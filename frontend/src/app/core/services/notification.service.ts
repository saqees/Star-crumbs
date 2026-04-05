import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/models';
import { PushService } from './push.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = environment.apiUrl;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  /** In-app popup notification (works on ALL browsers, no permission needed) */
  inAppNotif = signal<{ title: string; body: string; url: string; icon: string } | null>(null);
  private inAppTimer: any;

  constructor(private http: HttpClient, private push: PushService) {}

  load() {
    return this.http.get<Notification[]>(`${this.api}/notifications`).pipe(
      tap(list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.is_read).length);
      })
    );
  }

  /**
   * Show a real-time notification from Socket.io.
   * Works on ALL browsers without any permission:
   *   1. In-app popup at top of screen (always)
   *   2. Browser OS notification (if permission granted, desktop/Android)
   */
  addRealtime(data: { title: string; body: string; url?: string; icon?: string }) {
    // 1. Add to bell counter
    const n: any = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.body,
      is_read: false,
      created_at: new Date().toISOString(),
      url: data.url
    };
    this.notifications.update(list => [n, ...list]);
    this.unreadCount.update(c => c + 1);

    // 2. Show in-app popup (works everywhere, no permission needed)
    this.showInApp(data.title, data.body, data.url || '/', data.icon || '🍪');

    // 3. Also try browser notification if supported and allowed
    this.push.showNotification(data.title, data.body, data.url || '/');
  }

  /** Show a beautiful in-app popup — works on ALL browsers without any permission */
  showInApp(title: string, body: string, url = '/', icon = '🍪') {
    clearTimeout(this.inAppTimer);
    this.inAppNotif.set({ title, body, url, icon });
    // Auto-dismiss after 5 seconds
    this.inAppTimer = setTimeout(() => this.inAppNotif.set(null), 5000);
  }

  dismissInApp() {
    clearTimeout(this.inAppTimer);
    this.inAppNotif.set(null);
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
    this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
    this.unreadCount.set(0);
    this.http.post(`${this.api}/notifications/read-all`, {}).subscribe({ error: () => {} });
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/notifications/${id}`).pipe(
      tap(() => this.load().subscribe())
    );
  }
}
