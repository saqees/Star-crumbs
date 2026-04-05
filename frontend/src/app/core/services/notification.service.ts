import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = environment.apiUrl;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  // Browser permission state
  browserPermission = signal<NotificationPermission>('default');

  constructor(private http: HttpClient) {
    if ('Notification' in window) {
      this.browserPermission.set(Notification.permission);
    }
  }

  // ── Browser Notification API ────────────────────────────
  // Works on any browser tab, NO install needed.
  // iOS Safari does NOT support this API without PWA install.
  canUseBrowserNotifications(): boolean {
    return 'Notification' in window;
  }

  async requestBrowserPermission(): Promise<boolean> {
    if (!this.canUseBrowserNotifications()) return false;
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    this.browserPermission.set(perm);
    return perm === 'granted';
  }

  // Show a native browser notification (works in any open tab/window)
  showBrowserNotification(title: string, body: string, opts?: {
    icon?: string; url?: string; tag?: string;
  }) {
    if (Notification.permission !== 'granted') return;
    const notif = new Notification(title, {
      body,
      icon: opts?.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: opts?.tag || 'star-crumbs',
      silent: false,
    });
    if (opts?.url) {
      notif.onclick = () => { window.focus(); window.location.href = opts.url!; notif.close(); };
    }
    // Auto-close after 5 seconds
    setTimeout(() => notif.close(), 5000);
  }

  // ── In-app bell notifications ──────────────────────────
  load() {
    return this.http.get<Notification[]>(`${this.api}/notifications`).pipe(
      tap(list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.is_read).length);
      })
    );
  }

  // Add an in-app notification locally (from socket events)
  addLocal(n: Notification) {
    this.notifications.update(list => [n, ...list]);
    this.unreadCount.update(c => c + 1);
    // Also show browser notification if permission granted
    this.showBrowserNotification(n.title, n.description || '', {
      url: (n as any).url || '/'
    });
  }

  create(data: { title: string; description: string; image_url?: string }) {
    return this.http.post<Notification>(`${this.api}/notifications`, data).pipe(
      tap(() => this.load().subscribe())
    );
  }

  markRead(id: string) {
    return this.http.post(`${this.api}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        const list = this.notifications().map(n =>
          n.id === id ? { ...n, is_read: true } : n
        );
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.is_read).length);
      })
    );
  }

  markAllRead() {
    return this.http.post(`${this.api}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
        this.unreadCount.set(0);
      })
    );
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/notifications/${id}`).pipe(
      tap(() => this.load().subscribe())
    );
  }
}
