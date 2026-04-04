import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <span class="auth-icon">✨</span>
          <h2>Crear cuenta</h2>
          <p>Únete a la familia Star Crumbs</p>
        </div>

        <form (ngSubmit)="register()">
          <div class="form-row">
            <div class="form-group">
              <label>Usuario *</label>
              <input type="text" [(ngModel)]="form.username" name="username" class="form-control" placeholder="mi_usuario" required>
            </div>
            <div class="form-group">
              <label>Nombre completo</label>
              <input type="text" [(ngModel)]="form.full_name" name="full_name" class="form-control" placeholder="Tu nombre">
            </div>
          </div>

          <div class="form-group">
            <label>Correo electrónico *</label>
            <input type="email" [(ngModel)]="form.email" name="email" class="form-control" placeholder="tu@email.com" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" [(ngModel)]="form.phone" name="phone" class="form-control" placeholder="3001234567">
            </div>
            <div class="form-group">
              <label>N° de Ambiente</label>
              <input type="text" [(ngModel)]="form.ambiente_number" name="ambiente" class="form-control" placeholder="Ej: 301">
            </div>
          </div>

          <div class="form-group">
            <label>Jornada</label>
            <select [(ngModel)]="form.schedule" name="schedule" class="form-control">
              <option value="">Selecciona tu jornada</option>
              <option value="diurna">☀️ Diurna</option>
              <option value="mixta">🌤️ Mixta</option>
              <option value="nocturna">🌙 Nocturna</option>
            </select>
          </div>

          <div class="form-group">
            <label>Contraseña *</label>
            <div class="pass-wrap">
              <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="form.password" name="password"
                     class="form-control" placeholder="Mínimo 6 caracteres" required minlength="6">
              <button type="button" class="pass-toggle" (click)="showPass=!showPass">
                <i [class]="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" [disabled]="loading()">
            <i class="fas fa-user-plus"></i>
            {{loading() ? 'Creando cuenta...' : 'Crear cuenta'}}
          </button>
        </form>

        <p class="auth-alt">
          ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
        </p>
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
    .auth-card { padding: 48px 40px; max-width: 560px; width: 100%; }
    .auth-header { text-align: center; margin-bottom: 32px; }
    .auth-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .auth-header h2 { margin-bottom: 6px; }
    .auth-header p { color: var(--text-light); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .pass-wrap { position: relative; }
    .pass-wrap .form-control { padding-right: 48px; }
    .pass-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-light); font-size: 1rem;
    }
    .auth-alt { text-align: center; margin-top: 24px; color: var(--text-light); font-size: 0.9rem; }
    .auth-alt a { color: var(--warm-capuchino); font-weight: 700; }
    @media (max-width: 480px) { .auth-card { padding: 32px 20px; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class RegisterComponent {
  form = { username: '', email: '', password: '', full_name: '', phone: '', ambiente_number: '', schedule: '' };
  showPass = false;
  loading = signal(false);

  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}

  register() {
    if (!this.form.username || !this.form.email || !this.form.password) {
      this.toast.error('Usuario, email y contraseña son requeridos');
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form).subscribe({
      next: () => {
        this.toast.success('¡Cuenta creada! Bienvenido 🍪');
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error(e.error?.message || 'Error al crear la cuenta');
      }
    });
  }
}
