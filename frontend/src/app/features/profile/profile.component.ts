import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { User, Product } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container"><h1>Mi <span style="color:var(--warm-capuchino)">Perfil</span></h1></div>
      </div>
      <div class="container section-sm">

        <!-- Tabs -->
        <div class="profile-tabs">
          <button class="tab-pill" [class.active]="tab()==='info'" (click)="tab.set('info')"><i class="fas fa-user"></i> Info</button>
          <button class="tab-pill" [class.active]="tab()==='orders'" (click)="tab.set('orders'); loadOrders('active')"><i class="fas fa-shopping-bag"></i> Pedidos</button>
          <button class="tab-pill" [class.active]="tab()==='review'" (click)="tab.set('review')"><i class="fas fa-star"></i> Reseña</button>
        </div>

        <!-- ─── INFO ─── -->
        <div *ngIf="tab()==='info'" class="profile-layout">
          <div class="avatar-card card">
            <div class="avatar-wrap" (click)="fileInput.click()">
              <img [src]="form.profile_picture || 'assets/avatar.png'" alt="avatar" class="avatar-big">
              <div class="avatar-overlay"><i class="fas fa-camera"></i><span>Cambiar foto</span></div>
            </div>
            <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)">
            <p *ngIf="uploading()" class="upload-txt"><i class="fas fa-spinner fa-spin"></i> Subiendo...</p>
            <h3>{{auth.currentUser()?.username}}</h3>
            <span class="role-badge" [class.admin-badge]="auth.isAdmin">{{auth.isAdmin ? '👑 Admin' : '🍪 Cliente'}}</span>
            <div class="profile-meta">
              <div class="meta-item" *ngIf="auth.currentUser()?.schedule"><i class="fas fa-clock"></i>{{getScheduleLabel(auth.currentUser()?.schedule)}}</div>
              <div class="meta-item" *ngIf="auth.currentUser()?.ambiente_number"><i class="fas fa-door-open"></i>Amb. {{auth.currentUser()?.ambiente_number}}</div>
              <div class="meta-item" *ngIf="auth.currentUser()?.phone"><i class="fas fa-phone"></i>{{auth.currentUser()?.phone}}</div>
            </div>
          </div>
          <div class="edit-card card">
            <h3>Editar información</h3>
            <div class="form-row-2">
              <div class="form-group"><label>Usuario</label><input type="text" [(ngModel)]="form.username" class="form-control"></div>
              <div class="form-group"><label>Nombre completo</label><input type="text" [(ngModel)]="form.full_name" class="form-control"></div>
            </div>
            <div class="form-row-2">
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

        <!-- ─── ORDERS ─── -->
        <div *ngIf="tab()==='orders'">
          <div class="orders-tabs">
            <button class="tab-pill" [class.active]="orderView()==='active'" (click)="loadOrders('active')">Activos</button>
            <button class="tab-pill" [class.active]="orderView()==='archived'" (click)="loadOrders('archived')">Archivados</button>
          </div>

          <div *ngIf="!ordersLoading() && !orders().length" class="empty-state">
            <span>📦</span><h3>No hay pedidos aquí</h3>
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
                  <img [src]="(item.images && item.images[0]) ? item.images[0] : 'assets/cookie-placeholder.png'" [alt]="item.name" class="item-thumb">
                  <div class="item-details">
                    <span class="item-name">{{item.name}}</span>
                    <span class="item-qty">Cantidad: {{item.quantity}}</span>
                  </div>
                  <span class="item-price">$ {{item.unit_price * item.quantity | number:'1.0-0'}}</span>
                </div>
              </div>
              <div class="order-footer">
                <div class="order-meta">
                  <span><i class="fas fa-credit-card"></i> {{order.payment_method}}</span>
                  <strong class="order-total">Total: $ {{order.total | number:'1.0-0'}}</strong>
                </div>
                <div class="order-actions">
                  <button *ngIf="order.status==='pending'" class="action-sm edit-btn" (click)="openEditOrder(order)" title="Editar pedido">
                    <i class="fas fa-edit"></i> Editar
                  </button>
                  <button *ngIf="orderView()==='active'" class="action-sm archive-btn" (click)="archiveOrder(order.id)">
                    <i class="fas fa-archive"></i> Archivar
                  </button>
                  <button *ngIf="orderView()==='active'" class="action-sm delete-btn" (click)="deleteOrder(order.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── REVIEW ─── -->
        <div *ngIf="tab()==='review'" class="review-form-wrap">
          <div class="review-form card">
            <h3>💬 Dejar una Reseña</h3>
            <p class="review-intro">Tu opinión nos ayuda a mejorar.</p>
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
              <textarea [(ngModel)]="reviewForm.comment" class="form-control" rows="4" placeholder="Escribe tu experiencia..."></textarea>
            </div>
            <button class="btn btn-primary" (click)="submitReview()" [disabled]="submittingReview()">
              <i class="fas fa-paper-plane"></i> {{submittingReview() ? 'Enviando...' : 'Enviar reseña'}}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div *ngIf="editingOrder()" class="overlay">
      <div class="modal modal-lg">
        <button class="close-btn" (click)="editingOrder.set(null)"><i class="fas fa-times"></i></button>
        <h3>✏️ Editar Pedido</h3>
        <p style="color:var(--text-light);font-size:0.88rem;margin-bottom:20px">Solo se pueden editar pedidos en estado pendiente.</p>

        <div class="edit-order-items">
          <div *ngFor="let item of editOrderItems(); let i=index" class="edit-order-item">
            <img [src]="getProductImg(item.product_id)" [alt]="item.name" class="item-thumb">
            <div class="item-info">
              <strong>{{getProductName(item.product_id)}}</strong>
              <div class="qty-ctrl">
                <button (click)="item.quantity > 1 && (item.quantity = item.quantity - 1)"><i class="fas fa-minus"></i></button>
                <span>{{item.quantity}}</span>
                <button (click)="item.quantity = item.quantity + 1"><i class="fas fa-plus"></i></button>
              </div>
            </div>
            <button class="action-sm delete-btn" (click)="removeEditItem(i)"><i class="fas fa-trash"></i></button>
          </div>
        </div>

        <div class="add-product-section">
          <h4>Agregar producto</h4>
          <div class="form-row-2">
            <div class="form-group">
              <label>Producto</label>
              <select [(ngModel)]="newItemProductId" class="form-control">
                <option value="">Selecciona un producto</option>
                <option *ngFor="let p of allProducts()" [value]="p.id">{{p.name}} - $ {{p.price | number:'1.0-0'}}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Cantidad</label>
              <input type="number" [(ngModel)]="newItemQty" class="form-control" min="1" value="1">
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="addEditItem()" [disabled]="!newItemProductId">
            <i class="fas fa-plus"></i> Agregar al pedido
          </button>
        </div>

        <div class="edit-order-footer">
          <strong style="color:var(--warm-capuchino);font-size:1.1rem">
            Total estimado: $ {{getEditTotal() | number:'1.0-0'}}
          </strong>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" (click)="editingOrder.set(null)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveEditOrder()" [disabled]="savingOrder()">
              {{savingOrder() ? 'Guardando...' : 'Confirmar cambios'}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 56px 0 36px; }
    .profile-tabs { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
    .tab-pill { padding: 10px 20px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--text-mid); transition: all var(--transition); display: flex; align-items: center; gap: 7px; }
    .tab-pill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    .profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
    .avatar-card { padding: 28px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .avatar-wrap { position: relative; width: 120px; height: 120px; cursor: pointer; border-radius: 50%; overflow: hidden; border: 4px solid var(--almond); }
    .avatar-big { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #fff; font-size: 0.78rem; opacity: 0; transition: opacity var(--transition); }
    .avatar-overlay i { font-size: 1.3rem; }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .upload-txt { font-size: 0.82rem; color: var(--text-light); }
    .avatar-card h3 { font-size: 1.1rem; color: var(--mocca-bean); }
    .role-badge { padding: 4px 14px; border-radius: var(--radius-full); background: var(--almond-light); color: var(--text-mid); font-size: 0.8rem; font-weight: 600; }
    .admin-badge { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .profile-meta { display: flex; flex-direction: column; gap: 7px; width: 100%; margin-top: 4px; }
    .meta-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--almond-light); border-radius: var(--radius-md); font-size: 0.83rem; color: var(--text-mid); }
    .meta-item i { color: var(--warm-capuchino); width: 14px; }
    .edit-card { padding: 28px; }
    .edit-card h3 { margin-bottom: 20px; color: var(--mocca-bean); }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    /* Orders */
    .orders-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .empty-state { text-align: center; padding: 56px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .empty-state span { font-size: 3.5rem; }
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { padding: 0; overflow: hidden; }
    .order-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; background: var(--almond-light); border-bottom: 1px solid var(--almond); flex-wrap: wrap; gap: 8px; }
    .order-id { font-weight: 700; color: var(--mocca-bean); font-family: monospace; display: block; font-size: 0.86rem; }
    .order-date { font-size: 0.76rem; color: var(--text-light); }
    .status-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.74rem; font-weight: 700; }
    .status-pending    { background: #fff3e0; color: #f57c00; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-completed  { background: #e8f5e9; color: #388e3c; }
    .status-cancelled  { background: #fde8e8; color: var(--error); }
    .order-items { padding: 13px 16px; display: flex; flex-direction: column; gap: 9px; }
    .order-item { display: flex; align-items: center; gap: 10px; }
    .item-thumb { width: 46px; height: 46px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0; }
    .item-details { flex: 1; }
    .item-name { font-weight: 600; font-size: 0.87rem; color: var(--text-dark); display: block; }
    .item-qty { font-size: 0.77rem; color: var(--text-light); }
    .item-price { font-weight: 700; color: var(--warm-capuchino); font-size: 0.9rem; white-space: nowrap; }
    .order-footer { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; border-top: 1px solid var(--almond); flex-wrap: wrap; gap: 10px; }
    .order-meta { display: flex; align-items: center; gap: 14px; font-size: 0.83rem; color: var(--text-mid); flex-wrap: wrap; }
    .order-meta i { color: var(--warm-capuchino); margin-right: 3px; }
    .order-total { color: var(--warm-capuchino); }
    .order-actions { display: flex; gap: 6px; }
    .action-sm { padding: 6px 12px; border-radius: var(--radius-full); border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all var(--transition); }
    .edit-btn { background: #e3f2fd; color: #1976d2; }
    .edit-btn:hover { background: #1976d2; color: #fff; }
    .archive-btn { background: var(--almond-light); color: var(--text-mid); }
    .archive-btn:hover { background: var(--almond); }
    .delete-btn { background: #fde8e8; color: var(--error); }
    .delete-btn:hover { background: var(--error); color: #fff; }
    /* Review */
    .review-form-wrap { max-width: 560px; }
    .review-form { padding: 28px; }
    .review-form h3 { margin-bottom: 6px; color: var(--mocca-bean); }
    .review-intro { color: var(--text-light); font-size: 0.88rem; margin-bottom: 22px; }
    .type-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .type-btn { padding: 8px 16px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all var(--transition); color: var(--text-mid); }
    .type-btn.active { border-color: var(--warm-capuchino); background: var(--warm-capuchino); color: #fff; }
    .star-input { display: flex; gap: 4px; }
    .star-input button { background: none; border: none; cursor: pointer; font-size: 1.5rem; color: var(--almond); transition: color var(--transition); }
    .star-input button.filled { color: var(--caramel); }
    /* Edit order modal */
    .close-btn { position: absolute; top: 14px; right: 14px; background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-light); }
    .edit-order-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .edit-order-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--almond-light); border-radius: var(--radius-md); }
    .item-info { flex: 1; }
    .item-info strong { display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--mocca-bean); }
    .qty-ctrl { display: flex; align-items: center; gap: 0; border: 2px solid var(--almond); border-radius: var(--radius-full); overflow: hidden; width: fit-content; }
    .qty-ctrl button { padding: 6px 12px; background: none; border: none; cursor: pointer; color: var(--warm-capuchino); font-size: 0.8rem; transition: background var(--transition); }
    .qty-ctrl button:hover { background: var(--almond); }
    .qty-ctrl span { padding: 0 14px; font-weight: 700; min-width: 28px; text-align: center; font-size: 0.9rem; }
    .add-product-section { padding: 16px; background: var(--almond-light); border-radius: var(--radius-md); margin-bottom: 20px; }
    .add-product-section h4 { color: var(--mocca-bean); margin-bottom: 14px; }
    .edit-order-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--almond); flex-wrap: wrap; gap: 14px; }
    @media (max-width: 768px) {
      .profile-layout { grid-template-columns: 1fr; }
      .form-row-2 { grid-template-columns: 1fr; }
      .avatar-card { padding: 20px 14px; }
    }
    @media (max-width: 480px) {
      .profile-tabs { gap: 7px; }
      .tab-pill { padding: 8px 14px; font-size: 0.82rem; }
      .order-header { padding: 10px 12px; }
      .order-items { padding: 10px 12px; }
      .order-footer { padding: 10px 12px; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  tab = signal<'info'|'orders'|'review'>('info');
  form: Partial<User> = {};
  saving = signal(false);
  uploading = signal(false);
  orders = signal<any[]>([]);
  ordersLoading = signal(false);
  orderView = signal<'active'|'archived'>('active');
  submittingReview = signal(false);
  editingOrder = signal<any>(null);
  editOrderItems = signal<any[]>([]);
  allProducts = signal<Product[]>([]);
  savingOrder = signal(false);
  newItemProductId = '';
  newItemQty = 1;
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
    this.http.get<Product[]>(`${environment.apiUrl}/products`).subscribe(p => this.allProducts.set(p));
  }

  triggerFileInput() { document.querySelector<HTMLInputElement>('input[type=file]')?.click(); }

  async onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    const base64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(base64, 'star-crumbs/profiles').subscribe({
      next: res => { this.form.profile_picture = res.url; this.uploading.set(false); this.toast.success('Foto actualizada ✅'); },
      error: () => { this.uploading.set(false); this.toast.error('Error al subir'); }
    });
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
    this.ordersLoading.set(true);
    const params = view === 'archived' ? '?archived=true' : '';
    this.http.get<any[]>(`${environment.apiUrl}/orders${params}`).subscribe({
      next: o => { this.orders.set(o); this.ordersLoading.set(false); },
      error: () => this.ordersLoading.set(false)
    });
  }

  archiveOrder(id: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/user-archive`, {}).subscribe({
      next: () => { this.toast.success('Pedido archivado'); this.loadOrders('active'); },
      error: (e) => { this.toast.error('Error al archivar'); console.error(e); }
    });
  }

  deleteOrder(id: string) {
    if (!confirm('¿Eliminar este pedido de tu historial?')) return;
    this.http.delete(`${environment.apiUrl}/orders/${id}/user-delete`).subscribe({
      next: () => { this.toast.success('Pedido eliminado'); this.loadOrders('active'); },
      error: (e) => { this.toast.error('Error al eliminar'); console.error(e); }
    });
  }

  openEditOrder(order: any) {
    this.editingOrder.set(order);
    const items = (order.items || []).map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, name: i.name, images: i.images, unit_price: i.unit_price }));
    this.editOrderItems.set(items);
  }

  removeEditItem(i: number) {
    const items = [...this.editOrderItems()];
    items.splice(i, 1);
    this.editOrderItems.set(items);
  }

  addEditItem() {
    if (!this.newItemProductId) return;
    const product = this.allProducts().find(p => p.id === this.newItemProductId);
    if (!product) return;
    const existing = this.editOrderItems().findIndex(i => i.product_id === product.id);
    if (existing >= 0) {
      const items = [...this.editOrderItems()];
      items[existing].quantity += this.newItemQty;
      this.editOrderItems.set(items);
    } else {
      this.editOrderItems.update(items => [...items, { product_id: product.id, quantity: this.newItemQty, name: product.name, images: product.images, unit_price: product.price }]);
    }
    this.newItemProductId = '';
    this.newItemQty = 1;
  }

  saveEditOrder() {
    if (!this.editOrderItems().length) { this.toast.error('El pedido no puede estar vacío'); return; }
    this.savingOrder.set(true);
    this.http.put(`${environment.apiUrl}/orders/${this.editingOrder().id}/edit-items`, { items: this.editOrderItems() }).subscribe({
      next: () => {
        this.savingOrder.set(false);
        this.editingOrder.set(null);
        this.toast.success('Pedido actualizado ✅');
        this.loadOrders('active');
      },
      error: (e) => { this.savingOrder.set(false); this.toast.error(e.error?.message || 'Error al guardar'); }
    });
  }

  getEditTotal() {
    return this.editOrderItems().reduce((acc, i) => {
      const p = this.allProducts().find(pr => pr.id === i.product_id);
      return acc + (p ? p.price : i.unit_price) * i.quantity;
    }, 0);
  }

  getProductName(id: string) { return this.allProducts().find(p => p.id === id)?.name || 'Producto'; }
  getProductImg(id: string) { return this.allProducts().find(p => p.id === id)?.images?.[0] || 'assets/cookie-placeholder.png'; }

  submitReview() {
    if (!this.reviewForm.comment.trim()) { this.toast.error('Escribe tu mensaje'); return; }
    this.submittingReview.set(true);
    this.http.post(`${environment.apiUrl}/site-reviews`, this.reviewForm).subscribe({
      next: () => { this.submittingReview.set(false); this.toast.success('¡Reseña enviada! 🙏'); this.reviewForm = { type: 'review', rating: 0, comment: '' }; },
      error: () => { this.submittingReview.set(false); this.toast.error('Error al enviar'); }
    });
  }

  getStatusLabel(s: string) {
    const m: Record<string,string> = { pending: '⏳ Pendiente', processing: '🔄 En proceso', completed: '✅ Completado', cancelled: '❌ Cancelado' };
    return m[s] || s;
  }
  getScheduleLabel(s?: string) {
    const m: Record<string,string> = { diurna: '☀️ Diurna', mixta: '🌤️ Mixta', nocturna: '🌙 Nocturna' };
    return s ? m[s] || s : '';
  }
}
