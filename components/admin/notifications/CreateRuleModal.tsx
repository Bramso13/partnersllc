"use client";

import { useState } from "react";
import { NotificationChannel } from "@/lib/notifications/types";
import { EventType } from "@/lib/events";
import { useNotifications } from "@/lib/contexts/notifications/NotificationsContext";

interface CreateRuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRuleModal({ onClose, onSuccess }: CreateRuleModalProps) {
  const { createRule } = useNotifications();
  const [formData, setFormData] = useState({
    event_type: "STEP_COMPLETED" as EventType,
    template_code: "STEP_COMPLETED",
    channels: ["EMAIL", "IN_APP"] as NotificationChannel[],
    priority: 100,
    description: "",
    conditions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let conditions = null;
      if (formData.conditions.trim()) {
        try {
          conditions = JSON.parse(formData.conditions);
        } catch {
          throw new Error("Invalid JSON in conditions field");
        }
      }

      await createRule({ ...formData, conditions });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4">
            Create Notification Rule
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Event Type *
              </label>
              <select
                value={formData.event_type}
                onChange={(e) =>
                  setFormData({ ...formData, event_type: e.target.value as EventType })
                }
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary"
                required
              >
                <option value="DOSSIER_CREATED">DOSSIER_CREATED</option>
                <option value="STEP_COMPLETED">STEP_COMPLETED</option>
                <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
                <option value="DOCUMENT_REVIEWED">DOCUMENT_REVIEWED</option>
                <option value="DOCUMENT_DELIVERED">DOCUMENT_DELIVERED</option>
                <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
                <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
              </select>
            </div>

            {/* Template Code */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Template Code *
              </label>
              <input
                type="text"
                value={formData.template_code}
                onChange={(e) =>
                  setFormData({ ...formData, template_code: e.target.value })
                }
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary"
                required
              />
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Channels *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["EMAIL", "WHATSAPP", "IN_APP", "SMS"] as NotificationChannel[]).map(
                  (channel) => (
                    <label
                      key={channel}
                      className="flex items-center gap-2 p-3 bg-brand-bg-tertiary rounded-lg cursor-pointer hover:bg-brand-bg-tertiary/80"
                    >
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={() => toggleChannel(channel)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-brand-text-primary">{channel}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) })
                }
                min="0"
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary"
                required
              />
            </div>

            {/* Conditions (Optional) */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Conditions (JSON, optional)
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) =>
                  setFormData({ ...formData, conditions: e.target.value })
                }
                rows={3}
                placeholder='{"payload": {"review_status": "APPROVED"}}'
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary font-mono text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || formData.channels.length === 0}
                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create Rule"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-brand-bg-tertiary text-brand-text-primary rounded-lg hover:bg-brand-bg-tertiary/80 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
