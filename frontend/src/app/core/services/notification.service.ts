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
   * Add a real-time notification from Socket.io and show browser popup.
   * No install needed — works in any open browser tab.
   */
  addRealtime(data: { title: string; body: string; url?: string; icon?: string }) {
    // Add to in-app bell
    const n: any = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.body,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.update(list => [n, ...list]);
    this.unreadCount.update(c => c + 1);
    // Show browser notification popup (no install needed)
    this.push.show(data.title, data.body, data.url || '/');
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
    // Try API silently
    this.http.post(`${this.api}/notifications/read-all`, {}).subscribe({ error: () => {} });
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/notifications/${id}`).pipe(
      tap(() => this.load().subscribe())
    );
  }
}
