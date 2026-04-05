import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  /**
   * Web Push es soportado por:
   *  - Chrome/Edge desktop y Android       → sí, sin PWA
   *  - Firefox desktop y Android           → sí, sin PWA
   *  - Safari macOS 16+ (Ventura)          → sí, sin PWA
   *  - Samsung Internet                    → sí, sin PWA
   *  - Safari iOS 16.4+                    → SOLO como PWA instalada (limitación de Apple)
   */
  readonly isSupported: boolean =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  permission = signal<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  isSubscribed = signal(false);
  private registration: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {
    if (this.isSupported) {
      this.checkSubscription();
    }
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isInstalledPWA(): boolean {
    return (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
  }

  /**
   * Retorna true si este navegador puede recibir push AHORA MISMO.
   * Solo bloquea Safari iOS sin PWA instalada (limitación de Apple).
   * Todos los demás navegadores se permiten directamente.
   */
  canUsePushOnDevice(): boolean {
    if (!this.isSupported) return false;
    if (this.isIOS() && !this.isInstalledPWA()) return false;
    return true;
  }

  /**
   * Razón por la que no se puede usar push.
   * Retorna null si no hay ningún problema.
   */
  getBlockedReason(): string | null {
    if (!this.isSupported) {
      return 'Tu navegador no soporta notificaciones web. Prueba con Chrome, Edge o Firefox.';
    }
    if (this.isIOS() && !this.isInstalledPWA()) {
      return 'En iPhone/iPad debes instalar Star Crumbs primero: toca Compartir → "Agregar a pantalla de inicio".';
    }
    if (this.permission() === 'denied') {
      return 'Bloqueaste las notificaciones. Ve a la configuración del navegador y permítelas para este sitio.';
    }
    return null;
  }

  async checkSubscription(): Promise<void> {
    if (!this.isSupported) return;
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW timeout')), 5000)
        )
      ]) as ServiceWorkerRegistration;
      this.registration = reg;
      const sub = await reg.pushManager.getSubscription();
      this.isSubscribed.set(!!sub);
      if (sub) this.permission.set('granted');
    } catch (_) {}
  }

  async requestPermissionAndSubscribe(): Promise<boolean> {
    // Solo bloquear en Safari iOS sin PWA instalada
    const blocked = this.getBlockedReason();
    if (blocked) {
      console.warn('Push no disponible:', blocked);
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      this.permission.set(permission);
      if (permission !== 'granted') return false;
      return await this.subscribe();
    } catch (e) {
      console.error('Error al pedir permiso push:', e);
      return false;
    }
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const reg = this.registration || await navigator.serviceWorker.ready;
      this.registration = reg;

      const resp = await this.http
        .get<{ publicKey: string }>(`${environment.apiUrl}/push/vapid-key`)
        .toPromise() as any;
      const publicKey = resp?.publicKey;
      if (!publicKey) throw new Error('No se recibió VAPID key del servidor');

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
      console.error('Error al suscribir push:', e);
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
      console.error('Error al desuscribir push:', e);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
  }
}
