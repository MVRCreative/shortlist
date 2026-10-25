-- Standard is the default account. Admin is the internal role that can read every user and digest.

alter type public.user_role rename value 'member' to 'standard';

alter table public.profiles
  alter column role set default 'standard';
