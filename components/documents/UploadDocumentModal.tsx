"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDocumentRecord } from "@/app/actions/documents";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Dossier {
  id: string;
  product_id: string;
  product: { name: string } | null;
}

export function UploadDocumentModal({
  onClose,
  onSuccess,
}: UploadDocumentModalProps) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] =
    useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDossiers();
  }, []);

  useEffect(() => {
    if (selectedDossierId) {
      loadDocumentTypes(selectedDossierId);
    } else {
      setDocumentTypes([]);
      setSelectedDocumentTypeId("");
    }
  }, [selectedDossierId]);

  const loadDossiers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Non authentifié");
        return;
      }

      const { data: dossiersData, error } = await supabase
        .from("dossiers")
        .select(
          `
          id,
          product_id,
          product:products(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our Dossier type
      const transformedDossiers = (dossiersData || []).map((d: any) => ({
        id: d.id,
        product_id: d.product_id,
        product: Array.isArray(d.product) ? d.product[0] : d.product,
      }));

      setDossiers(transformedDossiers as Dossier[]);
    } catch (err: any) {
      setError("Erreur lors du chargement des dossiers");
      console.error(err);
    }
  };

  const loadDocumentTypes = async (dossierId: string) => {
    try {
      // Fetch current step instance for dossier to get required document types
      const { data: dossier } = await supabase
        .from("dossiers")
        .select("current_step_instance_id")
        .eq("id", dossierId)
        .single();

      if (dossier?.current_step_instance_id) {
        const { data: stepInstance } = await supabase
          .from("step_instances")
          .select("step_id")
          .eq("id", dossier.current_step_instance_id)
          .single();

        if (stepInstance?.step_id) {
          const { data: types } = await supabase
            .from("document_types")
            .select("*")
            .eq("required_step_id", stepInstance.step_id);

          setDocumentTypes(types || []);
        }
      }
    } catch (err) {
      console.error("Error loading document types:", err);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Type de fichier non supporté. Veuillez sélectionner un fichier PDF, JPG ou PNG."
      );
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("Fichier trop volumineux. La taille maximale est de 10MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDossierId || !selectedDocumentTypeId) {
      setError("Veuillez remplir tous les champs requis");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get document type slug for storage path
      const { data: docType } = await supabase
        .from("document_types")
        .select("code")
        .eq("id", selectedDocumentTypeId)
        .single();

      if (!docType) {
        throw new Error("Type de document introuvable");
      }

      // Upload to Supabase Storage with progress tracking
      const ext = selectedFile.name.split(".").pop();
      const storagePath = `documents/${selectedDossierId}/${docType.code}/1.${ext}`;

      // Upload file
      setUploadProgress(50); // Simulate progress
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(100);

      // Create document records via Server Action
      await createDocumentRecord(
        selectedDossierId,
        selectedDocumentTypeId,
        null, // step_instance_id
        storagePath,
        selectedFile.size,
        selectedFile.type,
        selectedFile.name
      );

      // Success - close modal and refresh
      onSuccess();
      // Show success message (could be enhanced with a toast library)
      alert(
        "Document téléversé avec succès. Vous serez notifié lors de sa validation."
      );
    } catch (err: any) {
      setError(err.message || "Erreur lors du téléversement");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand-text-primary">
            Téléverser un document
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            aria-label="Fermer"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          {/* Dossier Selection */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Sélectionnez le dossier associé *
            </label>
            <select
              value={selectedDossierId}
              onChange={(e) => setSelectedDossierId(e.target.value)}
              className="w-full bg-brand-dark-bg border border-brand-dark-border rounded-lg px-4 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              disabled={isUploading}
            >
              <option value="">Sélectionnez un dossier</option>
              {dossiers.map((dossier) => (
                <option key={dossier.id} value={dossier.id}>
                  {dossier.product?.name || dossier.id}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Type de document *
            </label>
            <select
              value={selectedDocumentTypeId}
              onChange={(e) => setSelectedDocumentTypeId(e.target.value)}
              className="w-full bg-brand-dark-bg border border-brand-dark-border rounded-lg px-4 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              disabled={
                isUploading || !selectedDossierId || documentTypes.length === 0
              }
            >
              <option value="">
                {!selectedDossierId
                  ? "Sélectionnez d'abord un dossier"
                  : documentTypes.length === 0
                    ? "Aucun type disponible"
                    : "Sélectionnez un type"}
              </option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedDocumentTypeId && (
              (() => {
                const selectedType = documentTypes.find(
                  (t) => t.id === selectedDocumentTypeId
                );
                return selectedType?.description ? (
                  <div className="mt-3 p-3 bg-brand-dark-bg border border-brand-dark-border rounded-lg">
                    <MarkdownContent
                      content={selectedType.description}
                      className="text-sm text-brand-text-secondary"
                    />
                  </div>
                ) : null;
              })()
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-brand-accent bg-brand-accent/5"
                : "border-brand-dark-border"
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <i className="fa-solid fa-file text-4xl text-brand-accent"></i>
                <p className="text-brand-text-primary font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-brand-text-secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-brand-text-secondary hover:text-brand-text-primary text-sm"
                >
                  Changer de fichier
                </button>
              </div>
            ) : (
              <>
                <i className="fa-solid fa-cloud-upload-alt text-4xl text-brand-text-secondary mb-4"></i>
                <p className="text-brand-text-primary mb-2">
                  Glissez-déposez votre fichier ici ou cliquez pour parcourir
                </p>
                <p className="text-sm text-brand-text-secondary mb-4">
                  PDF, JPG, PNG (max 10MB)
                </p>
                <label className="inline-block px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                  <span>Parcourir</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInputChange}
                    disabled={isUploading}
                  />
                </label>
              </>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-text-secondary">
                  Téléversement en cours...
                </span>
                <span className="text-sm text-brand-text-secondary">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-brand-dark-bg rounded-full h-2.5">
                <div
                  className="bg-brand-accent h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-lg p-4">
              <p className="text-brand-danger text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand-dark-surface text-brand-text-primary rounded-lg hover:bg-brand-dark-border transition-colors"
              disabled={isUploading}
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={
                isUploading ||
                !selectedFile ||
                !selectedDossierId ||
                !selectedDocumentTypeId
              }
              className="px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Téléversement..." : "Téléverser"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
