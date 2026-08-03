-- Bootstrap an admin user after they have signed up and have a profiles row.
-- 1) Set ADMIN_EMAIL in the app environment (optional; used by bootstrap helpers if present).
-- 2) Run this in the Supabase SQL editor, replacing the email:

UPDATE public.profiles
SET is_admin = true
WHERE email = 'you@example.com';

-- Verify:
-- SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;
