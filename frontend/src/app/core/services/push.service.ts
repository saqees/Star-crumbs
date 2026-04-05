import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  /** Is browser Notification API available? */
  readonly supported = typeof window !== 'undefined' && 'Notification' in window;

  /** Current permission state */
  permission = signal<NotificationPermission>(
    this.supported ? Notification.permission : 'denied'
  );

  /** True once user granted permission */
  isSubscribed = signal(false);

  constructor(private http: HttpClient) {
    if (this.supported && Notification.permission === 'granted') {
      this.isSubscribed.set(true);
    }
    // Also try VAPID push subscription silently in background
    if (this.supported && Notification.permission === 'granted') {
      this.tryVapidSubscribe();
    }
  }

  /**
   * Trigger the native browser notification permission dialog.
   * Shows: "[Site icon] Star Crumbs wants to send you notifications — Allow / Block"
   * Works on: Chrome, Firefox, Edge, Safari (macOS), Android Chrome
   * Does NOT require PWA install.
   *
   * Returns true if permission was granted.
   */
  async requestPermission(): Promise<boolean> {
    if (!this.supported) return false;

    // Already granted
    if (Notification.permission === 'granted') {
      this.permission.set('granted');
      this.isSubscribed.set(true);
      this.showWelcome();
      return true;
    }

    // Already blocked — can't re-ask (browser decision)
    if (Notification.permission === 'denied') {
      this.permission.set('denied');
      return false;
    }

    try {
      // ← THIS is the call that shows the native browser prompt
      const result = await Notification.requestPermission();
      this.permission.set(result);

      if (result === 'granted') {
        this.isSubscribed.set(true);
        // Show confirmation notification immediately so user sees it works
        this.showWelcome();
        // Also register for push (background notifications when browser closed)
        this.tryVapidSubscribe();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Show a notification in the browser.
   * Works in any open browser tab — no install, no service worker needed.
   */
  show(title: string, body: string, url = '/') {
    if (!this.supported || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',   // App icon shown in the notification
        badge: '/icons/badge-72x72.png',    // Small monochrome icon (Android)
        tag: 'star-crumbs',                 // Replace old notifications of same tag
        silent: false,
      });
      n.onclick = () => {
        window.focus();
        if (url !== '/') window.location.href = url;
        n.close();
      };
      // Auto-close after 6 seconds
      setTimeout(() => n.close(), 6000);
    } catch {
      // Some browsers restrict Notification() outside SW — fail silently
    }
  }

  /** Welcome notification shown right after granting permission */
  private showWelcome() {
    setTimeout(() => {
      this.show(
        '¡Notificaciones activadas! 🍪',
        'Recibirás alertas de tus pedidos y novedades de Star Crumbs.',
        '/'
      );
    }, 500);
  }

  /** Optional: subscribe to VAPID push (background notifications when browser closed) */
  private async tryVapidSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // Already subscribed

      const resp: any = await this.http
        .get<{ publicKey: string }>(`${environment.apiUrl}/push/vapid-key`)
        .toPromise();
      if (!resp?.publicKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.b64ToUint8(resp.publicKey),
      });
      const s = sub.toJSON();
      await this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint: s.endpoint,
        keys: s.keys,
      }).toPromise();
    } catch {
      // VAPID not configured — browser notifications still work fine
    }
  }

  async unsubscribe() {
    this.isSubscribed.set(false);
    this.permission.set('default');
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await this.http.delete(`${environment.apiUrl}/push/subscribe`, {
            body: { endpoint: sub.endpoint },
          }).toPromise();
          await sub.unsubscribe();
        }
      }
    } catch { /* ignore */ }
  }

  isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
  isInstalledPWA() {
    return (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
  }

  private b64ToUint8(b64: string): Uint8Array {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  }
}
