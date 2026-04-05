import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  permission = signal<NotificationPermission>('default');
  isSubscribed = signal(false);
  private registration: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {
    if (this.isSupported) {
      this.permission.set(Notification.permission);
      this.checkSubscription();
    }
  }

  async checkSubscription() {
    if (!this.isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      this.registration = reg;
      const sub = await reg.pushManager.getSubscription();
      this.isSubscribed.set(!!sub);
    } catch (_) {}
  }

  async requestPermissionAndSubscribe(): Promise<boolean> {
    if (!this.isSupported) return false;
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

      // Get VAPID public key from server
      const { publicKey } = await this.http.get<{ publicKey: string }>(`${environment.apiUrl}/push/vapid-key`).toPromise() as any;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      const subJson = subscription.toJSON();
      await this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint: subJson.endpoint,
        keys: subJson.keys
      }).toPromise();

      this.isSubscribed.set(true);
      return true;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported) return;
    try {
      const reg = this.registration || await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await this.http.delete(`${environment.apiUrl}/push/subscribe`, {
          body: { endpoint: sub.endpoint }
        }).toPromise();
        await sub.unsubscribe();
        this.isSubscribed.set(false);
      }
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    }
  }

  // Helper: convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
  }
}
