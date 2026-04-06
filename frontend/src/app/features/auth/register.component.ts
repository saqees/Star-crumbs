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
          <!-- Datos básicos -->
          <div class="form-row">
            <div class="form-group">
              <label>Usuario *</label>
              <input type="text" [(ngModel)]="form.username" name="username"
                     class="form-control" placeholder="mi_usuario" required>
            </div>
            <div class="form-group">
              <label>Nombre completo</label>
              <input type="text" [(ngModel)]="form.full_name" name="full_name"
                     class="form-control" placeholder="Tu nombre">
            </div>
          </div>

          <div class="form-group">
            <label>Correo electrónico *</label>
            <input type="email" [(ngModel)]="form.email" name="email"
                   class="form-control" placeholder="tu@email.com" required>
          </div>

          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone"
                   class="form-control" placeholder="3001234567">
          </div>

          <!-- ── UBICACIÓN ──────────────────────────── -->
          <div class="location-section">
            <div class="location-label">
              <i class="fas fa-map-marker-alt"></i> Ubicación
            </div>

            <!-- Selector tipo de ubicación -->
            <div class="location-type-selector">
              <button type="button"
                      class="loc-type-btn" [class.active]="form.location_type==='sena'"
                      (click)="form.location_type='sena'">
                <div class="loc-icon">🏫</div>
                <div>
                  <strong>SENA</strong>
                  <span>Centro de formación</span>
                </div>
              </button>
              <button type="button"
                      class="loc-type-btn" [class.active]="form.location_type==='especifica'"
                      (click)="form.location_type='especifica'">
                <div class="loc-icon">📍</div>
                <div>
                  <strong>Ubicación específica</strong>
                  <span>Dirección personalizada</span>
                </div>
              </button>
            </div>

            <!-- SENA fields -->
            <div *ngIf="form.location_type==='sena'" class="loc-fields">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-door-open"></i> N° de Ambiente</label>
                  <input type="text" [(ngModel)]="form.ambiente_number" name="ambiente"
                         class="form-control" placeholder="Ej: 301, 405...">
                </div>
                <div class="form-group">
                  <label><i class="fas fa-clock"></i> Jornada</label>
                  <select [(ngModel)]="form.schedule" name="schedule" class="form-control">
                    <option value="">Selecciona tu jornada</option>
                    <option value="diurna">☀️ Diurna</option>
                    <option value="mixta">🌤️ Mixta</option>
                    <option value="nocturna">🌙 Nocturna</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Ubicación específica fields -->
            <div *ngIf="form.location_type==='especifica'" class="loc-fields">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-road"></i> Calle / Carrera</label>
                  <input type="text" [(ngModel)]="form.street" name="street"
                         class="form-control" placeholder="Calle 25 # 14-30">
                </div>
                <div class="form-group">
                  <label><i class="fas fa-home"></i> Barrio</label>
                  <input type="text" [(ngModel)]="form.neighborhood" name="neighborhood"
                         class="form-control" placeholder="Nombre del barrio">
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Indicaciones adicionales</label>
                <input type="text" [(ngModel)]="form.address_detail" name="address_detail"
                       class="form-control" placeholder="Apto 201, casa azul, al lado de...">
              </div>
              <!-- Map preview link -->
              <div class="map-section">
                <label><i class="fas fa-map"></i> Enlace de ubicación en el mapa (opcional)</label>
                <input type="url" [(ngModel)]="form.location_map_url" name="map_url"
                       class="form-control" placeholder="https://maps.google.com/...">
                <div class="map-hint">
                  <i class="fas fa-lightbulb"></i>
                  Abre Google Maps, busca tu ubicación, toca <strong>Compartir → Copiar enlace</strong>
                </div>
                <!-- Map preview -->
                <div *ngIf="form.location_map_url" class="map-preview">
                  <a [href]="form.location_map_url" target="_blank" class="map-preview-link">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Ver en Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Contraseña -->
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
    .auth-card { padding: 44px 36px; max-width: 580px; width: 100%; }
    .auth-header { text-align: center; margin-bottom: 28px; }
    .auth-icon { font-size: 2.8rem; display: block; margin-bottom: 10px; }
    .auth-header h2 { margin-bottom: 5px; }
    .auth-header p { color: var(--text-light); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    /* ── Location section ── */
    .location-section {
      background: var(--almond-light);
      border: 1.5px solid var(--almond);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 16px;
    }
    .location-label {
      font-size: 0.88rem; font-weight: 700; color: var(--mocca-bean);
      margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .location-label i { color: var(--warm-capuchino); }
    .location-type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .loc-type-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: var(--radius-md);
      border: 2px solid var(--almond); background: #fff;
      cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .loc-type-btn:hover { border-color: var(--warm-capuchino); }
    .loc-type-btn.active {
      border-color: var(--warm-capuchino);
      background: linear-gradient(135deg, rgba(201,149,106,0.08), rgba(181,98,46,0.05));
    }
    .loc-icon { font-size: 1.6rem; flex-shrink: 0; }
    .loc-type-btn strong { display: block; font-size: 0.85rem; color: var(--mocca-bean); }
    .loc-type-btn span { font-size: 0.72rem; color: var(--text-light); }
    .loc-fields { animation: fadeIn 0.2s ease; }
    .map-section { margin-top: 2px; }
    .map-hint {
      font-size: 0.75rem; color: var(--text-light); margin-top: 5px;
      display: flex; align-items: flex-start; gap: 5px;
      background: rgba(201,149,106,0.08); padding: 6px 10px; border-radius: var(--radius-sm);
    }
    .map-hint i { color: var(--warm-capuchino); margin-top: 1px; flex-shrink: 0; }
    .map-preview {
      margin-top: 8px; padding: 10px;
      background: white; border: 1px solid var(--almond); border-radius: var(--radius-md);
    }
    .map-preview-link {
      display: flex; align-items: center; gap: 6px;
      color: var(--warm-capuchino); text-decoration: none; font-size: 0.85rem; font-weight: 600;
    }
    .map-preview-link:hover { text-decoration: underline; }

    /* Password */
    .pass-wrap { position: relative; }
    .pass-wrap .form-control { padding-right: 48px; }
    .pass-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-light); font-size: 1rem;
    }
    .auth-alt { text-align: center; margin-top: 20px; color: var(--text-light); font-size: 0.9rem; }
    .auth-alt a { color: var(--warm-capuchino); font-weight: 700; }
    @media (max-width: 480px) {
      .auth-card { padding: 28px 16px; }
      .form-row { grid-template-columns: 1fr; }
      .location-type-selector { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  form = {
    username: '', email: '', password: '', full_name: '', phone: '',
    location_type: 'sena',
    // SENA fields
    ambiente_number: '', schedule: '',
    // Specific location fields
    street: '', neighborhood: '', address_detail: '', location_map_url: ''
  };
  showPass = false;
  loading = signal(false);

  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}

  register() {
    if (!this.form.username || !this.form.email || !this.form.password) {
      this.toast.error('Usuario, email y contraseña son requeridos');
      return;
    }
    this.loading.set(true);

    // Build the specific_address string from parts
    let specificAddress = '';
    if (this.form.location_type === 'especifica') {
      const parts = [this.form.street, this.form.neighborhood, this.form.address_detail].filter(Boolean);
      specificAddress = parts.join(', ');
    }

    const payload = {
      username: this.form.username,
      email: this.form.email,
      password: this.form.password,
      full_name: this.form.full_name,
      phone: this.form.phone,
      location_type: this.form.location_type,
      ambiente_number: this.form.location_type === 'sena' ? this.form.ambiente_number : '',
      schedule: this.form.location_type === 'sena' ? this.form.schedule : '',
      specific_address: specificAddress,
      location_map_url: this.form.location_map_url
    };

    this.auth.register(payload).subscribe({
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
