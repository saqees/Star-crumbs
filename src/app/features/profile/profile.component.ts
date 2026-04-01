import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container">
          <h1>Mi <span style="color:var(--warm-capuchino)">Perfil</span></h1>
        </div>
      </div>

      <div class="container section-sm">
        <div class="profile-layout">
          <!-- Avatar card -->
          <div class="avatar-card card">
            <div class="avatar-wrap" (click)="triggerFileInput()">
              <img [src]="form.profile_picture || 'assets/avatar.png'" alt="avatar" class="avatar-big">
              <div class="avatar-overlay">
                <i class="fas fa-camera"></i>
                <span>Cambiar foto</span>
              </div>
            </div>
            <input type="file" #fileInput accept="image/*" style="display:none" (change)="onFileChange($event)">
            <div *ngIf="uploading()" class="upload-progress">
              <div class="upload-bar"></div>
              <span>Subiendo imagen...</span>
            </div>
            <h3 class="avatar-name">{{auth.currentUser()?.username}}</h3>
            <span class="role-badge" [class.admin-badge]="auth.isAdmin">
              {{auth.isAdmin ? '👑 Admin' : '🍪 Cliente'}}
            </span>
            <div class="profile-meta">
              <div class="meta-item" *ngIf="auth.currentUser()?.schedule">
                <i class="fas fa-clock"></i>
                {{getScheduleLabel(auth.currentUser()?.schedule)}}
              </div>
              <div class="meta-item" *ngIf="auth.currentUser()?.ambiente_number">
                <i class="fas fa-door-open"></i>
                Ambiente {{auth.currentUser()?.ambiente_number}}
              </div>
              <div class="meta-item" *ngIf="auth.currentUser()?.phone">
                <i class="fas fa-phone"></i>
                {{auth.currentUser()?.phone}}
              </div>
            </div>
          </div>

          <!-- Edit form -->
          <div class="edit-card card">
            <h3>Editar información</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Usuario</label>
                <input type="text" [(ngModel)]="form.username" class="form-control" placeholder="mi_usuario">
              </div>
              <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" [(ngModel)]="form.full_name" class="form-control" placeholder="Tu nombre">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" [(ngModel)]="form.phone" class="form-control" placeholder="3001234567">
              </div>
              <div class="form-group">
                <label>N° de Ambiente</label>
                <input type="text" [(ngModel)]="form.ambiente_number" class="form-control" placeholder="Ej: 301">
              </div>
            </div>
            <div class="form-group">
              <label>Jornada</label>
              <select [(ngModel)]="form.schedule" class="form-control">
                <option value="">Sin especificar</option>
                <option value="diurna">☀️ Diurna</option>
                <option value="mixta">🌤️ Mixta</option>
                <option value="nocturna">🌙 Nocturna</option>
              </select>
            </div>
            <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving()">
              <i class="fas fa-save"></i>
              {{saving() ? 'Guardando...' : 'Guardar cambios'}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 60px 0 40px; }
    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 28px; align-items: start; }
    .avatar-card { padding: 36px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .avatar-wrap {
      position: relative; width: 140px; height: 140px; cursor: pointer;
      border-radius: 50%; overflow: hidden;
      border: 4px solid var(--almond); transition: border-color var(--transition);
    }
    .avatar-wrap:hover { border-color: var(--warm-capuchino); }
    .avatar-big { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.45); display: flex;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; color: #fff; font-size: 0.8rem; opacity: 0;
      transition: opacity var(--transition);
    }
    .avatar-overlay i { font-size: 1.4rem; }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .upload-progress { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-light); }
    .upload-bar {
      width: 120px; height: 4px; background: var(--almond); border-radius: 2px; overflow: hidden;
    }
    .upload-bar::after {
      content: ''; display: block; height: 100%;
      background: var(--warm-capuchino); border-radius: 2px;
      animation: shimmer 1s infinite;
    }
    .avatar-name { font-size: 1.25rem; color: var(--mocca-bean); }
    .role-badge {
      padding: 4px 14px; border-radius: var(--radius-full);
      background: var(--almond-light); color: var(--text-mid); font-size: 0.82rem; font-weight: 600;
    }
    .admin-badge { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .profile-meta { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 4px; }
    .meta-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; background: var(--almond-light); border-radius: var(--radius-md);
      font-size: 0.85rem; color: var(--text-mid);
    }
    .meta-item i { color: var(--warm-capuchino); width: 16px; }
    .edit-card { padding: 36px; }
    .edit-card h3 { margin-bottom: 24px; color: var(--mocca-bean); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) {
      .profile-layout { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  form: Partial<User> = {};
  saving = signal(false);
  uploading = signal(false);

  constructor(
    public auth: AuthService,
    private uploadService: UploadService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    if (u) this.form = { ...u };
  }

  triggerFileInput() {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  async onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    try {
      const base64 = await this.uploadService.fileToBase64(file);
      this.uploadService.uploadImage(base64, 'star-crumbs/profiles').subscribe({
        next: (res) => {
          this.form.profile_picture = res.url;
          this.uploading.set(false);
          this.toast.success('Foto actualizada ✅');
        },
        error: () => {
          this.uploading.set(false);
          this.toast.error('Error al subir la imagen');
        }
      });
    } catch {
      this.uploading.set(false);
      this.toast.error('Error al leer la imagen');
    }
  }

  saveProfile() {
    this.saving.set(true);
    this.auth.updateProfile(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Perfil actualizado ✅');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Error al guardar');
      }
    });
  }

  getScheduleLabel(s?: string) {
    const m: Record<string, string> = { diurna: '☀️ Jornada Diurna', mixta: '🌤️ Jornada Mixta', nocturna: '🌙 Jornada Nocturna' };
    return s ? m[s] || s : '';
  }
}
