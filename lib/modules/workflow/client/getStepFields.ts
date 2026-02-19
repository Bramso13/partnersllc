import { createClient } from "@/lib/supabase/server";
import { StepField } from "@/types/qualification";

export async function getStepFields(stepId: string): Promise<StepField[]> {
  const supabase = await createClient();

  const { data: stepFields, error } = await supabase
    .from("step_fields")
    .select("*")
    .eq("step_id", stepId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching step fields:", error);
    throw error;
  }

  const fields = (stepFields || []).map((field) => {
    let options = field.options;
    if (options && typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = null;
      }
    }

    if (Array.isArray(options) && options.length > 0) {
      if (typeof options[0] === "string") {
        options = options.map((opt) => ({ value: opt, label: opt }));
      }
    }

    return {
      ...field,
      options: options || null,
    } as StepField;
  });

  return fields;
}
