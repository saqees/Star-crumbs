import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  // iOS 16.4+ requires the app to be installed as PWA first
  isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  permission = signal<NotificationPermission>('default');
  isSubscribed = signal(false);
  private registration: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {
    if ('Notification' in window) {
      this.permission.set(Notification.permission);
    }
    if (this.isSupported) {
      this.checkSubscription();
    }
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isInstalledPWA(): boolean {
    return (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
  }

  // iOS: can only use push if installed as PWA AND iOS >= 16.4
  canUsePushOnDevice(): boolean {
    if (this.isIOS()) {
      return this.isInstalledPWA() && this.isSupported;
    }
    return this.isSupported;
  }

  async checkSubscription() {
    if (!this.isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      this.registration = reg;
      const sub = await reg.pushManager.getSubscription();
      this.isSubscribed.set(!!sub);
      if (sub) this.permission.set('granted');
    } catch (_) {}
  }

  async requestPermissionAndSubscribe(): Promise<boolean> {
    if (!this.canUsePushOnDevice()) {
      // iOS not installed
      if (this.isIOS() && !this.isInstalledPWA()) {
        console.log('iOS: must install PWA first');
        return false;
      }
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      this.permission.set(permission);
      if (permission !== 'granted') return false;
      return await this.subscribe();
    } catch (e) {
      console.error('Push permission error:', e);
      return false;
    }
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const reg = this.registration || await navigator.serviceWorker.ready;
      this.registration = reg;

      const resp = await this.http.get<{ publicKey: string }>(`${environment.apiUrl}/push/vapid-key`).toPromise() as any;
      const publicKey = resp?.publicKey;
      if (!publicKey) throw new Error('No VAPID key');

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      const sub = subscription.toJSON();
      await this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint: sub.endpoint,
        keys: sub.keys
      }).toPromise();

      this.isSubscribed.set(true);
      this.permission.set('granted');
      return true;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      const reg = this.registration || await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await this.http.delete(`${environment.apiUrl}/push/subscribe`, {
          body: { endpoint: sub.endpoint }
        }).toPromise();
        await sub.unsubscribe();
      }
      this.isSubscribed.set(false);
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
  }
}
