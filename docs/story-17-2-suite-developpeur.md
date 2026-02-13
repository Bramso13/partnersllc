# Story 17.2 – Suite pour le développeur

Document de passation pour **terminer** la migration « Contexts API par domaine » et le remplacement des `fetch()` par `useApi()`.

---

## 1. Contexte et objectifs

- **Objectif** : plus de `fetch()` direct dans les composants client ; tout passer par le hook central `useApi()` (et les contexts par domaine quand c’est pertinent).
- **Référence** : `docs/architecture/dev-agent-api-conventions.md`.
- **Hook central** : `lib/api/useApi.ts` (get, post, put, patch, delete, batch, **getBlob** pour exports / téléchargements, **post** accepte **FormData** pour les uploads).

---

## 2. Ce qui est déjà fait

### Contexts et providers en place

| Context | Fichier | Pages avec provider |
|--------|---------|----------------------|
| **ClientsContext** | `lib/contexts/clients/` | `/admin/clients` |
| **ProductsContext** | `lib/contexts/products/` | `/admin/products` |
| **AgentsContext** | `lib/contexts/agents/` | `/admin/agents`, `/admin/dossiers/[id]` |
| **DossiersContext** | `lib/contexts/dossiers/` | `/dashboard/dossier/[id]` |
| **FormationsContext** | `lib/contexts/formations/` | `/admin/formations`, `/admin/formations/[id]` |
| **PaymentLinksContext** | `lib/contexts/payment-links/` | `/admin/payment-links` |
| **NotificationsContext** | `lib/contexts/notifications/` | `/admin/notification-rules` (PUT/POST alignés sur l’API) |
| **ConversationsContext** | `lib/contexts/conversations/` | `/admin/conversations/clients`, `/admin/conversations/clients/[id]`, `/admin/dossiers/[id]` |
| **OrdersContext** | `lib/contexts/orders/` | (créé ; AdminAcomptesContent utilise `useApi` directement) |

### Composants déjà migrés vers useApi

- **Workflow** : `useStepForm.ts`, `useStepData.ts`, `useDocumentPreview.ts`, `StepDocuments.tsx`
- **Dashboard / legal** : `EmptyState.tsx`, `DeliveredDocuments.tsx`, `AdminDeliveredDocumentsSection.tsx`, `FormationParcours.tsx`, `LegalDocumentModal.tsx`, `MediaViewer.tsx`
- **Hub signup** : `Step1TypeAccount.tsx`, `Step2PersonalInfo.tsx`
- **Admin** : `AdminAcomptesContent.tsx`, page `app/(protected)/admin/test-notifications/page.tsx`
- **Conversations** : `NewConversationModal.tsx`, `DossierConversationButton.tsx`, `ConversationDetailContent.tsx` (polling, messages, participants, FormData)

### Nettoyage

- `console.log` retiré dans les composants/hooks modifiés (dont `DossierDetailContent.tsx`). Les scripts dans `scripts/` et le code serveur peuvent garder des `console.log` si besoin.

---

## 3. Travail restant : remplacer les `fetch()` par `useApi()`

Règle : dans tout composant ou hook **client** qui fait encore un `fetch()` vers `/api/...`, utiliser `useApi()` et `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.getBlob()` à la place.

### 3.1 Où chercher les `fetch()` restants

À la racine du front (ex. `partnersllc-app/`) :

```bash
rg "await fetch\(|fetch\(\s*[\`'\"]" --glob "*.{tsx,ts}" -l
```

Exclure : `lib/api/useApi.ts`, `scripts/`, `__tests__/`, et le code serveur (ex. `lib/notifications/whatsapp.ts`, routes API).

### 3.2 Fichiers connus encore avec `fetch()` (à migrer)

**Admin – Products / workflow**

- `components/admin/products/workflow/WorkflowConfigContent.tsx`
- `components/admin/products/workflow/SaveAsTemplateModal.tsx`
- `components/admin/products/workflow/LoadTemplateModal.tsx`
- `components/admin/products/workflow/DocumentTypesSelector.tsx`
- `components/admin/products/workflow/CustomFieldModal.tsx`
- `components/admin/products/workflow/CreateDocumentTypeModal.tsx` (workflow + racine si doublon)
- `components/admin/products/workflow/AddStepModal.tsx`
- `components/admin/products/StepsTabContent.tsx`
- `components/admin/products/EditStepModal.tsx`
- `components/admin/products/EditDocumentTypeModal.tsx`
- `components/admin/products/CreateStepModal.tsx`
- `components/admin/products/CreateDocumentTypeModal.tsx`

**Admin – Dossier (détail)**

