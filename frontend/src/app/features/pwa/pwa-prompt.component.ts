import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushService } from './push.service';

@Component({
  selector: 'app-pwa-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position:fixed;bottom:20px;right:20px;background:#222;color:#fff;padding:15px;border-radius:10px;">
      <p>Activar notificaciones 🔔</p>
      <button (click)="enable()">Activar</button>
    </div>
  `
})
export class PwaPromptComponent {

  constructor(private push: PushService) {}

  async enable() {
    const permission = await this.push.requestPermission();

    if (permission === 'granted') {
      this.push.showNotification('Notificaciones activadas 🚀', {
        body: 'Todo listo'
      });
    }
  }
}
