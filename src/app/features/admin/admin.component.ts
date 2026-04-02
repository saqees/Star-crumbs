import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { UploadService } from '../../core/services/upload.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { Product, Category, Order, User, ChatMessage } from '../../core/models/models';
import { environment } from '../../../environments/environment';

type Tab = 'products' | 'orders' | 'users' | 'chat' | 'categories';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-enter admin-page">
      <div class="admin-header">
        <div class="container">
          <h1>👑 Panel de Administración</h1>
          <p>Gestiona tu tienda Star Crumbs</p>
        </div>
      </div>

      <div class="container admin-layout">
        <!-- Sidebar tabs -->
        <div class="admin-sidebar">
          <button *ngFor="let t of tabs" class="tab-btn" [class.active]="activeTab()===t.key" (click)="activeTab.set(t.key)">
            <i [class]="t.icon"></i> {{t.label}}
          </button>
        </div>

        <!-- Content -->
        <div class="admin-content">

          <!-- ─── PRODUCTS ─── -->
          <div *ngIf="activeTab()==='products'">
            <div class="content-header">
              <h2>Productos</h2>
              <button class="btn btn-primary btn-sm" (click)="openProductForm()">
                <i class="fas fa-plus"></i> Agregar producto
              </button>
            </div>

            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Destacado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of products()">
                    <td><img [src]="p.images[0]||'assets/cookie-placeholder.png'" class="table-img"></td>
                    <td>{{p.name}}</td>
                    <td>$ {{p.price | number:'1.0-0'}}</td>
                    <td>
                      <span class="stock-badge" [class.low-stock]="p.stock < 5">{{p.stock}}</span>
                    </td>
                    <td>
                      <span class="featured-toggle" [class.on]="p.is_featured" (click)="toggleFeatured(p)">
                        {{p.is_featured ? '⭐' : '☆'}}
                      </span>
                    </td>
                    <td class="action-btns">
                      <button class="action-btn edit" (click)="editProduct(p)"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete" (click)="deleteProduct(p.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── ORDERS ─── -->
          <div *ngIf="activeTab()==='orders'">
            <div class="content-header"><h2>Pedidos</h2></div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr><th>ID</th><th>Cliente</th><th>Total</th><th>Método</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of orders()">
                    <td class="mono">{{o.id | slice:0:8}}...</td>
                    <td>{{o.username || 'Anónimo'}}</td>
                    <td>$ {{o.total | number:'1.0-0'}}</td>
                    <td>{{o.payment_method}}</td>
                    <td>
                      <select class="status-select" [value]="o.status" (change)="updateOrderStatus(o.id, $any($event.target).value)">
                        <option value="pending">⏳ Pendiente</option>
                        <option value="processing">🔄 En proceso</option>
                        <option value="completed">✅ Completado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                    </td>
                    <td>{{o.created_at | date:'dd/MM/yy'}}</td>
                    <td><span class="status-badge" [class]="'status-'+o.status">{{o.status}}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── USERS ─── -->
          <div *ngIf="activeTab()==='users'">
            <div class="content-header"><h2>Usuarios registrados</h2></div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr><th>Avatar</th><th>Usuario</th><th>Email</th><th>Jornada</th><th>Ambiente</th><th>Registrado</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of users()">
                    <td><img [src]="u.profile_picture||'assets/avatar.png'" class="table-img rounded"></td>
                    <td><strong>{{u.username}}</strong><br><small class="role-label" [class.admin-role]="u.role==='admin'">{{u.role}}</small></td>
                    <td>{{u.email}}</td>
                    <td>{{u.schedule || '—'}}</td>
                    <td>{{u.ambiente_number || '—'}}</td>
                    <td>{{u.created_at | date:'dd/MM/yy'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── CHAT ─── -->
          <div *ngIf="activeTab()==='chat'" class="admin-chat">
            <div class="content-header"><h2>Chat con usuarios</h2></div>
            <div class="chat-layout">
              <!-- Conversation list -->
              <div class="conv-list">
                <div *ngFor="let c of conversations()"
                     class="conv-item" [class.active]="selectedConv()?.id===c.id"
                     (click)="openConversation(c)">
                  <img [src]="c.profile_picture||'assets/avatar.png'" class="conv-avatar">
                  <div class="conv-info">
                    <strong>{{c.username}}</strong>
                    <p class="conv-last">{{c.last_message | slice:0:30}}...</p>
                  </div>
                  <span *ngIf="c.unread_count > 0" class="unread-badge">{{c.unread_count}}</span>
                </div>
                <div *ngIf="conversations().length === 0" class="no-convs">
                  <span>💬</span><p>Sin conversaciones aún</p>
                </div>
              </div>

              <!-- Chat window -->
              <div class="admin-chat-window" *ngIf="selectedConv()">
                <div class="admin-chat-header">
                  <img [src]="selectedConv()?.profile_picture||'assets/avatar.png'" class="conv-avatar-sm">
                  <strong>{{selectedConv()?.username}}</strong>
                </div>
                <div class="admin-messages">
                  <div *ngFor="let m of adminMessages()"
                       class="msg-row"
                       [class.msg-mine]="m.sender_id === myId"
                       [class.msg-theirs]="m.sender_id !== myId">
                    <div class="msg-bubble">
                      {{m.message}}
                      <span class="msg-time">{{formatTime(m.created_at)}}</span>
                    </div>
                  </div>
                </div>
                <div class="admin-chat-input">
                  <input type="text" [(ngModel)]="adminMsg" (keydown.enter)="sendAdminMsg()"
                         placeholder="Escribe una respuesta..." class="form-control">
                  <button class="send-btn btn btn-primary btn-sm" (click)="sendAdminMsg()">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
              <div *ngIf="!selectedConv()" class="no-chat-selected">
                <span>💬</span><p>Selecciona una conversación</p>
              </div>
            </div>
          </div>

          <!-- ─── CATEGORIES ─── -->
          <div *ngIf="activeTab()==='categories'">
            <div class="content-header">
              <h2>Categorías</h2>
              <button class="btn btn-primary btn-sm" (click)="showCatForm=!showCatForm">
                <i class="fas fa-plus"></i> Nueva categoría
              </button>
            </div>
            <div *ngIf="showCatForm" class="cat-form card" style="padding:24px;margin-bottom:24px">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <input type="text" [(ngModel)]="newCat.name" class="form-control" placeholder="Galletas Clásicas">
                </div>
                <div class="form-group">
                  <label>Slug</label>
                  <input type="text" [(ngModel)]="newCat.slug" class="form-control" placeholder="clasicas">
                </div>
              </div>
              <button class="btn btn-primary btn-sm" (click)="createCategory()">Crear categoría</button>
            </div>
            <div class="categories-grid">
              <div *ngFor="let c of categories()" class="cat-chip">
                <span>{{c.name}}</span>
                <button class="del-cat" (click)="deleteCategory(c.id)"><i class="fas fa-times"></i></button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Product Form Modal -->
      <div *ngIf="showProductForm()" class="overlay">
        <div class="modal">
          <button class="close-btn" (click)="showProductForm.set(false)"><i class="fas fa-times"></i></button>
          <h3>{{editingProduct() ? 'Editar' : 'Nuevo'}} Producto</h3>

          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" [(ngModel)]="productForm.name" class="form-control">
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="productForm.description" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Precio *</label>
              <input type="number" [(ngModel)]="productForm.price" class="form-control" min="0">
            </div>
            <div class="form-group">
              <label>Stock</label>
              <input type="number" [(ngModel)]="productForm.stock" class="form-control" min="0">
            </div>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select [(ngModel)]="productForm.category_id" class="form-control">
              <option value="">Sin categoría</option>
              <option *ngFor="let c of categories()" [value]="c.id">{{c.name}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Imagen del producto</label>
            <input type="file" accept="image/*" (change)="onProductImageChange($event)" class="file-input">
            <div class="product-imgs-preview">
              <img *ngFor="let img of productForm.images" [src]="img" class="product-img-thumb">
            </div>
            <div *ngIf="uploadingImg()" style="font-size:0.85rem;color:var(--text-light);margin-top:6px">
              <i class="fas fa-spinner fa-spin"></i> Subiendo imagen...
            </div>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" [(ngModel)]="productForm.is_featured"> Producto destacado ⭐
            </label>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary btn-sm" (click)="showProductForm.set(false)">Cancelar</button>
            <button class="btn btn-primary btn-sm" (click)="saveProduct()" [disabled]="savingProduct()">
              {{savingProduct() ? 'Guardando...' : (editingProduct() ? 'Actualizar' : 'Crear producto')}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { background: var(--almond-light); min-height: 100vh; }
    .admin-header {
      background: linear-gradient(135deg, var(--mocca-bean), var(--caramel-roast));
      color: #fff; padding: 50px 0 30px;
    }
    .admin-header h1 { color: #fff; margin-bottom: 6px; }
    .admin-header p { opacity: 0.75; }
    .admin-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; padding-top: 32px; padding-bottom: 48px; }
    .admin-sidebar { background: #fff; border-radius: var(--radius-lg); padding: 16px; height: fit-content; box-shadow: var(--shadow-sm); position: sticky; top: 90px; }
    .tab-btn {
      width: 100%; padding: 12px 16px; border: none; background: none;
      cursor: pointer; font-size: 0.9rem; font-weight: 600; color: var(--text-mid);
      border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px;
      transition: all var(--transition); text-align: left; margin-bottom: 4px;
    }
    .tab-btn:hover { background: var(--almond-light); color: var(--warm-capuchino); }
    .tab-btn.active { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .admin-content { background: #fff; border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm); }
    .content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .content-header h2 { color: var(--mocca-bean); }
    .admin-table-wrap { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .admin-table th { background: var(--almond-light); padding: 12px 14px; text-align: left; font-weight: 700; color: var(--text-mid); font-size: 0.8rem; text-transform: uppercase; }
    .admin-table td { padding: 12px 14px; border-bottom: 1px solid var(--almond-light); vertical-align: middle; }
    .table-img { width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; }
    .table-img.rounded { border-radius: 50%; }
    .stock-badge { padding: 3px 10px; border-radius: var(--radius-full); background: var(--success); color: #fff; font-size: 0.78rem; font-weight: 700; }
    .stock-badge.low-stock { background: var(--error); }
    .featured-toggle { cursor: pointer; font-size: 1.2rem; }
    .featured-toggle.on { filter: drop-shadow(0 0 4px gold); }
    .action-btns { display: flex; gap: 6px; }
    .action-btn {
      width: 32px; height: 32px; border: none; cursor: pointer; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: all var(--transition);
    }
    .action-btn.edit { background: #e8f0fe; color: #1967d2; }
    .action-btn.edit:hover { background: #1967d2; color: #fff; }
    .action-btn.delete { background: #fde8e8; color: var(--error); }
    .action-btn.delete:hover { background: var(--error); color: #fff; }
    .status-select { padding: 5px 10px; border: 1px solid var(--almond); border-radius: var(--radius-sm); font-size: 0.8rem; }
    .status-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
    .status-pending    { background: #fff3e0; color: #f57c00; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-completed  { background: #e8f5e9; color: #388e3c; }
    .status-cancelled  { background: #fde8e8; color: var(--error); }
    .role-label { font-size: 0.7rem; color: var(--text-light); }
    .admin-role { color: var(--warm-capuchino); font-weight: 700; }
    .mono { font-family: monospace; font-size: 0.78rem; }
    /* Chat admin */
    .admin-chat .chat-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; height: 500px; }
    .conv-list { border: 1px solid var(--almond); border-radius: var(--radius-md); overflow-y: auto; }
    .conv-item { display: flex; align-items: center; gap: 10px; padding: 14px; cursor: pointer; transition: background var(--transition); border-bottom: 1px solid var(--almond-light); position: relative; }
    .conv-item:hover, .conv-item.active { background: var(--almond-light); }
    .conv-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .conv-avatar-sm { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .conv-info { flex: 1; overflow: hidden; }
    .conv-info strong { font-size: 0.88rem; color: var(--text-dark); display: block; }
    .conv-last { font-size: 0.75rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .unread-badge { background: var(--warm-capuchino); color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .no-convs { text-align: center; padding: 40px 16px; color: var(--text-light); font-size: 0.85rem; }
    .no-convs span { font-size: 2rem; display: block; margin-bottom: 8px; }
    .admin-chat-window { border: 1px solid var(--almond); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden; }
    .admin-chat-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--almond-light); border-bottom: 1px solid var(--almond); }
    .admin-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: #f8f4f0; }
    .admin-chat-input { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--almond); }
    .msg-row { display: flex; max-width: 80%; }
    .msg-mine { align-self: flex-end; }
    .msg-theirs { align-self: flex-start; }
    .msg-bubble { padding: 8px 13px; border-radius: 16px; font-size: 0.85rem; line-height: 1.5; }
    .msg-mine .msg-bubble { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; border-bottom-right-radius: 4px; }
    .msg-theirs .msg-bubble { background: #fff; color: var(--text-dark); border-bottom-left-radius: 4px; box-shadow: var(--shadow-sm); }
    .msg-time { display: block; font-size: 0.62rem; opacity: 0.6; text-align: right; margin-top: 2px; }
    .no-chat-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-light); border: 1px solid var(--almond); border-radius: var(--radius-md); }
    .no-chat-selected span { font-size: 2.5rem; }
    /* Categories */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .categories-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .cat-chip { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--almond-light); border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; color: var(--text-mid); }
    .del-cat { background: none; border: none; cursor: pointer; color: var(--error); font-size: 0.75rem; }
    .showCatForm .cat-form { margin-bottom: 24px; }
    .file-input { padding: 8px 0; font-size: 0.85rem; width: 100%; }
    .product-imgs-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .product-img-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm); border: 2px solid var(--almond); }
    .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-light); }
    @media (max-width: 900px) {
      .admin-layout { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; display: flex; flex-wrap: wrap; gap: 6px; }
      .tab-btn { width: auto; }
      .admin-chat .chat-layout { grid-template-columns: 1fr; height: auto; }
    }
  `]
})
export class AdminComponent implements OnInit {
  activeTab = signal<Tab>('products');
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  users = signal<User[]>([]);
  categories = signal<Category[]>([]);
  conversations = signal<any[]>([]);
  adminMessages = signal<ChatMessage[]>([]);
  selectedConv = signal<any>(null);
  showProductForm = signal(false);
  editingProduct = signal<Product | null>(null);
  savingProduct = signal(false);
  uploadingImg = signal(false);
  showCatForm = false;
  adminMsg = '';
  get myId() { return this.auth.currentUser()?.id || ''; }

  productForm: Partial<Product> & { images: string[] } = { name: '', description: '', price: 0, stock: 0, images: [], is_featured: false };
  newCat = { name: '', slug: '' };

  tabs = [
    { key: 'products' as Tab, label: 'Productos', icon: 'fas fa-cookie-bite' },
    { key: 'categories' as Tab, label: 'Categorías', icon: 'fas fa-tags' },
    { key: 'orders' as Tab, label: 'Pedidos', icon: 'fas fa-shopping-bag' },
    { key: 'users' as Tab, label: 'Usuarios', icon: 'fas fa-users' },
    { key: 'chat' as Tab, label: 'Chat', icon: 'fas fa-comments' }
  ];

  constructor(
    private productService: ProductService,
    private uploadService: UploadService,
    private toast: ToastService,
    public auth: AuthService,
    private chatService: ChatService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.productService.getAll().subscribe(p => this.products.set(p));
    this.http.get<Order[]>(`${environment.apiUrl}/orders`).subscribe(o => this.orders.set(o));
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe(u => this.users.set(u));
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c));
    this.chatService.getConversations().subscribe(c => this.conversations.set(c));
  }

  openProductForm() {
    this.editingProduct.set(null);
    this.productForm = { name: '', description: '', price: 0, stock: 0, images: [], is_featured: false };
    this.showProductForm.set(true);
  }

  editProduct(p: Product) {
    this.editingProduct.set(p);
    this.productForm = { ...p, images: p.images || [] };
    this.showProductForm.set(true);
  }

  async onProductImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImg.set(true);
    const base64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(base64, 'star-crumbs/products').subscribe({
      next: res => {
        this.productForm.images = [...(this.productForm.images || []), res.url];
        this.uploadingImg.set(false);
        this.toast.success('Imagen subida ✅');
      },
      error: () => { this.uploadingImg.set(false); this.toast.error('Error al subir imagen'); }
    });
  }

  saveProduct() {
    if (!this.productForm.name) { this.toast.error('El nombre es requerido'); return; }
    this.savingProduct.set(true);
    const obs = this.editingProduct()
      ? this.productService.update(this.editingProduct()!.id, this.productForm)
      : this.productService.create(this.productForm);
    obs.subscribe({
      next: () => {
        this.savingProduct.set(false);
        this.showProductForm.set(false);
        this.toast.success(this.editingProduct() ? 'Producto actualizado ✅' : 'Producto creado ✅');
        this.productService.getAll().subscribe(p => this.products.set(p));
      },
      error: () => { this.savingProduct.set(false); this.toast.error('Error al guardar'); }
    });
  }

  deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productService.delete(id).subscribe({
      next: () => { this.toast.success('Producto eliminado'); this.productService.getAll().subscribe(p => this.products.set(p)); },
      error: () => this.toast.error('Error al eliminar')
    });
  }

  toggleFeatured(p: Product) {
    this.productService.update(p.id, { is_featured: !p.is_featured }).subscribe({
      next: () => this.productService.getAll().subscribe(pr => this.products.set(pr))
    });
  }

  updateOrderStatus(id: string, status: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/status`, { status }).subscribe({
      next: () => this.toast.success('Estado actualizado'),
      error: () => this.toast.error('Error')
    });
  }

  createCategory() {
    if (!this.newCat.name || !this.newCat.slug) { this.toast.error('Nombre y slug requeridos'); return; }
    this.http.post<Category>(`${environment.apiUrl}/categories`, this.newCat).subscribe({
      next: () => {
        this.toast.success('Categoría creada');
        this.newCat = { name: '', slug: '' };
        this.showCatForm = false;
        this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c));
      },
      error: () => this.toast.error('Error al crear')
    });
  }

  deleteCategory(id: string) {
    this.http.delete(`${environment.apiUrl}/categories/${id}`).subscribe({
      next: () => this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c))
    });
  }

  openConversation(conv: any) {
    this.selectedConv.set(conv);
    this.chatService.loadHistory(conv.id).subscribe(msgs => this.adminMessages.set(msgs));
    this.chatService.markRead(conv.id).subscribe();
  }

  sendAdminMsg() {
    const text = this.adminMsg.trim();
    if (!text || !this.selectedConv()) return;
    const msg: ChatMessage = { sender_id: this.myId, message: text, created_at: new Date().toISOString() };
    this.adminMessages.update(m => [...m, msg]);
    this.adminMsg = '';
    this.chatService.sendMessage({
      receiverId: this.selectedConv().id,
      message: text,
      senderId: this.myId,
      senderName: this.auth.currentUser()?.username || 'Admin',
      senderPic: this.auth.currentUser()?.profile_picture || ''
    });
  }

  formatTime(val: any): string {
    if (!val) return '';
    return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
