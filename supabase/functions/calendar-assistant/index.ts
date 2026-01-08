import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "create_calendar_events",
      description: "Cria um ou mais eventos no calendário. Usa esta função quando o utilizador pedir para adicionar, criar ou agendar eventos. Quando o utilizador pedir para criar eventos em múltiplos dias (ex: 'todos os dias de julho', 'de dia 10 a dia 15', 'dia 1, 2, 3 e 4'), DEVES fornecer TODAS as datas no array 'dates'.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "O título/nome do evento (será aplicado a todos os dias)"
          },
          dates: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array de datas no formato YYYY-MM-DD. Para múltiplos dias, inclui TODAS as datas. Exemplo: para 'todos os dias de julho 2026', inclui ['2026-07-01', '2026-07-02', ..., '2026-07-31']"
          },
          period: {
            type: "string",
            enum: ["morning", "afternoon"],
            description: "O período do dia: 'morning' para manhã, 'afternoon' para tarde"
          },
          category: {
            type: "string",
            enum: ["legal", "família", "pessoal", "corporate", "work_financeiro", "forecast", "voos", "viagem", "real_estate", "férias"],
            description: "A categoria do evento"
          },
          notes: {
            type: "string",
            description: "Notas adicionais sobre o evento (opcional)"
          }
        },
        required: ["title", "dates", "period"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, conversationHistory = [] } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase configuration is missing');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT - RLS enforces access
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate user via getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = claimsData.claims.sub;
    console.log('Calendar Assistant - User:', userId);

    // Fetch calendar events for next 30 days
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today)
      .lte('date', futureDate)
      .order('date', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Fetch monthly objectives for current and next 2 months
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const { data: objectives, error: objectivesError } = await supabase
      .from('monthly_objectives')
      .select('*')
      .eq('user_id', userId)
      .or(`and(year.eq.${currentYear},month.gte.${currentMonth}),and(year.eq.${currentYear + 1},month.lte.2)`)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (objectivesError) {
      console.error('Error fetching objectives:', objectivesError);
    }

    // Fetch custody/holiday status
    const { data: dayStatus, error: statusError } = await supabase
      .from('calendar_day_status')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today)
      .lte('date', futureDate);

    if (statusError) {
      console.error('Error fetching day status:', statusError);
    }

    // Format events context
    const eventsContext = events?.map(e => {
      const categoryLabel = getCategoryLabel(e.category);
      return `- ${e.date} (${e.period === 'morning' ? 'Manhã' : 'Tarde'}): ${e.title} [${categoryLabel}]${e.notes ? ` | Notas: ${e.notes}` : ''}`;
    }).join('\n') || 'Sem eventos agendados.';

    // Format objectives context
    const objectivesContext = objectives?.map(o => {
      const monthName = getMonthName(o.month);
      const status = o.is_completed ? '✅' : '⬜';
      return `- ${monthName} ${o.year}: ${status} ${o.content}`;
    }).join('\n') || 'Sem objetivos definidos.';

    // Format custody context - only show days where children ARE with the user
    const custodyContext = dayStatus?.filter(d => d.beatriz_status === 'comigo' || d.diana_status === 'comigo').map(d => {
      const parts = [];
      if (d.beatriz_status === 'comigo') parts.push('Beatriz está comigo');
      if (d.diana_status === 'comigo') parts.push('Diana está comigo');
      const holiday = d.is_holiday ? ' 🎄 FERIADO' : '';
      return `- ${d.date}: ${parts.join(', ')}${holiday}`;
    }).join('\n') || 'Nenhum dia de custódia marcado no calendário.';

    const systemPrompt = `És o Assistente Executivo de Calendário - um PARCEIRO ESTRATÉGICO PROATIVO.

### PERFIL DO UTILIZADOR:
- ⚖️ Processos Legais Complexos (eventos marcados como "legal", "tribunal", "julgamento")
- 👨‍👧 Logística de Custódia Partilhada (Beatriz e Diana)
- 💰 Objetivos Financeiros/Trading (eventos "corporate", "finance", "trading")
- ✈️ Viagens e Voos (eventos "voos", "viagem")
- 🏠 Real Estate (eventos "real_estate")

### 🎯 MISSÃO PRINCIPAL:
Garantir que o utilizador NUNCA está despreparado para um evento crítico.
Deves "Reverse Engineer" datas importantes - analisar 14-21 dias à frente e SUGERIR BLOCOS DE PREPARAÇÃO AGORA.

### ⚙️ PROTOCOLOS DE SUGESTÃO PROATIVA (aplicar SEMPRE em briefings e "Verificar Estratégia"):

**1. 🔴 PROTOCOLO LEGAL/TRIBUNAL (Prioridade Crítica)**
- Triggers: "Tribunal", "Julgamento", "Audiência", "Sentença", "Violência Doméstica", "PER"
- Ação: Sugerir bloco "Deep Work: Preparação Legal" (2-4h)
- Timing: 3-5 dias ANTES da data do tribunal
- Formato: "⚠️ Detectei '[Evento]' no dia [Data]. Sugiro marcar 3h de preparação no dia [Data-3/5] para rever o dossier. Queres que agende?"

**2. ✈️ PROTOCOLO VIAGEM/LOGÍSTICA**
- Triggers: "Voo", "VOO:", "Aeroporto", "Viagem", "Embaixada", "Mauritius", "Lisboa"
- Ação: Sugerir tarefa "Verificação Logística" (1h)
- Timing: 24-48h ANTES da partida
- Contexto: Check-in, Passaportes, Vistos, Transfers

**3. 🎂 PROTOCOLO EVENTOS FAMÍLIA**
- Triggers: "Aniversário", "Festa", "Natal"
- Ação: Sugerir "Comprar Presente/Organizar"
- Timing: 7 dias ANTES do evento

**4. 💰 PROTOCOLO LIQUIDEZ/ATIVOS**
- Triggers: "Vender", "Escritura", "Pagamento Grande", "Avanço"
- Ação: Sugerir "Confirmar Liquidez/Bancos"
- Timing: 1 semana ANTES

### 💡 ESTILO DE INTERAÇÃO - PROPOSTAS ACIONÁVEIS

NÃO digas apenas "deves preparar-te". Apresenta PROPOSTAS CONCRETAS que o utilizador pode confirmar com "Sim":

❌ MAU: "Tens um julgamento, devias preparar-te."
✅ BOM:
"⚠️ **Alerta de Preparação:**
O 'Julgamento Eusource' é daqui a 10 dias (15 de Março).
A tua agenda está cheia na véspera.

👉 **Sugestão:** Queres que bloqueie a manhã de **10 de Março (Terça)** exclusivamente para preparação legal?"

### ✅ VERIFICAÇÃO DE CONFLITOS
Antes de sugerir um slot, verifica se está VAZIO nos dados. Não sugiras preparação durante 'Tempo Família' ou dias de custódia salvo urgência absoluta (e avisa se o fizeres).

### 📝 CAPACIDADE DE CRIAR EVENTOS:
⚠️ **PODES E DEVES CRIAR EVENTOS quando o utilizador pedir!**
- Se o utilizador disser "adiciona", "cria", "agenda", "marca", "põe", "mete", "sim" (após sugestão) - USA IMEDIATAMENTE a função create_calendar_events.
- NÃO recuses criar eventos - isso é uma das tuas funções principais!
- **MÚLTIPLOS DIAS:** Se o utilizador pedir para criar eventos em vários dias, inclui TODAS as datas no array 'dates'.
- Interpreta datas relativas: "amanhã", "próxima segunda", "dia 25", etc.
- Se não especificar período, assume "morning" (manhã).
- DATA ATUAL: ${today}

### 📊 REGRAS PARA CONSULTAS (NÃO para criar eventos):
⚠️ **Ao CONSULTAR eventos:**
- Só podes falar sobre eventos que estão EXPLICITAMENTE listados abaixo.
- NUNCA digas que um dia está "livre" ou "sem eventos".
- A categoria "família" num evento NÃO significa custódia - só calendar_day_status indica custódia.

### 📋 FORMATO DE BRIEFING ESTRATÉGICO:

**1. 🚨 CRÍTICO & LEGAL** - Prioridade máxima
**2. 👨‍👧 LOGÍSTICA FAMILIAR** - Dias de custódia confirmados
**3. 💼 CORPORATIVO & NEGÓCIOS**
**4. 💰 FINANÇAS & ATIVOS**
**5. ✈️ VIAGENS & VOOS**
**6. ⚡ SUGESTÕES PROATIVAS** - As tuas recomendações de preparação!

### 📅 DADOS DE CONTEXTO:

**EVENTOS DOS PRÓXIMOS 30 DIAS:**
${eventsContext}

**OBJETIVOS MENSAIS:**
${objectivesContext}

**DIAS DE CUSTÓDIA (filhas estão com o utilizador APENAS nestes dias):**
${custodyContext}

**DATA ATUAL:** ${today}`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    console.log('Calling OpenAI with calendar context and tools...');

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat API error:', errorText);
      throw new Error(`Failed to generate response: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const message = chatData.choices[0].message;

    // Check if the model wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('Function call:', functionName, functionArgs);

      if (functionName === 'create_calendar_events') {
        // Create multiple events
        const { title, dates, period, category, notes } = functionArgs;
        
        // Ensure dates is an array
        const datesArray = Array.isArray(dates) ? dates : [dates];
        
        console.log(`Creating ${datesArray.length} events...`);
        
        const eventsToInsert = datesArray.map((date: string) => ({
          user_id: userId,
          title,
          date,
          period: period || 'morning',
          category: category || null,
          notes: notes || null
        }));

        const { data: newEvents, error: insertError } = await supabase
          .from('calendar_events')
          .insert(eventsToInsert)
          .select();

        if (insertError) {
          console.error('Error creating events:', insertError);
          return new Response(
            JSON.stringify({ 
              response: `❌ Erro ao criar os eventos: ${insertError.message}`,
              eventCreated: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`${newEvents?.length || 0} events created`);

        // Format confirmation message
        const periodLabel = period === 'afternoon' ? 'Tarde' : 'Manhã';
        const categoryLabel = getCategoryLabel(category);
        const eventCount = datesArray.length;

        let confirmationMessage: string;
        
        if (eventCount === 1) {
          const dateFormatted = formatDatePT(datesArray[0]);
          confirmationMessage = `✅ **Evento criado com sucesso!**

📅 **${title}**
- 📆 Data: ${dateFormatted}
- ⏰ Período: ${periodLabel}
${category ? `- 🏷️ Categoria: ${categoryLabel}` : ''}
${notes ? `- 📝 Notas: ${notes}` : ''}

O evento foi adicionado ao teu calendário.`;
        } else {
          // Multiple events
          const firstDate = formatDatePT(datesArray[0]);
          const lastDate = formatDatePT(datesArray[datesArray.length - 1]);
          
          confirmationMessage = `✅ **${eventCount} eventos criados com sucesso!**

📅 **${title}**
- 📆 Datas: De ${firstDate} até ${lastDate}
- 📊 Total: ${eventCount} dias
- ⏰ Período: ${periodLabel}
${category ? `- 🏷️ Categoria: ${categoryLabel}` : ''}
${notes ? `- 📝 Notas: ${notes}` : ''}

Todos os eventos foram adicionados ao teu calendário.`;
        }

        return new Response(
          JSON.stringify({ 
            response: confirmationMessage,
            eventCreated: true,
            eventsCount: eventCount,
            events: newEvents
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Regular response (no function call)
    const aiResponse = message.content;
    console.log('Calendar assistant response generated');

    // Parse response for rich rendering hints
    const sections = parseResponseSections(aiResponse);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        sections,
        eventsCount: events?.length || 0,
        objectivesCount: objectives?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calendar-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    'legal': '⚖️ Legal',
    'tribunal': '⚖️ Tribunal',
    'família': '👨‍👧 Família',
    'family': '👨‍👧 Família',
    'pessoal': '👤 Pessoal',
    'corporate': '💼 Corporativo',
    'work_financeiro': '💰 Financeiro',
    'forecast': '📈 Previsão',
    'voos': '✈️ Voos',
    'viagem': '✈️ Viagem',
    'real_estate': '🏠 Imobiliário',
    'férias': '🎄 Férias',
  };
  return labels[category || ''] || category || 'Geral';
}

function getMonthName(month: number | null): string {
  const months = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month || 0] || '';
}

function formatDatePT(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = getMonthName(date.getMonth() + 1);
  const year = date.getFullYear();
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const weekday = weekdays[date.getDay()];
  return `${weekday}, ${day} de ${month} de ${year}`;
}

function parseResponseSections(response: string): Array<{type: string, content: string}> {
  const sections: Array<{type: string, content: string}> = [];
  
  // Split by section headers
  const lines = response.split('\n');
  let currentSection = { type: 'default', content: '' };
  
  for (const line of lines) {
    if (line.includes('🚨') || line.toLowerCase().includes('crítico') || line.toLowerCase().includes('legal')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { type: 'critical', content: line + '\n' };
    } else if (line.includes('👨‍👧') || line.toLowerCase().includes('família') || line.toLowerCase().includes('custódia')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { type: 'family', content: line + '\n' };
    } else if (line.includes('💼') || line.toLowerCase().includes('corporativo') || line.toLowerCase().includes('negócios')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { type: 'corporate', content: line + '\n' };
    } else if (line.includes('💰') || line.toLowerCase().includes('finanças') || line.toLowerCase().includes('finance')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { type: 'finance', content: line + '\n' };
    } else if (line.includes('⚡') || line.toLowerCase().includes('sugest')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { type: 'suggestion', content: line + '\n' };
    } else {
      currentSection.content += line + '\n';
    }
  }
  
  if (currentSection.content) sections.push(currentSection);
  
  return sections;
}
