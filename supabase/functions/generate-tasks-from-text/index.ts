import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildSystemPrompt = (availableLists?: string[]) => {
  const basePrompt = `Analisa o seguinte texto e extrai as tarefas principais que precisam de ser realizadas.
Para cada tarefa, identifica:
- Título curto e claro (máximo 80 caracteres)
- Descrição resumida do que precisa ser feito
- Prioridade (high/medium/low) baseada na urgência mencionada

Foca apenas em itens acionáveis. Ignora contexto informativo.
Extrai no máximo 10 tarefas principais.`;

  if (availableLists && availableLists.length > 0) {
    return `${basePrompt}

IMPORTANTE: As listas disponíveis neste board são: ${availableLists.join(', ')}.
Analisa o contexto do texto e determina qual das listas é mais apropriada para receber TODAS estas tarefas.
Devolve o nome EXATO de uma das listas disponíveis no campo suggestedList.
Se o texto não tiver contexto claro, escolhe a lista que pareça mais genérica ou a primeira.`;
  }
  
  return basePrompt;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, availableLists } = await req.json();
    
    if (!text || text.length < 50) {
      return new Response(
        JSON.stringify({ error: "Texto deve ter pelo menos 50 caracteres" }),
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
          { role: "system", content: buildSystemPrompt(availableLists) },
          { role: "user", content: text }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tasks",
            description: "Extrai tarefas acionáveis do texto fornecido",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "Título curto e claro da tarefa (máx 80 caracteres)" 
                      },
                      description: { 
                        type: "string",
                        description: "Descrição resumida do que precisa ser feito"
                      },
                      priority: { 
                        type: "string", 
                        enum: ["low", "medium", "high"],
                        description: "Prioridade baseada na urgência"
                      }
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false
                  }
                },
                suggestedList: {
                  type: "string",
                  description: "Nome exato da lista mais apropriada para todas as tarefas (apenas quando availableLists é fornecido)"
                }
              },
              required: availableLists?.length > 0 ? ["tasks", "suggestedList"] : ["tasks"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_tasks" } }
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
    
    // Extract tasks from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const tasksResult = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ 
        tasks: tasksResult.tasks || [],
        suggestedList: tasksResult.suggestedList || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-tasks-from-text error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
