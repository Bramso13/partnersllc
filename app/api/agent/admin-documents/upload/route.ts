import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  try {
    const agent = await requireAgentAuth();

    // Vérifier que c'est un agent CREATEUR
    if (agent.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'Only CREATEUR agents can upload admin documents' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const documentTypeId = formData.get('document_type_id') as string;
    const stepInstanceId = formData.get('step_instance_id') as string;

    if (!file || !documentTypeId || !stepInstanceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier que la step_instance appartient à l'agent et est de type ADMIN
    const { data: stepInstance } = await supabase
      .from('step_instances')
      .select(`
        id,
        assigned_to,
        dossier_id,
        step:steps(step_type)
      `)
      .eq('id', stepInstanceId)
      .single();

    if (!stepInstance || stepInstance.assigned_to !== agent.id) {
      return NextResponse.json(
        { error: 'Not authorized or step not found' },
        { status: 403 }
      );
    }

    if (stepInstance.step[0]?.step_type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not an ADMIN step' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${stepInstanceId}_${documentTypeId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    const fileUrl = supabase.storage
      .from('admin-documents')
      .getPublicUrl(fileName).data.publicUrl;

    // Créer ou mettre à jour le document avec source = 'ADMIN'
    const { data: document, error: docError } = await supabase
      .from('documents')
      .upsert({
        document_type_id: documentTypeId,
        dossier_id: stepInstance.dossier_id,
        step_instance_id: stepInstanceId,
        status: 'PENDING',
        source: 'ADMIN'
      }, {
        onConflict: 'dossier_id,document_type_id,source'
      })
      .select()
      .single();

    if (docError) {
      console.error('Document upsert error:', docError);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Créer la version du document
    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        file_url: fileUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        version_number: 1,
        uploaded_by: agent.id
      });

    if (versionError) {
      console.error('Version creation error:', versionError);
      return NextResponse.json(
        { error: 'Failed to create document version' },
        { status: 500 }
      );
    }

    // Créer un événement
    await supabase.from('events').insert({
      entity_type: 'document',
      entity_id: document.id,
      event_type: 'DOCUMENT_UPLOADED',
      actor_type: 'AGENT',
      actor_id: agent.id,
      payload: {
        document_type: documentTypeId,
        agent_name: agent.full_name,
        agent_type: 'CREATEUR',
        source: 'ADMIN'
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        status: 'PENDING',
        source: 'ADMIN'
      }
    });

  } catch (error) {
    console.error('Admin document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}