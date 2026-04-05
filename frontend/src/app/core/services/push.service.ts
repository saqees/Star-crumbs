import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  readonly supported = typeof window !== 'undefined' && 'Notification' in window;

  permission = signal<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window)
      ? Notification.permission
      : 'denied'
  );
  isSubscribed = signal(false);

  constructor(private http: HttpClient) {
    if (this.supported && Notification.permission === 'granted') {
      this.isSubscribed.set(true);
    }
  }

  // ── Show a browser notification ─────────────────────────────────────────
  // Works in any open browser tab, no install needed.
  showNotification(title: string, body: string, url = '/') {
    if (!this.supported || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'star-crumbs',
      });
      n.onclick = () => { window.focus(); if (url !== '/') window.location.href = url; n.close(); };
      setTimeout(() => n.close(), 6000);
    } catch { /* browser may restrict outside SW */ }
  }

  // Alias for template binding
  show = this.showNotification.bind(this);

  // ── VAPID push subscription (background, optional) ──────────────────────
  // Called AFTER browser permission is already granted.
  // Fails silently if not configured — browser notifications still work.
  async tryVapidSubscribePub() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return;

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
        endpoint: s.endpoint, keys: s.keys,
      }).toPromise();
    } catch { /* vapid not configured — ok */ }
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
