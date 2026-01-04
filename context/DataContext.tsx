"use client";

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// ==================== TYPES ====================

type Dossier = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  llc_name: string | null;
  structure: string | null;
  status: "en_cours" | "accepte" | "refuse";
  identity_verified?: boolean;
  created_at: string;
};

type DossierStep = {
  id: string;
  dossier_id: string;
  step_id: string;
  status: "en_attente" | "en_cours" | "complete" | "bloque" | "validated";
  content: any;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
};

type Associate = {
  id: string;
  dossier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
};

type IdentityImage = {
  id: string;
  dossier_id: string;
  image_url: string;
  created_at: string;
};

type Agent = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  created_at: string;
  updated_at: string;
};

type AdminTask = {
  id: string;
  admin_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type Document = {
  id: string;
  dossier_id: string;
  name: string;
  category: "juridique" | "fiscal" | "bancaire" | "autre";
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  status: "en_attente" | "signe" | "valide" | "archive";
  created_at: string;
};

type LLCStep = {
  id: string;
  step_number: number;
  name: string;
  description: string | null;
  order_index: number | null;
  role: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  sender_type: "user" | "admin" | "agent" | "conseiller";
  recipient_id: string;
  recipient_type: "user" | "admin" | "agent" | "conseiller";
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  dossier_id: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    email: string | null;
    telephone: string | null;
  };
};

// ==================== CONTEXT TYPE ====================

