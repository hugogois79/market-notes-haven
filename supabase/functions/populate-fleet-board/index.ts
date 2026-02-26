import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { boardId } = await req.json();

    // 1. Create the 5 lists (columns)
    const lists = [
      { title: '📥 Torre de Controlo', position: 0 },
      { title: '📋 Plano de Voo',      position: 1 },
      { title: '🔄 Em Rota',           position: 2 },
      { title: '✅ Aterragem',          position: 3 },
      { title: '🛠️ Hangar',            position: 4 },
    ];

    const createdLists: Record<string, string> = {};

    for (const list of lists) {
      const { data: listData, error: listError } = await supabaseClient
        .from('kanban_lists')
        .insert([{ board_id: boardId, title: list.title, position: list.position }])
        .select()
        .single();

      if (listError) throw listError;
      createdLists[list.title] = listData.id;
    }

    // 2. Create labels for the board
    const labels = [
      { name: 'Blacklane',  color: '#1a1a1a' },
      { name: 'Família',    color: '#3b82f6' },
      { name: 'Frota',      color: '#16a34a' },
      { name: 'Despesa',    color: '#eab308' },
    ];

    const createdLabels: Record<string, string> = {};

    for (const label of labels) {
      const { data: labelData, error: labelError } = await supabaseClient
        .from('kanban_labels')
        .insert([{ board_id: boardId, name: label.name, color: label.color }])
        .select()
        .single();

      if (labelError) throw labelError;
      createdLabels[label.name] = labelData.id;
    }

    // 3. Create initial cards
    const cards: Record<string, Array<{
      title: string;
      description: string;
      position: number;
      priority?: string;
      due_date?: string;
    }>> = {
      '📥 Torre de Controlo': [
        {
          title: 'Levar GT3 à marca para revisão',
          description: 'Porsche 911 GT3 RS — verificar data exacta com Hugo.',
          position: 0,
        },
        {
          title: 'Comprar cápsulas Nespresso para escritório',
          description: '',
          position: 1,
        },
      ],
      '🛠️ Hangar': [
        {
          title: '🔧 Waldir — Confirmar KMs actuais de cada viatura',
          description: 'Confirmar quilometragem actual de todas as viaturas para actualizar fleet_vehicles.',
          position: 0,
          priority: 'high',
        },
        {
          title: 'Renovar Seguro Bentley Bentayga (verificar data)',
          description: 'Consultar data exacta de expiração em fleet_vehicles.',
          position: 1,
          priority: 'medium',
        },
        {
          title: 'IUC — Verificar datas de todas as viaturas',
          description: 'Victor Claw monitorizará automaticamente quando fleet_vehicles tiver datas preenchidas.',
          position: 2,
          priority: 'medium',
        },
        {
          title: 'Porsche GT3 RS — Revisão aos 20.000km',
          description: 'Agendar quando km_actual se aproximar de km_proxima_revisao.',
          position: 3,
          priority: 'low',
        },
      ],
    };

    let cardsCreated = 0;

    for (const [listTitle, listCards] of Object.entries(cards)) {
      const listId = createdLists[listTitle];
      if (!listId) continue;

      for (const card of listCards) {
        const { error: cardError } = await supabaseClient
          .from('kanban_cards')
          .insert([{
            list_id: listId,
            title: card.title,
            description: card.description,
            position: card.position,
            priority: card.priority ?? 'medium',
            due_date: card.due_date ?? null,
          }]);

        if (cardError) throw cardError;
        cardsCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Robsonway Fleet board populated successfully',
        listsCreated: Object.keys(createdLists).length,
        labelsCreated: Object.keys(createdLabels).length,
        cardsCreated,
        boardId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
