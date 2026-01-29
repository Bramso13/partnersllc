import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { processEventForNotifications } from "@/lib/notifications/orchestrator";
import { BaseEvent, EventType } from "@/lib/events";
import { randomUUID } from "crypto";

/**
 * Construit un événement complet à partir des champs "humains" fournis
 */
function buildEventFromHumanFields(
  eventType: EventType,
  userId: string,
  humanFields: Record<string, any>
): BaseEvent {
  const eventId = randomUUID();
  const now = new Date().toISOString();

  // Template de base pour chaque type d'événement
  const baseEvent: BaseEvent = {
    id: eventId,
    event_type: eventType,
    entity_type: "",
    entity_id: randomUUID(),
    actor_type: "SYSTEM",
    actor_id: null,
    payload: {
      user_id: userId, // Toujours inclure user_id dans le payload pour determineRecipients
    },
    created_at: now,
  };

  // Personnaliser selon le type d'événement
  switch (eventType) {
    case "DOSSIER_CREATED":
      // Utiliser "test_dossier" comme entity_type pour éviter que createNotificationFromRule
      // utilise event.entity_id comme dossierId (qui n'existe pas en base)
      baseEvent.entity_type = "test_dossier";
      // Ne pas mettre dossier_id dans le payload pour les tests
      baseEvent.payload.product_id = humanFields.product_id || randomUUID();
      break;

    case "DOSSIER_STATUS_CHANGED":
      // Utiliser "test_dossier" comme entity_type pour éviter que createNotificationFromRule
      // utilise event.entity_id comme dossierId (qui n'existe pas en base)
      baseEvent.entity_type = "test_dossier";
      baseEvent.payload.old_status = humanFields.old_status || "IN_PROGRESS";
      baseEvent.payload.new_status = humanFields.new_status || "COMPLETED";
      baseEvent.payload.dossier_type = humanFields.dossier_type || "LLC_FORMATION";
      // Ne pas mettre dossier_id dans le payload pour les tests
      break;

    case "STEP_COMPLETED":
      baseEvent.entity_type = "step_instance";
      baseEvent.actor_type = "AGENT";
      baseEvent.payload.step_id = randomUUID();
      baseEvent.payload.step_instance_id = baseEvent.entity_id;
      // Ne pas mettre dossier_id pour les tests (évite les erreurs de clé étrangère)
      // baseEvent.payload.dossier_id = randomUUID();
      baseEvent.payload.step_name = humanFields.step_name || "Étape de test";
      baseEvent.payload.step_label = humanFields.step_label || humanFields.step_name || "Étape de test";
      break;

    case "DOCUMENT_UPLOADED":
      baseEvent.entity_type = "document_version";
      baseEvent.actor_type = "USER";
      baseEvent.actor_id = userId;
      baseEvent.payload.version_id = baseEvent.entity_id;
      baseEvent.payload.version_number = humanFields.version_number || 1;
      baseEvent.payload.file_name = humanFields.file_name || "test-document.pdf";
      baseEvent.payload.file_size_bytes = humanFields.file_size_bytes || 1024;
      baseEvent.payload.mime_type = humanFields.mime_type || "application/pdf";
      // Ne pas mettre dossier_id pour les tests (évite les erreurs de clé étrangère)
      // baseEvent.payload.dossier_id = randomUUID();
      baseEvent.payload.uploaded_by_type = "USER";
      baseEvent.payload.uploaded_by_id = userId;
      baseEvent.payload.uploaded_at = now;
      break;

    case "DOCUMENT_REVIEWED":
      baseEvent.entity_type = "document";
      baseEvent.actor_type = "AGENT";
      baseEvent.payload.document_id = baseEvent.entity_id;
      baseEvent.payload.document_version_id = randomUUID();
      baseEvent.payload.document_type = humanFields.document_type || "PASSPORT";
      // Ne pas mettre dossier_id pour les tests (évite les erreurs de clé étrangère)
      // baseEvent.payload.dossier_id = randomUUID();
      baseEvent.payload.reviewer_name = humanFields.reviewer_name || "Agent Test";
      baseEvent.payload.review_status = humanFields.review_status || "APPROVED";
      baseEvent.payload.reviewed_at = now;
      break;

    case "DOCUMENT_DELIVERED":
      // Utiliser "test_dossier" comme entity_type pour éviter que createNotificationFromRule
      // utilise event.entity_id comme dossierId (qui n'existe pas en base)
      baseEvent.entity_type = "test_dossier";
      baseEvent.actor_type = "AGENT";
      // Ne pas mettre dossier_id dans le payload pour les tests
      baseEvent.payload.document_count = humanFields.document_count || 1;
      baseEvent.payload.step_name = humanFields.step_name || null;
      baseEvent.payload.message = humanFields.message || null;
      break;

    case "PAYMENT_RECEIVED":
      baseEvent.entity_type = "order";
      baseEvent.payload.order_id = baseEvent.entity_id;
      baseEvent.payload.amount_paid = humanFields.amount_paid || 100.0;
      baseEvent.payload.currency = humanFields.currency || "EUR";
      break;

    case "PAYMENT_FAILED":
      baseEvent.entity_type = "order";
      baseEvent.payload.order_id = baseEvent.entity_id;
      baseEvent.payload.reason = humanFields.reason || "Card declined";
      break;

    case "MANUAL_CLIENT_CREATED":
      baseEvent.entity_type = "profile";
      baseEvent.entity_id = userId;
      baseEvent.actor_type = "AGENT";
      baseEvent.payload.email = humanFields.email || "";
      baseEvent.payload.product_id = humanFields.product_id || randomUUID();
      break;

    case "MESSAGE_SENT":
      baseEvent.entity_type = "message";
      baseEvent.actor_type = "USER";
      baseEvent.actor_id = userId;
      baseEvent.payload.message_id = baseEvent.entity_id;
      // Ne pas mettre dossier_id pour les tests (évite les erreurs de clé étrangère)
      // baseEvent.payload.dossier_id = randomUUID();
      baseEvent.payload.sender_type = "USER";
      baseEvent.payload.sender_id = userId;
      baseEvent.payload.content = humanFields.content || "Message de test";
      break;

    case "ERROR":
      baseEvent.entity_type = "system";
      baseEvent.payload.error_type = humanFields.error_type || "VALIDATION_ERROR";
      baseEvent.payload.error_message = humanFields.error_message || "Erreur de test";
      break;

    default:
      // Pour STEP_STARTED et autres, utiliser des valeurs par défaut
      baseEvent.entity_type = "step_instance";
      baseEvent.payload.step_id = randomUUID();
      baseEvent.payload.step_instance_id = baseEvent.entity_id;
      // Ne pas mettre dossier_id pour les tests (évite les erreurs de clé étrangère)
      // baseEvent.payload.dossier_id = randomUUID();
      break;
  }

  return baseEvent;
}

