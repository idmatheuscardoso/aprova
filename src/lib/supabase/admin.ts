import { createClient } from "@supabase/supabase-js";

// Client com a chave service role: ignora RLS. Só pode ser usado em código
// que roda no servidor (Server Components / Server Actions / Route Handlers)
// para servir a tela pública de aprovação, nunca em código de cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
