-- Insert legal contacts for the first user in the system
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.legal_contacts (name, role, user_id) VALUES
    ('Aglaya Shandrina', 'Defendant Witness', first_user_id),
    ('Alexandra Finkle', 'Defendant Witness', first_user_id),
    ('Amélia Góis', 'Witness', first_user_id),
    ('Ana Catarina Entrudo Pires', 'Defendant Witness', first_user_id),
    ('Ana Gil', 'Defendant Witness', first_user_id),
    ('Ana Vasconcelos', 'Other', first_user_id),
    ('André Góis', 'Witness', first_user_id),
    ('Andreia Sonia Carvalho', 'Defendant Witness', first_user_id),
    ('Angela Mendes', 'Specialist', first_user_id),
    ('Bruna Carvalho', 'Witness', first_user_id),
    ('Carmelo Urdaneta', 'Defendant', first_user_id),
    ('Catarina Ribeiro', 'Specialist', first_user_id),
    ('Daryna Piddubna', 'Defendant', first_user_id),
    ('Eva Delgado', 'Witness', first_user_id),
    ('Federico Lazeraschi', 'Witness', first_user_id),
    ('Fernando Vuteff', 'Defendant', first_user_id),
    ('Gio Rodrigues', 'Witness', first_user_id),
    ('Gustavo Frieri', 'Defendant', first_user_id),
    ('Hugo Góis', 'Defendant', first_user_id),
    ('Irina Kisileva', 'Defendant Witness', first_user_id),
    ('João Lemos', 'Witness', first_user_id),
    ('José Taveira Mota', 'Witness', first_user_id),
    ('Márcia Guedes Nogueira', 'Witness', first_user_id),
    ('Marcia Santos', 'Other', first_user_id),
    ('Maria Amélia Góis', 'Witness', first_user_id),
    ('Mario Cordeiro', 'Other', first_user_id),
    ('Mario Machado', 'Witness', first_user_id),
    ('Ministério Publico', 'Other', first_user_id),
    ('Mónica Botelho', 'Defendant Witness', first_user_id),
    ('Moris Eliyahu', 'Defendant Witness', first_user_id),
    ('Morris', 'Defendant Witness', first_user_id),
    ('Olga Piddubna', 'Defendant Witness', first_user_id),
    ('Paul A. Hayden', 'D.O.J', first_user_id),
    ('Paula Cristina da Costa Gomes Ferreira Pires', 'Witness', first_user_id),
    ('Pedro Marinho Falcão', 'Witness', first_user_id),
    ('Raul Gorrin', 'Defendant', first_user_id),
    ('Robert Manzanares', 'Witness', first_user_id),
    ('Rui Carolino', 'Defendant Witness', first_user_id),
    ('Stanislav Jansta', 'Defendant Witness', first_user_id),
    ('Victoria Vaschenko', 'Defendant Witness', first_user_id),
    ('Yulia Klitsevich', 'Defendant Witness', first_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;