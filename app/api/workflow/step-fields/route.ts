import { NextRequest, NextResponse } from "next/server";
import { getStepFields } from "@/lib/workflow";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stepId = searchParams.get("step_id");
    const stepInstanceId = searchParams.get("step_instance_id");

    if (!stepId) {
      return NextResponse.json(
        { message: "step_id is required" },
        { status: 400 }
      );
    }

    const fields = await getStepFields(stepId);

    // If step_instance_id is provided, fetch field values with validation status
    if (stepInstanceId) {
      const supabase = await createClient();
      const { data: fieldValues } = await supabase
        .from("step_field_values")
        .select("step_field_id, value, validation_status, rejection_reason")
        .eq("step_instance_id", stepInstanceId);

      // Map field values to fields
      const fieldsWithValues = fields.map((field) => {
        const fieldValue = fieldValues?.find(
          (fv) => fv.step_field_id === field.id
        );
        return {
          ...field,
          currentValue: fieldValue?.value || null,
          validationStatus: (fieldValue?.validation_status as
            | "PENDING"
            | "APPROVED"
            | "REJECTED") || "PENDING",
          rejectionReason: fieldValue?.rejection_reason || null,
        };
      });

      return NextResponse.json(fieldsWithValues);
    }

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching step fields:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Error fetching step fields",
      },
      { status: 500 }
    );
  }
}
