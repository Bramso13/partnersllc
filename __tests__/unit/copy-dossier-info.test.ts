import { formatDossierInfoForCopy } from "@/lib/agent/copy-dossier-info";
import { DossierAllData } from "@/lib/agent/dossiers";

describe("formatDossierInfoForCopy", () => {
  it("should format complete dossier data correctly", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
      },
      step_instances: [
        {
          id: "step-1",
          step: {
            id: "step-id-1",
            label: "Identification",
            code: "IDENTIFICATION",
            position: 1,
          },
          started_at: "2024-01-15T10:00:00Z",
          completed_at: "2024-01-16T10:00:00Z",
          fields: [
            {
              field_label: "Company Name",
              field_key: "company_name",
              value: "Acme Corp",
              value_jsonb: null,
            },
            {
              field_label: "Address",
              field_key: "address",
              value: "123 Main St",
              value_jsonb: null,
            },
          ],
          documents: [
            {
              document_type: "Passport",
              status: "APPROVED",
              file_name: "passport.pdf",
              uploaded_at: "2024-01-15T12:00:00Z",
            },
          ],
        },
        {
          id: "step-2",
          step: {
            id: "step-id-2",
            label: "Payment",
            code: "PAYMENT",
            position: 2,
          },
          started_at: "2024-01-17T10:00:00Z",
          completed_at: null,
          fields: [],
          documents: [],
        },
      ],
    };

    const result = formatDossierInfoForCopy(mockData);

    // Check that the result contains expected sections
    expect(result).toContain("=== DOSSIER ===");
    expect(result).toContain("ID: dossier-123");
    expect(result).toContain("Statut: IN_PROGRESS");
    expect(result).toContain("Type: LLC");

    expect(result).toContain("=== CLIENT ===");
    expect(result).toContain("Prénom: John");
    expect(result).toContain("Nom: Doe");
    expect(result).toContain("Email: john.doe@example.com");
    expect(result).toContain("Téléphone: +1234567890");

    expect(result).toContain("=== STEP 1: Identification ===");
    expect(result).toContain("Statut: Complété");
    expect(result).toContain("Champs:");
    expect(result).toContain("- Company Name: Acme Corp");
    expect(result).toContain("- Address: 123 Main St");
    expect(result).toContain("Documents:");
    expect(result).toContain("- Passport: APPROVED (passport.pdf)");

    expect(result).toContain("=== STEP 2: Payment ===");
    expect(result).toContain("Statut: En cours");
  });

  it("should handle dossier with no client phone", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "Jane Smith",
        email: "jane@example.com",
        phone: null,
      },
      step_instances: [],
    };

    const result = formatDossierInfoForCopy(mockData);

    expect(result).toContain("Téléphone: N/A");
  });

  it("should handle step with no fields or documents", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "Jane Smith",
        email: "jane@example.com",
        phone: null,
      },
      step_instances: [
        {
          id: "step-1",
          step: {
            id: "step-id-1",
            label: "Empty Step",
            code: "EMPTY",
            position: 1,
          },
          started_at: "2024-01-15T10:00:00Z",
          completed_at: null,
          fields: [],
          documents: [],
        },
      ],
    };

    const result = formatDossierInfoForCopy(mockData);

    expect(result).toContain("=== STEP 1: Empty Step ===");
    expect(result).toContain("Statut: En cours");
    expect(result).not.toContain("Champs:");
    expect(result).not.toContain("Documents:");
  });

  it("should handle JSON field values", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "Jane Smith",
        email: "jane@example.com",
        phone: null,
      },
      step_instances: [
        {
          id: "step-1",
          step: {
            id: "step-id-1",
            label: "Test Step",
            code: "TEST",
            position: 1,
          },
          started_at: "2024-01-15T10:00:00Z",
          completed_at: null,
          fields: [
            {
              field_label: "JSON Field",
              field_key: "json_field",
              value: null,
              value_jsonb: { key: "value", nested: { data: 123 } },
            },
          ],
          documents: [],
        },
      ],
    };

    const result = formatDossierInfoForCopy(mockData);

    expect(result).toContain("- JSON Field:");
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });

  it("should handle single-name clients", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "Madonna",
        email: "madonna@example.com",
        phone: null,
      },
      step_instances: [],
    };

    const result = formatDossierInfoForCopy(mockData);

    expect(result).toContain("Prénom: Madonna");
    expect(result).toContain("Nom: N/A");
  });

  it("should format dates in French format", () => {
    const mockData: DossierAllData = {
      dossier: {
        id: "dossier-123",
        status: "IN_PROGRESS",
        type: "LLC",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
      },
      client: {
        id: "client-123",
        full_name: "John Doe",
        email: "john@example.com",
        phone: null,
      },
      step_instances: [
        {
          id: "step-1",
          step: {
            id: "step-id-1",
            label: "Test Step",
            code: "TEST",
            position: 1,
          },
          started_at: "2024-01-15T10:00:00Z",
          completed_at: "2024-01-16T10:00:00Z",
          fields: [],
          documents: [],
        },
      ],
    };

    const result = formatDossierInfoForCopy(mockData);

    // French date format is DD/MM/YYYY
    expect(result).toMatch(/Créé le: \d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/Démarré le: \d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/Complété le: \d{2}\/\d{2}\/\d{4}/);
  });
});
