-- Historical user audit links include self-references. Deferring these two
-- constraints inside a controlled import transaction preserves source times
-- and actors without a second UPDATE that would fire touch_updated_at().
alter table public.profiles
  alter constraint profiles_created_by_fkey deferrable initially immediate;
alter table public.profiles
  alter constraint profiles_updated_by_fkey deferrable initially immediate;
