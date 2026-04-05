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
    <!-- iOS "Add to Home Screen" instruction banner -->
    <div *ngIf="showIOSBanner()" class="pwa-banner ios-banner">
      <button class="pwa-banner-close" (click)="dismissIOSBanner()">✕</button>
      <div class="ios-install-content">
        <img src="icons/icon-96x96.png" alt="Star Crumbs" class="ios-app-icon">
        <div>
          <strong>Instala Star Crumbs</strong>
          <p>
            Toca <span class="ios-share-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/>
                <polyline points="15 3 12 0 9 3"/><line x1="12" y1="0" x2="12" y2="13"/>
              </svg>
            </span>
            y después <strong>"Agregar a pantalla de inicio"</strong>
          </p>
        </div>
      </div>
      <div class="ios-arrow">▼</div>
    </div>

    <!-- Android/Desktop install banner -->
    <div *ngIf="showAndroidBanner()" class="pwa-banner android-banner">
      <button class="pwa-banner-close" (click)="dismissAndroidBanner()">✕</button>
      <img src="icons/icon-72x72.png" alt="Star Crumbs" class="android-icon">
      <div class="android-text">
        <strong>Instalar Star Crumbs</strong>
        <span>Acceso rápido desde tu celular</span>
      </div>
      <button class="btn-install" (click)="installApp()">Instalar</button>
    </div>

    <!-- Notification permission prompt (shown after install or on first login) -->
    <div *ngIf="showNotifPrompt()" class="notif-prompt-overlay">
      <div class="notif-prompt">
        <div class="notif-prompt-icon">🔔</div>
        <h3>Activa las notificaciones</h3>
        <p>
          Recibe alertas de tus pedidos, novedades y ofertas especiales de Star Crumbs.
          <span *ngIf="isIOS()"> <br><small>📱 En iPhone debes instalar la app primero.</small></span>
        </p>
        <div class="notif-prompt-btns">
          <button class="btn btn-primary" (click)="enableNotifications()">
            <i class="fas fa-bell"></i> Activar
          </button>
          <button class="btn btn-secondary btn-sm" (click)="dismissNotifPrompt()">Ahora no</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* iOS Banner */
    .pwa-banner { position:fixed; bottom:0; left:0; right:0; z-index:9800; padding:14px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 -4px 20px rgba(0,0,0,0.15); animation:slideUp .3s ease; }
    .pwa-banner-close { position:absolute; top:8px; right:12px; background:none; border:none; cursor:pointer; font-size:1rem; color:#999; }
    .ios-banner { background:#fff; border-top:1px solid #e0e0e0; flex-direction:column; padding:14px 16px 20px; }
    .ios-install-content { display:flex; align-items:center; gap:12px; width:100%; }
    .ios-app-icon { width:48px; height:48px; border-radius:12px; flex-shrink:0; }
    .ios-install-content div { flex:1; }
    .ios-install-content strong { display:block; font-size:.95rem; color:#1c1c1e; margin-bottom:3px; }
    .ios-install-content p { font-size:.82rem; color:#636366; margin:0; line-height:1.5; }
    .ios-share-icon { display:inline-flex; vertical-align:middle; margin:0 2px; }
    .ios-arrow { font-size:1.2rem; color:#007AFF; margin-top:6px; animation:bounce .8s infinite; }
    /* Android banner */
    .android-banner { background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); color:#fff; border-radius:var(--radius-lg) var(--radius-lg) 0 0; justify-content:space-between; }
    .android-icon { width:44px; height:44px; border-radius:10px; flex-shrink:0; }
    .android-text { flex:1; }
    .android-text strong { display:block; font-size:.9rem; }
    .android-text span { font-size:.78rem; opacity:.85; }
    .btn-install { background:#fff; color:var(--warm-capuchino); border:none; border-radius:var(--radius-full); padding:8px 18px; font-weight:700; cursor:pointer; font-size:.85rem; white-space:nowrap; }
    /* Notification prompt */
    .notif-prompt-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9900; padding:16px; animation:fadeIn .2s ease; }
    .notif-prompt { background:#fff; border-radius:var(--radius-xl); padding:28px 24px; max-width:340px; width:100%; text-align:center; box-shadow:var(--shadow-lg); animation:slideUp .3s ease; }
    .notif-prompt-icon { font-size:3rem; margin-bottom:12px; }
    .notif-prompt h3 { color:var(--mocca-bean); margin-bottom:8px; }
    .notif-prompt p { color:var(--text-mid); font-size:.88rem; line-height:1.6; margin-bottom:20px; }
    .notif-prompt-btns { display:flex; flex-direction:column; gap:8px; align-items:center; }
    .notif-prompt-btns .btn { width:100%; justify-content:center; }
  `]
})
export class PwaPromptComponent implements OnInit, OnDestroy {
  showIOSBanner = signal(false);
  showAndroidBanner = signal(false);
  showNotifPrompt = signal(false);
  private deferredPrompt: any = null;
  private beforeInstallHandler: any;

  constructor(
    public pushService: PushService,
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    // iOS detection
    const isIOS = this.isIOS();
    const isStandalone = (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;

    // Show iOS banner if on iOS Safari, not standalone, not dismissed
    if (isIOS && !isStandalone && !localStorage.getItem('pwa-ios-dismissed')) {
      setTimeout(() => this.showIOSBanner.set(true), 3000);
    }

    // Android/desktop install prompt
    this.beforeInstallHandler = (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (!localStorage.getItem('pwa-android-dismissed')) {
        this.showAndroidBanner.set(true);
      }
    };
    window.addEventListener('beforeinstallprompt', this.beforeInstallHandler);

    // Show notification prompt after 8s if logged in and not subscribed and not dismissed
    if (this.auth.isLoggedIn && !localStorage.getItem('notif-prompt-dismissed')) {
      setTimeout(() => {
        if (!this.pushService.isSubscribed() && Notification.permission === 'default') {
          this.showNotifPrompt.set(true);
        }
      }, 8000);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler);
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  dismissIOSBanner() {
    this.showIOSBanner.set(false);
    localStorage.setItem('pwa-ios-dismissed', '1');
  }

  dismissAndroidBanner() {
    this.showAndroidBanner.set(false);
    localStorage.setItem('pwa-android-dismissed', '1');
  }

  async installApp() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.toast.success('¡App instalada! 🎉');
      this.showAndroidBanner.set(false);
    }
    this.deferredPrompt = null;
  }

  async enableNotifications() {
    this.showNotifPrompt.set(false);
    // Usar getBlockedReason() del servicio para mensaje contextual
    const blocked = this.pushService.getBlockedReason();
    if (blocked) {
      this.toast.info(blocked);
      return;
    }
    const ok = await this.pushService.requestPermissionAndSubscribe();
    if (ok) {
      this.toast.success('¡Notificaciones activadas! 🔔');
    } else if (this.pushService.permission() === 'denied') {
      this.toast.error('Permiso denegado. Habilítalo en la configuración del navegador.');
    } else {
      this.toast.error('No se pudieron activar las notificaciones. Intenta de nuevo.');
    }
  }

  dismissNotifPrompt() {
    this.showNotifPrompt.set(false);
    localStorage.setItem('notif-prompt-dismissed', '1');
  }
}
