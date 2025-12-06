
-- Update Carol Curry's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'RealEstate'),
  (SELECT id FROM expense_projects WHERE name = 'Representacao')
]::uuid[] WHERE name = 'Carol Curry';

-- Update Hugo Góis's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'Aviation'),
  (SELECT id FROM expense_projects WHERE name = 'DABMAR'),
  (SELECT id FROM expense_projects WHERE name = 'Legal'),
  (SELECT id FROM expense_projects WHERE name = 'RealEstate'),
  (SELECT id FROM expense_projects WHERE name = 'Representacao'),
  (SELECT id FROM expense_projects WHERE name = 'Trading'),
  (SELECT id FROM expense_projects WHERE name = 'Trinidad')
]::uuid[] WHERE name = 'Hugo Góis';

-- Update John Amorim's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'Trinidad')
]::uuid[] WHERE name = 'John Amorim';

-- Update Magali Algibaia's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'Legal'),
  (SELECT id FROM expense_projects WHERE name = 'RealEstate'),
  (SELECT id FROM expense_projects WHERE name = 'Representacao'),
  (SELECT id FROM expense_projects WHERE name = 'Trading')
]::uuid[] WHERE name = 'Magali Algibaia';

-- Update Manuel Zepeda's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'DABMAR')
]::uuid[] WHERE name = 'Manuel Zepeda';

-- Update Vasco Vieira's assigned projects
UPDATE expense_requesters SET assigned_project_ids = ARRAY[
  (SELECT id FROM expense_projects WHERE name = 'Aviation'),
  (SELECT id FROM expense_projects WHERE name = 'Representacao')
]::uuid[] WHERE name = 'Vasco Vieira';
