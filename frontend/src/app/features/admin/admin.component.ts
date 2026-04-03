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
    <!-- Sidebar toggle (mobile) -->
    <button class="sidebar-toggle" (click)="sidebarOpen=!sidebarOpen">
      <i class="fas fa-bars"></i> Menú
    </button>

    <!-- Sidebar -->
    <div class="admin-sidebar" [class.open]="sidebarOpen">
      <p class="slabel">Tienda</p>
      <button *ngFor="let t of tabs.slice(0,3)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i> {{t.label}}
      </button>
      <p class="slabel">Gestión</p>
      <button *ngFor="let t of tabs.slice(3,6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i> {{t.label}}
      </button>
      <p class="slabel">Personalización</p>
      <button *ngFor="let t of tabs.slice(6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
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
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Img</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>⭐</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of products()">
                <td><img [src]="p.images[0]||'assets/cookie-placeholder.png'" class="table-img"></td>
                <td class="td-name">{{p.name}}</td>
                <td>$ {{p.price | number:'1.0-0'}}</td>
                <td><span class="stock-badge" [class.low-stock]="p.stock < 5">{{p.stock}}</span></td>
                <td><span class="feat-toggle" [class.on]="p.is_featured" (click)="toggleFeatured(p)">{{p.is_featured?'⭐':'☆'}}</span></td>
                <td class="action-btns">
                  <button class="abtn edit" (click)="editProduct(p)" title="Editar"><i class="fas fa-edit"></i></button>
                  <button class="abtn del" (click)="deleteProduct(p.id)" title="Eliminar"><i class="fas fa-trash"></i></button>
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
        <div *ngIf="showCatForm" class="card" style="padding:18px;margin-bottom:18px">
          <div class="form-row-2">
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
          <div class="view-tabs">
            <button class="vpill" [class.active]="orderView()==='active'" (click)="loadOrders('active')">Activos</button>
            <button class="vpill" [class.active]="orderView()==='archived'" (click)="loadOrders('archived')">Archivados</button>
            <button class="vpill" [class.active]="orderView()==='deleted'" (click)="loadOrders('deleted')">Eliminados</button>
          </div>
        </div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders()">
                <td class="mono">{{o.id | slice:0:7}}…</td>
                <td>
                  <div class="user-cell">
                    <img [src]="o.profile_picture||'assets/avatar.png'" class="table-img rounded">
                    <div>
                      <strong style="font-size:0.85rem">{{o.username||'—'}}</strong>
                      <small *ngIf="o.full_name" class="block-txt">{{o.full_name}}</small>
                      <small *ngIf="o.phone" class="block-txt"><i class="fas fa-phone" style="font-size:0.65rem;color:var(--warm-capuchino)"></i> {{o.phone}}</small>
                    </div>
                  </div>
                </td>
                <td class="td-products">
                  <div *ngFor="let item of (o.items||[])" class="mini-product">
                    <img [src]="(item.images&&item.images[0])||'assets/cookie-placeholder.png'" class="mini-img">
                    <span>{{item.name}} ×{{item.quantity}}</span>
                  </div>
                </td>
                <td><strong>$ {{o.total | number:'1.0-0'}}</strong></td>
                <td>{{o.payment_method}}</td>
                <td>
                  <select *ngIf="orderView()==='active'" class="status-sel" [value]="o.status" (change)="updateOrderStatus(o.id, $any($event.target).value)">
                    <option value="pending">⏳ Pendiente</option>
                    <option value="processing">🔄 En proceso</option>
                    <option value="completed">✅ Completado</option>
                    <option value="cancelled">❌ Cancelado</option>
                  </select>
                  <span *ngIf="orderView()!=='active'" class="status-badge" [class]="'status-'+o.status">{{o.status}}</span>
                </td>
                <td>{{o.created_at | date:'dd/MM/yy'}}</td>
                <td class="action-btns">
                  <button class="abtn edit" (click)="viewOrderDetail(o)" title="Ver detalle"><i class="fas fa-eye"></i></button>
                  <button *ngIf="orderView()==='active'" class="abtn" style="background:#fff3e0;color:#f57c00" (click)="archiveOrder(o.id)" title="Archivar"><i class="fas fa-archive"></i></button>
                  <button *ngIf="orderView()==='active'" class="abtn del" (click)="softDeleteOrder(o.id)" title="Eliminar"><i class="fas fa-trash"></i></button>
                  <button *ngIf="orderView()!=='active'" class="abtn edit" (click)="restoreOrder(o.id)" title="Restaurar"><i class="fas fa-undo"></i></button>
                  <button *ngIf="orderView()==='deleted'" class="abtn del" (click)="permanentDeleteOrder(o.id)" title="Eliminar definitivo"><i class="fas fa-times"></i></button>
                  <button class="abtn" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(o)" title="Mensaje"><i class="fas fa-comment"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── USERS ─── -->
      <div *ngIf="activeTab()==='users'">
        <div class="content-header"><h2>Usuarios</h2></div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Avatar</th><th>Usuario</th><th>Email</th><th>Jornada</th><th>Amb.</th><th>Registro</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td><img [src]="u.profile_picture||'assets/avatar.png'" class="table-img rounded"></td>
                <td><strong>{{u.username}}</strong><br><small class="role-lbl" [class.admin-role]="u.role==='admin'">{{u.role}}</small></td>
                <td class="td-email">{{u.email}}</td>
                <td>{{u.schedule||'—'}}</td>
                <td>{{u.ambiente_number||'—'}}</td>
                <td>{{u.created_at | date:'dd/MM/yy'}}</td>
                <td class="action-btns">
                  <button class="abtn edit" (click)="viewUserProfile(u)" title="Ver perfil"><i class="fas fa-eye"></i></button>
                  <button class="abtn" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(u)" title="Mensaje"><i class="fas fa-comment"></i></button>
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
              <img [src]="c.profile_picture||'assets/avatar.png'" class="conv-av">
              <div class="conv-info"><strong>{{c.username}}</strong><p>{{c.last_message | slice:0:28}}…</p></div>
              <span *ngIf="c.unread_count > 0" class="unread-dot">{{c.unread_count}}</span>
            </div>
            <div *ngIf="!conversations().length" class="no-conv"><span>💬</span><p>Sin conversaciones</p></div>
          </div>
          <div class="admin-chat-win" *ngIf="selectedConv()">
            <div class="achat-header">
              <img [src]="selectedConv()?.profile_picture||'assets/avatar.png'" class="conv-av-sm">
              <strong>{{selectedConv()?.username}}</strong>
            </div>
            <div class="achat-msgs">
              <div *ngFor="let m of adminMessages()" class="msg-row" [class.msg-mine]="m.sender_id===myId" [class.msg-theirs]="m.sender_id!==myId">
                <div class="mbubble">{{m.message}}<span class="mtime">{{formatTime(m.created_at)}}</span></div>
              </div>
            </div>
            <div class="achat-input">
              <input type="text" [(ngModel)]="adminMsg" (keydown.enter)="sendAdminMsg()" placeholder="Escribe respuesta..." class="form-control">
              <button class="btn btn-primary btn-sm" (click)="sendAdminMsg()"><i class="fas fa-paper-plane"></i></button>
            </div>
          </div>
          <div *ngIf="!selectedConv()" class="no-chat-sel"><span>💬</span><p>Selecciona conversación</p></div>
        </div>
      </div>

      <!-- ─── CAROUSEL ─── -->
      <div *ngIf="activeTab()==='carousel'">
        <div class="content-header">
          <h2>Carrusel</h2>
          <button class="btn btn-primary btn-sm" (click)="openSlideForm()"><i class="fas fa-plus"></i> Nuevo slide</button>
        </div>
        <div class="slides-list">
          <div *ngFor="let s of carouselSlides()" class="slide-adm-card card">
            <div class="slide-preview" [style]="getSlidePreviewStyle(s)">
              <span *ngIf="s.display_mode==='emoji'||!s.display_mode" style="font-size:2rem">{{s.emoji||'🍪'}}</span>
              <img *ngIf="s.display_mode==='small_image'&&s.image_url" [src]="s.image_url" style="width:60px;height:60px;object-fit:cover;border-radius:8px">
              <span *ngIf="s.display_mode==='bg_image'" style="font-size:0.7rem;color:#fff;font-weight:700">BG IMG</span>
            </div>
            <div class="slide-info">
              <h4>{{s.title}}</h4>
              <p>{{s.subtitle}}</p>
              <div style="display:flex;gap:6px;margin-top:4px">
                <span class="vpill" style="font-size:0.7rem">Orden: {{s.order_index}}</span>
                <span class="slide-st" [class.active]="s.is_active">{{s.is_active?'Activo':'Inactivo'}}</span>
              </div>
            </div>
            <div class="action-btns" style="flex-shrink:0">
              <button class="abtn edit" (click)="editSlide(s)"><i class="fas fa-edit"></i></button>
              <button class="abtn del" (click)="deleteSlide(s.id)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div *ngIf="!carouselSlides().length" class="empty-adm"><span>🎠</span><p>Sin slides</p></div>
        </div>
      </div>

      <!-- ─── WHY US ─── -->
      <div *ngIf="activeTab()==='why_us'">
        <div class="content-header"><h2>Sección "¿Por qué nosotros?"</h2></div>
        <div class="settings-card card">
          <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="whyUsData.title" class="form-control"></div>
          <div *ngFor="let item of whyUsData.items; let i=index" class="why-item-edit">
            <div class="form-row-2">
              <div class="form-group"><label>Emoji</label><input type="text" [(ngModel)]="item.icon" class="form-control" style="font-size:1.3rem;text-align:center"></div>
              <div class="form-group">
                <label>Imagen pequeña (opcional)</label>
                <div class="file-input-wrap">
                  <label class="file-input-label"><i class="fas fa-image"></i> {{item.image ? 'Cambiar imagen' : 'Subir imagen'}}
                    <input type="file" class="file-input-hidden" accept="image/*" (change)="onWhyItemImage($event, i)">
                  </label>
                </div>
                <img *ngIf="item.image" [src]="item.image" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-top:6px">
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="item.title" class="form-control"></div>
              <div class="form-group"><label>Descripción</label><input type="text" [(ngModel)]="item.desc" class="form-control"></div>
            </div>
            <button class="btn btn-danger btn-sm" (click)="removeWhyItem(i)"><i class="fas fa-trash"></i> Eliminar</button>
            <hr class="divider">
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" (click)="addWhyItem()"><i class="fas fa-plus"></i> Agregar item</button>
            <button class="btn btn-primary" (click)="saveWhyUs()"><i class="fas fa-save"></i> Guardar</button>
          </div>
        </div>
      </div>

      <!-- ─── NAVBAR ─── -->
      <div *ngIf="activeTab()==='navbar'">
        <div class="content-header"><h2>Editar Navbar</h2></div>
        <div class="settings-card card">
          <div class="form-row-2">
            <div class="form-group">
              <label>Posición del logo</label>
              <select [(ngModel)]="navbarData.logo_position" class="form-control">
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <div class="form-group"><label>Ícono del logo</label><input type="text" [(ngModel)]="navbarData.logo_icon" class="form-control" style="font-size:1.4rem;text-align:center"></div>
          </div>
          <div class="form-group"><label>Texto del logo</label><input type="text" [(ngModel)]="navbarData.logo_text" class="form-control"></div>
          <div class="checkbox-row">
            <label class="check-lbl"><input type="checkbox" [(ngModel)]="navbarData.show_cart"> Mostrar carrito</label>
            <label class="check-lbl"><input type="checkbox" [(ngModel)]="navbarData.show_chat"> Mostrar chat</label>
            <label class="check-lbl"><input type="checkbox" [(ngModel)]="navbarData.show_notifications"> Mostrar campana</label>
          </div>
          <h4 class="sub-title">Links del navbar</h4>
          <div *ngFor="let link of navbarData.links; let i=index" class="link-edit-row">
            <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta" style="flex:1">
            <select [(ngModel)]="link.url" class="form-control url-select">
              <option value="">Selecciona página</option>
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/orders">📦 Mis Pedidos</option>
              <option value="/cart">🛍️ Carrito</option>
              <option value="/profile">👤 Perfil</option>
              <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
            </select>
            <label class="check-lbl-sm"><input type="checkbox" [(ngModel)]="link.exact"> Exacto</label>
            <button class="abtn del" (click)="removeNavLink(i)"><i class="fas fa-times"></i></button>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" (click)="addNavLink()"><i class="fas fa-plus"></i> Agregar link</button>
            <button class="btn btn-primary" (click)="saveNavbar()"><i class="fas fa-save"></i> Guardar navbar</button>
          </div>
        </div>
      </div>

      <!-- ─── FOOTER ─── -->
      <div *ngIf="activeTab()==='footer'">
        <div class="content-header"><h2>Editar Footer</h2></div>
        <div class="settings-card card">
          <div class="form-row-2">
            <div class="form-group"><label>Ícono</label><input type="text" [(ngModel)]="footerData.brand_icon" class="form-control" style="font-size:1.4rem;text-align:center"></div>
            <div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="footerData.brand_text" class="form-control"></div>
          </div>
          <div class="form-group"><label>Tagline</label><input type="text" [(ngModel)]="footerData.tagline" class="form-control"></div>
          <div class="form-group"><label>Copyright</label><input type="text" [(ngModel)]="footerData.copyright" class="form-control"></div>
          <h4 class="sub-title">Links del footer</h4>
          <div *ngFor="let link of footerData.links; let i=index" class="link-edit-row">
            <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta" style="flex:1">
            <select [(ngModel)]="link.url" class="form-control url-select">
              <option value="">Selecciona página</option>
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/orders">📦 Mis Pedidos</option>
              <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
              <option value="custom">✏️ URL personalizada</option>
            </select>
            <input *ngIf="link.url==='custom'" type="text" [(ngModel)]="link.custom_url" class="form-control" placeholder="https://...">
            <input type="text" [(ngModel)]="link.icon" class="form-control" placeholder="fab fa-whatsapp" style="max-width:160px">
            <label class="check-lbl-sm"><input type="checkbox" [(ngModel)]="link.external"> Externo</label>
            <button class="abtn del" (click)="removeFooterLink(i)"><i class="fas fa-times"></i></button>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" (click)="addFooterLink()"><i class="fas fa-plus"></i> Agregar link</button>
            <button class="btn btn-primary" (click)="saveFooter()"><i class="fas fa-save"></i> Guardar footer</button>
          </div>
        </div>
      </div>

      <!-- ─── PAGES ─── -->
      <div *ngIf="activeTab()==='pages'">
        <div class="content-header">
          <h2>Páginas</h2>
          <button class="btn btn-primary btn-sm" (click)="openPageForm()"><i class="fas fa-plus"></i> Nueva página</button>
        </div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Título</th><th>URL</th><th>Estado</th><th>En nav</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let pg of sitePages()">
                <td><strong>{{pg.title}}</strong></td>
                <td class="mono">/page/{{pg.slug}}</td>
                <td><span class="slide-st" [class.active]="pg.is_active">{{pg.is_active?'Activa':'Inactiva'}}</span></td>
                <td><span class="slide-st" [class.active]="pg.show_in_nav">{{pg.show_in_nav?'Sí':'No'}}</span></td>
                <td class="action-btns">
                  <button class="abtn edit" (click)="editPage(pg)"><i class="fas fa-edit"></i></button>
                  <button class="abtn del" (click)="deletePage(pg.id)"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── SITE REVIEWS ─── -->
      <div *ngIf="activeTab()==='site_reviews'">
        <div class="content-header"><h2>Reseñas del sitio</h2></div>
        <div class="reviews-list">
          <div *ngFor="let r of siteReviews()" class="review-card card" [class.unread-card]="!r.is_read">
            <div class="rev-header">
              <img [src]="r.profile_picture||'assets/avatar.png'" class="table-img rounded">
              <div>
                <strong>{{r.username||'Anónimo'}}</strong>
                <span class="rtype" [class]="'rtype-'+r.type">{{getReviewTypeLabel(r.type)}}</span>
              </div>
              <div *ngIf="r.rating" class="stars-sm">
                <i *ngFor="let s of getStars(r.rating)" class="fas fa-star"></i>
              </div>
              <span class="rev-date">{{r.created_at | date:'dd/MM/yy HH:mm'}}</span>
            </div>
            <p class="rev-comment">{{r.comment}}</p>
            <div class="rev-actions">
              <button *ngIf="!r.is_read" class="btn btn-secondary btn-sm" (click)="markSiteReviewRead(r.id)"><i class="fas fa-check"></i> Leído</button>
              <button class="btn btn-danger btn-sm" (click)="deleteSiteReview(r.id)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div *ngIf="!siteReviews().length" class="empty-adm"><span>⭐</span><p>Sin reseñas aún</p></div>
        </div>
      </div>

    </div><!-- /admin-content -->
  </div><!-- /admin-layout -->

  <!-- ═══ MODALS ═══ -->

  <!-- Product Form -->
  <div *ngIf="showProductForm()" class="overlay">
    <div class="modal">
      <button class="close-btn" (click)="showProductForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingProduct() ? 'Editar' : 'Nuevo'}} Producto</h3>
      <div class="form-group"><label>Nombre *</label><input type="text" [(ngModel)]="productForm.name" class="form-control"></div>
      <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="productForm.description" class="form-control" rows="3"></textarea></div>
      <div class="form-row-2">
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
        <label>Imagen del producto</label>
        <div class="file-input-wrap">
          <label class="file-input-label">
            <i class="fas fa-image"></i> {{uploadingImg() ? 'Subiendo...' : 'Seleccionar imagen'}}
            <input type="file" class="file-input-hidden" accept="image/*" (change)="onProductImageChange($event)">
          </label>
        </div>
        <div class="imgs-preview">
          <img *ngFor="let img of productForm.images" [src]="img" class="img-thumb">
        </div>
      </div>
      <div class="form-group">
        <label class="check-lbl"><input type="checkbox" [(ngModel)]="productForm.is_featured"> Producto destacado ⭐</label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" (click)="showProductForm.set(false)">Cancelar</button>
        <button class="btn btn-primary btn-sm" (click)="saveProduct()" [disabled]="savingProduct()">{{savingProduct()?'Guardando...':(editingProduct()?'Actualizar':'Crear')}}</button>
      </div>
    </div>
  </div>

  <!-- Slide Form -->
  <div *ngIf="showSlideForm()" class="overlay">
    <div class="modal modal-lg">
      <button class="close-btn" (click)="showSlideForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingSlide() ? 'Editar' : 'Nuevo'}} Slide</h3>

      <!-- Display mode selector -->
      <div class="form-group">
        <label>Modo de visualización lateral</label>
        <div class="mode-selector">
          <button class="mode-btn" [class.active]="slideForm.display_mode==='emoji'" (click)="slideForm.display_mode='emoji'">😀 Emoji</button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='small_image'" (click)="slideForm.display_mode='small_image'">🖼️ Imagen pequeña</button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='bg_image'" (click)="slideForm.display_mode='bg_image'">🌄 Imagen de fondo</button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='none'" (click)="slideForm.display_mode='none'">✖ Sin imagen</button>
        </div>
      </div>

      <!-- Emoji -->
      <div *ngIf="slideForm.display_mode==='emoji'" class="form-group">
        <label>Emoji</label>
        <input type="text" [(ngModel)]="slideForm.emoji" class="form-control" style="font-size:2rem;text-align:center;max-width:100px" placeholder="🍪">
      </div>

      <!-- Small image or bg image upload -->
      <div *ngIf="slideForm.display_mode==='small_image'||slideForm.display_mode==='bg_image'" class="form-group">
        <label>{{slideForm.display_mode==='bg_image' ? 'Imagen de fondo' : 'Imagen pequeña lateral'}}</label>
        <div class="file-input-wrap">
          <label class="file-input-label">
            <i class="fas fa-upload"></i> {{uploadingImg() ? 'Subiendo...' : (slideForm.image_url ? 'Cambiar imagen' : 'Subir imagen')}}
            <input type="file" class="file-input-hidden" accept="image/*" (change)="onSlideImageChange($event)">
          </label>
        </div>
        <img *ngIf="slideForm.image_url" [src]="slideForm.image_url" class="slide-prev-img">
      </div>

      <!-- Background options -->
      <div class="form-group">
        <label>Fondo del carrusel</label>
        <div class="bg-options">
          <button class="mode-btn" [class.active]="bgMode==='gradient'" (click)="bgMode='gradient'">🌈 Gradiente</button>
          <button class="mode-btn" [class.active]="bgMode==='color'" (click)="bgMode='color'">🎨 Color sólido</button>
        </div>
      </div>
      <div *ngIf="bgMode==='gradient'" class="form-group">
        <label>CSS de gradiente</label>
        <input type="text" [(ngModel)]="slideForm.bg_gradient" class="form-control" placeholder="linear-gradient(135deg, #F5E6D3 60%, #E8C99A)">
        <div class="gradient-preview" [style.background]="slideForm.bg_gradient"></div>
      </div>
      <div *ngIf="bgMode==='color'" class="form-group">
        <label>Color de fondo</label>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="color" [(ngModel)]="slideForm.bg_color" style="width:50px;height:40px;border-radius:8px;border:2px solid var(--almond);cursor:pointer">
          <input type="text" [(ngModel)]="slideForm.bg_color" class="form-control" placeholder="#F5E6D3" style="flex:1">
        </div>
        <div class="gradient-preview" [style.background]="slideForm.bg_color"></div>
      </div>

      <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="slideForm.title" class="form-control"></div>
      <div class="form-group"><label>Subtítulo / Tag</label><input type="text" [(ngModel)]="slideForm.subtitle" class="form-control" placeholder="✨ Artesanal & Fresco"></div>
      <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="slideForm.description" class="form-control" rows="2"></textarea></div>
      <div class="form-row-2">
        <div class="form-group"><label>Texto del botón</label><input type="text" [(ngModel)]="slideForm.button_text" class="form-control"></div>
        <div class="form-group">
          <label>Destino del botón</label>
          <select [(ngModel)]="slideForm.button_url" class="form-control">
            <option value="/products">🍪 Productos</option>
            <option value="/">🏠 Inicio</option>
            <option value="/orders">📦 Mis Pedidos</option>
            <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
          </select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label>Orden</label><input type="number" [(ngModel)]="slideForm.order_index" class="form-control" min="0"></div>
        <div class="form-group" style="display:flex;align-items:flex-end">
          <label class="check-lbl"><input type="checkbox" [(ngModel)]="slideForm.is_active"> Activo</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" (click)="showSlideForm.set(false)">Cancelar</button>
        <button class="btn btn-primary btn-sm" (click)="saveSlide()">{{editingSlide()?'Actualizar':'Crear'}}</button>
      </div>
    </div>
  </div>

  <!-- Page Form -->
  <div *ngIf="showPageForm()" class="overlay">
    <div class="modal modal-lg">
      <button class="close-btn" (click)="showPageForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingPage() ? 'Editar' : 'Nueva'}} Página</h3>
      <div class="form-row-2">
        <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="pageForm.title" class="form-control"></div>
        <div class="form-group"><label>Slug *</label><input type="text" [(ngModel)]="pageForm.slug" class="form-control" placeholder="mi-pagina"></div>
      </div>
      <div class="checkbox-row">
        <label class="check-lbl"><input type="checkbox" [(ngModel)]="pageForm.is_active"> Activa</label>
        <label class="check-lbl"><input type="checkbox" [(ngModel)]="pageForm.show_in_nav"> Mostrar en navbar</label>
      </div>
      <h4 class="sub-title">Secciones de la página</h4>
      <div *ngFor="let sec of pageForm.sections; let i=index" class="sec-edit-block">
        <div class="sec-type-row">
          <select [(ngModel)]="sec.type" class="form-control" style="flex:1">
            <option value="text">📝 Texto</option>
            <option value="banner">🖼️ Banner con imagen</option>
            <option value="products_all">🍪 Todos los productos</option>
            <option value="products_featured">⭐ Productos destacados</option>
            <option value="products_specific">🎯 Producto específico</option>
          </select>
          <button class="abtn del" (click)="removePageSection(i)"><i class="fas fa-trash"></i></button>
        </div>
        <!-- Text/Banner -->
        <div *ngIf="sec.type==='text'||sec.type==='banner'" class="form-group mt-sm"><label>Título</label><input type="text" [(ngModel)]="sec.title" class="form-control"></div>
        <div *ngIf="sec.type==='text'" class="form-group"><label>Contenido</label><textarea [(ngModel)]="sec.content" class="form-control" rows="3"></textarea></div>
        <!-- Banner specific -->
        <div *ngIf="sec.type==='banner'">
          <div class="form-group">
            <label>Imagen</label>
            <div class="file-input-wrap">
              <label class="file-input-label"><i class="fas fa-image"></i> {{sec.image ? 'Cambiar imagen' : 'Subir imagen'}}
                <input type="file" class="file-input-hidden" accept="image/*" (change)="onSectionImageChange($event, i)">
              </label>
            </div>
            <img *ngIf="sec.image" [src]="sec.image" style="max-width:120px;border-radius:8px;margin-top:6px">
          </div>
          <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="sec.description" class="form-control" rows="2"></textarea></div>
          <div class="form-row-2">
            <div class="form-group"><label>Texto botón</label><input type="text" [(ngModel)]="sec.button_text" class="form-control"></div>
            <div class="form-group">
              <label>Destino botón</label>
              <select [(ngModel)]="sec.button_url" class="form-control">
                <option value="/products">🍪 Productos</option>
                <option value="/">🏠 Inicio</option>
                <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
              </select>
            </div>
          </div>
        </div>
        <!-- Specific product -->
        <div *ngIf="sec.type==='products_specific'" class="form-group">
          <label>Seleccionar producto</label>
          <select [(ngModel)]="sec.product_id" class="form-control">
            <option value="">Selecciona un producto</option>
            <option *ngFor="let p of allProducts()" [value]="p.id">{{p.name}}</option>
          </select>
          <div class="form-row-2 mt-sm">
            <div class="form-group"><label>Mostrar imagen</label><label class="check-lbl"><input type="checkbox" [(ngModel)]="sec.show_image"> Sí</label></div>
            <div class="form-group"><label>Mostrar precio</label><label class="check-lbl"><input type="checkbox" [(ngModel)]="sec.show_price"> Sí</label></div>
          </div>
          <div class="form-group"><label>Descripción personalizada</label><textarea [(ngModel)]="sec.custom_description" class="form-control" rows="2" placeholder="Deja vacío para usar la del producto"></textarea></div>
        </div>
      </div>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('text')"><i class="fas fa-plus"></i> Texto</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('banner')"><i class="fas fa-plus"></i> Banner</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('products_all')"><i class="fas fa-plus"></i> Productos</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('products_specific')"><i class="fas fa-plus"></i> Producto específico</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" (click)="showPageForm.set(false)">Cancelar</button>
        <button class="btn btn-primary" (click)="savePage()">{{editingPage()?'Actualizar':'Crear página'}}</button>
      </div>
    </div>
  </div>

  <!-- User Profile Modal -->
  <div *ngIf="viewingUser()" class="overlay">
    <div class="modal">
      <button class="close-btn" (click)="viewingUser.set(null)"><i class="fas fa-times"></i></button>
      <div class="user-profile-view">
        <img [src]="viewingUser()!.profile_picture||'assets/avatar.png'" class="user-av-big">
        <h3>{{viewingUser()!.full_name || viewingUser()!.username}}</h3>
        <span class="role-lbl" [class.admin-role]="viewingUser()!.role==='admin'">{{viewingUser()!.role}}</span>
        <div class="profile-info-grid">
          <div class="info-item"><i class="fas fa-user"></i> {{viewingUser()!.username}}</div>
          <div class="info-item"><i class="fas fa-envelope"></i> {{viewingUser()!.email}}</div>
          <div *ngIf="viewingUser()!.phone" class="info-item"><i class="fas fa-phone"></i> {{viewingUser()!.phone}}</div>
          <div *ngIf="viewingUser()!.ambiente_number" class="info-item"><i class="fas fa-door-open"></i> Amb. {{viewingUser()!.ambiente_number}}</div>
          <div *ngIf="viewingUser()!.schedule" class="info-item"><i class="fas fa-clock"></i> {{viewingUser()!.schedule}}</div>
          <div class="info-item"><i class="fas fa-calendar"></i> {{viewingUser()!.created_at | date:'dd/MM/yyyy'}}</div>
        </div>
        <button class="btn btn-primary mt-md" (click)="openChatWithUser(viewingUser()!); viewingUser.set(null)">
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
        <div>
          <h4 class="sub-title">Cliente</h4>
          <div class="client-info-card">
            <img [src]="viewingOrder()!.profile_picture||'assets/avatar.png'" class="client-av">
            <div>
              <strong>{{viewingOrder()!.full_name || viewingOrder()!.username}}</strong>
              <p>{{viewingOrder()!.email}}</p>
              <p *ngIf="viewingOrder()!.phone"><i class="fas fa-phone"></i> {{viewingOrder()!.phone}}</p>
              <p *ngIf="viewingOrder()!.ambiente_number"><i class="fas fa-door-open"></i> Amb. {{viewingOrder()!.ambiente_number}}</p>
              <p *ngIf="viewingOrder()!.schedule"><i class="fas fa-clock"></i> {{viewingOrder()!.schedule}}</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm mt-md" (click)="openChatWithUser(viewingOrder()!); viewingOrder.set(null)">
            <i class="fas fa-comment"></i> Enviar mensaje
          </button>
        </div>
        <div>
          <h4 class="sub-title">Productos del pedido</h4>
          <div *ngFor="let item of (viewingOrder()!.items||[])" class="detail-item">
            <img [src]="(item.images&&item.images[0])||'assets/cookie-placeholder.png'" class="detail-img">
            <div style="flex:1"><strong>{{item.name}}</strong><p style="font-size:0.8rem;color:var(--text-light)">x{{item.quantity}} — $ {{item.unit_price|number:'1.0-0'}} c/u</p></div>
            <span style="font-weight:700;color:var(--warm-capuchino)">$ {{item.unit_price*item.quantity|number:'1.0-0'}}</span>
          </div>
          <div class="detail-total">
            <strong>Total: $ {{viewingOrder()!.total|number:'1.0-0'}}</strong>
            <span>{{viewingOrder()!.payment_method}}</span>
            <span>{{viewingOrder()!.created_at|date:'dd/MM/yyyy HH:mm'}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .admin-page { background: var(--almond-light); min-height: 100vh; }
    .admin-header { background: linear-gradient(135deg, var(--mocca-bean), var(--caramel-roast)); color: #fff; padding: 48px 0 28px; }
    .admin-header h1 { color: #fff; margin-bottom: 4px; }
    .admin-header p { opacity: 0.7; font-size: 0.9rem; }
    .admin-layout { display: grid; grid-template-columns: 200px 1fr; gap: 20px; padding: 28px 0 48px; align-items: start; }
    .sidebar-toggle { display: none; margin-bottom: 12px; }
    .admin-sidebar { background: #fff; border-radius: var(--radius-lg); padding: 14px; height: fit-content; box-shadow: var(--shadow-sm); position: sticky; top: 88px; }
    .slabel { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-light); letter-spacing: 0.8px; padding: 10px 6px 3px; }
    .tab-btn { width: 100%; padding: 9px 12px; border: none; background: none; cursor: pointer; font-size: 0.84rem; font-weight: 600; color: var(--text-mid); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; transition: all var(--transition); text-align: left; margin-bottom: 2px; }
    .tab-btn:hover { background: var(--almond-light); color: var(--warm-capuchino); }
    .tab-btn.active { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; }
    .admin-content { background: #fff; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); min-width: 0; }
    .content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
    .content-header h2 { color: var(--mocca-bean); font-size: 1.3rem; }
    .view-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .vpill { padding: 5px 14px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: var(--text-mid); transition: all var(--transition); }
    .vpill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    /* Table */
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; min-width: 500px; }
    .admin-table th { background: var(--almond-light); padding: 10px 11px; text-align: left; font-weight: 700; color: var(--text-mid); font-size: 0.74rem; text-transform: uppercase; white-space: nowrap; }
    .admin-table td { padding: 10px 11px; border-bottom: 1px solid var(--almond-light); vertical-align: middle; }
    .table-img { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0; }
    .table-img.rounded { border-radius: 50%; }
    .td-name { max-width: 150px; word-break: break-word; }
    .td-email { max-width: 160px; word-break: break-all; font-size: 0.78rem; }
    .td-products { max-width: 200px; }
    .mini-product { display: flex; align-items: center; gap: 5px; font-size: 0.76rem; color: var(--text-mid); margin-bottom: 4px; }
    .mini-img { width: 24px; height: 24px; border-radius: 4px; object-fit: cover; }
    .stock-badge { padding: 2px 7px; border-radius: var(--radius-full); background: var(--success); color: #fff; font-size: 0.73rem; font-weight: 700; }
    .stock-badge.low-stock { background: var(--error); }
    .feat-toggle { cursor: pointer; font-size: 1.1rem; }
    .feat-toggle.on { filter: drop-shadow(0 0 3px gold); }
    .action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
    .abtn { width: 28px; height: 28px; border: none; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; transition: all var(--transition); flex-shrink: 0; }
    .abtn.edit { background: #e8f0fe; color: #1967d2; }
    .abtn.edit:hover { background: #1967d2; color: #fff; }
    .abtn.del { background: #fde8e8; color: var(--error); }
    .abtn.del:hover { background: var(--error); color: #fff; }
    .status-sel { padding: 4px 7px; border: 1px solid var(--almond); border-radius: 6px; font-size: 0.76rem; max-width: 130px; }
    .status-badge { padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
    .status-pending { background:#fff3e0;color:#f57c00; }
    .status-processing { background:#e3f2fd;color:#1976d2; }
    .status-completed { background:#e8f5e9;color:#388e3c; }
    .status-cancelled { background:#fde8e8;color:var(--error); }
    .user-cell { display: flex; align-items: center; gap: 7px; }
    .block-txt { display: block; font-size: 0.72rem; color: var(--text-light); }
    .role-lbl { font-size: 0.68rem; color: var(--text-light); }
    .admin-role { color: var(--warm-capuchino); font-weight: 700; }
    .mono { font-family: monospace; font-size: 0.74rem; }
    /* Chat */
    .admin-chat .chat-layout { display: grid; grid-template-columns: 220px 1fr; gap: 14px; height: 460px; }
    .conv-list { border: 1px solid var(--almond); border-radius: var(--radius-md); overflow-y: auto; }
    .conv-item { display: flex; align-items: center; gap: 8px; padding: 11px; cursor: pointer; transition: background var(--transition); border-bottom: 1px solid var(--almond-light); }
    .conv-item:hover,.conv-item.active { background: var(--almond-light); }
    .conv-av { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .conv-av-sm { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
    .conv-info { flex: 1; overflow: hidden; }
    .conv-info strong { font-size: 0.83rem; display: block; color: var(--text-dark); }
    .conv-info p { font-size: 0.7rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
    .unread-dot { background: var(--warm-capuchino); color: #fff; border-radius: 50%; width: 17px; height: 17px; font-size: 0.66rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .no-conv { text-align: center; padding: 28px 10px; color: var(--text-light); font-size: 0.8rem; }
    .no-conv span { font-size: 1.6rem; display: block; margin-bottom: 5px; }
    .admin-chat-win { border: 1px solid var(--almond); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden; }
    .achat-header { display: flex; align-items: center; gap: 8px; padding: 10px 13px; background: var(--almond-light); border-bottom: 1px solid var(--almond); }
    .achat-msgs { flex: 1; overflow-y: auto; padding: 13px; display: flex; flex-direction: column; gap: 6px; background: #f8f4f0; }
    .achat-input { display: flex; gap: 7px; padding: 10px; border-top: 1px solid var(--almond); }
    .msg-row { display: flex; max-width: 80%; }
    .msg-mine { align-self: flex-end; }
    .msg-theirs { align-self: flex-start; }
    .mbubble { padding: 7px 11px; border-radius: 14px; font-size: 0.82rem; line-height: 1.5; }
    .msg-mine .mbubble { background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast)); color: #fff; border-bottom-right-radius: 3px; }
    .msg-theirs .mbubble { background: #fff; color: var(--text-dark); border-bottom-left-radius: 3px; box-shadow: var(--shadow-sm); }
    .mtime { display: block; font-size: 0.58rem; opacity: 0.55; text-align: right; margin-top: 2px; }
    .no-chat-sel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: var(--text-light); border: 1px solid var(--almond); border-radius: var(--radius-md); font-size: 0.82rem; }
    .no-chat-sel span { font-size: 2rem; }
    /* Carousel */
    .slides-list { display: flex; flex-direction: column; gap: 14px; }
    .slide-adm-card { display: flex; align-items: center; gap: 14px; padding: 14px; }
    .slide-preview { width: 90px; height: 64px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .slide-info { flex: 1; min-width: 0; }
    .slide-info h4 { color: var(--mocca-bean); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .slide-info p { font-size: 0.78rem; color: var(--text-light); }
    .slide-st { font-size: 0.7rem; padding: 2px 7px; border-radius: var(--radius-full); background: #fde8e8; color: var(--error); font-weight: 700; }
    .slide-st.active { background: #e8f5e9; color: #388e3c; }
    .slide-prev-img { width: 100%; max-height: 110px; object-fit: cover; border-radius: var(--radius-md); margin-top: 8px; }
    /* Mode selector */
    .mode-selector, .bg-options { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
    .mode-btn { padding: 7px 14px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.83rem; font-weight: 600; transition: all var(--transition); color: var(--text-mid); }
    .mode-btn.active { border-color: var(--warm-capuchino); background: var(--warm-capuchino); color: #fff; }
    .gradient-preview { height: 28px; border-radius: var(--radius-md); margin-top: 8px; border: 1px solid var(--almond); }
    /* Settings forms */
    .settings-card { padding: 24px; }
    .sub-title { color: var(--mocca-bean); font-size: 0.95rem; margin: 18px 0 10px; }
    .checkbox-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 14px; }
    .check-lbl { display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 0.87rem; font-weight: 600; color: var(--text-mid); }
    .check-lbl-sm { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: var(--text-mid); white-space: nowrap; }
    .link-edit-row { display: flex; gap: 7px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .url-select { flex: 1.2; min-width: 130px; }
    .btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
    .divider { border: none; border-top: 1px solid var(--almond); margin: 12px 0; }
    /* Why us editor */
    .why-item-edit { margin-bottom: 4px; }
    /* Pages */
    .sec-edit-block { background: var(--almond-light); padding: 14px; border-radius: var(--radius-md); margin-bottom: 10px; }
    .sec-type-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    /* Reviews */
    .reviews-list { display: flex; flex-direction: column; gap: 14px; }
    .review-card { padding: 18px; }
    .unread-card { border-left: 3px solid var(--warm-capuchino); }
    .rev-header { display: flex; align-items: center; gap: 9px; margin-bottom: 9px; flex-wrap: wrap; }
    .rtype { padding: 2px 9px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700; }
    .rtype-review { background:#e3f2fd;color:#1976d2; }
    .rtype-complaint { background:#fde8e8;color:var(--error); }
    .rtype-suggestion { background:#e8f5e9;color:#388e3c; }
    .rev-date { font-size: 0.72rem; color: var(--text-light); margin-left: auto; }
    .rev-comment { font-size: 0.88rem; color: var(--text-mid); line-height: 1.6; margin-bottom: 10px; }
    .rev-actions { display: flex; gap: 7px; }
    .stars-sm .fa-star { color: var(--caramel); font-size: 0.78rem; }
    /* User profile modal */
    .close-btn { position: absolute; top: 13px; right: 13px; background: none; border: none; cursor: pointer; font-size: 1.05rem; color: var(--text-light); }
    .user-profile-view { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .user-av-big { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 4px solid var(--almond); }
    .profile-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; width: 100%; margin-top: 10px; text-align: left; }
    .info-item { display: flex; align-items: center; gap: 7px; padding: 7px 11px; background: var(--almond-light); border-radius: var(--radius-md); font-size: 0.82rem; color: var(--text-mid); }
    .info-item i { color: var(--warm-capuchino); width: 13px; flex-shrink: 0; }
    /* Order detail */
    .order-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
    .client-info-card { display: flex; gap: 12px; align-items: flex-start; padding: 14px; background: var(--almond-light); border-radius: var(--radius-lg); margin-top: 8px; }
    .client-av { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .client-info-card p { font-size: 0.8rem; color: var(--text-mid); margin: 2px 0; }
    .detail-item { display: flex; align-items: center; gap: 9px; padding: 9px 0; border-bottom: 1px solid var(--almond-light); }
    .detail-img { width: 42px; height: 42px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0; }
    .detail-total { display: flex; align-items: center; gap: 14px; padding: 13px 0; flex-wrap: wrap; }
    .detail-total strong { color: var(--warm-capuchino); font-size: 1.05rem; font-family: var(--font-display); }
    .detail-total span { font-size: 0.8rem; color: var(--text-light); }
    /* Misc */
    .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--almond); }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .categories-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .cat-chip { display: flex; align-items: center; gap: 7px; padding: 7px 14px; background: var(--almond-light); border-radius: var(--radius-full); font-size: 0.83rem; font-weight: 600; color: var(--text-mid); }
    .del-cat { background: none; border: none; cursor: pointer; color: var(--error); font-size: 0.72rem; }
    .imgs-preview { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 7px; }
    .img-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: var(--radius-sm); border: 2px solid var(--almond); }
    .empty-adm { text-align: center; padding: 40px 16px; color: var(--text-light); }
    .empty-adm span { font-size: 2.2rem; display: block; margin-bottom: 6px; }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 900px) {
      .admin-layout { grid-template-columns: 1fr; padding: 16px 0 32px; }
      .sidebar-toggle { display: flex; align-items: center; gap: 8px; width: 100%; }
      .admin-sidebar { display: none; border-radius: var(--radius-md); padding: 12px; position: static; }
      .admin-sidebar.open { display: block; }
      .tab-btn { font-size: 0.82rem; padding: 8px 10px; }
      .form-row-2 { grid-template-columns: 1fr; gap: 0; }
      .admin-chat .chat-layout { grid-template-columns: 1fr; height: auto; }
      .admin-chat .chat-layout .conv-list { max-height: 200px; }
      .admin-chat .chat-layout .admin-chat-win { height: 300px; }
      .profile-info-grid { grid-template-columns: 1fr; }
      .order-detail-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .admin-header { padding: 36px 0 20px; }
      .admin-header h1 { font-size: 1.4rem; }
      .content-header { flex-direction: column; align-items: flex-start; }
      .view-tabs { width: 100%; }
      .admin-table th, .admin-table td { padding: 8px 8px; font-size: 0.78rem; }
      .link-edit-row { flex-direction: column; }
      .link-edit-row .form-control { width: 100%; }
      .mode-selector, .bg-options { gap: 6px; }
      .mode-btn { font-size: 0.78rem; padding: 6px 10px; }
      .checkbox-row { gap: 12px; }
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
  allProducts = signal<Product[]>([]);
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
  sidebarOpen = false;
  adminMsg = '';
  orderView = signal<'active'|'archived'|'deleted'>('active');
  bgMode = 'gradient';

  get myId() { return this.auth.currentUser()?.id || ''; }

  productForm: any = { name:'', description:'', price:0, stock:0, images:[], is_featured:false };
  slideForm: any = { title:'', subtitle:'', description:'', button_text:'Ver más', button_url:'/products', image_url:'', bg_gradient:'linear-gradient(135deg,#F5E6D3 60%,#E8C99A)', bg_color:'', order_index:0, is_active:true, display_mode:'emoji', emoji:'🍪' };
  pageForm: any = { title:'', slug:'', sections:[], is_active:true, show_in_nav:false };
  newCat = { name:'', slug:'' };
  whyUsData: any = { title:'¿Por qué Star Crumbs?', items:[] };
  navbarData: any = { logo_position:'left', logo_text:'Star Crumbs', logo_icon:'🍪', links:[], show_cart:true, show_chat:true, show_notifications:true };
  footerData: any = { brand_text:'Star Crumbs', brand_icon:'🍪', tagline:'', copyright:'', links:[] };

  tabs = [
    { key:'products' as Tab, label:'Productos', icon:'fas fa-cookie-bite' },
    { key:'categories' as Tab, label:'Categorías', icon:'fas fa-tags' },
    { key:'carousel' as Tab, label:'Carrusel', icon:'fas fa-images' },
    { key:'orders' as Tab, label:'Pedidos', icon:'fas fa-shopping-bag' },
    { key:'users' as Tab, label:'Usuarios', icon:'fas fa-users' },
    { key:'chat' as Tab, label:'Chat', icon:'fas fa-comments' },
    { key:'why_us' as Tab, label:'¿Por qué nosotros?', icon:'fas fa-star' },
    { key:'navbar' as Tab, label:'Navbar', icon:'fas fa-bars' },
    { key:'footer' as Tab, label:'Footer', icon:'fas fa-grip-lines' },
    { key:'pages' as Tab, label:'Páginas', icon:'fas fa-file-alt' },
    { key:'site_reviews' as Tab, label:'Reseñas', icon:'fas fa-comment-dots' }
  ];

  constructor(private productService:ProductService, private uploadService:UploadService, private toast:ToastService, public auth:AuthService, private chatService:ChatService, private http:HttpClient) {}

  ngOnInit() { this.loadAll(); }

  setTab(key: Tab) { this.activeTab.set(key); this.sidebarOpen = false; }

  loadAll() {
    this.productService.getAll().subscribe(p => { this.products.set(p); this.allProducts.set(p); });
    this.loadOrders('active');
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe(u => this.users.set(u));
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c));
    this.chatService.getConversations().subscribe(c => this.conversations.set(c));
    this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s => this.carouselSlides.set(s));
    this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p => this.sitePages.set(p));
    this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r => this.siteReviews.set(r));
    this.http.get<any>(`${environment.apiUrl}/site-settings/why_us`).subscribe(s => { if(s?.setting_value) this.whyUsData = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/navbar`).subscribe(s => { if(s?.setting_value) this.navbarData = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/footer`).subscribe(s => { if(s?.setting_value) this.footerData = JSON.parse(JSON.stringify(s.setting_value)); });
  }

  loadOrders(view: 'active'|'archived'|'deleted') {
    this.orderView.set(view);
    const params = view !== 'active' ? `?${view}=true` : '';
    this.http.get<Order[]>(`${environment.apiUrl}/orders${params}`).subscribe(o => this.orders.set(o));
  }

  // Products
  openProductForm() { this.editingProduct.set(null); this.productForm = { name:'', description:'', price:0, stock:0, images:[], is_featured:false }; this.showProductForm.set(true); }
  editProduct(p: Product) { this.editingProduct.set(p); this.productForm = { ...p, images: p.images||[] }; this.showProductForm.set(true); }
  async onProductImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    this.uploadingImg.set(true);
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64, 'star-crumbs/products').subscribe({ next: r => { this.productForm.images = [...(this.productForm.images||[]), r.url]; this.uploadingImg.set(false); }, error: () => { this.uploadingImg.set(false); this.toast.error('Error al subir'); } });
  }
  saveProduct() {
    if (!this.productForm.name) { this.toast.error('El nombre es requerido'); return; }
    this.savingProduct.set(true);
    const obs = this.editingProduct() ? this.productService.update(this.editingProduct()!.id, this.productForm) : this.productService.create(this.productForm);
    obs.subscribe({ next: () => { this.savingProduct.set(false); this.showProductForm.set(false); this.toast.success('Producto guardado ✅'); this.productService.getAll().subscribe(p => { this.products.set(p); this.allProducts.set(p); }); }, error: () => { this.savingProduct.set(false); this.toast.error('Error al guardar'); } });
  }
  deleteProduct(id: string) { if(!confirm('¿Eliminar?')) return; this.productService.delete(id).subscribe({ next: () => { this.toast.success('Eliminado'); this.productService.getAll().subscribe(p => { this.products.set(p); this.allProducts.set(p); }); } }); }
  toggleFeatured(p: Product) { this.productService.update(p.id, { is_featured: !p.is_featured }).subscribe({ next: () => this.productService.getAll().subscribe(pr => this.products.set(pr)) }); }

  // Categories
  createCategory() { if(!this.newCat.name||!this.newCat.slug) { this.toast.error('Nombre y slug requeridos'); return; } this.http.post<Category>(`${environment.apiUrl}/categories`, this.newCat).subscribe({ next: () => { this.toast.success('Creada'); this.newCat={name:'',slug:''}; this.showCatForm=false; this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c=>this.categories.set(c)); } }); }
  deleteCategory(id: string) { this.http.delete(`${environment.apiUrl}/categories/${id}`).subscribe({ next: () => this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c=>this.categories.set(c)) }); }

  // Orders
  updateOrderStatus(id:string, status:string) { this.http.put(`${environment.apiUrl}/orders/${id}/status`,{status}).subscribe({next:()=>this.toast.success('Estado actualizado')}); }
  archiveOrder(id:string) { this.http.put(`${environment.apiUrl}/orders/${id}/archive`,{}).subscribe({next:()=>{this.toast.success('Archivado');this.loadOrders('active');}}); }
  restoreOrder(id:string) { this.http.put(`${environment.apiUrl}/orders/${id}/restore`,{}).subscribe({next:()=>{this.toast.success('Restaurado');this.loadOrders(this.orderView());}}); }
  softDeleteOrder(id:string) { if(!confirm('¿Eliminar pedido?')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/admin`).subscribe({next:()=>{this.toast.success('Eliminado');this.loadOrders('active');}}); }
  permanentDeleteOrder(id:string) { if(!confirm('¿Eliminar permanentemente?')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/permanent`).subscribe({next:()=>{this.toast.success('Eliminado definitivo');this.loadOrders('deleted');}}); }
  viewOrderDetail(o:any) { this.viewingOrder.set(o); }
  viewUserProfile(u:User) { this.viewingUser.set(u); }

  // Chat
  openConversation(conv:any) { this.selectedConv.set(conv); this.chatService.loadHistory(conv.id).subscribe(msgs=>this.adminMessages.set(msgs)); this.chatService.markRead(conv.id).subscribe(); }
  openChatWithUser(u:any) {
    const userId = u.user_id || u.id;
    const userObj = this.users().find(usr => usr.id === userId) || u;
    this.selectedConv.set({ id: userId, username: userObj.username || u.username, profile_picture: userObj.profile_picture || u.profile_picture });
    this.chatService.loadHistory(userId).subscribe(msgs=>this.adminMessages.set(msgs));
    this.setTab('chat');
  }
  sendAdminMsg() {
    const text = this.adminMsg.trim(); if(!text||!this.selectedConv()) return;
    this.adminMessages.update((m:ChatMessage[]) => [...m, { sender_id:this.myId, message:text, created_at:new Date().toISOString() }]);
    this.adminMsg = '';
    this.chatService.sendMessage({ receiverId:this.selectedConv().id, message:text, senderId:this.myId, senderName:this.auth.currentUser()?.username||'Admin' });
  }

  // Carousel
  openSlideForm() { this.editingSlide.set(null); this.slideForm={title:'',subtitle:'',description:'',button_text:'Ver más',button_url:'/products',image_url:'',bg_gradient:'linear-gradient(135deg,#F5E6D3 60%,#E8C99A)',bg_color:'',order_index:this.carouselSlides().length,is_active:true,display_mode:'emoji',emoji:'🍪'}; this.bgMode='gradient'; this.showSlideForm.set(true); }
  editSlide(s:any) { this.editingSlide.set(s); this.slideForm={...s}; this.bgMode = s.bg_color ? 'color' : 'gradient'; this.showSlideForm.set(true); }
  async onSlideImageChange(event: Event) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    this.uploadingImg.set(true);
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/carousel').subscribe({ next:r=>{this.slideForm.image_url=r.url;this.uploadingImg.set(false);}, error:()=>{this.uploadingImg.set(false);this.toast.error('Error al subir');} });
  }
  saveSlide() {
    const data = { ...this.slideForm };
    if (this.bgMode === 'color') { data.bg_gradient = ''; } else { data.bg_color = ''; }
    const obs = this.editingSlide() ? this.http.put(`${environment.apiUrl}/carousel/${this.editingSlide().id}`, data) : this.http.post(`${environment.apiUrl}/carousel`, data);
    obs.subscribe({ next:()=>{this.toast.success('Slide guardado ✅');this.showSlideForm.set(false);this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s=>this.carouselSlides.set(s));} });
  }
  deleteSlide(id:string) { if(!confirm('¿Eliminar slide?')) return; this.http.delete(`${environment.apiUrl}/carousel/${id}`).subscribe({next:()=>{this.toast.success('Eliminado');this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s=>this.carouselSlides.set(s));}}); }

  getSlidePreviewStyle(s:any): string {
    if(s.display_mode==='bg_image'&&s.image_url) return `background:url('${s.image_url}') center/cover`;
    if(s.bg_color) return `background:${s.bg_color}`;
    return `background:${s.bg_gradient||'linear-gradient(135deg,#F5E6D3,#E8C99A)'}`;
  }

  // Why Us
  addWhyItem() { this.whyUsData.items.push({icon:'🍪',title:'Nuevo item',desc:'Descripción',image:''}); }
  removeWhyItem(i:number) { this.whyUsData.items.splice(i,1); }
  async onWhyItemImage(event: Event, i: number) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/why-us').subscribe({next:r=>{this.whyUsData.items[i].image=r.url;this.toast.success('Imagen subida');},error:()=>this.toast.error('Error')});
  }
  saveWhyUs() { this.http.put(`${environment.apiUrl}/site-settings/why_us`,{setting_value:this.whyUsData}).subscribe({next:()=>this.toast.success('Guardado ✅'),error:()=>this.toast.error('Error')}); }

  // Navbar
  addNavLink() { this.navbarData.links.push({label:'Nuevo link',url:'/',exact:false}); }
  removeNavLink(i:number) { this.navbarData.links.splice(i,1); }
  saveNavbar() { this.http.put(`${environment.apiUrl}/site-settings/navbar`,{setting_value:this.navbarData}).subscribe({next:()=>this.toast.success('Navbar guardado ✅'),error:()=>this.toast.error('Error')}); }

  // Footer
  addFooterLink() { this.footerData.links.push({label:'Nuevo link',url:'/',icon:'',external:false}); }
  removeFooterLink(i:number) { this.footerData.links.splice(i,1); }
  saveFooter() {
    const data = JSON.parse(JSON.stringify(this.footerData));
    data.links = data.links.map((l:any) => ({ ...l, url: l.url === 'custom' ? (l.custom_url||'/') : l.url }));
    this.http.put(`${environment.apiUrl}/site-settings/footer`,{setting_value:data}).subscribe({next:()=>this.toast.success('Footer guardado ✅'),error:()=>this.toast.error('Error')});
  }

  // Pages
  openPageForm() { this.editingPage.set(null); this.pageForm={title:'',slug:'',sections:[],is_active:true,show_in_nav:false}; this.showPageForm.set(true); }
  editPage(pg:any) { this.editingPage.set(pg); this.pageForm=JSON.parse(JSON.stringify(pg)); this.showPageForm.set(true); }
  addPageSection(type:string) { this.pageForm.sections.push({type,title:'',content:'',description:'',image:'',button_text:'',button_url:'/products',product_id:'',show_image:true,show_price:true,custom_description:''}); }
  removePageSection(i:number) { this.pageForm.sections.splice(i,1); }
  async onSectionImageChange(event: Event, i: number) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/pages').subscribe({next:r=>{this.pageForm.sections[i].image=r.url;this.toast.success('Imagen subida');},error:()=>this.toast.error('Error')});
  }
  savePage() {
    const obs = this.editingPage() ? this.http.put(`${environment.apiUrl}/site-pages/${this.editingPage().id}`,this.pageForm) : this.http.post(`${environment.apiUrl}/site-pages`,this.pageForm);
    obs.subscribe({next:()=>{this.toast.success('Página guardada ✅');this.showPageForm.set(false);this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p=>this.sitePages.set(p));}});
  }
  deletePage(id:string) { if(!confirm('¿Eliminar página?')) return; this.http.delete(`${environment.apiUrl}/site-pages/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p=>this.sitePages.set(p));}}); }

  // Site Reviews
  markSiteReviewRead(id:string) { this.http.put(`${environment.apiUrl}/site-reviews/${id}/read`,{}).subscribe({next:()=>this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r=>this.siteReviews.set(r))}); }
  deleteSiteReview(id:string) { this.http.delete(`${environment.apiUrl}/site-reviews/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r=>this.siteReviews.set(r));}}); }
  getReviewTypeLabel(t:string) { const m:any={review:'⭐ Reseña',complaint:'😠 Queja',suggestion:'💡 Sugerencia'}; return m[t]||t; }

  formatTime(val:any) { if(!val) return ''; return new Date(val).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
  getStars(n:number) { return Array(n).fill(0); }
}
