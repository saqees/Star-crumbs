import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Notification strategy:
 *
 * 1. BROWSER NOTIFICATIONS (new Notification()) — PRIMARY
 *    ✅ Works in any open browser tab/window
 *    ✅ No install required, no service worker needed
 *    ✅ Works on Android Chrome, Windows Chrome/Edge/Firefox, macOS
 *    ❌ iOS Safari: only works if app is installed as PWA (Apple limitation)
 *    → Just needs: Notification.requestPermission() = 'granted'
 *
 * 2. PUSH NOTIFICATIONS (VAPID) — SECONDARY (background)
 *    ✅ Works even when browser is closed
 *    ❌ Requires service worker + VAPID keys on server
 *    → Optional upgrade after browser permission is granted
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  /** Whether browser Notification API is available */
  browserNotifSupported = typeof window !== 'undefined' && 'Notification' in window;

  /** Whether VAPID push is available (requires service worker) */
  pushSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  permission = signal<NotificationPermission>('default');
  isSubscribed = signal(false);  // true when push OR browser notifs active

  private swReg: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {
    if (this.browserNotifSupported) {
      this.permission.set(Notification.permission);
      if (Notification.permission === 'granted') this.isSubscribed.set(true);
    }
    if (this.pushSupported) this.initSW();
  }

  private async initSW() {
    try {
      this.swReg = await navigator.serviceWorker.ready;
      const sub = await this.swReg.pushManager.getSubscription();
      if (sub) { this.isSubscribed.set(true); this.permission.set('granted'); }
    } catch (_) {}
  }

  // ── STEP 1: Request browser notification permission ──────────────────────
  // This is all you need for in-browser notifications. No install required.
  async requestPermission(): Promise<boolean> {
    if (!this.browserNotifSupported) return false;
    if (Notification.permission === 'granted') {
      this.permission.set('granted');
      this.isSubscribed.set(true);
      return true;
    }
    try {
      const perm = await Notification.requestPermission();
      this.permission.set(perm);
      if (perm === 'granted') {
        this.isSubscribed.set(true);
        // Also try VAPID push subscription in background (optional)
        this.tryVapidSubscribe();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  }

  // ── STEP 2 (optional): Subscribe to VAPID push ───────────────────────────
  // Called automatically after browser permission granted.
  // Fails silently — browser notifications still work without this.
  private async tryVapidSubscribe() {
    if (!this.pushSupported || !this.swReg) return;
    try {
      const resp: any = await this.http
        .get<{ publicKey: string }>(`${environment.apiUrl}/push/vapid-key`)
        .toPromise();
      if (!resp?.publicKey) return;

      const sub = await this.swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.b64ToUint8(resp.publicKey)
      });
      const s = sub.toJSON();
      await this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint: s.endpoint, keys: s.keys
      }).toPromise();
    } catch (_) {
      // VAPID push failed — browser notifications still work
    }
  }

  // ── Show a browser notification (works in any open tab) ─────────────────
  show(title: string, body: string, url = '/') {
    if (Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'star-crumbs',
        silent: false,
      });
      n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
      setTimeout(() => n.close(), 6000);
    } catch (e) {
      // Some browsers block Notification from non-SW context — ignore
      console.warn('Browser notification failed:', e);
    }
  }

  // ── Unsubscribe ──────────────────────────────────────────────────────────
  async unsubscribe() {
    this.isSubscribed.set(false);
    this.permission.set('default');
    try {
      if (this.swReg) {
        const sub = await this.swReg.pushManager.getSubscription();
        if (sub) {
          await this.http.delete(`${environment.apiUrl}/push/subscribe`, {
            body: { endpoint: sub.endpoint }
          }).toPromise();
          await sub.unsubscribe();
        }
      }
    } catch (_) {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
  isInstalledPWA() {
    return (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
  }

  private b64ToUint8(b64: string): Uint8Array {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  }
}
