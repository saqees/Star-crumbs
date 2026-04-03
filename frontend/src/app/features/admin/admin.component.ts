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

type Tab = 'products'|'categories'|'orders'|'users'|'chat'|'carousel'|'why_us'|'navbar'|'footer'|'pages'|'site_reviews';

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
        <!-- Sidebar -->
        <div class="admin-sidebar">
          <p class="sidebar-group-label">Tienda</p>
          <button *ngFor="let t of tabs.slice(0,3)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="activeTab.set(t.key)">
            <i [class]="t.icon"></i> {{t.label}}
          </button>
          <p class="sidebar-group-label">Gestión</p>
          <button *ngFor="let t of tabs.slice(3,6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="activeTab.set(t.key)">
            <i [class]="t.icon"></i> {{t.label}}
          </button>
          <p class="sidebar-group-label">Personalización</p>
          <button *ngFor="let t of tabs.slice(6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="activeTab.set(t.key)">
            <i [class]="t.icon"></i> {{t.label}}
          </button>
        </div>

        <div class="admin-content">

          <!-- ─── PRODUCTS ─── -->
          <div *ngIf="activeTab()==='products'">
            <div class="content-header">
              <h2>Productos</h2>
              <button class="btn btn-primary btn-sm" (click)="openProductForm()"><i class="fas fa-plus"></i> Agregar</button>
            </div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Destacado</th><th>Acciones</th></tr></thead>
                <tbody>
                  <tr *ngFor="let p of products()">
                    <td><img [src]="p.images[0]||'assets/cookie-placeholder.png'" class="table-img"></td>
                    <td>{{p.name}}</td>
                    <td>$ {{p.price | number:'1.0-0'}}</td>
                    <td><span class="stock-badge" [class.low-stock]="p.stock < 5">{{p.stock}}</span></td>
                    <td><span class="featured-toggle" [class.on]="p.is_featured" (click)="toggleFeatured(p)">{{p.is_featured ? '⭐' : '☆'}}</span></td>
                    <td class="action-btns">
                      <button class="action-btn edit" (click)="editProduct(p)"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete" (click)="deleteProduct(p.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── CATEGORIES ─── -->
          <div *ngIf="activeTab()==='categories'">
            <div class="content-header">
              <h2>Categorías</h2>
              <button class="btn btn-primary btn-sm" (click)="showCatForm=!showCatForm"><i class="fas fa-plus"></i> Nueva</button>
            </div>
            <div *ngIf="showCatForm" class="card" style="padding:20px;margin-bottom:20px">
              <div class="form-row">
                <div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="newCat.name" class="form-control"></div>
                <div class="form-group"><label>Slug</label><input type="text" [(ngModel)]="newCat.slug" class="form-control" placeholder="sin-espacios"></div>
              </div>
              <button class="btn btn-primary btn-sm" (click)="createCategory()">Crear</button>
            </div>
            <div class="categories-grid">
              <div *ngFor="let c of categories()" class="cat-chip">
                <span>{{c.name}}</span>
                <button class="del-cat" (click)="deleteCategory(c.id)"><i class="fas fa-times"></i></button>
              </div>
            </div>
          </div>

          <!-- ─── ORDERS ─── -->
          <div *ngIf="activeTab()==='orders'">
            <div class="content-header">
              <h2>Pedidos</h2>
              <div class="order-view-tabs">
                <button class="tab-pill" [class.active]="orderView()==='active'" (click)="loadOrders('active')">Activos</button>
                <button class="tab-pill" [class.active]="orderView()==='archived'" (click)="loadOrders('archived')">Archivados</button>
                <button class="tab-pill" [class.active]="orderView()==='deleted'" (click)="loadOrders('deleted')">Eliminados</button>
              </div>
            </div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>ID</th><th>Cliente</th><th>Info</th><th>Total</th><th>Método</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
                <tbody>
                  <tr *ngFor="let o of orders()">
                    <td class="mono">{{o.id | slice:0:8}}...</td>
                    <td>
                      <div class="user-cell">
                        <img [src]="o.profile_picture||'assets/avatar.png'" class="table-img rounded">
                        <div>
                          <strong>{{o.username || 'Anónimo'}}</strong>
                          <small *ngIf="o.full_name" class="block-text">{{o.full_name}}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="info-mini">
                        <span *ngIf="o.phone"><i class="fas fa-phone"></i> {{o.phone}}</span>
                        <span *ngIf="o.ambiente_number"><i class="fas fa-door-open"></i> Amb. {{o.ambiente_number}}</span>
                        <span *ngIf="o.schedule"><i class="fas fa-clock"></i> {{o.schedule}}</span>
                      </div>
                    </td>
                    <td>$ {{o.total | number:'1.0-0'}}</td>
                    <td>{{o.payment_method}}</td>
                    <td>
                      <select *ngIf="orderView()==='active'" class="status-select" [value]="o.status" (change)="updateOrderStatus(o.id, $any($event.target).value)">
                        <option value="pending">⏳ Pendiente</option>
                        <option value="processing">🔄 En proceso</option>
                        <option value="completed">✅ Completado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                      <span *ngIf="orderView()!=='active'" class="status-badge" [class]="'status-'+o.status">{{o.status}}</span>
                    </td>
                    <td>{{o.created_at | date:'dd/MM/yy'}}</td>
                    <td class="action-btns">
                      <button class="action-btn edit" (click)="viewOrderDetail(o)" title="Ver detalle"><i class="fas fa-eye"></i></button>
                      <button *ngIf="orderView()==='active'" class="action-btn" style="background:#fff3e0;color:#f57c00" (click)="archiveOrder(o.id)" title="Archivar"><i class="fas fa-archive"></i></button>
                      <button *ngIf="orderView()==='active'" class="action-btn delete" (click)="softDeleteOrder(o.id)" title="Eliminar"><i class="fas fa-trash"></i></button>
                      <button *ngIf="orderView()!=='active'" class="action-btn edit" (click)="restoreOrder(o.id)" title="Restaurar"><i class="fas fa-undo"></i></button>
                      <button *ngIf="orderView()==='deleted'" class="action-btn delete" (click)="permanentDeleteOrder(o.id)" title="Eliminar permanente"><i class="fas fa-times"></i></button>
                      <button class="action-btn" style="background:#e3f2fd;color:#1976d2" (click)="messageUser(o)" title="Enviar mensaje"><i class="fas fa-comment"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── USERS ─── -->
          <div *ngIf="activeTab()==='users'">
            <div class="content-header"><h2>Usuarios</h2></div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>Avatar</th><th>Usuario</th><th>Email</th><th>Jornada</th><th>Ambiente</th><th>Registrado</th><th>Acciones</th></tr></thead>
                <tbody>
                  <tr *ngFor="let u of users()">
                    <td><img [src]="u.profile_picture||'assets/avatar.png'" class="table-img rounded"></td>
                    <td><strong>{{u.username}}</strong><br><small class="role-label" [class.admin-role]="u.role==='admin'">{{u.role}}</small></td>
                    <td>{{u.email}}</td>
                    <td>{{u.schedule || '—'}}</td>
                    <td>{{u.ambiente_number || '—'}}</td>
                    <td>{{u.created_at | date:'dd/MM/yy'}}</td>
                    <td class="action-btns">
                      <button class="action-btn edit" (click)="viewUserProfile(u)" title="Ver perfil"><i class="fas fa-eye"></i></button>
                      <button class="action-btn" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(u)" title="Enviar mensaje"><i class="fas fa-comment"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── CHAT ─── -->
          <div *ngIf="activeTab()==='chat'" class="admin-chat">
            <div class="content-header"><h2>Chat con usuarios</h2></div>
            <div class="chat-layout">
              <div class="conv-list">
                <div *ngFor="let c of conversations()" class="conv-item" [class.active]="selectedConv()?.id===c.id" (click)="openConversation(c)">
                  <img [src]="c.profile_picture||'assets/avatar.png'" class="conv-avatar">
                  <div class="conv-info">
                    <strong>{{c.username}}</strong>
                    <p class="conv-last">{{c.last_message | slice:0:30}}</p>
                  </div>
                  <span *ngIf="c.unread_count > 0" class="unread-badge">{{c.unread_count}}</span>
                </div>
                <div *ngIf="conversations().length===0" class="no-convs"><span>💬</span><p>Sin conversaciones</p></div>
              </div>
              <div class="admin-chat-window" *ngIf="selectedConv()">
                <div class="admin-chat-header">
                  <img [src]="selectedConv()?.profile_picture||'assets/avatar.png'" class="conv-avatar-sm">
                  <strong>{{selectedConv()?.username}}</strong>
                </div>
                <div class="admin-messages">
                  <div *ngFor="let m of adminMessages()" class="msg-row" [class.msg-mine]="m.sender_id===myId" [class.msg-theirs]="m.sender_id!==myId">
                    <div class="msg-bubble">{{m.message}}<span class="msg-time">{{formatTime(m.created_at)}}</span></div>
                  </div>
                </div>
                <div class="admin-chat-input">
                  <input type="text" [(ngModel)]="adminMsg" (keydown.enter)="sendAdminMsg()" placeholder="Escribe una respuesta..." class="form-control">
                  <button class="send-btn btn btn-primary btn-sm" (click)="sendAdminMsg()"><i class="fas fa-paper-plane"></i></button>
                </div>
              </div>
              <div *ngIf="!selectedConv()" class="no-chat-selected"><span>💬</span><p>Selecciona una conversación</p></div>
            </div>
          </div>

          <!-- ─── CAROUSEL ─── -->
          <div *ngIf="activeTab()==='carousel'">
            <div class="content-header">
              <h2>Carrusel</h2>
              <button class="btn btn-primary btn-sm" (click)="openSlideForm()"><i class="fas fa-plus"></i> Nuevo slide</button>
            </div>
            <div class="slides-list">
              <div *ngFor="let s of carouselSlides(); let i=index" class="slide-admin-card card">
                <div class="slide-preview" [style.background]="s.bg_gradient">
                  <img *ngIf="s.image_url" [src]="s.image_url" class="slide-thumb-img">
                  <span *ngIf="!s.image_url" class="slide-emoji-sm">🍪</span>
                </div>
                <div class="slide-info">
                  <h4>{{s.title}}</h4>
                  <p>{{s.subtitle}}</p>
                  <span class="slide-order">Orden: {{s.order_index}}</span>
                  <span class="slide-status" [class.active]="s.is_active">{{s.is_active ? 'Activo' : 'Inactivo'}}</span>
                </div>
                <div class="action-btns">
                  <button class="action-btn edit" (click)="editSlide(s)"><i class="fas fa-edit"></i></button>
                  <button class="action-btn delete" (click)="deleteSlide(s.id)"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <div *ngIf="carouselSlides().length===0" class="empty-admin"><span>🎠</span><p>No hay slides. Agrega uno.</p></div>
            </div>
          </div>

          <!-- ─── WHY US ─── -->
          <div *ngIf="activeTab()==='why_us'">
            <div class="content-header"><h2>Sección "¿Por qué nosotros?"</h2></div>
            <div class="settings-form card" style="padding:28px">
              <div class="form-group"><label>Título de la sección</label><input type="text" [(ngModel)]="whyUsData.title" class="form-control"></div>
              <div *ngFor="let item of whyUsData.items; let i=index" class="why-item-edit">
                <div class="form-row">
                  <div class="form-group"><label>Emoji/Icono</label><input type="text" [(ngModel)]="item.icon" class="form-control" style="font-size:1.5rem"></div>
                  <div class="form-group"><label>Imagen URL (opcional)</label><input type="text" [(ngModel)]="item.image" class="form-control" placeholder="https://..."></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="item.title" class="form-control"></div>
                  <div class="form-group"><label>Descripción</label><input type="text" [(ngModel)]="item.desc" class="form-control"></div>
                </div>
                <button class="btn btn-danger btn-sm" (click)="removeWhyItem(i)"><i class="fas fa-trash"></i> Eliminar</button>
                <hr style="margin:16px 0;border-color:var(--almond)">
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-secondary btn-sm" (click)="addWhyItem()"><i class="fas fa-plus"></i> Agregar item</button>
                <button class="btn btn-primary" (click)="saveWhyUs()">Guardar cambios</button>
              </div>
            </div>
          </div>

          <!-- ─── NAVBAR ─── -->
          <div *ngIf="activeTab()==='navbar'">
            <div class="content-header"><h2>Editar Navbar</h2></div>
            <div class="settings-form card" style="padding:28px">
              <div class="form-row">
                <div class="form-group">
                  <label>Posición del logo</label>
                  <select [(ngModel)]="navbarData.logo_position" class="form-control">
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                  </select>
                </div>
                <div class="form-group"><label>Ícono del logo</label><input type="text" [(ngModel)]="navbarData.logo_icon" class="form-control" style="font-size:1.5rem"></div>
              </div>
              <div class="form-group"><label>Texto del logo</label><input type="text" [(ngModel)]="navbarData.logo_text" class="form-control"></div>
              <div class="form-row">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="navbarData.show_cart"> Mostrar carrito</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="navbarData.show_chat"> Mostrar chat</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="navbarData.show_notifications"> Mostrar campana</label>
              </div>
              <h4 style="margin:20px 0 12px;color:var(--mocca-bean)">Links del navbar</h4>
              <div *ngFor="let link of navbarData.links; let i=index" class="link-edit-row">
                <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta">
                <input type="text" [(ngModel)]="link.url" class="form-control" placeholder="/ruta">
                <label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;white-space:nowrap"><input type="checkbox" [(ngModel)]="link.exact"> Exacto</label>
                <button class="action-btn delete" (click)="removeNavLink(i)"><i class="fas fa-times"></i></button>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
                <button class="btn btn-secondary btn-sm" (click)="addNavLink()"><i class="fas fa-plus"></i> Agregar link</button>
                <button class="btn btn-primary" (click)="saveNavbar()">Guardar navbar</button>
              </div>
            </div>
          </div>

          <!-- ─── FOOTER ─── -->
          <div *ngIf="activeTab()==='footer'">
            <div class="content-header"><h2>Editar Footer</h2></div>
            <div class="settings-form card" style="padding:28px">
              <div class="form-row">
                <div class="form-group"><label>Ícono</label><input type="text" [(ngModel)]="footerData.brand_icon" class="form-control" style="font-size:1.5rem"></div>
                <div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="footerData.brand_text" class="form-control"></div>
              </div>
              <div class="form-group"><label>Tagline</label><input type="text" [(ngModel)]="footerData.tagline" class="form-control"></div>
              <div class="form-group"><label>Copyright</label><input type="text" [(ngModel)]="footerData.copyright" class="form-control"></div>
              <h4 style="margin:20px 0 12px;color:var(--mocca-bean)">Links del footer</h4>
              <div *ngFor="let link of footerData.links; let i=index" class="link-edit-row">
                <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta">
                <input type="text" [(ngModel)]="link.url" class="form-control" placeholder="URL">
                <input type="text" [(ngModel)]="link.icon" class="form-control" placeholder="fa fa-... (opcional)">
                <label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;white-space:nowrap"><input type="checkbox" [(ngModel)]="link.external"> Externo</label>
                <button class="action-btn delete" (click)="removeFooterLink(i)"><i class="fas fa-times"></i></button>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
                <button class="btn btn-secondary btn-sm" (click)="addFooterLink()"><i class="fas fa-plus"></i> Agregar link</button>
                <button class="btn btn-primary" (click)="saveFooter()">Guardar footer</button>
              </div>
            </div>
          </div>

          <!-- ─── PAGES ─── -->
          <div *ngIf="activeTab()==='pages'">
            <div class="content-header">
              <h2>Páginas</h2>
              <button class="btn btn-primary btn-sm" (click)="openPageForm()"><i class="fas fa-plus"></i> Nueva página</button>
            </div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>Título</th><th>Slug</th><th>Estado</th><th>En nav</th><th>Acciones</th></tr></thead>
                <tbody>
                  <tr *ngFor="let pg of sitePages()">
                    <td><strong>{{pg.title}}</strong></td>
                    <td class="mono">/page/{{pg.slug}}</td>
                    <td><span class="slide-status" [class.active]="pg.is_active">{{pg.is_active ? 'Activa' : 'Inactiva'}}</span></td>
                    <td><span class="slide-status" [class.active]="pg.show_in_nav">{{pg.show_in_nav ? 'Sí' : 'No'}}</span></td>
                    <td class="action-btns">
                      <button class="action-btn edit" (click)="editPage(pg)"><i class="fas fa-edit"></i></button>
                      <button class="action-btn delete" (click)="deletePage(pg.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── SITE REVIEWS ─── -->
          <div *ngIf="activeTab()==='site_reviews'">
            <div class="content-header"><h2>Reseñas de la página</h2></div>
            <div class="reviews-admin-list">
              <div *ngFor="let r of siteReviews()" class="review-admin-card card" [class.unread-card]="!r.is_read">
                <div class="review-admin-header">
                  <img [src]="r.profile_picture||'assets/avatar.png'" class="table-img rounded">
                  <div>
                    <strong>{{r.username || 'Anónimo'}}</strong>
                    <span class="review-type-badge" [class]="'rtype-'+r.type">{{getReviewTypeLabel(r.type)}}</span>
                  </div>
                  <div class="stars" *ngIf="r.rating">
                    <i *ngFor="let s of getStars(r.rating)" class="fas fa-star" style="color:var(--caramel);font-size:0.85rem"></i>
                  </div>
                  <span class="review-date">{{r.created_at | date:'dd/MM/yy HH:mm'}}</span>
                </div>
                <p class="review-admin-comment">{{r.comment}}</p>
                <div class="review-admin-actions">
                  <button *ngIf="!r.is_read" class="btn btn-secondary btn-sm" (click)="markSiteReviewRead(r.id)"><i class="fas fa-check"></i> Marcar leído</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteSiteReview(r.id)"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <div *ngIf="siteReviews().length===0" class="empty-admin"><span>⭐</span><p>No hay reseñas aún.</p></div>
            </div>
          </div>

        </div><!-- end admin-content -->
      </div><!-- end admin-layout -->

      <!-- ═══ MODALS ═══ -->

      <!-- Product Form -->
      <div *ngIf="showProductForm()" class="overlay">
        <div class="modal">
          <button class="close-btn" (click)="showProductForm.set(false)"><i class="fas fa-times"></i></button>
          <h3>{{editingProduct() ? 'Editar' : 'Nuevo'}} Producto</h3>
          <div class="form-group"><label>Nombre *</label><input type="text" [(ngModel)]="productForm.name" class="form-control"></div>
          <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="productForm.description" class="form-control" rows="3"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Precio *</label><input type="number" [(ngModel)]="productForm.price" class="form-control"></div>
            <div class="form-group"><label>Stock</label><input type="number" [(ngModel)]="productForm.stock" class="form-control"></div>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select [(ngModel)]="productForm.category_id" class="form-control">
              <option value="">Sin categoría</option>
              <option *ngFor="let c of categories()" [value]="c.id">{{c.name}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Imagen</label>
            <input type="file" accept="image/*" (change)="onProductImageChange($event)" class="file-input">
            <div class="product-imgs-preview">
              <img *ngFor="let img of productForm.images" [src]="img" class="product-img-thumb">
            </div>
            <div *ngIf="uploadingImg()" style="font-size:0.85rem;color:var(--text-light)"><i class="fas fa-spinner fa-spin"></i> Subiendo...</div>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="productForm.is_featured"> Producto destacado ⭐</label>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary btn-sm" (click)="showProductForm.set(false)">Cancelar</button>
            <button class="btn btn-primary btn-sm" (click)="saveProduct()" [disabled]="savingProduct()">{{savingProduct() ? 'Guardando...' : (editingProduct() ? 'Actualizar' : 'Crear')}}</button>
          </div>
        </div>
      </div>

      <!-- Slide Form -->
      <div *ngIf="showSlideForm()" class="overlay">
        <div class="modal">
          <button class="close-btn" (click)="showSlideForm.set(false)"><i class="fas fa-times"></i></button>
          <h3>{{editingSlide() ? 'Editar' : 'Nuevo'}} Slide</h3>
          <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="slideForm.title" class="form-control"></div>
          <div class="form-group"><label>Subtítulo / Tag</label><input type="text" [(ngModel)]="slideForm.subtitle" class="form-control" placeholder="✨ Artesanal & Fresco"></div>
          <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="slideForm.description" class="form-control" rows="2"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Texto del botón</label><input type="text" [(ngModel)]="slideForm.button_text" class="form-control"></div>
            <div class="form-group"><label>URL del botón</label><input type="text" [(ngModel)]="slideForm.button_url" class="form-control" placeholder="/products"></div>
          </div>
          <div class="form-group">
            <label>Imagen de fondo (Cloudinary)</label>
            <input type="file" accept="image/*" (change)="onSlideImageChange($event)" class="file-input">
            <img *ngIf="slideForm.image_url" [src]="slideForm.image_url" class="slide-preview-img">
            <div *ngIf="uploadingImg()" style="font-size:0.85rem;color:var(--text-light)"><i class="fas fa-spinner fa-spin"></i> Subiendo...</div>
          </div>
          <div class="form-group"><label>Gradiente de fondo (CSS)</label><input type="text" [(ngModel)]="slideForm.bg_gradient" class="form-control" placeholder="linear-gradient(135deg, #F5E6D3 60%, #E8C99A)"></div>
          <div class="form-row">
            <div class="form-group"><label>Orden</label><input type="number" [(ngModel)]="slideForm.order_index" class="form-control" min="0"></div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:28px"><input type="checkbox" [(ngModel)]="slideForm.is_active"> Activo</label></div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-secondary btn-sm" (click)="showSlideForm.set(false)">Cancelar</button>
            <button class="btn btn-primary btn-sm" (click)="saveSlide()">{{editingSlide() ? 'Actualizar' : 'Crear'}}</button>
          </div>
        </div>
      </div>

      <!-- Page Form -->
      <div *ngIf="showPageForm()" class="overlay">
        <div class="modal modal-lg">
          <button class="close-btn" (click)="showPageForm.set(false)"><i class="fas fa-times"></i></button>
          <h3>{{editingPage() ? 'Editar' : 'Nueva'}} Página</h3>
          <div class="form-row">
            <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="pageForm.title" class="form-control"></div>
            <div class="form-group"><label>Slug *</label><input type="text" [(ngModel)]="pageForm.slug" class="form-control" placeholder="mi-pagina"></div>
          </div>
          <div class="form-row">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="pageForm.is_active"> Activa</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" [(ngModel)]="pageForm.show_in_nav"> Mostrar en navbar</label>
          </div>
          <h4 style="margin:20px 0 12px;color:var(--mocca-bean)">Secciones</h4>
          <div *ngFor="let sec of pageForm.sections; let i=index" class="section-edit-block">
            <div class="form-row">
              <div class="form-group">
                <label>Tipo de sección</label>
                <select [(ngModel)]="sec.type" class="form-control">
                  <option value="text">Texto</option>
                  <option value="banner">Banner con imagen</option>
                  <option value="products">Enlace a productos</option>
                </select>
              </div>
              <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="sec.title" class="form-control"></div>
            </div>
            <div class="form-group" *ngIf="sec.type!=='products'"><label>Contenido / Descripción</label><textarea [(ngModel)]="sec.content || sec.description" class="form-control" rows="2"></textarea></div>
            <div class="form-row" *ngIf="sec.type==='banner'">
              <div class="form-group"><label>URL Imagen</label><input type="text" [(ngModel)]="sec.image" class="form-control"></div>
              <div class="form-group"><label>Texto botón</label><input type="text" [(ngModel)]="sec.button_text" class="form-control"></div>
              <div class="form-group"><label>URL botón</label><input type="text" [(ngModel)]="sec.button_url" class="form-control"></div>
            </div>
            <button class="btn btn-danger btn-sm" (click)="removePageSection(i)"><i class="fas fa-trash"></i> Eliminar sección</button>
            <hr style="margin:12px 0;border-color:var(--almond)">
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
            <button class="btn btn-secondary btn-sm" (click)="addPageSection('text')"><i class="fas fa-plus"></i> + Texto</button>
            <button class="btn btn-secondary btn-sm" (click)="addPageSection('banner')"><i class="fas fa-plus"></i> + Banner</button>
            <button class="btn btn-secondary btn-sm" (click)="addPageSection('products')"><i class="fas fa-plus"></i> + Productos</button>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-secondary btn-sm" (click)="showPageForm.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="savePage()">{{editingPage() ? 'Actualizar' : 'Crear página'}}</button>
          </div>
        </div>
      </div>

      <!-- User Profile Modal -->
      <div *ngIf="viewingUser()" class="overlay">
        <div class="modal">
          <button class="close-btn" (click)="viewingUser.set(null)"><i class="fas fa-times"></i></button>
          <div class="user-profile-view">
            <img [src]="viewingUser()!.profile_picture||'assets/avatar.png'" class="user-profile-avatar">
            <h3>{{viewingUser()!.full_name || viewingUser()!.username}}</h3>
            <span class="role-label" [class.admin-role]="viewingUser()!.role==='admin'">{{viewingUser()!.role}}</span>
            <div class="profile-info-grid">
              <div class="info-item"><i class="fas fa-user"></i> {{viewingUser()!.username}}</div>
              <div class="info-item"><i class="fas fa-envelope"></i> {{viewingUser()!.email}}</div>
              <div class="info-item" *ngIf="viewingUser()!.phone"><i class="fas fa-phone"></i> {{viewingUser()!.phone}}</div>
              <div class="info-item" *ngIf="viewingUser()!.ambiente_number"><i class="fas fa-door-open"></i> Ambiente {{viewingUser()!.ambiente_number}}</div>
              <div class="info-item" *ngIf="viewingUser()!.schedule"><i class="fas fa-clock"></i> Jornada {{viewingUser()!.schedule}}</div>
              <div class="info-item"><i class="fas fa-calendar"></i> {{viewingUser()!.created_at | date:'dd/MM/yyyy'}}</div>
            </div>
            <button class="btn btn-primary" style="margin-top:16px" (click)="openChatWithUser(viewingUser()!); viewingUser.set(null)">
              <i class="fas fa-comment"></i> Enviar mensaje
            </button>
          </div>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div *ngIf="viewingOrder()" class="overlay">
        <div class="modal modal-lg">
          <button class="close-btn" (click)="viewingOrder.set(null)"><i class="fas fa-times"></i></button>
          <h3>Detalle del Pedido</h3>
          <div class="order-detail-grid">
            <div class="order-detail-client">
              <h4>Cliente</h4>
              <div class="client-info-card">
                <img [src]="viewingOrder()!.profile_picture||'assets/avatar.png'" class="client-avatar">
                <div>
                  <strong>{{viewingOrder()!.full_name || viewingOrder()!.username}}</strong>
                  <p>{{viewingOrder()!.email}}</p>
                  <p *ngIf="viewingOrder()!.phone"><i class="fas fa-phone"></i> {{viewingOrder()!.phone}}</p>
                  <p *ngIf="viewingOrder()!.ambiente_number"><i class="fas fa-door-open"></i> Ambiente {{viewingOrder()!.ambiente_number}}</p>
                  <p *ngIf="viewingOrder()!.schedule"><i class="fas fa-clock"></i> Jornada {{viewingOrder()!.schedule}}</p>
                </div>
              </div>
              <button class="btn btn-primary btn-sm mt-md" (click)="messageUser(viewingOrder()!); viewingOrder.set(null)">
                <i class="fas fa-comment"></i> Enviar mensaje
              </button>
            </div>
            <div class="order-detail-items">
              <h4>Productos</h4>
              <div *ngFor="let item of viewingOrder()!.items" class="detail-item">
                <img [src]="item.images?.[0]||'assets/cookie-placeholder.png'" class="detail-item-img">
                <div>
                  <strong>{{item.name}}</strong>
                  <p>x{{item.quantity}} — $ {{item.unit_price | number:'1.0-0'}}</p>
                </div>
                <span>$ {{item.unit_price * item.quantity | number:'1.0-0'}}</span>
              </div>
              <div class="detail-total">
                <strong>Total: $ {{viewingOrder()!.total | number:'1.0-0'}}</strong>
                <span>{{viewingOrder()!.payment_method}}</span>
                <span>{{viewingOrder()!.created_at | date:'dd/MM/yyyy HH:mm'}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-page { background: var(--almond-light); min-height: 100vh; }
    .admin-header { background: linear-gradient(135deg, var(--mocca-bean), var(--caramel-roast)); color: #fff; padding: 50px 0 30px; }
    .admin-header h1 { color: #fff; margin-bottom: 6px; }
    .admin-header p { opacity: 0.75; }
    .admin-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; padding-top: 32px; padding-bottom: 48px; }
    .admin-sidebar { background: #fff; border-radius: var(--radius-lg); padding: 16px; height: fit-content; box-shadow: var(--shadow-sm); position: sticky; top: 90px; }
    .sidebar-group-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-light); letter-spacing: 1px; padding: 12px 8px 4px; }
    .tab-btn { width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: var(--text-mid); border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px; transition: all var(--transition); text-align: left; margin-bottom: 2px; }
    .tab-btn:hover { background: var(--almond-light); color: var(--warm-capuchino); }
    .tab-btn.active { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .admin-content { background: #fff; border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm); }
    .content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .content-header h2 { color: var(--mocca-bean); }
    .order-view-tabs { display: flex; gap: 8px; }
    .tab-pill { padding: 6px 16px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.82rem; font-weight: 600; color: var(--text-mid); transition: all var(--transition); }
    .tab-pill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    .admin-table-wrap { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .admin-table th { background: var(--almond-light); padding: 11px 12px; text-align: left; font-weight: 700; color: var(--text-mid); font-size: 0.78rem; text-transform: uppercase; }
    .admin-table td { padding: 11px 12px; border-bottom: 1px solid var(--almond-light); vertical-align: middle; }
    .table-img { width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; }
    .table-img.rounded { border-radius: 50%; }
    .stock-badge { padding: 2px 8px; border-radius: var(--radius-full); background: var(--success); color: #fff; font-size: 0.76rem; font-weight: 700; }
    .stock-badge.low-stock { background: var(--error); }
    .featured-toggle { cursor: pointer; font-size: 1.2rem; }
    .featured-toggle.on { filter: drop-shadow(0 0 4px gold); }
    .action-btns { display: flex; gap: 5px; flex-wrap: wrap; }
    .action-btn { width: 30px; height: 30px; border: none; cursor: pointer; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.82rem; transition: all var(--transition); }
    .action-btn.edit { background: #e8f0fe; color: #1967d2; }
    .action-btn.edit:hover { background: #1967d2; color: #fff; }
    .action-btn.delete { background: #fde8e8; color: var(--error); }
    .action-btn.delete:hover { background: var(--error); color: #fff; }
    .status-select { padding: 5px 8px; border: 1px solid var(--almond); border-radius: var(--radius-sm); font-size: 0.78rem; }
    .status-badge { padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.73rem; font-weight: 700; }
    .status-pending    { background: #fff3e0; color: #f57c00; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-completed  { background: #e8f5e9; color: #388e3c; }
    .status-cancelled  { background: #fde8e8; color: var(--error); }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .block-text { display: block; font-size: 0.75rem; color: var(--text-light); }
    .info-mini { display: flex; flex-direction: column; gap: 2px; font-size: 0.75rem; color: var(--text-light); }
    .info-mini i { color: var(--warm-capuchino); margin-right: 3px; }
    .role-label { font-size: 0.7rem; color: var(--text-light); }
    .admin-role { color: var(--warm-capuchino); font-weight: 700; }
    .mono { font-family: monospace; font-size: 0.76rem; }
    /* Chat */
    .admin-chat .chat-layout { display: grid; grid-template-columns: 240px 1fr; gap: 16px; height: 480px; }
    .conv-list { border: 1px solid var(--almond); border-radius: var(--radius-md); overflow-y: auto; }
    .conv-item { display: flex; align-items: center; gap: 8px; padding: 12px; cursor: pointer; transition: background var(--transition); border-bottom: 1px solid var(--almond-light); position: relative; }
    .conv-item:hover, .conv-item.active { background: var(--almond-light); }
    .conv-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .conv-avatar-sm { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .conv-info { flex: 1; overflow: hidden; }
    .conv-info strong { font-size: 0.85rem; color: var(--text-dark); display: block; }
    .conv-last { font-size: 0.72rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .unread-badge { background: var(--warm-capuchino); color: #fff; border-radius: 50%; width: 18px; height: 18px; font-size: 0.68rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .no-convs { text-align: center; padding: 32px 12px; color: var(--text-light); font-size: 0.82rem; }
    .no-convs span { font-size: 1.8rem; display: block; margin-bottom: 6px; }
    .admin-chat-window { border: 1px solid var(--almond); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden; }
    .admin-chat-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--almond-light); border-bottom: 1px solid var(--almond); }
    .admin-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 7px; background: #f8f4f0; }
    .admin-chat-input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--almond); }
    .msg-row { display: flex; max-width: 80%; }
    .msg-mine { align-self: flex-end; }
    .msg-theirs { align-self: flex-start; }
    .msg-bubble { padding: 8px 12px; border-radius: 15px; font-size: 0.83rem; line-height: 1.5; }
    .msg-mine .msg-bubble { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; border-bottom-right-radius: 3px; }
    .msg-theirs .msg-bubble { background: #fff; color: var(--text-dark); border-bottom-left-radius: 3px; box-shadow: var(--shadow-sm); }
    .msg-time { display: block; font-size: 0.6rem; opacity: 0.6; text-align: right; margin-top: 2px; }
    .no-chat-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-light); border: 1px solid var(--almond); border-radius: var(--radius-md); }
    .no-chat-selected span { font-size: 2rem; }
    /* Carousel */
    .slides-list { display: flex; flex-direction: column; gap: 16px; }
    .slide-admin-card { display: flex; align-items: center; gap: 16px; padding: 16px; }
    .slide-preview { width: 100px; height: 70px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .slide-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .slide-emoji-sm { font-size: 2rem; }
    .slide-info { flex: 1; }
    .slide-info h4 { color: var(--mocca-bean); margin-bottom: 2px; }
    .slide-info p { font-size: 0.82rem; color: var(--text-light); }
    .slide-order { font-size: 0.75rem; background: var(--almond-light); padding: 2px 8px; border-radius: var(--radius-full); margin-right: 6px; }
    .slide-status { font-size: 0.73rem; padding: 2px 8px; border-radius: var(--radius-full); background: #fde8e8; color: var(--error); font-weight: 700; }
    .slide-status.active { background: #e8f5e9; color: #388e3c; }
    .slide-preview-img { width: 100%; max-height: 120px; object-fit: cover; border-radius: var(--radius-md); margin-top: 8px; }
    /* Why us editor */
    .why-item-edit { margin-bottom: 8px; }
    /* Settings forms */
    .settings-form .form-group { margin-bottom: 16px; }
    .link-edit-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .link-edit-row .form-control { flex: 1; min-width: 100px; }
    /* Pages */
    .section-edit-block { background: var(--almond-light); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px; }
    /* Site reviews */
    .reviews-admin-list { display: flex; flex-direction: column; gap: 16px; }
    .review-admin-card { padding: 20px; }
    .unread-card { border-left: 4px solid var(--warm-capuchino); }
    .review-admin-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .review-type-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
    .rtype-review     { background: #e3f2fd; color: #1976d2; }
    .rtype-complaint  { background: #fde8e8; color: var(--error); }
    .rtype-suggestion { background: #e8f5e9; color: #388e3c; }
    .review-date { font-size: 0.75rem; color: var(--text-light); margin-left: auto; }
    .review-admin-comment { font-size: 0.9rem; color: var(--text-mid); line-height: 1.6; margin-bottom: 12px; }
    .review-admin-actions { display: flex; gap: 8px; }
    /* User profile modal */
    .user-profile-view { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .user-profile-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid var(--almond); }
    .profile-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 12px; text-align: left; }
    .info-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--almond-light); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-mid); }
    .info-item i { color: var(--warm-capuchino); width: 14px; }
    /* Order detail */
    .order-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .client-info-card { display: flex; gap: 14px; align-items: flex-start; padding: 16px; background: var(--almond-light); border-radius: var(--radius-lg); margin-top: 10px; }
    .client-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .client-info-card p { font-size: 0.83rem; color: var(--text-mid); margin: 2px 0; }
    .detail-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--almond-light); }
    .detail-item-img { width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; }
    .detail-item strong { display: block; font-size: 0.88rem; }
    .detail-item p { font-size: 0.78rem; color: var(--text-light); }
    .detail-item span { margin-left: auto; font-weight: 700; color: var(--warm-capuchino); }
    .detail-total { display: flex; align-items: center; gap: 16px; padding: 14px 0; flex-wrap: wrap; }
    .detail-total strong { color: var(--warm-capuchino); font-size: 1.1rem; font-family: var(--font-display); }
    .detail-total span { font-size: 0.82rem; color: var(--text-light); }
    /* Modals */
    .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-light); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .categories-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .cat-chip { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--almond-light); border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; color: var(--text-mid); }
    .del-cat { background: none; border: none; cursor: pointer; color: var(--error); font-size: 0.75rem; }
    .file-input { padding: 8px 0; font-size: 0.83rem; width: 100%; }
    .product-imgs-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .product-img-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-sm); border: 2px solid var(--almond); }
    .empty-admin { text-align: center; padding: 48px 20px; color: var(--text-light); }
    .empty-admin span { font-size: 2.5rem; display: block; margin-bottom: 8px; }
    @media (max-width: 900px) {
      .admin-layout { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; display: flex; flex-wrap: wrap; gap: 4px; }
      .tab-btn { width: auto; padding: 8px 12px; font-size: 0.8rem; }
      .admin-chat .chat-layout { grid-template-columns: 1fr; height: auto; }
      .form-row { grid-template-columns: 1fr; }
      .order-detail-grid { grid-template-columns: 1fr; }
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
  carouselSlides = signal<any[]>([]);
  sitePages = signal<any[]>([]);
  siteReviews = signal<any[]>([]);
  showProductForm = signal(false);
  showSlideForm = signal(false);
  showPageForm = signal(false);
  editingProduct = signal<Product | null>(null);
  editingSlide = signal<any>(null);
  editingPage = signal<any>(null);
  viewingUser = signal<User | null>(null);
  viewingOrder = signal<any>(null);
  savingProduct = signal(false);
  uploadingImg = signal(false);
  showCatForm = false;
  adminMsg = '';
  orderView = signal<'active'|'archived'|'deleted'>('active');

  get myId() { return this.auth.currentUser()?.id || ''; }

  productForm: any = { name: '', description: '', price: 0, stock: 0, images: [], is_featured: false };
  slideForm: any = { title: '', subtitle: '', description: '', button_text: 'Ver más', button_url: '/products', image_url: '', bg_gradient: 'linear-gradient(135deg, #F5E6D3 60%, #E8C99A)', order_index: 0, is_active: true };
  pageForm: any = { title: '', slug: '', sections: [], is_active: true, show_in_nav: false };
  newCat = { name: '', slug: '' };
  whyUsData: any = { title: '¿Por qué Star Crumbs?', items: [] };
  navbarData: any = { logo_position: 'left', logo_text: 'Star Crumbs', logo_icon: '🍪', links: [], show_cart: true, show_chat: true, show_notifications: true };
  footerData: any = { brand_text: 'Star Crumbs', brand_icon: '🍪', tagline: '', copyright: '', links: [] };

  tabs = [
    { key: 'products' as Tab, label: 'Productos', icon: 'fas fa-cookie-bite' },
    { key: 'categories' as Tab, label: 'Categorías', icon: 'fas fa-tags' },
    { key: 'carousel' as Tab, label: 'Carrusel', icon: 'fas fa-images' },
    { key: 'orders' as Tab, label: 'Pedidos', icon: 'fas fa-shopping-bag' },
    { key: 'users' as Tab, label: 'Usuarios', icon: 'fas fa-users' },
    { key: 'chat' as Tab, label: 'Chat', icon: 'fas fa-comments' },
    { key: 'why_us' as Tab, label: '¿Por qué nosotros?', icon: 'fas fa-star' },
    { key: 'navbar' as Tab, label: 'Navbar', icon: 'fas fa-bars' },
    { key: 'footer' as Tab, label: 'Footer', icon: 'fas fa-grip-lines' },
    { key: 'pages' as Tab, label: 'Páginas', icon: 'fas fa-file-alt' },
    { key: 'site_reviews' as Tab, label: 'Reseñas del sitio', icon: 'fas fa-comments' }
  ];

  constructor(
    private productService: ProductService,
    private uploadService: UploadService,
    private toast: ToastService,
    public auth: AuthService,
    private chatService: ChatService,
    private http: HttpClient
  ) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.productService.getAll().subscribe(p => this.products.set(p));
    this.loadOrders('active');
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe(u => this.users.set(u));
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c));
    this.chatService.getConversations().subscribe(c => this.conversations.set(c));
    this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s => this.carouselSlides.set(s));
    this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p => this.sitePages.set(p));
    this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r => this.siteReviews.set(r));
    this.http.get<any>(`${environment.apiUrl}/site-settings/why_us`).subscribe(s => { if(s) this.whyUsData = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/navbar`).subscribe(s => { if(s) this.navbarData = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/footer`).subscribe(s => { if(s) this.footerData = JSON.parse(JSON.stringify(s.setting_value)); });
  }

  loadOrders(view: 'active'|'archived'|'deleted') {
    this.orderView.set(view);
    const params = view !== 'active' ? `?${view}=true` : '';
    this.http.get<Order[]>(`${environment.apiUrl}/orders${params}`).subscribe(o => this.orders.set(o));
  }

  // Product CRUD
  openProductForm() { this.editingProduct.set(null); this.productForm = { name: '', description: '', price: 0, stock: 0, images: [], is_featured: false }; this.showProductForm.set(true); }
  editProduct(p: Product) { this.editingProduct.set(p); this.productForm = { ...p, images: p.images || [] }; this.showProductForm.set(true); }
  async onProductImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImg.set(true);
    const base64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(base64, 'star-crumbs/products').subscribe({
      next: res => { this.productForm.images = [...(this.productForm.images || []), res.url]; this.uploadingImg.set(false); },
      error: () => { this.uploadingImg.set(false); this.toast.error('Error al subir imagen'); }
    });
  }
  saveProduct() {
    if (!this.productForm.name) { this.toast.error('El nombre es requerido'); return; }
    this.savingProduct.set(true);
    const obs = this.editingProduct() ? this.productService.update(this.editingProduct()!.id, this.productForm) : this.productService.create(this.productForm);
    obs.subscribe({
      next: () => { this.savingProduct.set(false); this.showProductForm.set(false); this.toast.success('Producto guardado ✅'); this.productService.getAll().subscribe(p => this.products.set(p)); },
      error: () => { this.savingProduct.set(false); this.toast.error('Error al guardar'); }
    });
  }
  deleteProduct(id: string) { if (!confirm('¿Eliminar?')) return; this.productService.delete(id).subscribe({ next: () => { this.toast.success('Eliminado'); this.productService.getAll().subscribe(p => this.products.set(p)); } }); }
  toggleFeatured(p: Product) { this.productService.update(p.id, { is_featured: !p.is_featured }).subscribe({ next: () => this.productService.getAll().subscribe(pr => this.products.set(pr)) }); }

  // Categories
  createCategory() {
    if (!this.newCat.name || !this.newCat.slug) { this.toast.error('Nombre y slug requeridos'); return; }
    this.http.post<Category>(`${environment.apiUrl}/categories`, this.newCat).subscribe({ next: () => { this.toast.success('Creada'); this.newCat = { name:'', slug:'' }; this.showCatForm = false; this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c)); } });
  }
  deleteCategory(id: string) { this.http.delete(`${environment.apiUrl}/categories/${id}`).subscribe({ next: () => this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c)) }); }

  // Orders
  updateOrderStatus(id: string, status: string) { this.http.put(`${environment.apiUrl}/orders/${id}/status`, { status }).subscribe({ next: () => this.toast.success('Estado actualizado') }); }
  archiveOrder(id: string) { this.http.put(`${environment.apiUrl}/orders/${id}/archive`, {}).subscribe({ next: () => { this.toast.success('Archivado'); this.loadOrders('active'); } }); }
  restoreOrder(id: string) { this.http.put(`${environment.apiUrl}/orders/${id}/restore`, {}).subscribe({ next: () => { this.toast.success('Restaurado'); this.loadOrders(this.orderView()); } }); }
  softDeleteOrder(id: string) { if (!confirm('¿Eliminar este pedido?')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/admin`).subscribe({ next: () => { this.toast.success('Eliminado'); this.loadOrders('active'); } }); }
  permanentDeleteOrder(id: string) { if (!confirm('¿Eliminar permanentemente? No se puede deshacer.')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/permanent`).subscribe({ next: () => { this.toast.success('Eliminado permanentemente'); this.loadOrders('deleted'); } }); }
  viewOrderDetail(o: any) { this.viewingOrder.set(o); }
  viewUserProfile(u: User) { this.viewingUser.set(u); }
  messageUser(o: any) { const user = this.users().find(u => u.id === o.user_id); if (user) { this.openChatWithUser(user as any); this.activeTab.set('chat'); } }

  // Chat
  openConversation(conv: any) { this.selectedConv.set(conv); this.chatService.loadHistory(conv.id).subscribe(msgs => this.adminMessages.set(msgs)); this.chatService.markRead(conv.id).subscribe(); }
  openChatWithUser(u: any) { this.selectedConv.set(u); this.chatService.loadHistory(u.id).subscribe(msgs => this.adminMessages.set(msgs)); this.activeTab.set('chat'); }
  sendAdminMsg() {
    const text = this.adminMsg.trim();
    if (!text || !this.selectedConv()) return;
    this.adminMessages.update((m: ChatMessage[]) => [...m, { sender_id: this.myId, message: text, created_at: new Date().toISOString() }]);
    this.adminMsg = '';
    this.chatService.sendMessage({ receiverId: this.selectedConv().id, message: text, senderId: this.myId, senderName: this.auth.currentUser()?.username || 'Admin' });
  }

  // Carousel
  openSlideForm() { this.editingSlide.set(null); this.slideForm = { title: '', subtitle: '', description: '', button_text: 'Ver más', button_url: '/products', image_url: '', bg_gradient: 'linear-gradient(135deg, #F5E6D3 60%, #E8C99A)', order_index: this.carouselSlides().length, is_active: true }; this.showSlideForm.set(true); }
  editSlide(s: any) { this.editingSlide.set(s); this.slideForm = { ...s }; this.showSlideForm.set(true); }
  async onSlideImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImg.set(true);
    const base64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(base64, 'star-crumbs/carousel').subscribe({
      next: res => { this.slideForm.image_url = res.url; this.uploadingImg.set(false); },
      error: () => { this.uploadingImg.set(false); this.toast.error('Error al subir'); }
    });
  }
  saveSlide() {
    const obs = this.editingSlide()
      ? this.http.put(`${environment.apiUrl}/carousel/${this.editingSlide().id}`, this.slideForm)
      : this.http.post(`${environment.apiUrl}/carousel`, this.slideForm);
    obs.subscribe({ next: () => { this.toast.success('Slide guardado ✅'); this.showSlideForm.set(false); this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s => this.carouselSlides.set(s)); } });
  }
  deleteSlide(id: string) { if (!confirm('¿Eliminar slide?')) return; this.http.delete(`${environment.apiUrl}/carousel/${id}`).subscribe({ next: () => { this.toast.success('Eliminado'); this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s => this.carouselSlides.set(s)); } }); }

  // Why Us
  addWhyItem() { this.whyUsData.items.push({ icon: '🍪', title: 'Nuevo item', desc: 'Descripción', image: '' }); }
  removeWhyItem(i: number) { this.whyUsData.items.splice(i, 1); }
  saveWhyUs() { this.http.put(`${environment.apiUrl}/site-settings/why_us`, { setting_value: this.whyUsData }).subscribe({ next: () => this.toast.success('Sección guardada ✅'), error: () => this.toast.error('Error al guardar') }); }

  // Navbar
  addNavLink() { this.navbarData.links.push({ label: 'Nuevo link', url: '/', exact: false }); }
  removeNavLink(i: number) { this.navbarData.links.splice(i, 1); }
  saveNavbar() { this.http.put(`${environment.apiUrl}/site-settings/navbar`, { setting_value: this.navbarData }).subscribe({ next: () => this.toast.success('Navbar guardado ✅'), error: () => this.toast.error('Error al guardar') }); }

  // Footer
  addFooterLink() { this.footerData.links.push({ label: 'Nuevo link', url: '/', icon: '', external: false }); }
  removeFooterLink(i: number) { this.footerData.links.splice(i, 1); }
  saveFooter() { this.http.put(`${environment.apiUrl}/site-settings/footer`, { setting_value: this.footerData }).subscribe({ next: () => this.toast.success('Footer guardado ✅'), error: () => this.toast.error('Error al guardar') }); }

  // Pages
  openPageForm() { this.editingPage.set(null); this.pageForm = { title: '', slug: '', sections: [], is_active: true, show_in_nav: false }; this.showPageForm.set(true); }
  editPage(pg: any) { this.editingPage.set(pg); this.pageForm = JSON.parse(JSON.stringify(pg)); this.showPageForm.set(true); }
  addPageSection(type: string) { this.pageForm.sections.push({ type, title: '', content: '', description: '', image: '', button_text: '', button_url: '' }); }
  removePageSection(i: number) { this.pageForm.sections.splice(i, 1); }
  savePage() {
    const obs = this.editingPage()
      ? this.http.put(`${environment.apiUrl}/site-pages/${this.editingPage().id}`, this.pageForm)
      : this.http.post(`${environment.apiUrl}/site-pages`, this.pageForm);
    obs.subscribe({ next: () => { this.toast.success('Página guardada ✅'); this.showPageForm.set(false); this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p => this.sitePages.set(p)); } });
  }
  deletePage(id: string) { if (!confirm('¿Eliminar página?')) return; this.http.delete(`${environment.apiUrl}/site-pages/${id}`).subscribe({ next: () => { this.toast.success('Eliminada'); this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p => this.sitePages.set(p)); } }); }

  // Site Reviews
  markSiteReviewRead(id: string) { this.http.put(`${environment.apiUrl}/site-reviews/${id}/read`, {}).subscribe({ next: () => this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r => this.siteReviews.set(r)) }); }
  deleteSiteReview(id: string) { this.http.delete(`${environment.apiUrl}/site-reviews/${id}`).subscribe({ next: () => { this.toast.success('Eliminada'); this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r => this.siteReviews.set(r)); } }); }
  getReviewTypeLabel(t: string) { const m: any = { review: '⭐ Reseña', complaint: '😠 Queja', suggestion: '💡 Sugerencia' }; return m[t] || t; }

  formatTime(val: any) { if (!val) return ''; return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  getStars(n: number) { return Array(n).fill(0); }
}
