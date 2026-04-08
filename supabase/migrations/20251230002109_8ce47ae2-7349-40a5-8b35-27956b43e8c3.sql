-- Update the existing user role to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '31377412-f0d4-4fdf-bf6b-7ca78d6caedf';