import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PushService {

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('Notificaciones no soportadas');
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}
