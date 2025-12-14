import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) throw new Error('OPENAI_API_KEY is not configured');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase configuration is missing');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is required');

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Invalid authentication token');
    
    const userId = user.id;
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

    const systemPrompt = `És o Assistente Executivo de Calendário, especializado em gestão estratégica de tempo para um perfil de alto risco que gere:
- ⚖️ Processos Legais Complexos (eventos marcados como "legal", "tribunal", "julgamento")
- 👨‍👧 Logística de Custódia Partilhada (Beatriz e Diana)
- 💰 Objetivos Financeiros/Trading (eventos "corporate", "finance", "trading")
- ✈️ Viagens e Voos (eventos "voos", "viagem")
- 🏠 Real Estate (eventos "real_estate")

### REGRAS CRÍTICAS:

⚠️ **NUNCA INVENTES INFORMAÇÃO!**
- Só podes falar sobre eventos que estão EXPLICITAMENTE listados abaixo.
- NUNCA digas que um dia está "livre" ou "sem eventos" - usa APENAS os dados fornecidos.
- Se não tens dados sobre um dia específico, NÃO o menciones.
- NUNCA assumes ou adivinhes o que pode acontecer num dia.

⚠️ **CUSTÓDIA:**
- A categoria "família" num evento NÃO significa que as filhas estão com o utilizador!
- Os DIAS DE CUSTÓDIA reais estão listados na secção "DIAS DE CUSTÓDIA" abaixo.
- Se um dia NÃO está na lista de custódia, as filhas NÃO estão com o utilizador nesse dia.
- NUNCA assumes que as filhas estão presentes só porque um evento tem categoria "família".

### INSTRUÇÕES PARA BRIEFINGS:
Quando o utilizador pedir um briefing semanal ou resumo, gera um **Briefing Estratégico** estruturado BASEADO APENAS NOS EVENTOS FORNECIDOS:

**1. 🚨 CRÍTICO & LEGAL (Itens Vermelhos)**
- Procura: "Tribunal", "Julgamento", "Sentença", "PER", "Legal", "Embaixada"

**2. 👨‍👧 LOGÍSTICA FAMILIAR (Itens Verdes)**
- Mostra APENAS dias onde a custódia está CONFIRMADA na lista "DIAS DE CUSTÓDIA"

**3. 💼 CORPORATIVO & NEGÓCIOS**
- Reuniões, propostas, clientes

**4. 💰 FINANÇAS & ATIVOS**
- "Vender", "Comprar", "Crypto", "Asset", "Banco", "Avanço"

**5. ✈️ VIAGENS & VOOS**
- Eventos de viagem, voos programados (VOO:)

**6. 🏠 IMOBILIÁRIO**
- Real Estate, propriedades

**7. 🎄 FÉRIAS & PESSOAL**
- Eventos com categoria "férias" ou "pessoal"

### FORMATO DE RESPOSTA:
- Usa emojis como bullet points
- Sê direto e executivo
- Responde em Português de Portugal
- LISTA APENAS eventos que existem nos dados - NUNCA inventes "dias livres"

### DADOS DE CONTEXTO (USA APENAS ESTES DADOS):

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

    console.log('Calling OpenAI with calendar context...');

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
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
    const aiResponse = chatData.choices[0].message.content;

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
  };
  return labels[category || ''] || category || 'Geral';
}

function getMonthName(month: number | null): string {
  const months = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month || 0] || '';
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
