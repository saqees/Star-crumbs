import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  /** Whether the browser supports the Notification API */
  readonly browserNotifSupported = typeof window !== 'undefined' && 'Notification' in window;

  permission = signal<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window)
      ? Notification.permission : 'denied'
  );
  isSubscribed = signal(false);

  constructor(private http: HttpClient) {
    if (this.browserNotifSupported && Notification.permission === 'granted') {
      this.isSubscribed.set(true);
    }
  }

  /** Show a browser OS notification (requires permission, works on desktop/Android) */
  showNotification(title: string, body: string, url = '/') {
    if (!this.browserNotifSupported || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'star-crumbs',
      });
      n.onclick = () => { window.focus(); if (url !== '/') window.location.href = url; n.close(); };
      setTimeout(() => n.close(), 6000);
    } catch { /* ignore */ }
  }

  /** Optional background push via VAPID — fails silently */
  async tryVapidSubscribePub() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (await reg.pushManager.getSubscription()) return;
      const resp: any = await this.http.get<any>(`${environment.apiUrl}/push/vapid-key`).toPromise();
      if (!resp?.publicKey) return;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.b64(resp.publicKey) });
      const s = sub.toJSON();
      await this.http.post(`${environment.apiUrl}/push/subscribe`, { endpoint: s.endpoint, keys: s.keys }).toPromise();
    } catch { /* vapid not configured */ }
  }

  async unsubscribe() {
    this.isSubscribed.set(false);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) { await sub.unsubscribe(); }
      }
    } catch { /* ignore */ }
  }

  isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
  isInstalledPWA() { return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches; }

  private b64(s: string): Uint8Array {
    const p = '='.repeat((4 - s.length % 4) % 4);
    const b = (s + p).replace(/-/g, '+').replace(/_/g, '/');
    return new Uint8Array([...window.atob(b)].map(c => c.charCodeAt(0)));
  }
}
