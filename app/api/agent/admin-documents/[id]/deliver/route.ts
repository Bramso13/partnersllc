import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await requireAgentAuth();
    const { id: documentId } = await params;
    const supabase = createAdminClient();

    // Récupérer le document avec ses informations
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        status,
        source,
        dossier_id,
        document_type:document_types(label),
        step_instance:step_instances(
          id,
          assigned_to,
          step:steps(step_type)
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Vérifications de sécurité
    if (document.source !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not an admin document' },
        { status: 400 }
      );
    }

    if (document.step_instance[0]?.assigned_to !== agent.id) {
      return NextResponse.json(
        { error: 'Not authorized to deliver this document' },
        { status: 403 }
      );
    }

    if (document.step_instance[0]?.step[0]?.step_type !== 'ADMIN') {
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
      actor_id: agent.id,
      payload: {
        document_type: document.document_type[0]?.label,
        agent_name: agent.full_name,
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