import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";

export default async function DebugPage() {
  let debugInfo: any = {};

  try {
    // 1. Check auth
    const user = await requireAdminAuth();
    debugInfo.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // 2. Check if we can query profiles
    const supabase = await createClient();
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .limit(5);

    debugInfo.profiles = {
      count: profiles?.length || 0,
      data: profiles,
      error: profilesError?.message,
    };

    // 3. Check if we can use admin client
    const adminClient = createAdminClient();
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    debugInfo.adminClient = {
      usersCount: authUsers?.users?.length || 0,
      error: authError?.message,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // 4. Check dossiers
    const { data: dossiers, error: dossiersError } = await supabase
      .from("dossiers")
      .select("id, status, user_id")
      .limit(5);

    debugInfo.dossiers = {
      count: dossiers?.length || 0,
      data: dossiers,
      error: dossiersError?.message,
    };

  } catch (error: any) {
    debugInfo.error = error.message;
  }

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#F9F9F9] mb-6">
          🔍 Debug Info
        </h1>
        <pre className="bg-[#2D3033] p-6 rounded-xl text-[#F9F9F9] overflow-auto text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
