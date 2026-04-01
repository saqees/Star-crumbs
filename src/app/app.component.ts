import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationService } from './core/services/notification.service';
import { ChatService } from './core/services/chat.service';
import { ToastService } from './core/services/toast.service';
import { ChatComponent } from './features/chat/chat.component';
import { NotificationsPanelComponent } from './features/notifications/notifications-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatComponent, NotificationsPanelComponent],
  template: `
    <!-- NAVBAR -->
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="container nav-inner">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🍪</span>
          <span class="brand-text">Star <strong>Crumbs</strong></span>
        </a>

        <div class="nav-links" [class.open]="menuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeMenu()">Inicio</a>
          <a routerLink="/products" routerLinkActive="active" (click)="closeMenu()">Productos</a>
          <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
        </div>

        <div class="nav-actions">
          <!-- Notifications bell -->
          <button *ngIf="auth.isLoggedIn" class="icon-btn bell-btn" (click)="toggleNotifications()" title="Novedades">
            <i class="fas fa-bell"></i>
            <span *ngIf="notifService.unreadCount() > 0" class="notif-badge">{{notifService.unreadCount()}}</span>
          </button>

          <!-- Chat bubble -->
          <button *ngIf="auth.isLoggedIn" class="icon-btn chat-btn" (click)="toggleChat()" title="Chat">
            <i class="fas fa-comment-dots"></i>
          </button>

          <!-- Cart -->
          <a routerLink="/cart" class="icon-btn cart-btn" title="Carrito">
            <i class="fas fa-shopping-bag"></i>
            <span *ngIf="cartService.itemCount() > 0" class="cart-badge">{{cartService.itemCount()}}</span>
          </a>

          <!-- User -->
          <div class="user-menu" *ngIf="auth.isLoggedIn; else loginBtn">
            <button class="user-btn" (click)="toggleUserMenu()">
              <img *ngIf="auth.currentUser()?.profile_picture; else avatar"
                   [src]="auth.currentUser()!.profile_picture" alt="avatar" class="avatar-img">
              <ng-template #avatar><i class="fas fa-user-circle"></i></ng-template>
              <span class="username-text">{{auth.currentUser()?.username}}</span>
              <i class="fas fa-chevron-down small-icon"></i>
            </button>
            <div class="dropdown" *ngIf="userMenuOpen">
              <a routerLink="/profile" (click)="userMenuOpen=false"><i class="fas fa-user"></i> Mi Perfil</a>
              <a routerLink="/cart" (click)="userMenuOpen=false"><i class="fas fa-shopping-bag"></i> Carrito</a>
              <hr>
              <button (click)="logout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
            </div>
          </div>

          <ng-template #loginBtn>
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Ingresar</a>
          </ng-template>

          <!-- Hamburger -->
          <button class="hamburger" (click)="menuOpen=!menuOpen">
            <span [class.active]="menuOpen"></span>
            <span [class.active]="menuOpen"></span>
            <span [class.active]="menuOpen"></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Notification Panel -->
    <app-notifications-panel
      *ngIf="showNotifications"
      (close)="showNotifications=false">
    </app-notifications-panel>

    <!-- Chat Window -->
    <app-chat
      *ngIf="showChat"
      (close)="showChat=false">
    </app-chat>

    <!-- Main content -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="brand-icon">🍪</span>
          <span><strong>Star Crumbs</strong></span>
          <p>Galletas artesanales con amor</p>
        </div>
        <div class="footer-links">
          <a routerLink="/">Inicio</a>
          <a routerLink="/products">Productos</a>
          <a href="https://wa.me/573000000000" target="_blank">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
        </div>
        <p class="footer-copy">© 2024 Star Crumbs. Todos los derechos reservados.</p>
      </div>
    </footer>

    <!-- Toasts -->
    <div class="toast-container">
      <div *ngFor="let t of toastService.toasts()"
           class="toast"
           [class.toast-success]="t.type==='success'"
           [class.toast-error]="t.type==='error'"
           [class.toast-info]="t.type==='info'">
        <i class="fas"
           [class.fa-check-circle]="t.type==='success'"
           [class.fa-exclamation-circle]="t.type==='error'"
           [class.fa-info-circle]="t.type==='info'"></i>
        {{t.message}}
      </div>
    </div>
  `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 900;
      background: rgba(255,249,244,0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--almond);
      transition: all var(--transition);
      height: 72px;
    }
    .navbar.scrolled { box-shadow: var(--shadow-md); }
    .nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      height: 72px; gap: 24px;
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--mocca-bean);
      font-family: var(--font-display); font-size: 1.4rem;
    }
    .brand-icon { font-size: 1.8rem; }
    .brand-text strong { color: var(--warm-capuchino); }
    .nav-links {
      display: flex; gap: 32px; align-items: center;
    }
    .nav-links a {
      color: var(--text-mid); font-weight: 600; font-size: 0.95rem;
      padding: 6px 0; border-bottom: 2px solid transparent;
      transition: all var(--transition);
    }
    .nav-links a:hover, .nav-links a.active {
      color: var(--warm-capuchino); border-bottom-color: var(--warm-capuchino);
    }
    .nav-actions { display: flex; align-items: center; gap: 12px; }
    .icon-btn {
      position: relative; background: none; border: none; cursor: pointer;
      width: 42px; height: 42px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center;
      color: var(--text-mid); font-size: 1.2rem;
      transition: all var(--transition);
      text-decoration: none;
    }
    .icon-btn:hover { background: var(--almond-light); color: var(--warm-capuchino); }
    .notif-badge, .cart-badge {
      position: absolute; top: 2px; right: 2px;
      background: var(--error); color: #fff;
      font-size: 0.65rem; font-weight: 700;
      min-width: 18px; height: 18px;
      border-radius: 9px; display: flex;
      align-items: center; justify-content: center;
      padding: 0 4px;
    }
    .user-menu { position: relative; }
    .user-btn {
      display: flex; align-items: center; gap: 8px;
      background: none; border: 2px solid var(--almond);
      border-radius: var(--radius-full); padding: 6px 14px;
      cursor: pointer; color: var(--text-mid); font-size: 0.9rem;
      font-weight: 600; transition: all var(--transition);
    }
    .user-btn:hover { border-color: var(--warm-capuchino); color: var(--warm-capuchino); }
    .avatar-img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .username-text { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .small-icon { font-size: 0.7rem; }
    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); min-width: 180px;
      padding: 8px; border: 1px solid var(--almond);
      animation: slideUp 0.2s ease;
    }
    .dropdown a, .dropdown button {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: var(--radius-sm);
      color: var(--text-mid); font-size: 0.9rem; font-weight: 500;
      width: 100%; background: none; border: none; cursor: pointer;
      text-decoration: none; transition: background var(--transition);
    }
    .dropdown a:hover, .dropdown button:hover {
      background: var(--almond-light); color: var(--warm-capuchino);
    }
    .dropdown hr { border: none; border-top: 1px solid var(--almond); margin: 6px 0; }
    .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
    .hamburger span { display: block; width: 24px; height: 2px; background: var(--text-mid); border-radius: 2px; transition: all var(--transition); }
    .main-content { margin-top: 72px; min-height: calc(100vh - 72px); }
    .footer {
      background: var(--mocca-bean); color: var(--almond-light); padding: 48px 0 24px;
    }
    .footer-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .footer-brand { display: flex; flex-direction: column; gap: 8px; font-size: 1.1rem; }
    .footer-brand p { font-size: 0.85rem; opacity: 0.7; }
    .footer-links { display: flex; flex-direction: column; gap: 10px; }
    .footer-links a { color: var(--almond); opacity: 0.85; font-size: 0.9rem; }
    .footer-links a:hover { opacity: 1; }
    .footer-copy { grid-column: 1/-1; text-align: center; opacity: 0.5; font-size: 0.8rem; margin-top: 24px; }
    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
    @media (max-width: 768px) {
      .nav-links { display: none; position: fixed; top: 72px; left: 0; right: 0; background: var(--cream-white); flex-direction: column; padding: 24px; box-shadow: var(--shadow-md); gap: 16px; }
      .nav-links.open { display: flex; }
      .hamburger { display: flex; }
      .username-text { display: none; }
      .footer-inner { grid-template-columns: 1fr; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  scrolled = false;
  menuOpen = false;
  userMenuOpen = false;
  showNotifications = false;
  showChat = false;

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    public notifService: NotificationService,
    public chatService: ChatService,
    public toastService: ToastService,
    private router: Router
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
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    this.chatService.disconnect();
  }

  onScroll = () => { this.scrolled = window.scrollY > 20; };

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showChat = false;
  }

  toggleChat() {
    this.showChat = !this.showChat;
    this.showNotifications = false;
  }

  toggleUserMenu() { this.userMenuOpen = !this.userMenuOpen; }
  closeMenu() { this.menuOpen = false; }

  logout() {
    this.userMenuOpen = false;
    this.auth.logout();
    this.chatService.disconnect();
  }
}
