// Utility to handle printing individual Kanban lists

export const printKanbanList = (listId: string, listTitle: string, cards: any[]) => {
  // Create a print-specific container
  const printContainer = document.createElement('div');
  printContainer.id = 'kanban-print-container';
  printContainer.className = 'print-this-list';
  
  // Add list title
  const titleElement = document.createElement('div');
  titleElement.className = 'print-list-title';
  titleElement.textContent = listTitle;
  printContainer.appendChild(titleElement);
  
  // Add list content wrapper
  const listWrapper = document.createElement('div');
  listWrapper.className = 'kanban-list-print';
  
  // Filter and sort cards
  const pendingCards = cards
    .filter(card => !card.concluded)
    .sort((a, b) => a.position - b.position);
  
  if (pendingCards.length > 0) {
    pendingCards.forEach(card => {
      const cardElement = document.createElement('div');
      let priorityClass = '';
      if (card.priority === 'high') priorityClass = 'priority-high';
      else if (card.priority === 'medium') priorityClass = 'priority-medium';
      else if (card.priority === 'low') priorityClass = 'priority-low';
      
      cardElement.className = `kanban-card-print ${priorityClass}`;
      
      // Card title
      const cardTitle = document.createElement('div');
      cardTitle.className = 'kanban-card-title';
      cardTitle.textContent = card.title;
      cardElement.appendChild(cardTitle);
      
      // Card description
      if (card.description) {
        const cardDesc = document.createElement('div');
        cardDesc.className = 'kanban-card-description';
        cardDesc.textContent = card.description;
        cardElement.appendChild(cardDesc);
      }
      
      // Card metadata
      const metaContainer = document.createElement('div');
      metaContainer.className = 'kanban-card-meta';
      
      if (card.priority) {
        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'kanban-card-badge';
        priorityBadge.textContent = `Priority: ${card.priority}`;
        metaContainer.appendChild(priorityBadge);
      }
      
      if (card.due_date) {
        const dueDateBadge = document.createElement('span');
        dueDateBadge.className = 'kanban-card-badge';
        dueDateBadge.textContent = `Due: ${new Date(card.due_date).toLocaleDateString()}`;
        metaContainer.appendChild(dueDateBadge);
      }
      
      if (card.tasks && Array.isArray(card.tasks) && card.tasks.length > 0) {
        const completed = card.tasks.filter((t: any) => t.completed).length;
        const total = card.tasks.length;
        const tasksBadge = document.createElement('span');
        tasksBadge.className = 'kanban-card-badge';
        tasksBadge.textContent = `Tasks: ${completed}/${total}`;
        metaContainer.appendChild(tasksBadge);
      }
      
      if (card.attachment_count && card.attachment_count > 0) {
        const attachmentBadge = document.createElement('span');
        attachmentBadge.className = 'kanban-card-badge';
        attachmentBadge.textContent = `Attachments: ${card.attachment_count}`;
        metaContainer.appendChild(attachmentBadge);
      }
      
      if (metaContainer.children.length > 0) {
        cardElement.appendChild(metaContainer);
      }
      
      listWrapper.appendChild(cardElement);
    });
  } else {
    const noCards = document.createElement('div');
    noCards.className = 'no-cards-print';
    noCards.textContent = 'No pending cards';
    listWrapper.appendChild(noCards);
  }
  
  printContainer.appendChild(listWrapper);
  
  // Add to body temporarily
  document.body.appendChild(printContainer);
  
  // Trigger print
  window.print();
  
  // Clean up after print dialog closes
  setTimeout(() => {
    document.body.removeChild(printContainer);
  }, 100);
};