- `components/admin/dossier/AdminStepsSection.tsx`
- `components/admin/dossier/InternalNotesSection.tsx`
- `components/admin/dossier/DocumentHistorySection.tsx`
- `components/admin/dossier/AdminDeliveryHistorySection.tsx`
- `components/admin/dossier/SendDocumentsModal.tsx`
- `components/admin/dossier/CancelDossierButton.tsx`
- `components/admin/dossier/StatusChangeDropdown.tsx`
- `components/admin/dossier/CompleteStepButton.tsx`
- `components/admin/dossier/AuditTrailSection.tsx`
- `components/admin/dossier/EventLogSection.tsx`
- `components/admin/dossier/validation/StepValidationSection.tsx`
- `components/admin/dossier/validation/StepValidationCard.tsx`
- `components/admin/dossier/validation/FieldValidationItem.tsx`
- `components/admin/dossier/validation/DocumentValidationItem.tsx`

**Admin – Dossiers (liste) / Analytics / Dashboard**

- `components/admin/dossiers/AdminDossierCard.tsx`
- `components/admin/analytics/RevenueMetrics.tsx`
- `components/admin/analytics/NotificationOrchestrationWidget.tsx`
- `components/admin/PerformanceChart.tsx`
- `components/admin/AgentDashboardContent.tsx`

**Admin – Formations**

- `components/admin/formations/FormationForm.tsx`
- `components/admin/formations/FormationElementsManager.tsx`
- `components/admin/formations/AddElementModal.tsx`

**Agent**

- `components/agent/StepQueueContent.tsx`
- `components/agent/StepFilters.tsx`
- `components/agent/DossiersListContent.tsx`
- `components/agent/verificateur/VerificateurDocumentsSection.tsx`
- `components/agent/verificateur/StepNotesSection.tsx`
- `components/agent/verificateur/CompleteStepSection.tsx`
- `components/agent/createur/CreateurCompleteStepSection.tsx`
- `components/agent/createur/AdminDocumentUploadSection.tsx`
- `components/agent/AdminStepWithoutInstance.tsx`
- `components/agent/AdminStepCompletionSection.tsx`

(La liste peut avoir légèrement évolué ; le `rg` ci‑dessus donne la liste à jour.)

---

## 4. Comment migrer un composant

### 4.1 Importer et utiliser le hook

```tsx
import { useApi } from "@/lib/api/useApi";

export function MonComposant() {
  const api = useApi();
  // ...
}
```

### 4.2 Remplacer les appels

| Avant (fetch) | Après (useApi) |
|---------------|----------------|
| `fetch(url)` puis `response.json()` | `await api.get<Type>(url)` |
| `fetch(url, { method: "POST", body: JSON.stringify(data) })` | `await api.post<Type>(url, data)` |
| `fetch(url, { method: "PUT", ... })` | `await api.put<Type>(url, data)` |
| `fetch(url, { method: "PATCH", ... })` | `await api.patch<Type>(url, data)` |
| `fetch(url)` puis `response.blob()` | `await api.getBlob(url)` |
| `fetch(url, { method: "POST", body: formData })` (FormData) | `await api.post<Type>(url, formData)` (pas de `Content-Type` manuel) |

### 4.3 Gestion d’erreur

- `useApi` lance une `Error` avec le message renvoyé par l’API (souvent `payload.error`) quand `!response.ok`.
- Dans le composant : `try { await api.get(...) } catch (e) { ... }` et utiliser `e instanceof Error ? e.message : "..."` pour l’affichage / toast.

### 4.4 Dépendances

- Si tu utilises `api` dans un `useEffect` ou un `useCallback`, ajoute `api` dans le tableau de dépendances.

### 4.5 Réponses API typiques

- Beaucoup de routes renvoient `{ data }` ou `{ list }` (ex. `{ formation }`, `{ payment_links }`). Typer et déstructurer :  
  `const data = await api.get<{ formation: Formation }>(path);` puis `data?.formation`.

---

## 5. Contexts : quand en ajouter un ?

- La story privilégie **useApi** dans les composants. Un **context** par domaine (ex. Orders, Conversations) est utile si plusieurs écrans partagent les mêmes données (liste, cache, refetch).
- Si un seul écran appelle une route, **useApi** suffit.
- Si tu crées un nouveau context : l’ajouter dans `lib/contexts/index.ts` et envelopper les pages concernées avec le provider (comme pour Conversations/Notifications).

---

## 6. Vérifications finales

1. **Aucun `fetch()` client restant** (hors `useApi.ts`, scripts, tests, code serveur) :  
   `rg "fetch\(" --glob "*.{tsx,ts}" -l` puis exclure les exceptions.
2. **Providers** : chaque page qui utilise un context doit être sous le bon provider (voir tableau §2).
3. **Console** : pas de `console.log` / `console.debug` / `console.info` dans les composants/hooks migrés (les `console.error` critiques peuvent rester si la convention du projet le permet).
4. **Non-régression** : tests manuels des parcours (dashboard client, dossiers, admin clients/dossiers/products, agent, payment links, formations, notifications, conversations).

---

## 7. Fichiers clés

- Hook API : `lib/api/useApi.ts`
- Contexts : `lib/contexts/*/` et `lib/contexts/index.ts`
- Conventions : `docs/architecture/dev-agent-api-conventions.md`

Bonne suite sur la story.
