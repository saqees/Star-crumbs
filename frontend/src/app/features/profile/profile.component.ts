import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container">
          <h1>Mi <span style="color:var(--warm-capuchino)">Perfil</span></h1>
        </div>
      </div>

      <div class="container section-sm">
        <!-- Profile tabs -->
        <div class="profile-tabs">
          <button class="tab-pill" [class.active]="tab()==='info'" (click)="tab.set('info')"><i class="fas fa-user"></i> Mi Información</button>
          <button class="tab-pill" [class.active]="tab()==='orders'" (click)="tab.set('orders'); loadOrders()"><i class="fas fa-shopping-bag"></i> Mis Pedidos</button>
          <button class="tab-pill" [class.active]="tab()==='review'" (click)="tab.set('review')"><i class="fas fa-star"></i> Dejar Reseña</button>
        </div>

        <!-- TAB: Info -->
        <div *ngIf="tab()==='info'" class="profile-layout">
          <div class="avatar-card card">
            <div class="avatar-wrap" (click)="triggerFileInput()">
              <img [src]="form.profile_picture || 'assets/avatar.png'" alt="avatar" class="avatar-big">
              <div class="avatar-overlay"><i class="fas fa-camera"></i><span>Cambiar foto</span></div>
            </div>
            <input type="file" #fileInput accept="image/*" style="display:none" (change)="onFileChange($event)">
            <div *ngIf="uploading()" class="upload-progress"><div class="upload-bar"></div><span>Subiendo imagen...</span></div>
            <h3 class="avatar-name">{{auth.currentUser()?.username}}</h3>
            <span class="role-badge" [class.admin-badge]="auth.isAdmin">{{auth.isAdmin ? '👑 Admin' : '🍪 Cliente'}}</span>
            <div class="profile-meta">
              <div class="meta-item" *ngIf="auth.currentUser()?.schedule"><i class="fas fa-clock"></i>{{getScheduleLabel(auth.currentUser()?.schedule)}}</div>
              <div class="meta-item" *ngIf="auth.currentUser()?.ambiente_number"><i class="fas fa-door-open"></i>Ambiente {{auth.currentUser()?.ambiente_number}}</div>
              <div class="meta-item" *ngIf="auth.currentUser()?.phone"><i class="fas fa-phone"></i>{{auth.currentUser()?.phone}}</div>
            </div>
          </div>
          <div class="edit-card card">
            <h3>Editar información</h3>
            <div class="form-row">
              <div class="form-group"><label>Usuario</label><input type="text" [(ngModel)]="form.username" class="form-control"></div>
              <div class="form-group"><label>Nombre completo</label><input type="text" [(ngModel)]="form.full_name" class="form-control"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Teléfono</label><input type="tel" [(ngModel)]="form.phone" class="form-control"></div>
              <div class="form-group"><label>N° de Ambiente</label><input type="text" [(ngModel)]="form.ambiente_number" class="form-control"></div>
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
              <i class="fas fa-save"></i> {{saving() ? 'Guardando...' : 'Guardar cambios'}}
            </button>
          </div>
        </div>

        <!-- TAB: Orders -->
        <div *ngIf="tab()==='orders'">
          <div class="orders-tabs">
            <button class="tab-pill" [class.active]="orderView()==='active'" (click)="loadOrders('active')">Activos</button>
            <button class="tab-pill" [class.active]="orderView()==='archived'" (click)="loadOrders('archived')">Archivados</button>
          </div>
          <div *ngIf="!orders().length" class="empty-state">
            <span>📦</span><h3>No hay pedidos</h3>
            <a routerLink="/products" class="btn btn-primary">Ver productos</a>
          </div>
          <div class="orders-list">
            <div *ngFor="let order of orders()" class="order-card card">
              <div class="order-header">
                <div>
                  <span class="order-id">Pedido #{{order.id | slice:0:8}}</span>
                  <span class="order-date">{{order.created_at | date:'dd/MM/yyyy HH:mm'}}</span>
                </div>
                <span class="status-badge" [class]="'status-'+order.status">{{getStatusLabel(order.status)}}</span>
              </div>
              <div class="order-items">
                <div *ngFor="let item of (order.items || [])" class="order-item">
                  <img [src]="item.images?.[0]||'assets/cookie-placeholder.png'" [alt]="item.name" class="item-thumb">
                  <div class="item-details"><span class="item-name">{{item.name}}</span><span class="item-qty">x{{item.quantity}}</span></div>
                  <span class="item-price">$ {{item.unit_price * item.quantity | number:'1.0-0'}}</span>
                </div>
              </div>
              <div class="order-footer">
                <div class="order-meta">
                  <span><i class="fas fa-credit-card"></i> {{order.payment_method}}</span>
                  <strong class="order-total">Total: $ {{order.total | number:'1.0-0'}}</strong>
                </div>
                <div class="order-actions">
                  <button *ngIf="orderView()==='active'" class="action-sm archive-btn" (click)="archiveOrder(order.id)"><i class="fas fa-archive"></i> Archivar</button>
                  <button *ngIf="orderView()==='active'" class="action-sm delete-btn" (click)="deleteOrder(order.id)"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: Review -->
        <div *ngIf="tab()==='review'" class="review-form-wrap">
          <div class="review-form card">
            <h3>💬 Dejar una Reseña</h3>
            <p class="review-intro">Tu opinión nos ayuda a mejorar. Cuéntanos tu experiencia con Star Crumbs.</p>
            <div class="form-group">
              <label>Tipo</label>
              <div class="type-options">
                <button class="type-btn" [class.active]="reviewForm.type==='review'" (click)="reviewForm.type='review'">⭐ Reseña</button>
                <button class="type-btn" [class.active]="reviewForm.type==='complaint'" (click)="reviewForm.type='complaint'">😠 Queja</button>
                <button class="type-btn" [class.active]="reviewForm.type==='suggestion'" (click)="reviewForm.type='suggestion'">💡 Sugerencia</button>
              </div>
            </div>
            <div class="form-group">
              <label>Calificación (opcional)</label>
              <div class="star-input">
                <button *ngFor="let s of [1,2,3,4,5]" (click)="reviewForm.rating=s" [class.filled]="reviewForm.rating >= s"><i class="fas fa-star"></i></button>
              </div>
            </div>
            <div class="form-group">
              <label>Tu mensaje *</label>
              <textarea [(ngModel)]="reviewForm.comment" class="form-control" rows="4" placeholder="Escribe tu experiencia, sugerencia o queja..."></textarea>
            </div>
            <button class="btn btn-primary" (click)="submitReview()" [disabled]="submittingReview()">
              <i class="fas fa-paper-plane"></i> {{submittingReview() ? 'Enviando...' : 'Enviar reseña'}}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 60px 0 40px; }
    .profile-tabs { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
    .tab-pill { padding: 10px 22px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--text-mid); transition: all var(--transition); display: flex; align-items: center; gap: 8px; }
    .tab-pill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    /* Profile info tab */
    .profile-layout { display: grid; grid-template-columns: 300px 1fr; gap: 28px; align-items: start; }
    .avatar-card { padding: 32px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .avatar-wrap { position: relative; width: 130px; height: 130px; cursor: pointer; border-radius: 50%; overflow: hidden; border: 4px solid var(--almond); transition: border-color var(--transition); }
    .avatar-wrap:hover { border-color: var(--warm-capuchino); }
    .avatar-big { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #fff; font-size: 0.8rem; opacity: 0; transition: opacity var(--transition); }
    .avatar-overlay i { font-size: 1.4rem; }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .upload-progress { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-light); }
    .upload-bar { width: 120px; height: 4px; background: var(--almond); border-radius: 2px; overflow: hidden; }
    .avatar-name { font-size: 1.2rem; color: var(--mocca-bean); }
    .role-badge { padding: 4px 14px; border-radius: var(--radius-full); background: var(--almond-light); color: var(--text-mid); font-size: 0.82rem; font-weight: 600; }
    .admin-badge { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .profile-meta { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 4px; }
    .meta-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--almond-light); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-mid); }
    .meta-item i { color: var(--warm-capuchino); width: 16px; }
    .edit-card { padding: 32px; }
    .edit-card h3 { margin-bottom: 24px; color: var(--mocca-bean); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    /* Orders tab */
    .orders-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .empty-state span { font-size: 3.5rem; }
    .orders-list { display: flex; flex-direction: column; gap: 18px; }
    .order-card { padding: 0; overflow: hidden; }
    .order-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--almond-light); border-bottom: 1px solid var(--almond); }
    .order-id { font-weight: 700; color: var(--mocca-bean); font-family: monospace; display: block; font-size: 0.88rem; }
    .order-date { font-size: 0.78rem; color: var(--text-light); }
    .status-badge { padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.76rem; font-weight: 700; }
    .status-pending { background: #fff3e0; color: #f57c00; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-completed { background: #e8f5e9; color: #388e3c; }
    .status-cancelled { background: #fde8e8; color: var(--error); }
    .order-items { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .order-item { display: flex; align-items: center; gap: 10px; }
    .item-thumb { width: 48px; height: 48px; border-radius: var(--radius-md); object-fit: cover; }
    .item-details { flex: 1; }
    .item-name { font-weight: 600; font-size: 0.88rem; color: var(--text-dark); display: block; }
    .item-qty { font-size: 0.78rem; color: var(--text-light); }
    .item-price { font-weight: 700; color: var(--warm-capuchino); font-size: 0.9rem; }
    .order-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-top: 1px solid var(--almond); flex-wrap: wrap; gap: 10px; }
    .order-meta { display: flex; align-items: center; gap: 16px; font-size: 0.85rem; color: var(--text-mid); }
    .order-meta i { color: var(--warm-capuchino); margin-right: 4px; }
    .order-total { color: var(--warm-capuchino); }
    .order-actions { display: flex; gap: 6px; }
    .action-sm { padding: 6px 12px; border-radius: var(--radius-full); border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all var(--transition); }
    .archive-btn { background: var(--almond-light); color: var(--text-mid); }
    .archive-btn:hover { background: var(--almond); }
    .delete-btn { background: #fde8e8; color: var(--error); }
    .delete-btn:hover { background: var(--error); color: #fff; }
    /* Review tab */
    .review-form-wrap { max-width: 600px; }
    .review-form { padding: 32px; }
    .review-form h3 { margin-bottom: 8px; color: var(--mocca-bean); }
    .review-intro { color: var(--text-light); font-size: 0.9rem; margin-bottom: 24px; }
    .type-options { display: flex; gap: 10px; flex-wrap: wrap; }
    .type-btn { padding: 8px 18px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.88rem; font-weight: 600; transition: all var(--transition); color: var(--text-mid); }
    .type-btn.active { border-color: var(--warm-capuchino); background: var(--warm-capuchino); color: #fff; }
    .star-input { display: flex; gap: 4px; }
    .star-input button { background: none; border: none; cursor: pointer; font-size: 1.6rem; color: var(--almond); transition: color var(--transition); }
    .star-input button.filled { color: var(--caramel); }
    @media (max-width: 900px) { .profile-layout { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  tab = signal<'info'|'orders'|'review'>('info');
  form: Partial<User> = {};
  saving = signal(false);
  uploading = signal(false);
  orders = signal<any[]>([]);
  orderView = signal<'active'|'archived'>('active');
  submittingReview = signal(false);
  reviewForm = { type: 'review', rating: 0, comment: '' };

  constructor(
    public auth: AuthService,
    private uploadService: UploadService,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    if (u) this.form = { ...u };
  }

  triggerFileInput() { document.querySelector<HTMLInputElement>('input[type=file]')?.click(); }

  async onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    try {
      const base64 = await this.uploadService.fileToBase64(file);
      this.uploadService.uploadImage(base64, 'star-crumbs/profiles').subscribe({
        next: res => { this.form.profile_picture = res.url; this.uploading.set(false); this.toast.success('Foto actualizada ✅'); },
        error: () => { this.uploading.set(false); this.toast.error('Error al subir imagen'); }
      });
    } catch { this.uploading.set(false); }
  }

  saveProfile() {
    this.saving.set(true);
    this.auth.updateProfile(this.form).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Perfil actualizado ✅'); },
      error: () => { this.saving.set(false); this.toast.error('Error al guardar'); }
    });
  }

  loadOrders(view: 'active'|'archived' = 'active') {
    this.orderView.set(view);
    const params = view === 'archived' ? '?archived=true' : '';
    this.http.get<any[]>(`${environment.apiUrl}/orders${params}`).subscribe({
      next: o => this.orders.set(o)
    });
  }

  archiveOrder(id: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/user-archive`, {}).subscribe({
      next: () => { this.toast.success('Archivado'); this.loadOrders('active'); }
    });
  }

  deleteOrder(id: string) {
    if (!confirm('¿Eliminar este pedido de tu historial?')) return;
    this.http.delete(`${environment.apiUrl}/orders/${id}/user-delete`).subscribe({
      next: () => { this.toast.success('Eliminado'); this.loadOrders('active'); }
    });
  }

  submitReview() {
    if (!this.reviewForm.comment.trim()) { this.toast.error('Escribe tu mensaje'); return; }
    this.submittingReview.set(true);
    this.http.post(`${environment.apiUrl}/site-reviews`, this.reviewForm).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.toast.success('¡Reseña enviada! Gracias por tu opinión 🙏');
        this.reviewForm = { type: 'review', rating: 0, comment: '' };
      },
      error: () => { this.submittingReview.set(false); this.toast.error('Error al enviar'); }
    });
  }

  getStatusLabel(s: string) {
    const m: Record<string, string> = { pending: '⏳ Pendiente', processing: '🔄 En proceso', completed: '✅ Completado', cancelled: '❌ Cancelado' };
    return m[s] || s;
  }
  getScheduleLabel(s?: string) {
    const m: Record<string, string> = { diurna: '☀️ Jornada Diurna', mixta: '🌤️ Jornada Mixta', nocturna: '🌙 Jornada Nocturna' };
    return s ? m[s] || s : '';
  }
}
