import { Component, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notif-overlay" (click)="onOverlay($event)">
      <div class="notif-panel">
        <div class="panel-header">
          <h3><i class="fas fa-bell"></i> Novedades</h3>
          <button class="close-x" (click)="close.emit()"><i class="fas fa-times"></i></button>
        </div>

        <!-- Admin: create notification -->
        <div *ngIf="auth.isAdmin" class="admin-create">
          <div *ngIf="!showForm()" class="create-btn-wrap">
            <button class="btn btn-primary btn-sm" (click)="showForm.set(true)">
              <i class="fas fa-plus"></i> Nueva novedad
            </button>
          </div>

          <div *ngIf="showForm()" class="create-form">
            <h4>Nueva Novedad</h4>
            <div class="form-group">
              <label>Título *</label>
              <input type="text" [(ngModel)]="newTitle" class="form-control" placeholder="Título de la novedad">
            </div>
            <div class="form-group">
              <label>Descripción *</label>
              <textarea [(ngModel)]="newDesc" class="form-control" rows="3" placeholder="Describe la novedad..."></textarea>
            </div>
            <div class="form-group">
              <label>Imagen (opcional)</label>
              <input type="file" accept="image/*" (change)="onImageSelect($event)" class="file-input">
              <img *ngIf="newImageUrl" [src]="newImageUrl" class="preview-img" alt="preview">
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary btn-sm" (click)="showForm.set(false)">Cancelar</button>
              <button class="btn btn-primary btn-sm" (click)="publishNotification()" [disabled]="publishing()">
                <i class="fas fa-paper-plane"></i>
                {{publishing() ? 'Publicando...' : 'Publicar'}}
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications list -->
        <div class="notif-list">
          <div *ngIf="notifService.notifications().length === 0" class="notif-empty">
            <span>🔔</span>
            <p>Sin novedades por ahora</p>
          </div>

          <div *ngFor="let n of notifService.notifications()"
               class="notif-item" [class.unread]="!n.is_read"
               (click)="markRead(n)">
            <img *ngIf="n.image_url" [src]="n.image_url" alt="notif" class="notif-img">
            <div class="notif-body">
              <div class="notif-top">
                <strong class="notif-title">{{n.title}}</strong>
                <span *ngIf="!n.is_read" class="unread-dot"></span>
              </div>
              <p class="notif-desc">{{n.description}}</p>
              <span class="notif-time">{{n.created_at | date:'dd/MM/yy HH:mm'}}</span>
            </div>
            <button *ngIf="auth.isAdmin" class="delete-notif" (click)="deleteNotif($event, n.id)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-overlay {
      position: fixed; inset: 0; z-index: 950;
      background: rgba(0,0,0,0.3);
    }
    .notif-panel {
      position: fixed; top: 72px; right: 16px;
      width: 380px; max-height: calc(100vh - 100px);
      background: #fff; border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg); display: flex;
      flex-direction: column; animation: slideUp 0.3s ease;
      overflow: hidden;
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--almond);
      background: linear-gradient(135deg, var(--creamy-latte), var(--almond-light));
    }
    .panel-header h3 { color: var(--mocca-bean); display: flex; align-items: center; gap: 8px; }
    .panel-header h3 i { color: var(--warm-capuchino); }
    .close-x { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text-light); padding: 4px; border-radius: var(--radius-sm); }
    .close-x:hover { color: var(--error); background: #ffe9e9; }
    .admin-create { padding: 16px 20px; border-bottom: 1px solid var(--almond); }
    .create-btn-wrap { display: flex; justify-content: flex-end; }
    .create-form h4 { margin-bottom: 14px; color: var(--mocca-bean); font-size: 0.95rem; }
    .create-form .form-group { margin-bottom: 12px; }
    .create-form label { font-size: 0.82rem; }
    .create-form .form-control { font-size: 0.88rem; }
    .file-input { width: 100%; font-size: 0.8rem; }
    .preview-img { width: 100%; max-height: 120px; object-fit: cover; border-radius: var(--radius-md); margin-top: 8px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .notif-list { overflow-y: auto; flex: 1; }
    .notif-empty { text-align: center; padding: 48px 20px; color: var(--text-light); }
    .notif-empty span { font-size: 2.5rem; display: block; margin-bottom: 10px; }
    .notif-item {
      display: flex; gap: 12px; padding: 16px 20px;
      border-bottom: 1px solid var(--almond-light); cursor: pointer;
      transition: background var(--transition); position: relative;
    }
    .notif-item:hover { background: var(--almond-light); }
    .notif-item.unread { background: rgba(201,149,106,0.06); }
    .notif-img { width: 52px; height: 52px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0; }
    .notif-body { flex: 1; }
    .notif-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .notif-title { font-size: 0.9rem; color: var(--mocca-bean); }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--warm-capuchino); flex-shrink: 0; }
    .notif-desc { font-size: 0.82rem; color: var(--text-mid); line-height: 1.5; margin-bottom: 4px; }
    .notif-time { font-size: 0.72rem; color: var(--text-light); }
    .delete-notif {
      background: none; border: none; cursor: pointer; color: var(--error);
      opacity: 0; transition: opacity var(--transition); padding: 4px; font-size: 0.85rem;
      align-self: flex-start;
    }
    .notif-item:hover .delete-notif { opacity: 1; }
    @media (max-width: 440px) {
      .notif-panel { width: calc(100vw - 32px); right: 16px; }
    }
  `]
})
export class NotificationsPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  showForm = signal(false);
  publishing = signal(false);
  newTitle = '';
  newDesc = '';
  newImageUrl = '';

  constructor(
    public notifService: NotificationService,
    public auth: AuthService,
    private uploadService: UploadService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.notifService.load().subscribe();
  }

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('notif-overlay')) this.close.emit();
  }

  async onImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const base64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(base64, 'star-crumbs/notifications').subscribe({
      next: res => { this.newImageUrl = res.url; },
      error: () => this.toast.error('Error al subir imagen')
    });
  }

  publishNotification() {
    if (!this.newTitle || !this.newDesc) { this.toast.error('Título y descripción son requeridos'); return; }
    this.publishing.set(true);
    this.notifService.create({
      title: this.newTitle,
      description: this.newDesc,
      image_url: this.newImageUrl || undefined
    }).subscribe({
      next: () => {
        this.publishing.set(false);
        this.showForm.set(false);
        this.newTitle = '';
        this.newDesc = '';
        this.newImageUrl = '';
        this.toast.success('Novedad publicada ✅');
      },
      error: () => {
        this.publishing.set(false);
        this.toast.error('Error al publicar');
      }
    });
  }

  markRead(n: Notification) {
    if (!n.is_read) this.notifService.markRead(n.id).subscribe();
  }

  deleteNotif(e: Event, id: string) {
    e.stopPropagation();
    this.notifService.delete(id).subscribe({ next: () => this.toast.success('Novedad eliminada') });
  }
}
