"use client";

import { useState } from "react";
import { NotificationRule } from "@/lib/notifications/types";
import { useNotifications } from "@/lib/contexts/notifications/NotificationsContext";

interface TestRuleModalProps {
  rule: NotificationRule;
  onClose: () => void;
}

type TestRuleResult = {
  matched: boolean;
  reason?: string;
  notification_preview?: {
    title: string;
    message: string;
    action_url?: string | null;
    channel_previews?: Record<string, unknown>;
  };
};

export function TestRuleModal({ rule, onClose }: TestRuleModalProps) {
  const { testRule } = useNotifications();
  const [eventPayload, setEventPayload] = useState(
    JSON.stringify(
      {
        event_type: rule.event_type,
        entity_type: "dossier",
        entity_id: "00000000-0000-0000-0000-000000000000",
        actor_type: "SYSTEM",
        actor_id: null,
        payload: {
          dossier_id: "00000000-0000-0000-0000-000000000000",
          step_name: "Example Step",
        },
      },
      null,
      2
    )
  );
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestRuleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setResult(null);
    try {
      const event = JSON.parse(eventPayload);
      const data = await testRule(rule.id, { event });
      setResult(data as TestRuleResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-bg-secondary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4">
            Test Notification Rule
          </h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-brand-text-secondary mb-2">
                Sample Event Payload (JSON)
              </div>
              <textarea
                value={eventPayload}
                onChange={(e) => setEventPayload(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary font-mono text-sm"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={testing}
              className="w-full px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {testing ? "Testing..." : "Run Test"}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                <div className="font-medium mb-2">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.matched ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-green-400 font-medium mb-3">✓ Rule Matched</div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-brand-text-secondary mb-1">Title:</div>
                        <div className="text-brand-text-primary">{result.notification_preview?.title}</div>
                      </div>

                      <div>
                        <div className="text-sm text-brand-text-secondary mb-1">Message:</div>
                        <div className="text-brand-text-primary">{result.notification_preview?.message}</div>
                      </div>

                      <div>
                        <div className="text-sm text-brand-text-secondary mb-1">Action URL:</div>
                        <div className="text-brand-accent text-sm font-mono">
                          {result.notification_preview?.action_url || "None"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-brand-text-secondary mb-2">Channel Previews:</div>
                        <div className="space-y-2">
                          {Object.entries(result.notification_preview?.channel_previews || {}).map(
                            ([channel, preview]: [string, any]) => (
                              <div key={channel} className="bg-brand-bg-tertiary p-3 rounded-lg">
                                <div className="text-sm font-medium text-brand-text-primary mb-2">
                                  {channel.toUpperCase()}
                                </div>
                                <pre className="text-xs text-brand-text-secondary overflow-x-auto">
                                  {JSON.stringify(preview, null, 2)}
                                </pre>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
                    <div className="font-medium mb-2">Rule Did Not Match</div>
                    <div className="text-sm">{result.reason}</div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-brand-bg-tertiary text-brand-text-primary rounded-lg hover:bg-brand-bg-tertiary/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
