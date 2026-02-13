"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

type TestDossier = {
  id: string;
  status: string;
  created_at: string;
  product_name: string | null;
};

type TestUser = {
  userId: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  dossiers: TestDossier[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  QUALIFICATION: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  IN_PROGRESS: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  COMPLETED: "text-green-400 bg-green-400/10 border-green-400/30",
  CANCELLED: "text-red-400 bg-red-400/10 border-red-400/30",
  PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
};

export function TestUsersTab() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/test/users");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setUsers(data.users ?? []);
      setHasFetched(true);
    } catch {
      toast.error("Impossible de charger les utilisateurs de test");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (user: TestUser) => {
    if (
      !window.confirm(
        `Supprimer le compte de test "${user.email ?? user.userId}" et toutes ses données (${user.dossiers.length} dossier(s), étapes, notifications, events) ? Irréversible.`
      )
    )
      return;

    setDeletingId(user.userId);
    try {
      const res = await fetch(`/api/admin/test/users/${user.userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la suppression");
      }
      setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
      toast.success(`Utilisateur de test "${user.email}" supprimé`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
            Utilisateurs de test
          </h2>
          <p className="text-sm text-[#b7b7b7]">
            Liste de tous les comptes ayant au moins un dossier marqué{" "}
            <code className="text-[#7c6af7] text-xs bg-[#7c6af7]/10 px-1 rounded">
              is_test=true
            </code>
            . Supprime le compte et toutes ses données associées.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7c6af7]/15 text-[#7c6af7] border border-[#7c6af7]/30 hover:bg-[#7c6af7]/25 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <i className={`fa-solid ${isLoading ? "fa-spinner fa-spin" : "fa-rotate-right"}`} />
          {hasFetched ? "Rafraîchir" : "Charger"}
        </button>
      </div>

      {!hasFetched && !isLoading && (
        <div className="rounded-xl bg-[#1e1f22] border border-[#363636] px-6 py-10 text-center">
          <i className="fa-solid fa-users text-[#363636] text-3xl mb-3" />
          <p className="text-sm text-[#666]">
            Cliquez sur &quot;Charger&quot; pour afficher les utilisateurs de test
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <i className="fa-solid fa-spinner fa-spin" />
          Chargement…
        </div>
      )}

      {hasFetched && !isLoading && users.length === 0 && (
        <div className="rounded-xl bg-[#1e1f22] border border-[#363636] px-6 py-10 text-center">
          <i className="fa-solid fa-circle-check text-[#50b989] text-3xl mb-3" />
          <p className="text-sm text-[#b7b7b7]">Aucun utilisateur de test</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className="rounded-xl bg-[#1e1f22] border border-[#363636] p-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* User info */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#7c6af7]/15 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user text-[#7c6af7] text-xs" />
                    </div>
                    <p className="text-sm font-medium text-[#f9f9f9] truncate">
                      {user.full_name ?? "—"}
                    </p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border text-[#7c6af7] bg-[#7c6af7]/10 border-[#7c6af7]/30">
                      TEST
                    </span>
                  </div>
                  <p className="text-xs text-[#b7b7b7] ml-9">{user.email ?? "—"}</p>
                  {user.phone && (
                    <p className="text-xs text-[#666] ml-9">{user.phone}</p>
                  )}
                  <p className="text-xs text-[#666] ml-9 font-mono">
                    {user.userId.slice(0, 8)}…
                  </p>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(user)}
                  disabled={deletingId === user.userId}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
                >
                  {deletingId === user.userId ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-trash-can" />
                      Supprimer tout
                    </>
                  )}
                </button>
              </div>

              {/* Dossiers */}
              {user.dossiers.length > 0 && (
                <div className="mt-3 ml-9 space-y-1.5">
                  <p className="text-xs font-medium text-[#666] uppercase tracking-wider">
                    {user.dossiers.length} dossier{user.dossiers.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1">
                    {user.dossiers.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 flex-wrap"
                      >
                        <a
                          href={`/admin/dossiers/${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#7c6af7] hover:underline font-mono"
                        >
                          {d.id.slice(0, 8)}…
                        </a>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[d.status] ?? "text-[#b7b7b7] bg-[#252628] border-[#363636]"}`}
                        >
                          {d.status}
                        </span>
                        <span className="text-xs text-[#b7b7b7]">
                          {d.product_name ?? "—"}
                        </span>
                        <span className="text-xs text-[#666]">
                          {formatDate(d.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
