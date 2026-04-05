import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushService } from '../../core/services/push.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pwa-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- iOS: instructions to add to home screen -->
    <div *ngIf="showIOSBanner()" class="pwa-banner ios-banner">
      <button class="pwa-banner-close" (click)="dismissIOSBanner()">✕</button>
      <div class="ios-install-content">
        <img src="icons/icon-96x96.png" alt="Star Crumbs" class="ios-app-icon">
        <div>
          <strong>Instala Star Crumbs 🍪</strong>
          <p>
            Toca
            <span class="ios-share-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/>
                <polyline points="15 3 12 0 9 3"/><line x1="12" y1="0" x2="12" y2="13"/>
              </svg>
            </span>
            y luego <strong>"Agregar a inicio"</strong>
          </p>
        </div>
      </div>
      <div class="ios-arrow">▼</div>
    </div>

    <!-- Android / Desktop: native install prompt -->
    <div *ngIf="showAndroidBanner()" class="pwa-banner android-banner">
      <button class="pwa-banner-close" (click)="dismissAndroidBanner()">✕</button>
      <img src="icons/icon-72x72.png" alt="Star Crumbs" class="android-icon">
      <div class="android-text">
        <strong>Instalar Star Crumbs</strong>
        <span>Acceso rápido desde tu celular</span>
      </div>
      <button class="btn-install" (click)="installApp()">Instalar</button>
    </div>

    <!-- Notification permission modal -->
    <div *ngIf="showNotifPrompt()" class="notif-overlay">
      <div class="notif-modal">
        <div class="notif-icon">🔔</div>
        <h3>Activa las notificaciones</h3>
        <p *ngIf="!iosNoInstall()">
          Recibe alertas de tus pedidos, novedades y descuentos directamente en el navegador.
          <strong>No necesitas instalar nada.</strong>
        </p>
        <p *ngIf="iosNoInstall()" class="ios-notif-msg">
          📱 En iPhone las notificaciones requieren instalar la app.<br>
          Toca el botón de compartir
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/><polyline points="15 3 12 0 9 3"/><line x1="12" y1="0" x2="12" y2="13"/></svg>
          y selecciona <strong>"Agregar a inicio"</strong>.
        </p>
        <div class="notif-btns">
          <button *ngIf="!iosNoInstall()" class="btn btn-primary" (click)="enableNotifications()">
            <i class="fas fa-bell"></i> Activar notificaciones
          </button>
          <button class="btn btn-secondary btn-sm" (click)="dismissNotifPrompt()">Ahora no</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pwa-banner {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9800;
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; box-shadow: 0 -4px 20px rgba(0,0,0,.15);
      animation: slideUp .3s ease;
    }
    .pwa-banner-close { position: absolute; top: 8px; right: 12px; background: none; border: none; cursor: pointer; font-size: 1rem; color: #999; }
    /* iOS */
    .ios-banner { background: #fff; border-top: 1px solid #e0e0e0; flex-direction: column; padding: 14px 16px 20px; }
    .ios-install-content { display: flex; align-items: center; gap: 12px; width: 100%; }
    .ios-app-icon { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
    .ios-install-content div { flex: 1; }
    .ios-install-content strong { display: block; font-size: .95rem; color: #1c1c1e; margin-bottom: 3px; }
    .ios-install-content p { font-size: .82rem; color: #636366; margin: 0; line-height: 1.5; }
    .ios-share-icon { display: inline-flex; vertical-align: middle; margin: 0 3px; }
    .ios-arrow { font-size: 1.2rem; color: #007AFF; margin-top: 6px; animation: bounce .8s infinite; }
    /* Android */
    .android-banner { background: linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); color: #fff; border-radius: var(--radius-lg) var(--radius-lg) 0 0; justify-content: space-between; }
    .android-icon { width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; }
    .android-text { flex: 1; }
    .android-text strong { display: block; font-size: .9rem; }
    .android-text span { font-size: .78rem; opacity: .85; }
    .btn-install { background: #fff; color: var(--warm-capuchino); border: none; border-radius: var(--radius-full); padding: 8px 18px; font-weight: 700; cursor: pointer; font-size: .85rem; white-space: nowrap; }
    /* Notif modal */
    .notif-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9900; padding: 16px; animation: fadeIn .2s ease; }
    .notif-modal { background: #fff; border-radius: var(--radius-xl); padding: 28px 24px; max-width: 360px; width: 100%; text-align: center; box-shadow: var(--shadow-lg); animation: slideUp .3s ease; }
    .notif-icon { font-size: 3rem; margin-bottom: 12px; }
    .notif-modal h3 { color: var(--mocca-bean); margin-bottom: 8px; }
    .notif-modal p { color: var(--text-mid); font-size: .88rem; line-height: 1.65; margin-bottom: 20px; }
    .ios-notif-msg { background: #fff3e0; border-radius: var(--radius-md); padding: 12px; font-size: .84rem; }
    .notif-btns { display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .notif-btns .btn { width: 100%; justify-content: center; }
  `]
})
export class PwaPromptComponent implements OnInit, OnDestroy {
  showIOSBanner   = signal(false);
  showAndroidBanner = signal(false);
  showNotifPrompt = signal(false);
  iosNoInstall    = signal(false);
  private deferredPrompt: any = null;
  private beforeInstallHandler: any;

  constructor(
    public pushService: PushService,
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const isIOS = this.pushService.isIOS();
    const isStandalone = this.pushService.isInstalledPWA();

    // iOS: show install instructions if not yet installed
    if (isIOS && !isStandalone && !localStorage.getItem('pwa-ios-dismissed')) {
      setTimeout(() => this.showIOSBanner.set(true), 3500);
    }

    // Android/Desktop: intercept native install prompt
    this.beforeInstallHandler = (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (!localStorage.getItem('pwa-android-dismissed')) {
        this.showAndroidBanner.set(true);
      }
    };
    window.addEventListener('beforeinstallprompt', this.beforeInstallHandler);

    // Notification prompt: show after 8s if permission not yet decided
    if (this.auth.isLoggedIn && !localStorage.getItem('notif-prompt-dismissed')) {
      setTimeout(() => {
        if (Notification.permission === 'default') {
          this.iosNoInstall.set(isIOS && !isStandalone);
          this.showNotifPrompt.set(true);
        }
      }, 8000);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler);
  }

  dismissIOSBanner() { this.showIOSBanner.set(false); localStorage.setItem('pwa-ios-dismissed', '1'); }
  dismissAndroidBanner() { this.showAndroidBanner.set(false); localStorage.setItem('pwa-android-dismissed', '1'); }
  dismissNotifPrompt() { this.showNotifPrompt.set(false); localStorage.setItem('notif-prompt-dismissed', '1'); }

  async installApp() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') { this.toast.success('¡App instalada! 🎉'); this.showAndroidBanner.set(false); }
    this.deferredPrompt = null;
  }

  async enableNotifications() {
    this.showNotifPrompt.set(false);

    if (!('Notification' in window)) {
      this.toast.error('Tu navegador no soporta notificaciones');
      return;
    }
    if (Notification.permission === 'denied') {
      this.toast.error('Notificaciones bloqueadas. Toca el 🔒 en la barra del navegador para activarlas.');
      return;
    }
    if (Notification.permission === 'granted') {
      this.pushService.isSubscribed.set(true);
      this.toast.success('¡Notificaciones ya activas! 🔔');
      return;
    }

    // Call Notification.requestPermission() DIRECTLY here (user gesture context)
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.pushService.isSubscribed.set(true);
        this.pushService.permission.set('granted');
        this.toast.success('¡Notificaciones activadas! 🔔');
        setTimeout(() => {
          this.pushService.showNotification(
            'Star Crumbs 🍪',
            '¡Perfecto! Te avisaremos de novedades y pedidos.',
            '/'
          );
        }, 400);
        this.pushService.tryVapidSubscribePub();
      } else if (result === 'denied') {
        this.toast.error('Bloqueaste las notificaciones. Cámbialo en el 🔒 de la URL.');
      } else {
        this.toast.info('Permiso no concedido. Puedes activarlo más tarde.');
      }
    } catch (e) {
      this.toast.error('Error al activar. Prueba en Chrome o Firefox.');
    }
  }
}
