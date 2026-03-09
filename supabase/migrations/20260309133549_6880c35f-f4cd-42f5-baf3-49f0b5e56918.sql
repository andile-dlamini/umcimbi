
INSERT INTO public.user_roles (user_id, role)
VALUES ('2f6b044e-e663-4266-9474-1b81ded16b95', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.profiles (user_id, email, full_name)
VALUES ('2f6b044e-e663-4266-9474-1b81ded16b95', 'startup.mihealer@gmail.com', 'Admin')
ON CONFLICT (user_id) DO NOTHING;
