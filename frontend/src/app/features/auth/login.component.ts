import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <span class="auth-icon">🍪</span>
          <h2>Bienvenido de vuelta</h2>
          <p>Inicia sesión en Star Crumbs</p>
        </div>

        <form (ngSubmit)="login()">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" [(ngModel)]="email" name="email" class="form-control" placeholder="tu@email.com" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <div class="pass-wrap">
              <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="password" name="password"
                     class="form-control" placeholder="••••••••" required>
              <button type="button" class="pass-toggle" (click)="showPass=!showPass">
                <i [class]="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" [disabled]="loading()">
            <i class="fas fa-sign-in-alt"></i>
            {{loading() ? 'Ingresando...' : 'Ingresar'}}
          </button>
        </form>

        <p class="auth-alt">
          ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a>
        </p>

        <div class="admin-hint">
          <small>Admin demo: admin@starcrumbs.com / Admin123!</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 72px);
      display: flex; align-items: center; justify-content: center;
      padding: 40px 16px;
      background: linear-gradient(135deg, var(--creamy-latte) 0%, var(--almond) 100%);
    }
    .auth-card { padding: 48px 40px; max-width: 440px; width: 100%; }
    .auth-header { text-align: center; margin-bottom: 36px; }
    .auth-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .auth-header h2 { margin-bottom: 6px; }
    .auth-header p { color: var(--text-light); }
    .pass-wrap { position: relative; }
    .pass-wrap .form-control { padding-right: 48px; }
    .pass-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-light); font-size: 1rem;
    }
    .auth-alt { text-align: center; margin-top: 24px; color: var(--text-light); font-size: 0.9rem; }
    .auth-alt a { color: var(--warm-capuchino); font-weight: 700; }
    .admin-hint { text-align: center; margin-top: 16px; padding: 10px; background: var(--almond-light); border-radius: var(--radius-md); }
    .admin-hint small { color: var(--text-light); font-size: 0.78rem; }
    @media (max-width: 480px) { .auth-card { padding: 32px 24px; } }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPass = false;
  loading = signal(false);

  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}

  login() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.toast.success('¡Bienvenido de vuelta! 🍪');
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error(e.error?.message || 'Credenciales incorrectas');
      }
    });
  }
}
