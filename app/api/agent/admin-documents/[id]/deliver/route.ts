import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth, getAgentId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentProfile = await requireAgentAuth();
    const { id: documentId } = await params;
    const supabase = createAdminClient();

    // Récupérer l'agent_id depuis la table agents
    const agentId = await getAgentId(agentProfile.email);
    
    if (!agentId) {
      console.error('Agent not found for email:', agentProfile.email);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Récupérer le document avec ses informations
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        status,
        dossier_id,
        step_instance_id,
        document_type:document_types(label),
        step_instance:step_instances!documents_step_instance_id_fkey(
          id,
          assigned_to,
          step:steps(step_type)
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document fetch error:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log('Document data:', JSON.stringify(document, null, 2));

    // Vérifications de sécurité - Document doit avoir un step_instance_id (documents ADMIN)
    if (!document.step_instance_id) {
      return NextResponse.json(
        { error: 'Not an admin document' },
        { status: 400 }
      );
    }

    // step_instance est un objet unique (pas un array) car c'est une foreign key
    const stepInstance = document.step_instance as any;
    
    if (!stepInstance || stepInstance.assigned_to !== agentId) {
      console.error('Authorization check failed:', {
        stepInstance,
        agentId
      });
      return NextResponse.json(
        { error: 'Not authorized to deliver this document' },
        { status: 403 }
      );
    }

    if (stepInstance.step?.step_type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not an ADMIN step' },
        { status: 400 }
      );
    }

    if (document.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Document already delivered' },
        { status: 400 }
      );
    }

    // Marquer le document comme livré
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'DELIVERED',
        delivered_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Document update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document status' },
        { status: 500 }
      );
    }

    // Créer un événement
    await supabase.from('events').insert({
      entity_type: 'document',
      entity_id: documentId,
      event_type: 'DOCUMENT_DELIVERED',
      actor_type: 'AGENT',
      actor_id: agentId,
      payload: {
        document_type: document.document_type[0]?.label,
        agent_name: agentProfile.full_name,
        agent_type: 'CREATEUR'
      }
    });

    // Créer une notification pour le client
    const { data: dossier } = await supabase
      .from('dossiers')
      .select('user_id')
      .eq('id', document.dossier_id)
      .single();

    if (dossier) {
      await supabase.from('notifications').insert({
        user_id: dossier.user_id,
        type: 'DOCUMENT_AVAILABLE',
        title: 'Nouveau document disponible',
        message: `Le document "${document.document_type[0]?.label}" est maintenant disponible dans votre dossier.`,
        payload: {
          dossier_id: document.dossier_id,
          document_id: documentId
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Admin document delivery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}