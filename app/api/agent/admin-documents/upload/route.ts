import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth, getAgentId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  try {
    const agent = await requireAgentAuth();

    // Get the agent_id from agents table (not profile.id)
    const agentId = await getAgentId(agent.email);
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent not found in agents table' },
        { status: 403 }
      );
    }

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

    if (!stepInstance) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Verify agent is assigned to this step
    if (stepInstance.assigned_to !== agentId) {
      return NextResponse.json(
        { error: 'Not authorized for this step' },
        { status: 403 }
      );
    }

    // if (stepInstance.step[0]?.step_type !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Not an ADMIN step' },
    //     { status: 400 }
    //   );
    // }

    // Upload file to Supabase Storage (use dossier-documents bucket so clients can access)
    const fileExt = file.name.split('.').pop();
    const fileName = `admin/${stepInstanceId}_${documentTypeId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dossier-documents')
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
      .from('dossier-documents')
      .getPublicUrl(fileName).data.publicUrl;

    // Créer ou mettre à jour le document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .upsert({
        document_type_id: documentTypeId,
        dossier_id: stepInstance.dossier_id,
        step_instance_id: stepInstanceId,
        status: 'PENDING'
      }, {
        onConflict: 'dossier_id,document_type_id,step_instance_id'
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

    // Compter les versions existantes pour ce document
    const { count: versionCount } = await supabase
      .from('document_versions')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', document.id);

    const nextVersionNumber = (versionCount || 0) + 1;

    // Créer la nouvelle version du document
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        file_url: fileUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        version_number: nextVersionNumber,
        uploaded_by_type: 'AGENT',
        uploaded_by_id: agentId
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error('Version creation error:', versionError);
      return NextResponse.json(
        { error: 'Failed to create document version' },
        { status: 500 }
      );
    }

    // Mettre à jour le document avec current_version_id
    const { error: updateDocError } = await supabase
      .from('documents')
      .update({ current_version_id: version.id })
      .eq('id', document.id);

    if (updateDocError) {
      console.error('Document update error:', updateDocError);
      return NextResponse.json(
        { error: 'Failed to update document with version' },
        { status: 500 }
      );
    }

    // Créer un événement
    await supabase.from('events').insert({
      entity_type: 'document',
      entity_id: document.id,
      event_type: 'DOCUMENT_UPLOADED',
      actor_type: 'AGENT',
      actor_id: agentId,
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