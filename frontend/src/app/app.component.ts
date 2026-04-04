import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationService } from './core/services/notification.service';
import { ChatService } from './core/services/chat.service';
import { ToastService } from './core/services/toast.service';
import { ChatComponent } from './features/chat/chat.component';
import { NotificationsPanelComponent } from './features/notifications/notifications-panel.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatComponent, NotificationsPanelComponent],
  template: `
    <!-- ═══════════ NAVBAR ═══════════ -->
    <nav class="navbar" [class.scrolled]="scrolled" [attr.data-pos]="navPos()">
      <div class="container nav-container">

        <!-- LOGO LEFT (default) -->
        <a *ngIf="navPos()==='left'" routerLink="/" class="brand">
          <span class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
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
            <span class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
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
          <span class="brand-icon">{{navConfig()?.logo_icon || '🍪'}}</span>
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

    <main class="main-content"><router-outlet></router-outlet></main>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <span>{{footerConfig()?.brand_icon || '🍪'}}</span>
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
        <p class="footer-copy">{{footerConfig()?.copyright || '© 2024 Star Crumbs.'}}</p>
      </div>
    </footer>

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
    .footer-copy { grid-column: 1/-1; text-align: center; opacity: 0.4; font-size: 0.77rem; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }

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
  navConfig = signal<any>(null);
  footerConfig = signal<any>(null);
  navLinks = signal<any[]>([]);
  navPos = signal<string>('left');

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    public notifService: NotificationService,
    public chatService: ChatService,
    public toastService: ToastService,
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
      error: () => {} // use defaults
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
}
