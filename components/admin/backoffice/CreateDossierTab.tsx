"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBackoffice } from "@/lib/contexts/backoffice/BackofficeContext";
import { useClients } from "@/lib/contexts/clients/ClientsContext";
import { useProducts } from "@/lib/contexts/products/ProductsContext";

const INITIAL_STATUSES = [
  { value: "QUALIFICATION", label: "QUALIFICATION (défaut)" },
  { value: "IN_PROGRESS", label: "IN_PROGRESS" },
  { value: "PENDING", label: "PENDING" },
];

export function CreateDossierTab() {
  const router = useRouter();
  const { createDossierForExistingClient, createDossierWithNewClient } =
    useBackoffice();
  const { clients, isLoading: isLoadingClients, fetchClients } = useClients();
  const {
    products,
    isLoading: isLoadingProducts,
    fetchActiveProducts,
  } = useProducts();

  const [isNewClient, setIsNewClient] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [initialStatus, setInitialStatus] = useState("QUALIFICATION");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProducts, setActiveProducts] = useState(products);

  // New client fields
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchActiveProducts().then(setActiveProducts);
  }, [fetchActiveProducts]);

  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = useCallback(async () => {
    if (!selectedProductId) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isNewClient) {
        if (!newClientName.trim() || !newClientEmail.trim() || !newClientPhone.trim()) {
          toast.error("Tous les champs du nouveau client sont obligatoires");
          return;
        }
        const res = await createDossierWithNewClient({
          full_name: newClientName.trim(),
          email: newClientEmail.trim(),
          phone: newClientPhone.trim(),
          product_id: selectedProductId,
          initial_status: initialStatus,
        });
        toast.success("Client et dossier créés avec succès");
        router.push(`/admin/dossiers/${res.dossierId}`);
      } else {
        if (!selectedClientId) {
          toast.error("Veuillez sélectionner un client");
          return;
        }
        const res = await createDossierForExistingClient({
          client_id: selectedClientId,
          product_id: selectedProductId,
          initial_status: initialStatus,
        });
        toast.success("Dossier créé avec succès");
        router.push(`/admin/dossiers/${res.dossierId}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isNewClient,
    selectedClientId,
    selectedProductId,
    initialStatus,
    newClientName,
    newClientEmail,
    newClientPhone,
    createDossierForExistingClient,
    createDossierWithNewClient,
    router,
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
          Créer un dossier
        </h2>
        <p className="text-sm text-[#b7b7b7]">
          Crée un dossier pour un client existant ou un nouveau client.
        </p>
      </div>

      {/* Toggle client existant / nouveau client */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#252628] border border-[#363636] w-fit">
        <button
          type="button"
          onClick={() => setIsNewClient(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !isNewClient
              ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
              : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
          }`}
        >
          Client existant
        </button>
        <button
          type="button"
          onClick={() => setIsNewClient(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isNewClient
              ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
              : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
          }`}
        >
          Nouveau client
        </button>
      </div>

      {/* Client existant */}
      {!isNewClient && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#b7b7b7]">
              Rechercher un client
            </label>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Nom ou email..."
              className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#50b989]"
            />
          </div>

          <div className="border border-[#363636] rounded-lg bg-[#1e1f22] max-h-52 overflow-y-auto divide-y divide-[#363636]">
            {isLoadingClients ? (
              <div className="px-4 py-3 text-sm text-[#666]">
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Chargement…
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#666]">
                Aucun client trouvé
              </div>
            ) : (
              filteredClients.slice(0, 50).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selectedClientId === c.id
                      ? "bg-[#50b989]/10 border-l-2 border-[#50b989]"
                      : "hover:bg-[#2d3033]"
                  }`}
                >
                  <p className="text-sm font-medium text-[#f9f9f9]">
                    {c.full_name}
                  </p>
                  <p className="text-xs text-[#b7b7b7]">{c.email}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Nouveau client */}
      {isNewClient && (
        <div className="space-y-3">
          {[
            {
              label: "Nom complet",
              value: newClientName,
              setter: setNewClientName,
              placeholder: "Jean Dupont",
              type: "text",
            },
            {
              label: "Email",
              value: newClientEmail,
              setter: setNewClientEmail,
              placeholder: "jean@example.com",
              type: "email",
            },
            {
              label: "Téléphone",
              value: newClientPhone,
              setter: setNewClientPhone,
              placeholder: "+33 6 12 34 56 78",
              type: "tel",
            },
          ].map(({ label, value, setter, placeholder, type }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-sm font-medium text-[#b7b7b7]">
                {label} <span className="text-red-400">*</span>
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#50b989]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Produit */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#b7b7b7]">
          Produit <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] focus:outline-none focus:border-[#50b989]"
        >
          <option value="">
            {isLoadingProducts ? "Chargement…" : "Sélectionner un produit"}
          </option>
          {activeProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Statut initial */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#b7b7b7]">
          Statut initial
        </label>
        <select
          value={initialStatus}
          onChange={(e) => setInitialStatus(e.target.value)}
          className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] focus:outline-none focus:border-[#50b989]"
        >
          {INITIAL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#50b989]/15 text-[#50b989] border border-[#50b989]/30 hover:bg-[#50b989]/25 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <i className="fa-solid fa-spinner fa-spin" />
            Création en cours…
          </>
        ) : (
          <>
            <i className="fa-solid fa-plus" />
            Créer le dossier
          </>
        )}
      </button>
    </div>
  );
}
