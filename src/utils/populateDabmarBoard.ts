import { KanbanService } from "@/services/kanbanService";

export async function populateDabmarBoard(boardId: string) {
  try {
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

    const cards: Record<string, Array<{
      title: string;
      description: string;
      position: number;
      due_date?: string;
      tasks?: Array<{ id: string; text: string; completed: boolean }>;
    }>> = {
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
    
    console.log('Creating lists...');
    for (const list of lists) {
      const listData = await KanbanService.createList({
        board_id: boardId,
        title: list.title,
        position: list.position,
      });
      
      createdLists[list.title] = listData.id;
      console.log(`Created list: ${list.title}`);
    }

    // Create cards for each list
    console.log('Creating cards...');
    for (const [listName, listCards] of Object.entries(cards)) {
      const listId = createdLists[listName];
      
      for (const card of listCards) {
        await KanbanService.createCard({
          list_id: listId,
          title: card.title,
          description: card.description,
          position: card.position,
          due_date: card.due_date || undefined,
          tasks: card.tasks || [],
        });
        console.log(`Created card: ${card.title} in ${listName}`);
      }
    }

    const totalCards = Object.values(cards).reduce((sum, cards) => sum + cards.length, 0);
    console.log(`✅ Successfully populated DABMAR board with ${Object.keys(createdLists).length} lists and ${totalCards} cards!`);
    
    return {
      success: true,
      listsCreated: Object.keys(createdLists).length,
      cardsCreated: totalCards
    };
  } catch (error) {
    console.error('Error populating board:', error);
    throw error;
  }
}

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).populateDabmarBoard = populateDabmarBoard;
}
