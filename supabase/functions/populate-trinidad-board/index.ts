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

    // Define the Trinidad board structure from Trello
    const lists = [
      { title: 'Location', position: 0 },
      { title: 'Maitenance', position: 1 },
      { title: 'Hugo', position: 2 },
      { title: 'John', position: 3 },
      { title: 'Orçamentar', position: 4 },
      { title: 'Alvaro', position: 5 },
      { title: 'Fora de Agua', position: 6 },
    ];

    const cards: Record<string, Array<{ title: string; description: string; position: number }>> = {
      'Location': [
        { title: 'Marina Imperia', description: '11 Sept - 11 Sept', position: 0 },
        { title: 'Marina Aeroporto Genova', description: '', position: 1 },
      ],
      'Maitenance': [
        { title: 'Ducha cabin maste', description: '', position: 0 },
        { title: 'Filtro de generador', description: '', position: 1 },
        { title: 'Ar Condicionado', description: '', position: 2 },
        { title: 'Depthfinder não funciona', description: '', position: 3 },
        { title: 'Chuveiros do Barco - Popa', description: '', position: 4 },
        { title: 'Revisão do Sidetruster', description: '', position: 5 },
        { title: 'Seacock Ar Condicionado', description: '', position: 6 },
        { title: 'Escovas Motor Electrico Direuti', description: '', position: 7 },
        { title: 'Novas Escovas Parabrisas', description: '', position: 8 },
        { title: 'Revisar reparar los dos ventiladores de sala de máquinas', description: '', position: 9 },
        { title: 'Sensores de Avante/Atrás (MAN V12 + ZF 2050A)', description: '', position: 10 },
        { title: 'Sensores de Temperatura dos Exhaust (MAN V12)', description: '', position: 11 },
        { title: 'Passarela OPACMARE (Azimut 80)', description: '', position: 12 },
      ],
      'Hugo': [
        { title: 'Nova decoração barco', description: '', position: 0 },
        { title: 'Mandar Internet', description: '', position: 1 },
        { title: 'Chaves do Barco', description: '', position: 2 },
        { title: 'NAVIOP - Sistema', description: '', position: 3 },
      ],
      'John': [
        { title: 'Substituir o colchão da cabine do capitão', description: '', position: 0 },
        { title: 'Extintores', description: '', position: 1 },
        { title: 'Revisão Balsas Salva-vidas Trinidad', description: '', position: 2 },
        { title: 'Medição Alcatifa Salão Trinidad', description: '', position: 3 },
        { title: 'Manutenção Sistema Travamento Guincho Âncora', description: '', position: 4 },
        { title: 'Limpeza e Arejamento Tambuchos - Prevenção Humidade', description: '', position: 5 },
        { title: 'Limpeza Profissional Sala de Máquinas', description: '', position: 6 },
        { title: 'Limpeza Profunda Ductos Ar Condicionado', description: '', position: 7 },
        { title: 'Renovação Rebites Toldos Negros Janelas', description: '', position: 8 },
        { title: 'Documentação Final Limpeza Crew Area', description: '', position: 9 },
        { title: 'Inspeção e Inventário Defensas', description: '', position: 10 },
      ],
      'Orçamentar': [
        { title: 'Port Side Cockpit Door (Azimut 80 Flybridge)', description: '', position: 0 },
        { title: 'Sensores Tanques Trinidad', description: '', position: 1 },
        { title: 'Reparar Exaustor Cozinha - Azimut 80', description: '', position: 2 },
        { title: 'Diagnóstico Gerador N2 Cummins Onan 27kW', description: '', position: 3 },
        { title: 'Novo seguro', description: '', position: 4 },
        { title: 'Trocar filtros de óleo', description: '', position: 5 },
        { title: 'Troca Óleo Motores MAN V12 - Azimut 80', description: '', position: 6 },
        { title: 'Instalar Duchas Popa + Reparar Master - Azimut 80', description: '', position: 7 },
        { title: 'Diagnosticar Depthfinder - Azimut 80', description: '', position: 8 },
        { title: 'Intercoolers MAHLE - Motores MAN V12', description: '', position: 9 },
        { title: 'Troca Óleo Gearboxes ZF - Azimut 80', description: '', position: 10 },
      ],
      'Alvaro': [],
      'Fora de Agua': [
        { title: 'Reparo Seacock Ar Condicionado - Azimut 80', description: '', position: 0 },
        { title: 'Polimento Completo Azimut 80', description: '', position: 1 },
        { title: 'Fridge - Medidas - Tentar meter 177', description: '', position: 2 },
      ],
    };

    // Get existing lists for this board
    const { data: existingLists } = await supabaseClient
      .from('kanban_lists')
      .select('id, title')
      .eq('board_id', boardId);

    const existingListTitles = new Set(existingLists?.map(l => l.title) || []);
    const listIdMap: Record<string, string> = {};
    
    // Map existing lists
    existingLists?.forEach(l => {
      listIdMap[l.title] = l.id;
    });

    // Create missing lists
    for (const list of lists) {
      if (!existingListTitles.has(list.title)) {
        const { data: listData, error: listError } = await supabaseClient
          .from('kanban_lists')
          .insert([{
            board_id: boardId,
            title: list.title,
            position: list.position,
          }])
          .select()
          .single();

        if (listError) {
          console.error(`Error creating list ${list.title}:`, listError);
          throw listError;
        }

        listIdMap[list.title] = listData.id;
      }
    }

    // Create cards for each list
    let cardsCreated = 0;
    for (const [listName, listCards] of Object.entries(cards)) {
      const listId = listIdMap[listName];
      if (!listId) continue;
      
      // Get existing cards in this list
      const { data: existingCards } = await supabaseClient
        .from('kanban_cards')
        .select('title')
        .eq('list_id', listId);
      
      const existingCardTitles = new Set(existingCards?.map(c => c.title) || []);
      
      for (const card of listCards) {
        // Skip if card already exists
        if (existingCardTitles.has(card.title)) continue;
        
        const { error: cardError } = await supabaseClient
          .from('kanban_cards')
          .insert([{
            list_id: listId,
            title: card.title,
            description: card.description,
            position: card.position,
          }]);

        if (cardError) {
          console.error(`Error creating card ${card.title}:`, cardError);
          throw cardError;
        }
        cardsCreated++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trinidad board populated successfully',
        listsCreated: lists.length - existingListTitles.size,
        cardsCreated
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
