import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const QuerySchema = z.object({
  type: z.enum(["dossiers", "orders", "clients", "step-instances", "documents"]),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().optional(),
});

/**
 * GET /api/admin/backoffice/entities
 * Read-only data explorer for admin back-office.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = request.nextUrl;
    const rawParams = {
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      per_page: searchParams.get("per_page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const validation = QuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const { type, page, per_page, search } = validation.data;
    const supabase = createAdminClient();
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    switch (type) {
      case "dossiers": {
        // For search: collect matching user_ids from profiles first
        let matchingUserIds: string[] | null = null;
        if (search) {
          const { data: matchingProfiles } = await supabase
            .from("profiles")
            .select("id")
            .ilike("full_name", `%${search}%`);
          matchingUserIds = (matchingProfiles ?? []).map((p) => p.id);
        }

        let query = supabase
          .from("dossiers")
          .select(
            `id, status, created_at, user_id, product_id, current_step_instance_id,
             profiles!user_id(full_name),
             products(name)`,
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        if (search && matchingUserIds !== null) {
          if (matchingUserIds.length > 0) {
            query = query.in("user_id", matchingUserIds);
          } else {
            // No matching clients → return empty
            return NextResponse.json({ data: [], total: 0, page, per_page });
          }
        }

        const { data, count, error } = await query;
        if (error) {
          console.error("[entities/dossiers]", error);
          return NextResponse.json({ error: "Erreur de requête" }, { status: 500 });
        }

        const rows = (data ?? []).map((d) => {
          const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
          const product = Array.isArray(d.products) ? d.products[0] : d.products;
          return {
            id: d.id,
            status: d.status,
            client_name: (profile as { full_name?: string } | null)?.full_name ?? "—",
            product_name: (product as { name?: string } | null)?.name ?? "—",
            created_at: d.created_at,
          };
        });

        return NextResponse.json({ data: rows, total: count ?? 0, page, per_page });
      }

      case "orders": {
        let query = supabase
          .from("orders")
          .select("id, status, amount, currency, dossier_id, created_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (search) {
          query = query.ilike("status", `%${search}%`);
        }

        const { data, count, error } = await query;
        if (error) {
          console.error("[entities/orders]", error);
          return NextResponse.json({ error: "Erreur de requête" }, { status: 500 });
        }

        return NextResponse.json({
          data: data ?? [],
          total: count ?? 0,
          page,
          per_page,
        });
      }

      case "clients": {
        let query = supabase
          .from("profiles")
          .select("id, full_name, status, created_at", { count: "exact" })
          .eq("role", "CLIENT")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (search) {
          query = query.or(`full_name.ilike.%${search}%`);
        }

        const { data, count, error } = await query;
        if (error) {
          console.error("[entities/clients]", error);
          return NextResponse.json({ error: "Erreur de requête" }, { status: 500 });
        }

        return NextResponse.json({
          data: data ?? [],
          total: count ?? 0,
          page,
          per_page,
        });
      }

      case "step-instances": {
        let query = supabase
          .from("step_instances")
          .select(
            `id, dossier_id, started_at, completed_at,
             steps(label)`,
            { count: "exact" }
          )
          .order("started_at", { ascending: false, nullsFirst: false })
          .range(from, to);

        // step_instances: search not supported (UUID columns only)

        const { data, count, error } = await query;
        if (error) {
          console.error("[entities/step-instances]", error);
          return NextResponse.json({ error: "Erreur de requête" }, { status: 500 });
        }

        const rows = (data ?? []).map((si) => {
          const step = Array.isArray(si.steps) ? si.steps[0] : si.steps;
          return {
            id: si.id,
            dossier_id: si.dossier_id,
            step_name: (step as { label?: string } | null)?.label ?? "—",
            started_at: si.started_at,
            completed_at: si.completed_at,
          };
        });

        return NextResponse.json({ data: rows, total: count ?? 0, page, per_page });
      }

      case "documents": {
        let query = supabase
          .from("documents")
          .select(
            "id, dossier_id, document_type_id, status, current_version_id, step_instance_id, created_at",
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        if (search) {
          query = query.ilike("status", `%${search}%`);
        }

        const { data, count, error } = await query;
        if (error) {
          console.error("[entities/documents]", error);
          return NextResponse.json({ error: "Erreur de requête" }, { status: 500 });
        }

        return NextResponse.json({
          data: data ?? [],
          total: count ?? 0,
          page,
          per_page,
        });
      }

      default:
        return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }
  } catch (error) {
    console.error("[GET /api/admin/backoffice/entities]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
