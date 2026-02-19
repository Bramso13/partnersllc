/**
 * Browser Notification Permission Utilities
 * For future push notifications implementation
 */

/**
 * Request browser notification permission
 * This is a placeholder for future push notification implementation
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  // Only request if not already granted or denied
  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      console.warn("Notification permission:", permission);
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return null;
    }
  }

  return Notification.permission;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  return Notification.permission;
}

/**
 * Show a browser notification (for testing/future use)
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/logo_partnersllc_blanc.png",
      badge: "/logo_partnersllc_blanc.png",
      ...options,
    });
  }
}