type DataContextValue = {
  // Dossiers LLC
  getDossierByUserId: (userId: string) => Promise<Dossier | null>;
  upsertDossier: (dossier: Partial<Dossier> & { user_id: string }) => Promise<{ data: Dossier | null; error: any }>;
  updateDossier: (dossierId: string, updates: Partial<Dossier>) => Promise<{ error: any }>;
  getAllDossiers: () => Promise<{ data: Dossier[] | null; error: any }>;
  getDossierById: (dossierId: string) => Promise<{ data: Dossier | null; error: any }>;

  // Steps
  getStepByNumber: (stepNumber: number) => Promise<{ data: LLCStep | null; error: any }>;
  getAllSteps: (role?: string | null) => Promise<{ data: LLCStep[] | null; error: any }>;
  getDossierStep: (dossierId: string, stepId: string) => Promise<{ data: DossierStep | null; error: any }>;
  getAllDossierSteps: (dossierId: string) => Promise<{ data: DossierStep[] | null; error: any }>;
  upsertDossierStep: (dossierId: string, stepId: string, status: string, content: any) => Promise<{ data: DossierStep | null; error: any }>;

  // Associates
  getAssociatesByDossierId: (dossierId: string) => Promise<{ data: Associate[] | null; error: any }>;
  deleteAssociatesByDossierId: (dossierId: string) => Promise<{ error: any }>;
  insertAssociates: (associates: Omit<Associate, "id">[]) => Promise<{ data: Associate[] | null; error: any }>;

  // Identity Images
  getIdentityImagesByDossierId: (dossierId: string) => Promise<{ data: IdentityImage[] | null; error: any }>;
  deleteIdentityImagesByDossierId: (dossierId: string) => Promise<{ error: any }>;
  insertIdentityImages: (images: Omit<IdentityImage, "id" | "created_at">[]) => Promise<{ error: any }>;

  // Storage
  uploadToStorage: (bucket: string, path: string, file: File) => Promise<{ data: { path: string } | null; error: any }>;
  getPublicUrl: (bucket: string, path: string) => string;

  // Agents
  getAllAgents: () => Promise<{ data: Agent[] | null; error: any }>;
  getAgentById: (agentId: string) => Promise<{ data: Agent | null; error: any }>;
  createAgent: (agent: Omit<Agent, "id" | "created_at" | "updated_at">) => Promise<{ error: any }>;
  updateAgent: (agentId: string, updates: Partial<Agent>) => Promise<{ error: any }>;
  deleteAgent: (agentId: string) => Promise<{ error: any }>;

  // Admin Tasks
  getTasksByAdminId: (adminId: string) => Promise<{ data: AdminTask[] | null; error: any }>;
  createTask: (task: Omit<AdminTask, "id" | "created_at" | "updated_at" | "completed_at">) => Promise<{ error: any }>;
  updateTask: (taskId: string, updates: Partial<AdminTask>) => Promise<{ error: any }>;
  deleteTask: (taskId: string) => Promise<{ error: any }>;

  // Documents
  getDocumentsByDossierId: (dossierId: string) => Promise<{ data: Document[] | null; error: any }>;
  createDocument: (document: Omit<Document, "id" | "created_at">) => Promise<{ data: Document | null; error: any }>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<{ error: any }>;
  deleteDocument: (documentId: string) => Promise<{ error: any }>;
  getAllDocumentStatuses: () => Promise<{ data: Array<{ id: string; code: string; label: string; description: string | null; display_order: number }> | null; error: any }>;

  // Profiles (pour compléter ProfileContext si besoin)
  getProfileById: (userId: string) => Promise<{ data: any | null; error: any }>;
  getAllProfiles: () => Promise<{ data: any[] | null; error: any }>;

  // Messages
  getMessagesForAdmin: (adminId: string) => Promise<{ data: Message[] | null; error: any }>;
  getUnreadMessagesCount: (adminId: string) => Promise<{ data: number; error: any }>;
  markMessageAsRead: (messageId: string) => Promise<{ error: any }>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

// ==================== PROVIDER ====================

type DataProviderProps = {
  children: ReactNode;
};

export function DataProvider({ children }: DataProviderProps) {
  // ==================== DOSSIERS LLC ====================

  const getDossierByUserId = useCallback(async (userId: string): Promise<Dossier | null> => {
    const { data, error } = await supabase
      .from("llc_dossiers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching dossier:", error);
      return null;
    }

    return data as Dossier | null;
  }, []);

  const upsertDossier = useCallback(async (dossier: Partial<Dossier> & { user_id: string }) => {
    const { data, error } = await supabase
      .from("llc_dossiers")
      .upsert(dossier, { onConflict: "user_id" })
      .select()
      .single();

    return { data: data as Dossier | null, error };
  }, []);

  const updateDossier = useCallback(async (dossierId: string, updates: Partial<Dossier>) => {
    const { error } = await supabase
      .from("llc_dossiers")
      .update(updates)
      .eq("id", dossierId);

    return { error };
  }, []);

  const getAllDossiers = useCallback(async () => {
    const { data, error } = await supabase
      .from("llc_dossiers")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data as Dossier[] | null, error };
  }, []);

  const getDossierById = useCallback(async (dossierId: string) => {
    const { data, error } = await supabase
      .from("llc_dossiers")
      .select("*")
      .eq("id", dossierId)
      .maybeSingle();

    return { data: data as Dossier | null, error };
  }, []);

  // ==================== STEPS ====================

  const getStepByNumber = useCallback(async (stepNumber: number) => {
    const { data, error } = await supabase
      .from("llc_steps")
      .select("*")
      .eq("step_number", stepNumber)
      .maybeSingle();

    return { data: data as LLCStep | null, error };
  }, []);

  const getAllSteps = useCallback(async (role?: string | null) => {
    let query = supabase
      .from("llc_steps")
      .select("*");
    
    // Filtrer par rôle : si role est fourni, on prend les étapes avec ce rôle OU NULL
    // Si role n'est pas fourni, on prend toutes les étapes
    if (role) {
      // Syntaxe Supabase pour OR : 'condition1,condition2'
      query = query.or(`role.eq.${role},role.is.null`);
    }
    
    const { data, error } = await query.order("order_index", { ascending: true });

    return { data: data as LLCStep[] | null, error };
  }, []);

  const getDossierStep = useCallback(async (dossierId: string, stepId: string) => {
    const { data, error } = await supabase
      .from("llc_dossier_steps")
      .select("*")
      .eq("dossier_id", dossierId)
      .eq("step_id", stepId)
      .maybeSingle();

    return { data: data as DossierStep | null, error };
  }, []);

  const getAllDossierSteps = useCallback(async (dossierId: string) => {
    const { data, error } = await supabase
      .from("llc_dossier_steps")
      .select(`
        *,
        llc_steps (
          id,
          step_number,
          name,
          description,
          order_index,
          role
        )
      `)
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true });

    return { data: data as any[] | null, error };
  }, []);

  const upsertDossierStep = useCallback(async (
    dossierId: string,
    stepId: string,
    status: string,
    content: any
  ) => {
    const { data, error } = await supabase
      .from("llc_dossier_steps")
      .upsert(
        {
          dossier_id: dossierId,
          step_id: stepId,
          status,
          content,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "dossier_id,step_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur lors de l'enregistrement dans llc_dossier_steps:", error);
      return { data: null, error };
    }

    console.log("✅ Données enregistrées dans llc_dossier_steps:", {
      id: data?.id,
      dossier_id: data?.dossier_id,
      step_id: data?.step_id,
      status: data?.status,
      content: data?.content,
      completed_at: data?.completed_at
    });

    return { data: data as DossierStep | null, error: null };
  }, []);

  // ==================== ASSOCIATES ====================

  const getAssociatesByDossierId = useCallback(async (dossierId: string) => {
    const { data, error } = await supabase
      .from("llc_associates")
      .select("*")
      .eq("dossier_id", dossierId);

    return { data: data as Associate[] | null, error };
  }, []);

  const deleteAssociatesByDossierId = useCallback(async (dossierId: string) => {
    const { error } = await supabase
      .from("llc_associates")
      .delete()
      .eq("dossier_id", dossierId);

    return { error };
  }, []);

  const insertAssociates = useCallback(async (associates: Omit<Associate, "id">[]) => {
    const { data, error } = await supabase
      .from("llc_associates")
      .insert(associates)
      .select();

    return { data: data as Associate[] | null, error };
  }, []);

  // ==================== IDENTITY IMAGES ====================

  const getIdentityImagesByDossierId = useCallback(async (dossierId: string) => {
    const { data, error } = await supabase
      .from("llc_identity_images")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true });

    return { data: data as IdentityImage[] | null, error };
  }, []);

  const deleteIdentityImagesByDossierId = useCallback(async (dossierId: string) => {
    const { error } = await supabase
      .from("llc_identity_images")
      .delete()
      .eq("dossier_id", dossierId);

    return { error };
  }, []);

  const insertIdentityImages = useCallback(async (images: Omit<IdentityImage, "id" | "created_at">[]) => {
    const { error } = await supabase
      .from("llc_identity_images")
      .insert(images);

    return { error };
  }, []);

  // ==================== STORAGE ====================

  const uploadToStorage = useCallback(async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    return { data, error };
  }, []);

  const getPublicUrl = useCallback((bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  // ==================== AGENTS ====================

  const getAllAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data as Agent[] | null, error };
  }, []);

  const getAgentById = useCallback(async (agentId: string) => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();

    return { data: data as Agent | null, error };
  }, []);

  const createAgent = useCallback(async (agent: Omit<Agent, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase
      .from("agents")
      .insert([agent]);

    return { error };
  }, []);

  const updateAgent = useCallback(async (agentId: string, updates: Partial<Agent>) => {
    const { error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", agentId);

    return { error };
  }, []);

  const deleteAgent = useCallback(async (agentId: string) => {
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", agentId);

    return { error };
  }, []);

  // ==================== ADMIN TASKS ====================

  const getTasksByAdminId = useCallback(async (adminId: string) => {
    const { data, error } = await supabase
      .from("admin_tasks")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    return { data: data as AdminTask[] | null, error };
  }, []);

  const createTask = useCallback(async (task: Omit<AdminTask, "id" | "created_at" | "updated_at" | "completed_at">) => {
    const { error } = await supabase
      .from("admin_tasks")
      .insert([task]);

    return { error };
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<AdminTask>) => {
    const { error } = await supabase
      .from("admin_tasks")
      .update(updates)
      .eq("id", taskId);

    return { error };
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase
      .from("admin_tasks")
      .delete()
      .eq("id", taskId);

    return { error };
  }, []);

  // ==================== DOCUMENTS ====================

  const getDocumentsByDossierId = useCallback(async (dossierId: string) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });

    return { data: data as Document[] | null, error };
  }, []);

  const createDocument = useCallback(async (document: Omit<Document, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("documents")
      .insert(document)
      .select()
      .single();

    return { data: data as Document | null, error };
  }, []);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    const { error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", documentId);

    return { error };
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    return { error };
  }, []);

  const getAllDocumentStatuses = useCallback(async () => {
    const { data, error } = await supabase
      .from("document_statuses")
      .select("*")
      .order("display_order", { ascending: true });

    return { data, error };
  }, []);

  // ==================== PROFILES ====================

  const getProfileById = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    return { data, error };
  }, []);

  const getAllProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    return { data, error };
  }, []);

  // ==================== MESSAGES ====================

  const getMessagesForAdmin = useCallback(async (adminId: string) => {
    // Récupérer les messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("recipient_id", adminId)
      .eq("recipient_type", "admin")
      .order("created_at", { ascending: false });

    if (messagesError) {
      return { data: null, error: messagesError };
    }

    if (!messages || messages.length === 0) {
      return { data: [], error: null };
    }

    // Récupérer les IDs uniques des expéditeurs
    const senderIds = [...new Set(messages.map((msg: any) => msg.sender_id))];

    // Récupérer les profils des expéditeurs
    const { data: senders, error: sendersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, telephone")
      .in("id", senderIds);

    if (sendersError) {
      console.error("Error fetching sender profiles:", sendersError);
    }

    // Créer un map pour un accès rapide aux profils
    const senderMap = new Map(
      (senders || []).map((sender: any) => [sender.id, sender])
    );

    // Combiner les messages avec les profils des expéditeurs
    const messagesWithSender = messages.map((msg: any) => ({
      ...msg,
      sender: senderMap.get(msg.sender_id) || null,
    }));

    return { data: messagesWithSender as Message[] | null, error: null };
  }, []);

  const getUnreadMessagesCount = useCallback(async (adminId: string) => {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", adminId)
      .eq("recipient_type", "admin")
      .eq("is_read", false);

    if (error) {
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    return { error };
  }, []);

  // ==================== VALUE ====================

  const value: DataContextValue = useMemo(() => ({
    // Dossiers LLC
    getDossierByUserId,
    upsertDossier,
    updateDossier,
    getAllDossiers,
    getDossierById,

    // Steps
    getStepByNumber,
    getAllSteps,
    getDossierStep,
    getAllDossierSteps,
    upsertDossierStep,

    // Associates
    getAssociatesByDossierId,
    deleteAssociatesByDossierId,
    insertAssociates,

    // Identity Images
    getIdentityImagesByDossierId,
    deleteIdentityImagesByDossierId,
    insertIdentityImages,

    // Storage
    uploadToStorage,
    getPublicUrl,

    // Agents
    getAllAgents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,

    // Admin Tasks
    getTasksByAdminId,
    createTask,
    updateTask,
    deleteTask,

    // Documents
    getDocumentsByDossierId,
    createDocument,
    updateDocument,
    deleteDocument,
    getAllDocumentStatuses,

    // Profiles
    getProfileById,
    getAllProfiles,

    // Messages
    getMessagesForAdmin,
    getUnreadMessagesCount,
    markMessageAsRead,
  }), [
    getDossierByUserId,
    upsertDossier,
    updateDossier,
    getAllDossiers,
    getDossierById,
    getStepByNumber,
    getAllSteps,
    getDossierStep,
    upsertDossierStep,
    getAssociatesByDossierId,
    deleteAssociatesByDossierId,
    insertAssociates,
    getIdentityImagesByDossierId,
    deleteIdentityImagesByDossierId,
    insertIdentityImages,
    uploadToStorage,
    getPublicUrl,
    getAllAgents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    getTasksByAdminId,
    createTask,
    updateTask,
    deleteTask,
    getDocumentsByDossierId,
    createDocument,
    updateDocument,
    deleteDocument,
    getAllDocumentStatuses,
    getProfileById,
    getAllProfiles,
    getMessagesForAdmin,
    getUnreadMessagesCount,
    markMessageAsRead,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ==================== HOOK ====================

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within <DataProvider>");
  }
  return context;
}

