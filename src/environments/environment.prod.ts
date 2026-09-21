import { supabaseConfig } from './supabase.generated';

export const environment = {
  production: true,
  // Temporary bridge while modules are migrated away from the Spring backend.
  proxyPath: '/api/proxy',
  supabase: supabaseConfig,
};