/**
 * POST /api/admin/test-notifications
 *
 * Test la fonction processEventForNotifications avec un événement personnalisé
 * Crée réellement les notifications (pas un dry run)
 * 
 * NOTE: Pour les tests uniquement - insère l'événement dans la base de données
 * avant de traiter les notifications pour satisfaire les contraintes de clé étrangère
 * 
 * Accepte soit:
 * - { event: BaseEvent } (mode avancé)
 * - { email: string, eventType: EventType, humanFields: {...} } (mode simplifié)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    let event: BaseEvent;

    // Mode simplifié: construire l'événement à partir de l'email et des champs humains
    if (body.email && body.eventType) {
      const supabase = createAdminClient();
      
      // Trouver ou créer l'utilisateur à partir de l'email
      let userId: string;
      
      // Chercher l'utilisateur par email dans auth.users
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        return NextResponse.json(
          { error: "Failed to search for user", message: listError.message },
          { status: 500 }
        );
      }

      const existingUser = authUsers.users.find(u => u.email === body.email);
      
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Créer un utilisateur de test si n'existe pas
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: body.email,
          password: randomUUID(), // Mot de passe aléatoire pour les tests
          email_confirm: true,
          user_metadata: {
            full_name: body.humanFields?.full_name || "Test User",
          }
        });

        if (createError || !newUser.user) {
          return NextResponse.json(
            { error: "Failed to create test user", message: createError?.message },
            { status: 500 }
          );
        }

        userId = newUser.user.id;

        // Mettre à jour le profil
        await supabase
          .from("profiles")
          .update({
            full_name: body.humanFields?.full_name || "Test User",
            status: "ACTIVE"
          })
          .eq("id", userId);
      }

      // Construire l'événement avec les IDs générés automatiquement
      event = buildEventFromHumanFields(body.eventType, userId, body.humanFields || {});
    } 
    // Mode avancé: utiliser l'événement fourni directement
    else if (body.event) {
      event = body.event;
    } else {
      return NextResponse.json(
        { error: "Missing required fields. Provide either {email, eventType} or {event}" },
        { status: 400 }
      );
    }

    // Valider la structure de base de l'événement
    if (!event.id || !event.event_type || !event.entity_type || !event.entity_id) {
      return NextResponse.json(
        {
          error: "Invalid event structure",
          details: "Event must have: id, event_type, entity_type, entity_id",
        },
        { status: 400 }
      );
    }

    // S'assurer que created_at est défini
    if (!event.created_at) {
      event.created_at = new Date().toISOString();
    }

    // IMPORTANT: Insérer l'événement dans la base de données avant de traiter les notifications
    // Cela est nécessaire car les notifications ont une contrainte de clé étrangère sur event_id
    const supabase = createAdminClient();
    const { error: insertError } = await supabase
      .from("events")
      .insert({
        id: event.id,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        event_type: event.event_type,
        actor_type: event.actor_type,
        actor_id: event.actor_id,
        payload: event.payload,
        created_at: event.created_at,
      })
      // Utiliser ON CONFLICT pour éviter les erreurs si l'événement existe déjà
      .select()
      .single();

    if (insertError) {
      // Si l'erreur est due à une violation de contrainte unique (événement existe déjà), continuer
      // Sinon, retourner l'erreur
      if (insertError.code !== "23505") {
        console.error("Error inserting test event:", insertError);
        return NextResponse.json(
          {
            error: "Failed to insert event in database",
            message: insertError.message,
            details: insertError,
          },
          { status: 500 }
        );
      }
      // L'événement existe déjà, on continue quand même
      console.log("Event already exists in database, continuing with notification processing");
    }

    // Exécuter processEventForNotifications
    const result = await processEventForNotifications(event);

    return NextResponse.json({
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      details: {
        event_id: event.id,
        event_type: event.event_type,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error in test-notifications API:", error);
    return NextResponse.json(
      {
        error: "Failed to process event",
        message: error.message || "Unknown error",
        processed: 0,
        succeeded: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}
