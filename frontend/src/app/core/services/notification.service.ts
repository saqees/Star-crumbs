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

  constructor(private http: HttpClient) {}

  load() {
    return this.http.get<Notification[]>(`${this.api}/notifications`).pipe(
      tap(list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.is_read).length);
      })
    );
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

  delete(id: string) {
    return this.http.delete(`${this.api}/notifications/${id}`).pipe(
      tap(() => this.load().subscribe())
    );
  }
}
