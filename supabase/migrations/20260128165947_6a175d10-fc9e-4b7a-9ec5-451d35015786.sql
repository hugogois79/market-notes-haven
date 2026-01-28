-- Create 3 Kanban cards for Ford Transit specialists

-- Card 1: Chapeiro e Pintor (Fase 1)
INSERT INTO public.kanban_cards (list_id, title, description, value, position, priority, tasks)
VALUES (
  'f41b500c-0220-4f3f-aa91-c555d0313ae3',
  '🔧 Chapeiro e Pintor - Exterior',
  E'**Objetivo:** Reparar o acidente, fechar o buraco do vidro e deixar a chapa direita.\n\nSem isto, entra água e estraga o trabalho que fizesses no interior.\n\n---\n\n**Trabalhos:**\n\n• **Vidro Lateral Traseiro:** Substituir o vidro partido (o plástico não isola bem) - **150€ a 200€**\n\n• **Farolim Traseiro Esquerdo:** Colocar novo (o atual está desfeito) - **80€ a 120€**\n\n• **Bate-Chapa (Desempenar):** Puxar a chapa da lateral traseira e alinhar o para-choques - **200€ a 300€**\n\n• **Pintura:** Pintar a lateral reparada e o para-choques para ficar uniforme - **250€ a 350€**\n\n---\n\n💰 **Total Estimado:** 680€ a 970€',
  825,
  0,
  'high',
  '[{"id": "1", "text": "Vidro Lateral Traseiro (150€-200€)", "completed": false}, {"id": "2", "text": "Farolim Traseiro Esquerdo (80€-120€)", "completed": false}, {"id": "3", "text": "Bate-Chapa/Desempenar (200€-300€)", "completed": false}, {"id": "4", "text": "Pintura lateral e para-choques (250€-350€)", "completed": false}]'::jsonb
);

-- Card 2: Mecânico (Fase 2)
INSERT INTO public.kanban_cards (list_id, title, description, value, position, priority, tasks)
VALUES (
  'f41b500c-0220-4f3f-aa91-c555d0313ae3',
  '⚙️ Mecânico - Segurança e Motor',
  E'**Objetivo:** Apagar luzes de erro e garantir que o carro não te deixa a pé com clientes.\n\nEsta fase é crítica porque a distribuição ou travões falharem é perigoso.\n\n---\n\n**Trabalhos:**\n\n• **Kit Distribuição + Bomba de Água:** Com 167.000km, se partir, o motor "morre". É prioridade máxima - **350€ a 500€**\n\n• **Sistema de Travagem:** Discos e pastilhas à frente e atrás (o aviso no painel é claro) - **250€ a 350€**\n\n• **Diagnóstico "Check Engine":** Ligar à máquina, limpar erro (provável EGR ou sensor) e apagar a luz amarela - **100€ a 200€**\n\n• **Revisão Geral:** Óleo 5W30 adequado e todos os 4 filtros - **150€ a 200€**\n\n• **Segurança da Roda:** Colocar a porca/perno em falta na roda traseira - **10€**\n\n---\n\n💰 **Total Estimado:** 860€ a 1.260€',
  1060,
  1,
  'high',
  '[{"id": "1", "text": "Kit Distribuição + Bomba Água (350€-500€)", "completed": false}, {"id": "2", "text": "Sistema Travagem completo (250€-350€)", "completed": false}, {"id": "3", "text": "Diagnóstico Check Engine (100€-200€)", "completed": false}, {"id": "4", "text": "Revisão Geral - óleo e filtros (150€-200€)", "completed": false}, {"id": "5", "text": "Porca/perno roda traseira (10€)", "completed": false}]'::jsonb
);

-- Card 3: Estofador e Estética (Fase 3)
INSERT INTO public.kanban_cards (list_id, title, description, value, position, priority, tasks)
VALUES (
  'f41b500c-0220-4f3f-aa91-c555d0313ae3',
  '🎨 Estofador e Estética - Visual TVDE',
  E'**Objetivo:** Transformar o "carro de carga" numa viatura de luxo, confortável e fácil de limpar.\n\n---\n\n**Trabalhos:**\n\n• **Estofar Bancos em Pele (Napa):** Recuperar as espumas rasgadas e forrar os bancos dianteiros e traseiros a preto - **600€ a 900€**\n\n• **Forrar Interior (Conversão):** Tapar a chapa e painéis de madeira da mala com alcatifa ou tecido acolchoado - **300€ a 500€**\n\n• **Películas (Vidros Fumados):** Aplicação de película homologada nos vidros traseiros (dá privacidade e "look" VIP) - **180€ a 250€** (já com legalização)\n\n• **Tratar Jantes:** Lixar ferrugem e pintar as 4 jantes de ferro de preto (acetinado ou brilho) - **80€ a 120€**\n\n---\n\n💰 **Total Estimado:** 1.160€ a 1.770€',
  1465,
  2,
  'medium',
  '[{"id": "1", "text": "Estofar bancos em pele Napa (600€-900€)", "completed": false}, {"id": "2", "text": "Forrar interior/mala (300€-500€)", "completed": false}, {"id": "3", "text": "Películas vidros fumados (180€-250€)", "completed": false}, {"id": "4", "text": "Tratar e pintar jantes (80€-120€)", "completed": false}]'::jsonb
);