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

    // Define the DABMAR board structure
    const lists = [
      { title: 'Voyages', position: 0 },
      { title: 'Charters', position: 1 },
      { title: 'Hugo', position: 2 },
      { title: 'Manuel', position: 3 },
      { title: 'Magali', position: 4 },
      { title: 'GV Toy', position: 5 },
      { title: 'Projects', position: 6 },
    ];

    const cards = {
      'Charters': [
        { title: '20-24 December: Christmas', description: '', position: 0 },
      ],
      'Hugo': [
        { title: 'Sistema Navtop Bloqueado', description: '', position: 0 },
        { title: 'Confirm Checklist', description: '', position: 1 },
        { title: 'Pedido de orçamento para câmaras de vigilância', description: '', position: 2 },
      ],
      'Manuel': [
        { title: 'imagen.jpeg', description: 'Navigation system screen', position: 0 },
        { title: 'Stabilizers', description: '', position: 1, tasks: [{ id: '1', text: 'Check stabilizers', completed: false }] },
      ],
      'Magali': [
        { title: 'BIMINI REMOVAL AND TRANSPORT TO PORTO', description: '', position: 0, tasks: [{ id: '1', text: 'Organize transport', completed: false }] },
        { title: 'SCOOTER & GOCYCLE TRANSPORT HALLOWEEN WEEKEND', description: '', position: 1 },
      ],
      'GV Toy': [
        { title: 'Bomba de Agua', description: '', position: 0 },
        { title: 'Window', description: '', position: 1 },
        { title: 'Wood closet next to helm', description: '', position: 2 },
        { title: 'Instalação Sistema VHF', description: '', position: 3 },
        { title: 'Transporte Tender para Cascais', description: '', position: 4 },
      ],
      'Projects': [
        { title: 'Crew October-May 2025-2026', description: '', position: 0 },
        { 
          title: 'imagen.jpeg', 
          description: 'Project timeline image', 
          position: 1,
          due_date: '2025-09-09',
          tasks: Array.from({ length: 10 }, (_, i) => ({ 
            id: `${i + 1}`, 
            text: `Task ${i + 1}`, 
            completed: false 
          }))
        },
        { 
          title: 'imagen.jpeg', 
          description: 'Project timeline image 2', 
          position: 2,
          due_date: '2025-10-30',
          tasks: Array.from({ length: 11 }, (_, i) => ({ 
            id: `${i + 1}`, 
            text: `Task ${i + 1}`, 
            completed: false 
          }))
        },
      ],
    };

    // Create lists and store their IDs
    const createdLists: Record<string, string> = {};
    
    for (const list of lists) {
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

      createdLists[list.title] = listData.id;
    }

    // Create cards for each list
    for (const [listName, listCards] of Object.entries(cards)) {
      const listId = createdLists[listName];
      
      for (const card of listCards) {
        const { error: cardError } = await supabaseClient
          .from('kanban_cards')
          .insert([{
            list_id: listId,
            title: card.title,
            description: card.description,
            position: card.position,
            due_date: card.due_date || null,
            tasks: card.tasks || [],
          }]);

        if (cardError) {
          console.error(`Error creating card ${card.title}:`, cardError);
          throw cardError;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'DABMAR board populated successfully',
        listsCreated: Object.keys(createdLists).length,
        cardsCreated: Object.values(cards).reduce((sum, cards) => sum + cards.length, 0)
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
