import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationService } from './core/services/notification.service';
import { ChatService } from './core/services/chat.service';
import { ToastService } from './core/services/toast.service';
import { ChatComponent } from './features/chat/chat.component';
import { PwaPromptComponent } from './features/pwa/pwa-prompt.component';
import { NotificationsPanelComponent } from './features/notifications/notifications-panel.component';
import { environment } from '../environments/environment';
import { PushService } from './core/services/push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatComponent, NotificationsPanelComponent, PwaPromptComponent],
  template: `
    <!-- ═══════════ NAVBAR ═══════════ -->
    <nav class="navbar" [class.scrolled]="scrolled" [attr.data-pos]="navPos()">
      <div class="container nav-container">

        <!-- LOGO LEFT (default) -->
        <a *ngIf="navPos()==='left'" routerLink="/" class="brand">
          <img *ngIf="navConfig()?.logo_image" [src]="navConfig()!.logo_image" alt="logo" class="brand-logo-img">
          <span *ngIf="!navConfig()?.logo_image" class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
          <span class="brand-name">{{navConfig()?.logo_text || 'Star Crumbs'}}</span>
        </a>

        <!-- CENTER: links left | logo center | actions right -->
        <ng-container *ngIf="navPos()==='center'">
          <div class="nav-links-left">
            <ng-container *ngFor="let link of navLinks()">
              <a [routerLink]="link.url" routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: link.exact||false}" (click)="closeMenu()">{{link.label}}</a>
            </ng-container>
            <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
          </div>
          <a routerLink="/" class="brand brand-center">
            <img *ngIf="navConfig()?.logo_image" [src]="navConfig()!.logo_image" alt="logo" class="brand-logo-img">
            <span *ngIf="!navConfig()?.logo_image" class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
            <span class="brand-name">{{navConfig()?.logo_text || 'Star Crumbs'}}</span>
          </a>
        </ng-container>

        <!-- RIGHT: actions left | links center | logo right -->
        <ng-container *ngIf="navPos()==='right'">
          <div class="nav-actions-left">
            <ng-container *ngTemplateOutlet="actionsTpl"></ng-container>
          </div>
          <div class="nav-links-center">
            <ng-container *ngFor="let link of navLinks()">
              <a [routerLink]="link.url" routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: link.exact||false}" (click)="closeMenu()">{{link.label}}</a>
            </ng-container>
            <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
          </div>
        </ng-container>

        <!-- LEFT: links after logo -->
        <div *ngIf="navPos()==='left'" class="nav-links" [class.menu-open]="menuOpen">
          <ng-container *ngFor="let link of navLinks()">
            <a [routerLink]="link.url" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: link.exact||false}" (click)="closeMenu()">{{link.label}}</a>
          </ng-container>
          <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
        </div>

        <!-- Actions RIGHT (default for left/center pos) -->
        <div *ngIf="navPos()!=='right'" class="nav-actions">
          <ng-container *ngTemplateOutlet="actionsTpl"></ng-container>
          <button class="hamburger" (click)="menuOpen=!menuOpen" aria-label="Menú">
            <span [class.bar-open]="menuOpen"></span>
            <span [class.bar-open]="menuOpen"></span>
            <span [class.bar-open]="menuOpen"></span>
          </button>
        </div>

        <!-- Logo RIGHT (right position) -->
        <a *ngIf="navPos()==='right'" routerLink="/" class="brand brand-right">
          <img *ngIf="navConfig()?.logo_image" [src]="navConfig()!.logo_image" alt="logo" class="brand-logo-img">
          <span *ngIf="!navConfig()?.logo_image" class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
          <span class="brand-name">{{navConfig()?.logo_text || 'Star Crumbs'}}</span>
        </a>

        <!-- Mobile menu (center/right positions) -->
        <div *ngIf="navPos()!=='left'" class="nav-links nav-links-mobile" [class.menu-open]="menuOpen">
          <ng-container *ngFor="let link of navLinks()">
            <a [routerLink]="link.url" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: link.exact||false}" (click)="closeMenu()">{{link.label}}</a>
          </ng-container>
          <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
          <button class="hamburger hamburger-inline" (click)="menuOpen=!menuOpen">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Actions template -->
    <ng-template #actionsTpl>
      <button *ngIf="navConfig()?.show_notifications!==false && auth.isLoggedIn"
              class="icon-btn" (click)="toggleNotifications()" title="Novedades">
        <i class="fas fa-bell"></i>
        <span *ngIf="notifService.unreadCount()>0" class="nav-badge">{{notifService.unreadCount()}}</span>
      </button>
      <button *ngIf="navConfig()?.show_chat!==false && auth.isLoggedIn"
              class="icon-btn" (click)="toggleChat()" title="Chat">
        <i class="fas fa-comment-dots"></i>
      </button>
      <a *ngIf="navConfig()?.show_cart!==false" routerLink="/cart" class="icon-btn" title="Carrito">
        <i class="fas fa-shopping-bag"></i>
        <span *ngIf="cartService.itemCount()>0" class="nav-badge">{{cartService.itemCount()}}</span>
      </a>
      <div class="user-menu-wrap" *ngIf="auth.isLoggedIn; else loginBtn">
        <button class="user-pill" (click)="toggleUserMenu()">
          <img *ngIf="auth.currentUser()?.profile_picture; else avatarIcon"
               [src]="auth.currentUser()!.profile_picture" alt="avatar" class="user-av">
          <ng-template #avatarIcon><i class="fas fa-user-circle" style="font-size:1.2rem"></i></ng-template>
          <span class="user-name">{{auth.currentUser()?.username}}</span>
          <i class="fas fa-chevron-down chev" [class.chev-open]="userMenuOpen"></i>
        </button>
        <div class="dropdown" *ngIf="userMenuOpen" (click)="userMenuOpen=false">
          <a routerLink="/profile"><i class="fas fa-user"></i> Mi Perfil</a>
          <a routerLink="/orders"><i class="fas fa-shopping-bag"></i> Mis Pedidos</a>
          <a routerLink="/cart"><i class="fas fa-cart-shopping"></i> Carrito</a>
          <hr>
          <button (click)="logout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
        </div>
      </div>
      <ng-template #loginBtn>
        <a routerLink="/auth/login" class="btn btn-primary btn-sm">Ingresar</a>
      </ng-template>
    </ng-template>

    <!-- Panels -->
    <app-notifications-panel *ngIf="showNotifications" (close)="showNotifications=false"></app-notifications-panel>
    <app-chat *ngIf="showChat" (close)="showChat=false"></app-chat>

    <app-pwa-prompt></app-pwa-prompt>

    <!-- ── ANUNCIOS TOP ── -->
    <div *ngFor="let ann of visibleAnnouncements('top')"
         class="ann-banner ann-top"
         [style.background]="ann.bg_color||'#E3F2FD'"
         [style.color]="ann.text_color||'#1565C0'"
         [style.borderColor]="ann.border_color||'#90CAF9'">
      <img *ngIf="ann.image_url" [src]="ann.image_url" class="ann-banner-img" alt="">
      <span class="ann-banner-icon" *ngIf="ann.icon">{{ann.icon}}</span>
      <div class="ann-banner-text">
        <strong [style.fontFamily]="ann.font">{{ann.title}}</strong>
        <span *ngIf="ann.message" [style.fontFamily]="ann.font"> — {{ann.message}}</span>
      </div>
      <button *ngIf="ann.show_close" class="ann-close" (click)="dismissAnn(ann)">✕</button>
    </div>

    <main class="main-content"><router-outlet></router-outlet></main>

    <!-- ── ANUNCIOS BOTTOM ── -->
    <div *ngFor="let ann of visibleAnnouncements('bottom')"
         class="ann-banner ann-bottom"
         [style.background]="ann.bg_color||'#E3F2FD'"
         [style.color]="ann.text_color||'#1565C0'"
         [style.borderColor]="ann.border_color||'#90CAF9'">
      <img *ngIf="ann.image_url" [src]="ann.image_url" class="ann-banner-img" alt="">
      <span class="ann-banner-icon" *ngIf="ann.icon">{{ann.icon}}</span>
      <div class="ann-banner-text">
        <strong [style.fontFamily]="ann.font">{{ann.title}}</strong>
        <span *ngIf="ann.message" [style.fontFamily]="ann.font"> — {{ann.message}}</span>
      </div>
      <button *ngIf="ann.show_close" class="ann-close" (click)="dismissAnn(ann)">✕</button>
    </div>

    <!-- ── ANUNCIOS FLOTANTES ── -->
    <div *ngFor="let ann of visibleAnnouncements('floating')"
         class="ann-floating"
         [style.background]="ann.bg_color||'#fff'"
         [style.color]="ann.text_color||'#333'"
         [style.borderColor]="ann.border_color||'#ddd'">
      <img *ngIf="ann.image_url" [src]="ann.image_url" class="ann-float-img" alt="">
      <div class="ann-float-body">
        <strong [style.fontFamily]="ann.font">{{ann.icon}} {{ann.title}}</strong>
        <p *ngIf="ann.message" [style.fontFamily]="ann.font">{{ann.message}}</p>
      </div>
      <button *ngIf="ann.show_close" class="ann-close ann-float-close" (click)="dismissAnn(ann)">✕</button>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img *ngIf="footerConfig()?.brand_image" [src]="footerConfig()!.brand_image" alt="logo" style="width:36px;height:36px;object-fit:contain;border-radius:6px">
            <span *ngIf="!footerConfig()?.brand_image">{{footerConfig()?.brand_icon || '🍪'}}</span>
            <strong>{{footerConfig()?.brand_text || 'Star Crumbs'}}</strong>
          </div>
          <p>{{footerConfig()?.tagline || 'Galletas artesanales con amor'}}</p>
        </div>
        <div class="footer-links">
          <ng-container *ngFor="let link of footerConfig()?.links||[]">
            <a *ngIf="!link.external" [routerLink]="link.url">
              <i *ngIf="link.icon" [class]="link.icon"></i> {{link.label}}
            </a>
            <a *ngIf="link.external" [href]="link.url" target="_blank" rel="noopener">
              <i *ngIf="link.icon" [class]="link.icon"></i> {{link.label}}
            </a>
          </ng-container>
        </div>
        <!-- Social Media -->
        <div class="footer-social" *ngIf="socialLinks().length">
          <a *ngFor="let s of socialLinks()" [href]="s.url" target="_blank" rel="noopener" class="social-icon" [title]="s.label">
            <i [class]="getSocialIcon(s.platform)"></i>
          </a>
        </div>
        <!-- Share + Notifications -->
        <div class="footer-actions">
          <button class="footer-action-btn" (click)="shareApp()" title="Compartir la página">
            <i class="fas fa-share-alt"></i>
            <span>Compartir</span>
          </button>
          <button *ngIf="pushService.isSubscribed()" class="footer-action-btn notif-btn active"
                  (click)="toggleNotifSubscription()" title="Desactivar notificaciones">
            <i class="fas fa-bell-slash"></i>
            <span>Notif. ON ✓</span>
          </button>
          <button *ngIf="!pushService.isSubscribed()" class="footer-action-btn notif-guide-btn"
                  (click)="showNotifGuide = true" title="Recibir notificaciones de Star Crumbs">
            <i class="fas fa-bell"></i>
            <span>Recibir notificaciones</span>
          </button>
        </div>
        <p class="footer-copy">{{footerConfig()?.copyright || '© 2024 Star Crumbs.'}}</p>
      </div>
    </footer>

    <!-- ═══════════ MODAL GUÍA NOTIFICACIONES ═══════════ -->
    <div class="notif-guide-overlay" *ngIf="showNotifGuide" (click)="onOverlayClick($event)">
      <div class="notif-guide-modal">

        <!-- Header con icono de la app -->
        <div class="ngm-header">
          <img src="/icons/icon-192x192.png" alt="Star Crumbs" class="ngm-app-icon">
          <div class="ngm-header-text">
            <h2>Recibir notificaciones</h2>
            <p>Entérate de pedidos, ofertas y novedades</p>
          </div>
          <button class="ngm-close" (click)="showNotifGuide = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Tabs de navegador -->
        <div class="ngm-tabs">
          <button class="ngm-tab" [class.active]="notifGuideTab === 'chrome'" (click)="notifGuideTab = 'chrome'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4285F4"/><circle cx="12" cy="12" r="4" fill="white"/><path d="M12 8 h10 M6.3 14 L1.3 5.5 M6.3 10 L1.3 18.5" stroke="#EA4335" stroke-width="3"/><path d="M12 8 h10" stroke="#FBBC05" stroke-width="3"/><path d="M6.3 14 L1.3 5.5" stroke="#34A853" stroke-width="3"/></svg>
            Chrome
          </button>
          <button class="ngm-tab" [class.active]="notifGuideTab === 'android'" (click)="notifGuideTab = 'android'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#3DDC84"><path d="M17.6 9.5H6.4C5.1 9.5 4 10.6 4 11.9v6.2c0 1.3 1.1 2.4 2.4 2.4h.4v2.8c0 .7.6 1.2 1.2 1.2s1.2-.5 1.2-1.2V20.5h5.6v2.8c0 .7.6 1.2 1.2 1.2s1.2-.5 1.2-1.2V20.5h.4c1.3 0 2.4-1.1 2.4-2.4v-6.2c0-1.3-1.1-2.4-2.4-2.4zM7.3 4.2l-1.4-1.4c-.2-.2-.2-.5 0-.7s.5-.2.7 0l1.5 1.5c.8-.4 1.7-.6 2.6-.6h2.6c1 0 1.9.2 2.7.7l1.5-1.5c.2-.2.5-.2.7 0s.2.5 0 .7l-1.4 1.4c1.3.9 2.2 2.3 2.2 3.9H5.1c0-1.7.9-3.1 2.2-4zm5 2.5c0 .4-.3.7-.7.7s-.7-.3-.7-.7.3-.7.7-.7.7.3.7.7zm4 0c0 .4-.3.7-.7.7s-.7-.3-.7-.7.3-.7.7-.7.7.3.7.7z"/></svg>
            Android
          </button>
          <button class="ngm-tab" [class.active]="notifGuideTab === 'safari'" (click)="notifGuideTab = 'safari'">
            <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#006CFF"/><polygon points="12,4 13.5,10.5 20,12 13.5,13.5 12,20 10.5,13.5 4,12 10.5,10.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="#006CFF"/></svg>
            Safari iOS
          </button>
          <button class="ngm-tab" [class.active]="notifGuideTab === 'firefox'" (click)="notifGuideTab = 'firefox'">
            <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF6611"/><path d="M12 4c-1.5 0-3 .5-4.2 1.4C9 5.1 10.2 5.5 11 6.5c.8-1 2-1.5 3.2-1.3C13.4 4.4 12.7 4 12 4z" fill="#FFCC00"/><path d="M7.8 5.4C6 6.8 4.8 9 4.8 11.5c0 4 3.2 7.2 7.2 7.2s7.2-3.2 7.2-7.2c0-1-.2-2-.6-2.9-1 .8-2.3 1.2-3.6 1-1.8-.3-3.4-1.8-3.4-3.7 0-.2 0-.4.1-.5-.6-.2-1.2-.4-1.9-.5-.7.4-1.3.9-1.8 1.5h.8z" fill="#FF4500"/></svg>
            Firefox
          </button>
        </div>

        <!-- Contenido por tab -->
        <div class="ngm-content">

          <!-- CHROME ESCRITORIO -->
          <div *ngIf="notifGuideTab === 'chrome'" class="ngm-steps">
            <div class="ngm-intro">
              <i class="fas fa-desktop"></i>
              Chrome en computador — actívalo en 2 clicks
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">1</div>
              <div class="ngm-step-body">
                <strong>Haz click en el candado <i class="fas fa-lock"></i></strong> que aparece a la izquierda de la barra de dirección del navegador.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">2</div>
              <div class="ngm-step-body">
                Busca <strong>"Notificaciones"</strong> en el menú que se abre y cámbialo a <span class="ngm-badge green">Permitir</span>.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">3</div>
              <div class="ngm-step-body">
                Vuelve aquí y presiona <strong>"Activar"</strong> abajo. ¡Listo!
              </div>
            </div>
            <div class="ngm-tip">
              <i class="fas fa-lightbulb"></i>
              También puedes instalar Star Crumbs como app: busca el ícono <i class="fas fa-download"></i> en la barra de Chrome para tenerla siempre a mano.
            </div>
          </div>

          <!-- ANDROID -->
          <div *ngIf="notifGuideTab === 'android'" class="ngm-steps">
            <div class="ngm-intro">
              <i class="fab fa-android"></i>
              Android (Chrome, Samsung, Edge) — directo desde el navegador
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">1</div>
              <div class="ngm-step-body">
                Presiona el botón <strong>"Activar notificaciones"</strong> de abajo.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">2</div>
              <div class="ngm-step-body">
                Aparecerá una ventana emergente del sistema. Toca <span class="ngm-badge green">Permitir</span>.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">3</div>
              <div class="ngm-step-body">
                ¡Ya está! Recibirás notificaciones aunque el navegador esté cerrado.
              </div>
            </div>
            <div class="ngm-divider">
              <span>¿Prefieres instalarla como app?</span>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num"><i class="fas fa-ellipsis-v"></i></div>
              <div class="ngm-step-body">
                Toca los <strong>tres puntos ⋮</strong> del navegador y selecciona <strong>"Agregar a pantalla de inicio"</strong> o <strong>"Instalar app"</strong>.
              </div>
            </div>
          </div>

          <!-- SAFARI iOS -->
          <div *ngIf="notifGuideTab === 'safari'" class="ngm-steps">
            <div class="ngm-intro">
              <i class="fab fa-apple"></i>
              iPhone / iPad — primero instala la app, luego activa
            </div>
            <div class="ngm-alert">
              <i class="fas fa-info-circle"></i>
              En iPhone e iPad, Apple requiere instalar Star Crumbs como app antes de poder recibir notificaciones.
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">1</div>
              <div class="ngm-step-body">
                Toca el botón de <strong>Compartir</strong>
                <span class="ngm-share-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </span>
                que está en la barra inferior de Safari.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">2</div>
              <div class="ngm-step-body">
                Desliza hacia abajo en el menú y toca <strong>"Agregar a pantalla de inicio"</strong> <i class="fas fa-plus-square" style="color:#007AFF"></i>.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">3</div>
              <div class="ngm-step-body">
                Confirma tocando <strong>"Agregar"</strong> en la esquina superior derecha. Aparecerá el ícono de Star Crumbs en tu pantalla de inicio.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">4</div>
              <div class="ngm-step-body">
                <strong>Abre Star Crumbs desde ese ícono</strong>, ve al footer y presiona <strong>"Recibir notificaciones"</strong>.
              </div>
            </div>
            <div class="ngm-tip">
              <i class="fas fa-lightbulb"></i>
              Requiere iOS 16.4 o superior. Actualiza tu iPhone si no ves la opción.
            </div>
          </div>

          <!-- FIREFOX -->
          <div *ngIf="notifGuideTab === 'firefox'" class="ngm-steps">
            <div class="ngm-intro">
              <i class="fab fa-firefox-browser"></i>
              Firefox — escritorio y Android
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">1</div>
              <div class="ngm-step-body">
                Presiona el botón <strong>"Activar notificaciones"</strong> de abajo.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">2</div>
              <div class="ngm-step-body">
                Aparecerá una barra en la parte superior con el mensaje <em>"¿Permitir que Star Crumbs envíe notificaciones?"</em> — toca o haz click en <span class="ngm-badge green">Permitir</span>.
              </div>
            </div>
            <div class="ngm-step">
              <div class="ngm-step-num">3</div>
              <div class="ngm-step-body">
                ¡Listo! Firefox entrega notificaciones en escritorio y en Android sin necesidad de instalar nada.
              </div>
            </div>
            <div class="ngm-tip">
              <i class="fas fa-lightbulb"></i>
              Si accidentalmente bloqueaste las notificaciones, ve a <strong>Preferencias → Privacidad → Permisos → Notificaciones</strong> y elimina star-crumbs de la lista de bloqueados.
            </div>
          </div>

        </div>

        <!-- Footer del modal -->
        <div class="ngm-footer">
          <button class="btn btn-secondary btn-sm" (click)="showNotifGuide = false">Ahora no</button>
          <button class="btn btn-primary" (click)="activateFromGuide()">
            <i class="fas fa-bell"></i>
            Activar notificaciones
          </button>
        </div>

      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-stack">
      <div *ngFor="let t of toastService.toasts()" class="toast"
           [class.toast-success]="t.type==='success'"
           [class.toast-error]="t.type==='error'"
           [class.toast-info]="t.type==='info'">
        <i class="fas" [class.fa-check-circle]="t.type==='success'"
           [class.fa-exclamation-circle]="t.type==='error'"
           [class.fa-info-circle]="t.type==='info'"></i>
        {{t.message}}
      </div>
    </div>
  `,
  styles: [`
    /* ═══ NAVBAR ════════════════════════════════════════ */
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 900;
      background: rgba(255,249,244,0.94);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--almond);
      transition: box-shadow var(--transition);
      height: 68px;
    }
    .navbar.scrolled { box-shadow: var(--shadow-md); }

    .nav-container {
      display: flex;
      align-items: center;
      height: 68px;
      gap: 0;
      position: relative;
    }

    /* ── Brand ── */
    .brand {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; color: var(--mocca-bean);
      font-family: var(--font-display); font-size: 1.3rem;
      font-weight: 700; white-space: nowrap; flex-shrink: 0;
    }
    .brand-icon { font-size: 1.6rem; line-height: 1; }
    .brand-logo-img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
    .brand-name { color: var(--warm-capuchino); }

    /* CENTER position: logo absolutely centered */
    .brand-center {
      position: absolute; left: 50%; transform: translateX(-50%);
    }
    /* RIGHT position: logo pushed to right end */
    .brand-right { margin-left: auto; }

    /* ── Nav links ── */
    .nav-links {
      display: flex; align-items: center; gap: 28px;
      margin-left: 32px;
    }
    .nav-links-left {
      display: flex; align-items: center; gap: 24px;
    }
    .nav-links-center {
      display: flex; align-items: center; gap: 24px;
      flex: 1; justify-content: center;
    }
    .nav-links a, .nav-links-left a, .nav-links-center a {
      color: var(--text-mid); font-weight: 600; font-size: 0.92rem;
      text-decoration: none; padding: 5px 0;
      border-bottom: 2px solid transparent;
      transition: all var(--transition); white-space: nowrap;
    }
    .nav-links a:hover, .nav-links-left a:hover, .nav-links-center a:hover,
    .nav-links a.active, .nav-links-left a.active, .nav-links-center a.active {
      color: var(--warm-capuchino); border-bottom-color: var(--warm-capuchino);
    }

    /* ── Actions ── */
    .nav-actions, .nav-actions-left {
      display: flex; align-items: center; gap: 8px;
      margin-left: auto;
    }
    .nav-actions-left { margin-left: 0; margin-right: 16px; }

    .icon-btn {
      position: relative; background: none; border: none; cursor: pointer;
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-mid); font-size: 1.15rem;
      transition: all var(--transition); text-decoration: none;
      -webkit-tap-highlight-color: transparent;
    }
    .icon-btn:hover { background: var(--almond-light); color: var(--warm-capuchino); }
    .nav-badge {
      position: absolute; top: 1px; right: 1px;
      background: var(--error); color: #fff;
      font-size: 0.6rem; font-weight: 700; min-width: 17px; height: 17px;
      border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 3px;
    }

    /* ── User pill ── */
    .user-menu-wrap { position: relative; }
    .user-pill {
      display: flex; align-items: center; gap: 7px;
      background: none; border: 2px solid var(--almond);
      border-radius: var(--radius-full); padding: 5px 13px;
      cursor: pointer; color: var(--text-mid); font-size: 0.88rem;
      font-weight: 600; transition: all var(--transition);
      max-width: 180px;
    }
    .user-pill:hover { border-color: var(--warm-capuchino); color: var(--warm-capuchino); }
    .user-av { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .user-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px; }
    .chev { font-size: 0.65rem; transition: transform var(--transition); flex-shrink: 0; }
    .chev-open { transform: rotate(180deg); }

    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); min-width: 190px; padding: 8px;
      border: 1px solid var(--almond); z-index: 1000;
      animation: slideUp 0.18s ease;
    }
    .dropdown a, .dropdown button {
      display: flex; align-items: center; gap: 9px;
      padding: 10px 13px; border-radius: var(--radius-sm);
      color: var(--text-mid); font-size: 0.88rem; font-weight: 500;
      width: 100%; background: none; border: none; cursor: pointer;
      text-decoration: none; transition: background var(--transition);
    }
    .dropdown a:hover, .dropdown button:hover {
      background: var(--almond-light); color: var(--warm-capuchino);
    }
    .dropdown hr { border: none; border-top: 1px solid var(--almond); margin: 5px 0; }

    /* ── Hamburger ── */
    .hamburger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer; padding: 6px;
      border-radius: var(--radius-sm); margin-left: 4px;
      -webkit-tap-highlight-color: transparent;
    }
    .hamburger span {
      display: block; width: 22px; height: 2px;
      background: var(--text-mid); border-radius: 2px;
      transition: all 0.28s ease; transform-origin: center;
    }
    .hamburger span.bar-open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger span.bar-open:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger span.bar-open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .nav-links-mobile { display: none !important; }
    .hamburger-inline { display: none; }

    /* ─── MAIN ─── */
    .main-content { margin-top: 68px; min-height: calc(100vh - 68px); }

    /* ─── FOOTER ─── */
    .footer { background: var(--mocca-bean); color: var(--almond-light); padding: 44px 0 20px; }
    .footer-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; }
    .footer-logo { display: flex; align-items: center; gap: 9px; font-size: 1.15rem; margin-bottom: 8px; }
    .footer-logo span { font-size: 1.5rem; }
    .footer-brand p { font-size: 0.83rem; opacity: 0.65; margin: 0; }
    .footer-links { display: flex; flex-direction: column; gap: 9px; }
    .footer-links a { color: var(--almond); opacity: 0.8; font-size: 0.88rem; text-decoration: none; transition: opacity var(--transition); }
    .footer-links a:hover { opacity: 1; }
    .footer-actions { grid-column:1/-1; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:8px; }
    .footer-action-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; border-radius:var(--radius-full); background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); color:var(--almond); cursor:pointer; font-size:0.82rem; font-weight:600; transition:all var(--transition); }
    .footer-action-btn:hover { background:var(--warm-capuchino); border-color:var(--warm-capuchino); color:#fff; }
    .install-btn { background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); border-color:transparent; color:#fff; }
    .notif-btn.active { background:rgba(201,149,106,0.3); }
    .footer-social { grid-column:1/-1; display:flex; gap:12px; justify-content:center; margin-top:16px; }
    .social-icon { width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:var(--almond); font-size:1rem; transition:all var(--transition); text-decoration:none; }
    .social-icon:hover { background:var(--warm-capuchino); color:#fff; transform:translateY(-3px); }
    .footer-copy { grid-column: 1/-1; text-align: center; opacity: 0.4; font-size: 0.77rem; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }

    /* ─── BOTÓN NOTIF GUIDE ─── */
    .notif-guide-btn { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); border-color: transparent; color: #fff; }
    .notif-guide-btn:hover { filter: brightness(1.1); color: #fff; }

    /* ─── MODAL GUÍA NOTIFICACIONES ─── */
    .notif-guide-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .notif-guide-modal {
      background: var(--cream-white); border-radius: 20px;
      width: 100%; max-width: 480px; max-height: 90vh;
      overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 24px 80px rgba(93,58,30,0.28);
      animation: slideUp 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
    /* Header */
    .ngm-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 20px 16px;
      background: linear-gradient(135deg, var(--mocca-bean) 0%, #7a4e2d 100%);
      color: #fff; flex-shrink: 0;
    }
    .ngm-app-icon {
      width: 52px; height: 52px; border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3); flex-shrink: 0;
    }
    .ngm-header-text { flex: 1; }
    .ngm-header-text h2 { font-size: 1.1rem; font-weight: 700; margin: 0 0 2px; color: #fff; }
    .ngm-header-text p { font-size: 0.8rem; opacity: 0.75; margin: 0; color: #fff; }
    .ngm-close {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.15); border: none; color: #fff;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; flex-shrink: 0; transition: background var(--transition);
    }
    .ngm-close:hover { background: rgba(255,255,255,0.3); }
    /* Tabs */
    .ngm-tabs {
      display: flex; gap: 2px; padding: 10px 12px 0;
      background: #fff; border-bottom: 2px solid var(--almond-light);
      flex-shrink: 0; overflow-x: auto;
    }
    .ngm-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px 8px 0 0;
      border: none; background: transparent; color: var(--text-mid);
      cursor: pointer; font-size: 0.82rem; font-weight: 600;
      white-space: nowrap; transition: all var(--transition);
      opacity: 0.6;
    }
    .ngm-tab:hover { opacity: 0.85; background: var(--almond-light); }
    .ngm-tab.active { opacity: 1; background: var(--almond-light); color: var(--mocca-bean); border-bottom: 2px solid var(--warm-capuchino); margin-bottom: -2px; }
    /* Contenido */
    .ngm-content { flex: 1; overflow-y: auto; padding: 20px; background: #fff; }
    .ngm-steps { display: flex; flex-direction: column; gap: 12px; }
    .ngm-intro {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; font-weight: 600; color: var(--mocca-bean);
      padding: 10px 14px; background: var(--almond-light);
      border-radius: 10px; border-left: 3px solid var(--warm-capuchino);
    }
    .ngm-intro i { color: var(--warm-capuchino); }
    .ngm-alert {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; background: #FFF3CD; border-radius: 10px;
      font-size: 0.83rem; color: #856404; border-left: 3px solid #FFC107;
    }
    .ngm-alert i { margin-top: 2px; color: #FFC107; flex-shrink: 0; }
    .ngm-step {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 12px 14px; background: var(--cream-white);
      border-radius: 12px; border: 1px solid var(--almond-light);
    }
    .ngm-step-num {
      min-width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast));
      color: #fff; font-size: 0.8rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .ngm-step-body { font-size: 0.86rem; color: var(--text-mid); line-height: 1.5; }
    .ngm-step-body strong { color: var(--mocca-bean); }
    .ngm-badge {
      display: inline-block; padding: 1px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
    }
    .ngm-badge.green { background: #D1FAE5; color: #065F46; }
    .ngm-share-icon { display: inline-flex; vertical-align: middle; margin: 0 3px; }
    .ngm-tip {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 14px; background: #EEF2FF; border-radius: 10px;
      font-size: 0.8rem; color: #3730A3; border-left: 3px solid #6366F1;
    }
    .ngm-tip i { color: #6366F1; flex-shrink: 0; margin-top: 2px; }
    .ngm-divider {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.78rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .ngm-divider::before, .ngm-divider::after { content: ''; flex: 1; height: 1px; background: var(--almond-light); }
    /* Footer del modal */
    .ngm-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 16px 20px; background: var(--cream-white);
      border-top: 1px solid var(--almond-light); flex-shrink: 0;
    }
    @media (max-width: 480px) {
      .ngm-footer { flex-direction: column-reverse; }
      .ngm-footer .btn { width: 100%; justify-content: center; }
    }

    /* ─── ANUNCIOS ─── */
    .ann-banner { display:flex; align-items:center; gap:10px; padding:10px 18px;
      border-bottom:2px solid; font-size:.88rem; flex-wrap:wrap; z-index:900; position:relative; }
    .ann-top { border-top:none; }
    .ann-bottom { border-bottom:none; border-top:2px solid; }
    .ann-banner-img { width:32px; height:32px; object-fit:cover; border-radius:6px; flex-shrink:0; }
    .ann-banner-icon { font-size:1.2rem; flex-shrink:0; }
    .ann-banner-text { flex:1; min-width:0; }
    .ann-close { background:none; border:none; cursor:pointer; opacity:0.6; font-size:1rem;
      padding:2px 6px; border-radius:4px; flex-shrink:0; color:inherit; transition:opacity .2s; }
    .ann-close:hover { opacity:1; }
    .ann-floating { position:fixed; bottom:80px; right:20px; z-index:9500; max-width:300px;
      border-radius:14px; border:1.5px solid; padding:14px 16px; box-shadow:0 8px 32px rgba(0,0,0,.15);
      display:flex; gap:10px; align-items:flex-start; animation:annFadeIn .3s ease; }
    @keyframes annFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .ann-float-img { width:48px; height:48px; object-fit:cover; border-radius:8px; flex-shrink:0; }
    .ann-float-body { flex:1; }
    .ann-float-body strong { display:block; font-size:.9rem; margin-bottom:3px; }
    .ann-float-body p { font-size:.82rem; margin:0; opacity:.85; }
    .ann-float-close { position:absolute; top:8px; right:8px; }

    /* ─── TOAST ─── */
    .toast-stack { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }

    /* ═══════════════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════════════ */
    @media (max-width: 960px) {
      /* Hide desktop links, show hamburger */
      .nav-links, .nav-links-left, .nav-links-center { display: none; }
      .hamburger { display: flex; }

      /* Mobile dropdown menu — full width, beautiful */
      .nav-links.menu-open {
        display: flex; flex-direction: column;
        position: fixed; top: 68px; left: 0; right: 0;
        background: var(--cream-white);
        padding: 8px 0 16px;
        gap: 2px; box-shadow: 0 8px 32px rgba(93,58,30,0.18);
        border-top: 2px solid var(--almond);
        z-index: 899;
        animation: slideDown 0.22s cubic-bezier(0.4,0,0.2,1);
      }
      @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      .nav-links.menu-open a {
        display: flex; align-items: center;
        padding: 14px 24px;
        border-radius: 0;
        border-bottom: none !important;
        border-left: 3px solid transparent;
        font-size: 1rem; font-weight: 600;
        color: var(--text-mid);
        transition: all 0.18s ease;
      }
      .nav-links.menu-open a:hover,
      .nav-links.menu-open a.active {
        background: var(--almond-light);
        border-left-color: var(--warm-capuchino);
        color: var(--warm-capuchino);
        padding-left: 32px;
      }

      /* Center/Right positions — same mobile behavior */
      .nav-links-mobile.menu-open {
        display: flex !important; flex-direction: column;
        position: fixed; top: 68px; left: 0; right: 0;
        background: var(--cream-white);
        padding: 8px 0 16px; gap: 2px;
        box-shadow: 0 8px 32px rgba(93,58,30,0.18);
        border-top: 2px solid var(--almond); z-index: 899;
        animation: slideDown 0.22s cubic-bezier(0.4,0,0.2,1);
      }
      .nav-links-mobile.menu-open a {
        display: flex; align-items: center;
        padding: 14px 24px; border-left: 3px solid transparent;
        font-size: 1rem; font-weight: 600; color: var(--text-mid);
        transition: all 0.18s ease;
      }
      .nav-links-mobile.menu-open a:hover,
      .nav-links-mobile.menu-open a.active {
        background: var(--almond-light);
        border-left-color: var(--warm-capuchino);
        color: var(--warm-capuchino);
        padding-left: 32px;
      }

      /* Center position adjustments */
      .brand-center { position: static; transform: none; }
      .nav-actions-left { display: none; }

      /* Ensure user pill doesn't overflow */
      .user-name { max-width: 70px; }
      .user-pill { padding: 4px 10px; }
    }

    @media (max-width: 600px) {
      .navbar { height: 58px; }
      .nav-container { height: 58px; }
      .main-content { margin-top: 58px; }
      .nav-links.menu-open { top: 58px; }
      .nav-links-mobile.menu-open { top: 58px; }
      .brand { font-size: 1.1rem; }
      .brand-icon { font-size: 1.4rem; }
      .user-name { display: none; }
      .user-pill { padding: 4px 8px; gap: 5px; }
      .chev { display: none; }
      .footer-grid { grid-template-columns: 1fr; gap: 20px; }
      .toast-stack { left: 12px; right: 12px; bottom: 14px; }
    }

    @media (max-width: 380px) {
      .nav-actions { gap: 4px; }
      .icon-btn { width: 36px; height: 36px; font-size: 1rem; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  scrolled = false;
  menuOpen = false;
  userMenuOpen = false;
  showNotifications = false;
  showChat = false;
  showNotifGuide = false;
  notifGuideTab: 'chrome' | 'android' | 'safari' | 'firefox' = 'chrome';
  pageAnnouncements: any[] = [];
  dismissedAnns = new Set<string>();
  currentRoute = '';
  navConfig = signal<any>(null);

  footerConfig = signal<any>(null);
  navLinks = signal<any[]>([]);
  navPos = signal<string>('left');
  socialLinks = signal<any[]>([]);

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    public notifService: NotificationService,
    public chatService: ChatService,
    public toastService: ToastService,
    public pushService: PushService,
    private router: Router,
    private http: HttpClient
  ) {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.cartService.loadCart();
        this.notifService.load().subscribe();
        this.chatService.connect(user.id);
      }
    });
  }

  ngOnInit() {
    window.addEventListener('scroll', this.onScroll);
    document.addEventListener('click', this.onDocClick);
    this.loadSiteSettings();
    // Rastrear ruta actual para filtrar anuncios por página
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects || e.url || '/';
    });
  }

  loadSiteSettings() {
    this.http.get<any>(`${environment.apiUrl}/site-settings/navbar`).subscribe({
      next: s => {
        const v = s?.setting_value;
        if (v) {
          this.navConfig.set(v);
          this.navLinks.set(v.links || []);
          this.navPos.set(v.logo_position || 'left');
        }
      },
      error: () => {
  this.navLinks.set([
    { label: 'Inicio', url: '/', exact: true },
    { label: 'Productos', url: '/products', exact: false },
    { label: 'Cajitas', url: '/cajitas', exact: false },
    { label: 'Mis Pedidos', url: '/orders', exact: false }
  ]);
}
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/footer`).subscribe({
      next: s => { if (s?.setting_value) this.footerConfig.set(s.setting_value); }
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/store_theme`).subscribe({
      next: s => { if (s?.setting_value) this.applyTheme(s.setting_value); },
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/favicon`).subscribe({
      next: s => { if (s?.setting_value) this.applyFavicon(s.setting_value); },
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/social_media`).subscribe({
      next: s => { if (s?.setting_value) this.socialLinks.set(s.setting_value.links || []); },
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/announcements`).subscribe({
      next: s => { if (s?.setting_value) this.pageAnnouncements = s.setting_value.items || []; },
      error: () => {}
    });
  }

  applyTheme(t: any) {
    const root = document.documentElement;
    if (t.primary_color)   root.style.setProperty('--warm-capuchino', t.primary_color);
    if (t.primary_dark)    root.style.setProperty('--caramel-roast', t.primary_dark);
    if (t.secondary_color) root.style.setProperty('--mocca-bean', t.secondary_color);
    if (t.accent_color)    root.style.setProperty('--almond', t.accent_color);
    if (t.bg_color)        root.style.setProperty('--cream-white', t.bg_color);
    if (t.text_color)      root.style.setProperty('--text-dark', t.text_color);
    if (t.btn_radius)      root.style.setProperty('--radius-full', t.btn_radius);
    if (t.card_radius)     root.style.setProperty('--radius-lg', t.card_radius);
    if (t.heading_font)    root.style.setProperty('--font-display', t.heading_font + ', serif');
    if (t.body_font)       root.style.setProperty('--font-body', t.body_font + ', sans-serif');
  }

  applyFavicon(f: any) {
    let link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (!link) link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!link) return;
    if (f.type === 'image' && f.image_url) {
      link.href = f.image_url;
    } else if (f.emoji) {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '52px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.emoji, 32, 36);
        link.href = canvas.toDataURL('image/png');
      }
    }
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('click', this.onDocClick);
    this.chatService.disconnect();
  }

  onScroll = () => { this.scrolled = window.scrollY > 10; };

  onDocClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-menu-wrap')) this.userMenuOpen = false;
  };

  toggleNotifications() { this.showNotifications = !this.showNotifications; this.showChat = false; }
  toggleChat() { this.showChat = !this.showChat; this.showNotifications = false; }
  toggleUserMenu() { this.userMenuOpen = !this.userMenuOpen; }
  closeMenu() { this.menuOpen = false; }
  logout() { this.userMenuOpen = false; this.auth.logout(); this.chatService.disconnect(); }

  // ── Anuncios de página ──
  visibleAnnouncements(position: string): any[] {
    return this.pageAnnouncements.filter(ann => {
      if (!ann.enabled) return false;
      if (ann.position !== position) return false;
      if (this.dismissedAnns.has(ann.id)) return false;
      if (ann.page !== '*') {
        const route = this.currentRoute || '/';
        const pageMap: Record<string, string[]> = {
          home:     ['/'],
          products: ['/products'],
          cajitas:  ['/cajitas'],
          cart:     ['/cart'],
          orders:   ['/orders'],
          profile:  ['/profile']
        };
        const allowed = pageMap[ann.page] || [];
        if (!allowed.some(p => route === p || route.startsWith(p + '/'))) return false;
      }
      return true;
    });
  }
  dismissAnn(ann: any) { this.dismissedAnns.add(ann.id); }

  shareApp() {
    const shareData = {
      title: 'Star Crumbs 🍪',
      text: 'Descubre las mejores galletas artesanales. ¡Mira esto!',
      url: window.location.origin
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin)
        .then(() => this.toastService.success('¡Link copiado al portapapeles! 📋'));
    }
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('notif-guide-overlay')) {
      this.showNotifGuide = false;
    }
  }

  async activateFromGuide() {
    this.showNotifGuide = false;
    const blocked = this.pushService.getBlockedReason();
    if (blocked) {
      this.toastService.info(blocked);
      return;
    }
    const ok = await this.pushService.requestPermissionAndSubscribe();
    if (ok) {
      this.toastService.success('¡Notificaciones activadas! 🔔');
    } else if (this.pushService.permission() === 'denied') {
      this.toastService.error('Permiso denegado. Habilítalo en la configuración del navegador.');
    } else {
      this.toastService.error('No se pudo activar. Intenta de nuevo.');
    }
  }

  async toggleNotifSubscription() {
    if (this.pushService.isSubscribed()) {
      await this.pushService.unsubscribe();
      this.toastService.info('Notificaciones desactivadas');
      return;
    }
    // Verificar si hay un motivo por el que no se puede activar
    const blocked = this.pushService.getBlockedReason();
    if (blocked) {
      this.toastService.error(blocked);
      return;
    }
    // Si no está logueado, pedir que ingrese primero para asociar la suscripción
    if (!this.auth.isLoggedIn) {
      const ok = await this.pushService.requestPermissionAndSubscribe();
      if (ok) this.toastService.success('Notificaciones activadas 🔔 (inicia sesión para recibir alertas personalizadas)');
      else if (this.pushService.permission() === 'denied') {
        this.toastService.error('Permiso denegado. Habilítalo en la configuración del navegador.');
      } else {
        this.toastService.error('No se pudo activar las notificaciones');
      }
      return;
    }
    const ok = await this.pushService.requestPermissionAndSubscribe();
    if (ok) {
      this.toastService.success('Notificaciones activadas 🔔');
    } else if (this.pushService.permission() === 'denied') {
      this.toastService.error('Permiso denegado. Ve a la configuración del navegador para habilitarlas.');
    } else {
      this.toastService.error('No se pudo activar las notificaciones. Intenta de nuevo.');
    }
  }

  getSocialIcon(platform: string): string {
    const icons: Record<string,string> = {
      instagram: 'fab fa-instagram', facebook: 'fab fa-facebook-f',
      tiktok: 'fab fa-tiktok', twitter: 'fab fa-x-twitter',
      youtube: 'fab fa-youtube', whatsapp: 'fab fa-whatsapp',
      linkedin: 'fab fa-linkedin-in', pinterest: 'fab fa-pinterest'
    };
    return icons[platform?.toLowerCase()] || 'fas fa-link';
  }
}
