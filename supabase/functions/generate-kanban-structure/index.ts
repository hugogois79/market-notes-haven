import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Analisa o texto fornecido e extrai estruturas para um sistema Kanban.

Deves identificar:

1. **BOARDS** - Projetos ou contextos distintos mencionados no texto
   - Só cria boards se o texto claramente fala de projetos SEPARADOS
   - Se o texto fala apenas de tarefas de um único contexto, NÃO cries boards

2. **LISTAS** - Fases, categorias ou estados lógicos
   - Exemplos: "A Fazer", "Em Progresso", "Concluído", "Urgente", "Esta Semana"
   - Só cria listas se fizer sentido agrupar as tarefas
   - Se boardRef é definido, a lista pertence a esse board (índice 0-based)

3. **CARDS** - Tarefas individuais acionáveis
   - Cada card deve ser uma ação concreta
   - Define prioridade baseada na urgência mencionada
   - Se listRef é definido, o card pertence a essa lista (índice 0-based)

REGRAS IMPORTANTES:
- Foca em itens ACIONÁVEIS, não em contexto informativo
- Extrai no máximo 5 boards, 10 listas e 20 cards
- Títulos devem ser curtos e claros (máximo 80 caracteres)
- Se não há projetos distintos, devolve boards vazio
- Se não há categorias claras, devolve lists vazio`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || text.length < 30) {
      return new Response(
        JSON.stringify({ error: "Texto deve ter pelo menos 30 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_kanban_structure",
            description: "Extrai estruturas Kanban (boards, listas e cards) do texto fornecido",
            parameters: {
              type: "object",
              properties: {
                boards: {
                  type: "array",
                  description: "Projetos ou contextos distintos. Deixa vazio se não há projetos separados.",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "Nome do projeto/board (máx 80 caracteres)" 
                      },
                      description: { 
                        type: "string",
                        description: "Descrição breve do projeto"
                      },
                      color: { 
                        type: "string", 
                        enum: ["blue", "green", "purple", "orange", "red", "pink", "yellow"],
                        description: "Cor sugerida para o board"
                      }
                    },
                    required: ["title"],
                    additionalProperties: false
                  }
                },
                lists: {
                  type: "array",
                  description: "Categorias, fases ou estados. Deixa vazio se não há categorização clara.",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "Nome da lista/categoria" 
                      },
                      boardRef: { 
                        type: "number",
                        description: "Índice do board associado (0-based), ou omite se for lista geral"
                      }
                    },
                    required: ["title"],
                    additionalProperties: false
                  }
                },
                cards: {
                  type: "array",
                  description: "Tarefas individuais acionáveis",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "Título curto da tarefa (máx 80 caracteres)" 
                      },
                      description: { 
                        type: "string",
                        description: "Descrição do que precisa ser feito"
                      },
                      priority: { 
                        type: "string", 
                        enum: ["low", "medium", "high"],
                        description: "Prioridade baseada na urgência"
                      },
                      listRef: { 
                        type: "number",
                        description: "Índice da lista associada (0-based), ou omite se não tem lista"
                      }
                    },
                    required: ["title", "priority"],
                    additionalProperties: false
                  }
                }
              },
              required: ["boards", "lists", "cards"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_kanban_structure" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract structure from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ 
        boards: result.boards || [],
        lists: result.lists || [],
        cards: result.cards || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-kanban-structure error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
