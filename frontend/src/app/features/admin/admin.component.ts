import { Component, OnInit, signal, computed } from '@angular/core';
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
    <button class="sidebar-toggle btn btn-secondary btn-sm" (click)="sidebarOpen=!sidebarOpen">
      <i class="fas fa-bars"></i> {{sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}}
    </button>

    <!-- SIDEBAR -->
    <aside class="admin-sidebar" [class.open]="sidebarOpen">
      <p class="slbl">Tienda</p>
      <button *ngFor="let t of tabs.slice(0,3)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i><span>{{t.label}}</span>
      </button>
      <p class="slbl">Gestión</p>
      <button *ngFor="let t of tabs.slice(3,6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i><span>{{t.label}}</span>
      </button>
      <p class="slbl">Personalización</p>
      <button *ngFor="let t of tabs.slice(6)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i><span>{{t.label}}</span>
      </button>
    </aside>

    <!-- CONTENT -->
    <div class="admin-content">

      <!-- ── PRODUCTS ── -->
      <div *ngIf="activeTab()==='products'">
        <div class="ch"><h2>Productos</h2><button class="btn btn-primary btn-sm" (click)="openProductForm()"><i class="fas fa-plus"></i> Agregar</button></div>
        <div class="tscroll">
          <table class="atable">
            <thead><tr><th>Img</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>⭐</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of products()">
                <td><img [src]="p.images[0]||'assets/cookie-placeholder.png'" class="timg"></td>
                <td>{{p.name}}</td>
                <td>$ {{p.price | number:'1.0-0'}}</td>
                <td><span class="stk" [class.stk-low]="p.stock<5">{{p.stock}}</span></td>
                <td><span class="feat" [class.feat-on]="p.is_featured" (click)="toggleFeatured(p)">{{p.is_featured?'⭐':'☆'}}</span></td>
                <td class="abts">
                  <button class="ab ab-e" (click)="editProduct(p)"><i class="fas fa-edit"></i></button>
                  <button class="ab ab-d" (click)="deleteProduct(p.id)"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── CATEGORIES ── -->
      <div *ngIf="activeTab()==='categories'">
        <div class="ch"><h2>Categorías</h2><button class="btn btn-primary btn-sm" (click)="showCatForm=!showCatForm"><i class="fas fa-plus"></i> Nueva</button></div>
        <div *ngIf="showCatForm" class="mini-card">
          <div class="row2"><div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="newCat.name" class="form-control"></div><div class="form-group"><label>Slug</label><input type="text" [(ngModel)]="newCat.slug" class="form-control" placeholder="sin-espacios"></div></div>
          <button class="btn btn-primary btn-sm" (click)="createCategory()">Crear</button>
        </div>
        <div class="cats-grid"><div *ngFor="let c of categories()" class="cat-chip"><span>{{c.name}}</span><button (click)="deleteCategory(c.id)"><i class="fas fa-times"></i></button></div></div>
      </div>

      <!-- ── ORDERS ── -->
      <div *ngIf="activeTab()==='orders'">
        <div class="ch">
          <h2>Pedidos</h2>
          <div class="vtabs">
            <button class="vpill" [class.active]="orderView()==='active'" (click)="loadOrders('active')">Activos</button>
            <button class="vpill" [class.active]="orderView()==='archived'" (click)="loadOrders('archived')">Archivados</button>
            <button class="vpill" [class.active]="orderView()==='deleted'" (click)="loadOrders('deleted')">Eliminados</button>
          </div>
        </div>
        <div class="tscroll">
          <table class="atable">
            <thead><tr><th>ID</th><th>Cliente</th><th>Productos comprados</th><th>Total</th><th>Pago</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders()">
                <td class="mono">{{o.id | slice:0:7}}…</td>
                <td>
                  <div class="ucell">
                    <img [src]="o.profile_picture||'assets/avatar.png'" class="timg round">
                    <div>
                      <strong>{{o.username||'—'}}</strong>
                      <small *ngIf="o.full_name" class="blk">{{o.full_name}}</small>
                      <small *ngIf="o.phone" class="blk"><i class="fas fa-phone" style="color:var(--warm-capuchino);font-size:0.6rem"></i> {{o.phone}}</small>
                      <small *ngIf="o.ambiente_number" class="blk">Amb. {{o.ambiente_number}}</small>
                    </div>
                  </div>
                </td>
                <td class="td-prods">
                  <div *ngFor="let item of (o.items||[])" class="prod-mini">
                    <img [src]="(item.images&&item.images[0])||'assets/cookie-placeholder.png'" class="prod-mini-img">
                    <div>
                      <span class="prod-mini-name">{{item.name}}</span>
                      <span class="prod-mini-qty">×{{item.quantity}} — $ {{item.unit_price * item.quantity | number:'1.0-0'}}</span>
                    </div>
                  </div>
                  <span *ngIf="!(o.items||[]).length" style="font-size:0.75rem;color:var(--text-light)">Sin productos</span>
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
                  <span *ngIf="orderView()!=='active'" class="status-badge" [class]="'sb-'+o.status">{{o.status}}</span>
                </td>
                <td>{{o.created_at | date:'dd/MM/yy'}}</td>
                <td class="abts">
                  <button class="ab ab-e" (click)="viewOrderDetail(o)" title="Ver"><i class="fas fa-eye"></i></button>
                  <button *ngIf="orderView()==='active'" class="ab" style="background:#fff3e0;color:#f57c00" (click)="archiveOrder(o.id)" title="Archivar"><i class="fas fa-archive"></i></button>
                  <button *ngIf="orderView()==='active'" class="ab ab-d" (click)="softDeleteOrder(o.id)" title="Eliminar"><i class="fas fa-trash"></i></button>
                  <button *ngIf="orderView()!=='active'" class="ab ab-e" (click)="restoreOrder(o.id)" title="Restaurar"><i class="fas fa-undo"></i></button>
                  <button *ngIf="orderView()==='deleted'" class="ab ab-d" (click)="permanentDeleteOrder(o.id)" title="Eliminar definitivo"><i class="fas fa-times-circle"></i></button>
                  <button class="ab" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(o)" title="Mensaje"><i class="fas fa-comment"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── USERS ── -->
      <div *ngIf="activeTab()==='users'">
        <div class="ch"><h2>Usuarios</h2></div>
        <div class="tscroll">
          <table class="atable">
            <thead><tr><th>Avatar</th><th>Usuario</th><th>Email</th><th>Jornada</th><th>Amb.</th><th>Registro</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td><img [src]="u.profile_picture||'assets/avatar.png'" class="timg round"></td>
                <td><strong>{{u.username}}</strong><br><small class="role-tag" [class.admin-tag]="u.role==='admin'">{{u.role}}</small></td>
                <td style="font-size:0.78rem">{{u.email}}</td>
                <td>{{u.schedule||'—'}}</td>
                <td>{{u.ambiente_number||'—'}}</td>
                <td>{{u.created_at | date:'dd/MM/yy'}}</td>
                <td class="abts">
                  <button class="ab ab-e" (click)="viewUserProfile(u)"><i class="fas fa-eye"></i></button>
                  <button class="ab" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(u)"><i class="fas fa-comment"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── CHAT ── -->
      <div *ngIf="activeTab()==='chat'">
        <div class="ch"><h2>Chat con usuarios</h2></div>
        <div class="chat-layout">
          <div class="conv-list">
            <div *ngFor="let c of conversations()" class="conv-item" [class.active]="selectedConv()?.id===c.id" (click)="openConversation(c)">
              <img [src]="c.profile_picture||'assets/avatar.png'" class="conv-av"><div class="conv-info"><strong>{{c.username}}</strong><p>{{c.last_message|slice:0:26}}</p></div>
              <span *ngIf="c.unread_count>0" class="unread-dot">{{c.unread_count}}</span>
            </div>
            <div *ngIf="!conversations().length" class="empty-sm"><span>💬</span><p>Sin conversaciones</p></div>
          </div>
          <div class="chat-win" *ngIf="selectedConv()">
            <div class="chat-win-hdr"><img [src]="selectedConv()?.profile_picture||'assets/avatar.png'" class="conv-av-sm"><strong>{{selectedConv()?.username}}</strong></div>
            <div class="chat-win-msgs">
              <div *ngFor="let m of adminMessages()" class="msg-row" [class.msg-me]="m.sender_id===myId" [class.msg-them]="m.sender_id!==myId">
                <div class="mb">{{m.message}}<span class="mt">{{formatTime(m.created_at)}}</span></div>
              </div>
            </div>
            <div class="chat-win-inp"><input type="text" [(ngModel)]="adminMsg" (keydown.enter)="sendAdminMsg()" placeholder="Responder..." class="form-control"><button class="btn btn-primary btn-sm" (click)="sendAdminMsg()"><i class="fas fa-paper-plane"></i></button></div>
          </div>
          <div *ngIf="!selectedConv()" class="empty-sm"><span>💬</span><p>Selecciona conversación</p></div>
        </div>
      </div>

      <!-- ── CAROUSEL ── -->
      <div *ngIf="activeTab()==='carousel'">
        <div class="ch"><h2>Carrusel</h2><button class="btn btn-primary btn-sm" (click)="openSlideForm()"><i class="fas fa-plus"></i> Nuevo slide</button></div>
        <div class="slides-list">
          <div *ngFor="let s of carouselSlides()" class="slide-card card">
            <div class="slide-prev" [style]="getSlideStyle(s)">
              <span *ngIf="s.display_mode==='emoji'||!s.display_mode" style="font-size:2rem">{{s.emoji||'🍪'}}</span>
              <img *ngIf="s.display_mode==='small_image'&&s.image_url" [src]="s.image_url" style="width:56px;height:56px;object-fit:cover;border-radius:8px">
              <span *ngIf="s.display_mode==='bg_image'" style="font-size:0.68rem;color:#fff;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.5)">IMG FONDO</span>
            </div>
            <div class="slide-info">
              <h4>{{s.title}}</h4>
              <p>{{s.subtitle}}</p>
              <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
                <span class="vpill" style="font-size:0.68rem">Orden: {{s.order_index}}</span>
                <span class="sst" [class.sst-on]="s.is_active">{{s.is_active?'Activo':'Inactivo'}}</span>
              </div>
            </div>
            <div class="abts"><button class="ab ab-e" (click)="editSlide(s)"><i class="fas fa-edit"></i></button><button class="ab ab-d" (click)="deleteSlide(s.id)"><i class="fas fa-trash"></i></button></div>
          </div>
          <div *ngIf="!carouselSlides().length" class="empty-sm"><span>🎠</span><p>Sin slides</p></div>
        </div>
      </div>

      <!-- ── WHY US ── -->
      <div *ngIf="activeTab()==='why_us'">
        <div class="ch"><h2>Sección "¿Por qué nosotros?"</h2></div>
        <div class="settings-card card">
          <div class="form-group"><label>Título de la sección</label><input type="text" [(ngModel)]="whyUsData.title" class="form-control"></div>
          <div *ngFor="let item of whyUsData.items; let i=index" class="why-item-box">
            <div class="row2">
              <div class="form-group"><label>Emoji</label><input type="text" [(ngModel)]="item.icon" class="form-control emoji-in"></div>
              <div class="form-group">
                <label>Imagen pequeña (opcional)</label>
                <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{item.image?'Cambiar':'Subir imagen'}}<input type="file" accept="image/*" class="fup-input" (change)="onWhyItemImage($event, i)"></label></div>
                <img *ngIf="item.image" [src]="item.image" style="width:44px;height:44px;object-fit:cover;border-radius:8px;margin-top:6px">
              </div>
            </div>
            <div class="row2">
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

      <!-- ── NAVBAR ── -->
      <div *ngIf="activeTab()==='navbar'">
        <div class="ch"><h2>Editar Navbar</h2></div>
        <div class="settings-card card">
          <label class="section-label">Posición del logo</label>
          <div class="nav-pos-selector">
            <button class="pos-btn" [class.active]="navbarData.logo_position==='left'" (click)="navbarData.logo_position='left'">
              <div class="pos-preview pos-left"><div class="pos-logo">Logo</div><div class="pos-links">Links</div><div class="pos-actions">···</div></div>
              <span>Izquierda</span>
            </button>
            <button class="pos-btn" [class.active]="navbarData.logo_position==='center'" (click)="navbarData.logo_position='center'">
              <div class="pos-preview pos-center"><div class="pos-links">Links</div><div class="pos-logo">Logo</div><div class="pos-actions">···</div></div>
              <span>Centro</span>
            </button>
            <button class="pos-btn" [class.active]="navbarData.logo_position==='right'" (click)="navbarData.logo_position='right'">
              <div class="pos-preview pos-right"><div class="pos-actions">···</div><div class="pos-links">Links</div><div class="pos-logo">Logo</div></div>
              <span>Derecha</span>
            </button>
          </div>
          <div class="row2 mt-md">
            <div class="form-group"><label>Ícono del logo</label><input type="text" [(ngModel)]="navbarData.logo_icon" class="form-control emoji-in"></div>
            <div class="form-group"><label>Texto del logo</label><input type="text" [(ngModel)]="navbarData.logo_text" class="form-control"></div>
          </div>
          <div class="check-row">
            <label class="chk"><input type="checkbox" [(ngModel)]="navbarData.show_cart"> Carrito</label>
            <label class="chk"><input type="checkbox" [(ngModel)]="navbarData.show_chat"> Chat</label>
            <label class="chk"><input type="checkbox" [(ngModel)]="navbarData.show_notifications"> Campana</label>
          </div>
          <p class="section-label" style="margin-top:16px">Links del navbar</p>
          <div *ngFor="let link of navbarData.links; let i=index" class="link-row">
            <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta" style="flex:0.8">
            <select [(ngModel)]="link.url" class="form-control" style="flex:1.2">
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/orders">📦 Mis Pedidos</option>
              <option value="/cart">🛍️ Carrito</option>
              <option value="/profile">👤 Perfil</option>
              <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
            </select>
            <label class="chk-sm"><input type="checkbox" [(ngModel)]="link.exact"> Exacto</label>
            <button class="ab ab-d" (click)="removeNavLink(i)"><i class="fas fa-times"></i></button>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" (click)="addNavLink()"><i class="fas fa-plus"></i> Agregar link</button>
            <button class="btn btn-primary" (click)="saveNavbar()"><i class="fas fa-save"></i> Guardar navbar</button>
          </div>
        </div>
      </div>

      <!-- ── FOOTER ── -->
      <div *ngIf="activeTab()==='footer'">
        <div class="ch"><h2>Editar Footer</h2></div>
        <div class="settings-card card">
          <div class="row2">
            <div class="form-group"><label>Ícono</label><input type="text" [(ngModel)]="footerData.brand_icon" class="form-control emoji-in"></div>
            <div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="footerData.brand_text" class="form-control"></div>
          </div>
          <div class="form-group"><label>Tagline</label><input type="text" [(ngModel)]="footerData.tagline" class="form-control"></div>
          <div class="form-group"><label>Copyright</label><input type="text" [(ngModel)]="footerData.copyright" class="form-control"></div>
          <p class="section-label" style="margin-top:16px">Links del footer</p>
          <div *ngFor="let link of footerData.links; let i=index" class="link-row link-row-footer">
            <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta" style="flex:0.7">
            <select [(ngModel)]="link.url" class="form-control" style="flex:1">
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/orders">📦 Mis Pedidos</option>
              <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
              <option value="_custom_">✏️ URL personalizada</option>
            </select>
            <input *ngIf="link.url==='_custom_'" type="text" [(ngModel)]="link.custom_url" class="form-control" placeholder="https://...">
            <input type="text" [(ngModel)]="link.icon" class="form-control" placeholder="fab fa-whatsapp" style="max-width:150px">
            <label class="chk-sm"><input type="checkbox" [(ngModel)]="link.external"> Ext.</label>
            <button class="ab ab-d" (click)="removeFooterLink(i)"><i class="fas fa-times"></i></button>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" (click)="addFooterLink()"><i class="fas fa-plus"></i> Agregar link</button>
            <button class="btn btn-primary" (click)="saveFooter()"><i class="fas fa-save"></i> Guardar footer</button>
          </div>
        </div>
      </div>

      <!-- ── PAGES ── -->
      <div *ngIf="activeTab()==='pages'">
        <div class="ch"><h2>Páginas</h2><button class="btn btn-primary btn-sm" (click)="openPageForm()"><i class="fas fa-plus"></i> Nueva</button></div>
        <div class="tscroll">
          <table class="atable">
            <thead><tr><th>Título</th><th>URL</th><th>Estado</th><th>En nav</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let pg of sitePages()">
                <td><strong>{{pg.title}}</strong></td>
                <td class="mono">/page/{{pg.slug}}</td>
                <td><span class="sst" [class.sst-on]="pg.is_active">{{pg.is_active?'Activa':'Inactiva'}}</span></td>
                <td><span class="sst" [class.sst-on]="pg.show_in_nav">{{pg.show_in_nav?'Sí':'No'}}</span></td>
                <td class="abts"><button class="ab ab-e" (click)="editPage(pg)"><i class="fas fa-edit"></i></button><button class="ab ab-d" (click)="deletePage(pg.id)"><i class="fas fa-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── SITE REVIEWS ── -->
      <div *ngIf="activeTab()==='site_reviews'">
        <div class="ch"><h2>Reseñas del sitio</h2></div>
        <div class="reviews-list">
          <div *ngFor="let r of siteReviews()" class="review-card card" [class.unread]="!r.is_read">
            <div class="rev-hdr">
              <img [src]="r.profile_picture||'assets/avatar.png'" class="timg round">
              <div><strong>{{r.username||'Anónimo'}}</strong><span class="rtype" [class]="'rt-'+r.type">{{getReviewLabel(r.type)}}</span></div>
              <div *ngIf="r.rating" class="stars-xs"><i *ngFor="let s of getStars(r.rating)" class="fas fa-star"></i></div>
              <span class="rev-date">{{r.created_at | date:'dd/MM/yy HH:mm'}}</span>
            </div>
            <p class="rev-comment">{{r.comment}}</p>
            <div class="abts">
              <button *ngIf="!r.is_read" class="btn btn-secondary btn-sm" (click)="markReviewRead(r.id)"><i class="fas fa-check"></i> Leído</button>
              <button class="btn btn-danger btn-sm" (click)="deleteSiteReview(r.id)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div *ngIf="!siteReviews().length" class="empty-sm"><span>⭐</span><p>Sin reseñas</p></div>
        </div>
      </div>

    </div><!-- /admin-content -->
  </div>

  <!-- ══ PRODUCT MODAL ══ -->
  <div *ngIf="showProductForm()" class="overlay">
    <div class="modal">
      <button class="mbtn-close" (click)="showProductForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingProduct()?'Editar':'Nuevo'}} Producto</h3>
      <div class="form-group"><label>Nombre *</label><input type="text" [(ngModel)]="productForm.name" class="form-control"></div>
      <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="productForm.description" class="form-control" rows="3"></textarea></div>
      <div class="row2">
        <div class="form-group"><label>Precio *</label><input type="number" [(ngModel)]="productForm.price" class="form-control"></div>
        <div class="form-group"><label>Stock</label><input type="number" [(ngModel)]="productForm.stock" class="form-control"></div>
      </div>
      <div class="form-group"><label>Categoría</label>
        <select [(ngModel)]="productForm.category_id" class="form-control">
          <option value="">Sin categoría</option>
          <option *ngFor="let c of categories()" [value]="c.id">{{c.name}}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Imágenes (puedes agregar varias)</label>
        <div class="fup-btn"><label class="fup-label" [class.fup-loading]="uploadingImg()"><i class="fas fa-images"></i> {{uploadingImg()?'Subiendo...':'Seleccionar imágenes'}}<input type="file" accept="image/*" multiple class="fup-input" (change)="onProductImagesChange($event)"></label></div>
        <div class="imgs-row"><img *ngFor="let img of productForm.images; let i=index" [src]="img" class="img-thumb"><button *ngFor="let img of productForm.images; let i=index" class="img-del" (click)="removeProductImg(i)" style="display:none"></button></div>
        <div class="imgs-row-del">
          <div *ngFor="let img of productForm.images; let i=index" class="img-wrap">
            <img [src]="img" class="img-thumb">
            <button class="img-del-btn" (click)="removeProductImg(i)" title="Eliminar"><i class="fas fa-times"></i></button>
          </div>
        </div>
      </div>
      <div class="form-group"><label class="chk"><input type="checkbox" [(ngModel)]="productForm.is_featured"> Producto destacado ⭐</label></div>
      <div class="mfooter">
        <button class="btn btn-secondary btn-sm" (click)="showProductForm.set(false)">Cancelar</button>
        <button class="btn btn-primary btn-sm" (click)="saveProduct()" [disabled]="savingProduct()">{{savingProduct()?'Guardando...':(editingProduct()?'Actualizar':'Crear')}}</button>
      </div>
    </div>
  </div>

  <!-- ══ SLIDE MODAL ══ -->
  <div *ngIf="showSlideForm()" class="overlay">
    <div class="modal modal-lg">
      <button class="mbtn-close" (click)="showSlideForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingSlide()?'Editar':'Nuevo'}} Slide del Carrusel</h3>

      <!-- Content type -->
      <div class="form-group">
        <label class="section-label">¿Qué mostrar a la derecha?</label>
        <div class="mode-sel">
          <button class="mode-btn" [class.active]="slideForm.display_mode==='emoji'" (click)="slideForm.display_mode='emoji'">😀<span>Emoji</span></button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='small_image'" (click)="slideForm.display_mode='small_image'">🖼️<span>Imagen lateral</span></button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='bg_image'" (click)="slideForm.display_mode='bg_image'">🌄<span>Imagen de fondo</span></button>
          <button class="mode-btn" [class.active]="slideForm.display_mode==='none'" (click)="slideForm.display_mode='none'">✖<span>Nada</span></button>
        </div>
      </div>

      <div *ngIf="slideForm.display_mode==='emoji'" class="form-group">
        <label>Emoji grande</label>
        <input type="text" [(ngModel)]="slideForm.emoji" class="form-control" style="font-size:2rem;text-align:center;max-width:90px" placeholder="🍪">
      </div>

      <div *ngIf="slideForm.display_mode==='small_image'||slideForm.display_mode==='bg_image'" class="form-group">
        <label>{{slideForm.display_mode==='bg_image'?'Imagen de fondo completo':'Imagen pequeña lateral'}}</label>
        <div class="fup-btn"><label class="fup-label" [class.fup-loading]="uploadingImg()"><i class="fas fa-upload"></i> {{uploadingImg()?'Subiendo...':(slideForm.image_url?'Cambiar imagen':'Subir imagen')}}<input type="file" class="fup-input" accept="image/*" (change)="onSlideImageChange($event)"></label></div>
        <img *ngIf="slideForm.image_url" [src]="slideForm.image_url" style="max-width:100%;max-height:110px;object-fit:cover;border-radius:12px;margin-top:8px">
      </div>

      <!-- Background builder -->
      <div class="form-group" *ngIf="slideForm.display_mode!=='bg_image'">
        <label class="section-label">Fondo del slide</label>
        <div class="bg-type-sel">
          <button class="mode-btn" [class.active]="slideBgMode==='gradient'" (click)="slideBgMode='gradient'">🌈<span>Gradiente</span></button>
          <button class="mode-btn" [class.active]="slideBgMode==='solid'" (click)="slideBgMode='solid'">🎨<span>Color sólido</span></button>
        </div>

        <!-- Gradient builder -->
        <div *ngIf="slideBgMode==='gradient'" class="gradient-builder">
          <div class="gb-direction">
            <label>Dirección</label>
            <div class="dir-btns">
              <button *ngFor="let d of gradientDirs" class="dir-btn" [class.active]="slideGradientDir===d.value" (click)="slideGradientDir=d.value; buildGradient()" [title]="d.label">{{d.icon}}</button>
            </div>
          </div>
          <div class="gb-colors">
            <label>Colores</label>
            <div class="color-stops">
              <div *ngFor="let stop of slideColorStops; let i=index" class="color-stop-row">
                <input type="color" [(ngModel)]="stop.color" (ngModelChange)="buildGradient()" class="color-picker">
                <input type="number" [(ngModel)]="stop.pos" (ngModelChange)="buildGradient()" class="form-control pos-input" min="0" max="100" placeholder="0">
                <span style="font-size:0.78rem;color:var(--text-light)">%</span>
                <button *ngIf="slideColorStops.length>2" class="ab ab-d" (click)="removeColorStop(i)"><i class="fas fa-times"></i></button>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="addColorStop()"><i class="fas fa-plus"></i> Color</button>
            </div>
          </div>
          <div class="gradient-preview-box" [style.background]="slideForm.bg_gradient">
            <span style="font-size:0.75rem;color:rgba(0,0,0,0.5);padding:4px 8px;background:rgba(255,255,255,0.4);border-radius:6px">Vista previa</span>
          </div>
        </div>

        <!-- Solid color -->
        <div *ngIf="slideBgMode==='solid'" class="solid-picker">
          <input type="color" [(ngModel)]="slideForm.bg_color" (ngModelChange)="slideForm.bg_gradient=''" class="color-picker-lg">
          <div class="gradient-preview-box" [style.background]="slideForm.bg_color"></div>
        </div>
      </div>

      <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="slideForm.title" class="form-control"></div>
      <div class="form-group"><label>Subtítulo / Tag</label><input type="text" [(ngModel)]="slideForm.subtitle" class="form-control" placeholder="✨ Artesanal & Fresco"></div>
      <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="slideForm.description" class="form-control" rows="2"></textarea></div>
      <div class="row2">
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
      <div class="row2">
        <div class="form-group"><label>Orden de aparición</label><input type="number" [(ngModel)]="slideForm.order_index" class="form-control" min="0"></div>
        <div class="form-group" style="display:flex;align-items:flex-end"><label class="chk"><input type="checkbox" [(ngModel)]="slideForm.is_active"> Activo</label></div>
      </div>
      <div class="mfooter">
        <button class="btn btn-secondary btn-sm" (click)="showSlideForm.set(false)">Cancelar</button>
        <button class="btn btn-primary btn-sm" (click)="saveSlide()">{{editingSlide()?'Actualizar':'Crear slide'}}</button>
      </div>
    </div>
  </div>

  <!-- ══ PAGE MODAL ══ -->
  <div *ngIf="showPageForm()" class="overlay">
    <div class="modal modal-lg">
      <button class="mbtn-close" (click)="showPageForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingPage()?'Editar':'Nueva'}} Página</h3>
      <div class="row2">
        <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="pageForm.title" class="form-control"></div>
        <div class="form-group"><label>Slug *</label><input type="text" [(ngModel)]="pageForm.slug" class="form-control" placeholder="mi-pagina"></div>
      </div>
      <div class="check-row">
        <label class="chk"><input type="checkbox" [(ngModel)]="pageForm.is_active"> Activa</label>
        <label class="chk"><input type="checkbox" [(ngModel)]="pageForm.show_in_nav"> En navbar</label>
      </div>
      <p class="section-label" style="margin-top:16px">Secciones</p>
      <div *ngFor="let sec of pageForm.sections; let i=index" class="sec-block">
        <div class="sec-hdr">
          <select [(ngModel)]="sec.type" class="form-control" style="flex:1">
            <option value="text">📝 Texto</option>
            <option value="banner">🖼️ Banner con imagen</option>
            <option value="products_all">🍪 Todos los productos</option>
            <option value="products_featured">⭐ Productos destacados</option>
            <option value="products_specific">🎯 Producto específico</option>
          </select>
          <button class="ab ab-d" (click)="removePageSection(i)"><i class="fas fa-trash"></i></button>
        </div>
        <div *ngIf="sec.type==='text'">
          <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="sec.title" class="form-control"></div>
          <div class="form-group"><label>Contenido</label><textarea [(ngModel)]="sec.content" class="form-control" rows="3"></textarea></div>
        </div>
        <div *ngIf="sec.type==='banner'">
          <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="sec.title" class="form-control"></div>
          <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="sec.description" class="form-control" rows="2"></textarea></div>
          <div class="form-group">
            <label>Imagen del banner</label>
            <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{sec.image?'Cambiar imagen':'Subir imagen'}}<input type="file" class="fup-input" accept="image/*" (change)="onSectionImageChange($event,i)"></label></div>
            <img *ngIf="sec.image" [src]="sec.image" style="max-width:160px;border-radius:10px;margin-top:7px">
          </div>
          <div class="row2">
            <div class="form-group"><label>Texto botón</label><input type="text" [(ngModel)]="sec.button_text" class="form-control"></div>
            <div class="form-group"><label>Destino</label>
              <select [(ngModel)]="sec.button_url" class="form-control">
                <option value="/products">🍪 Productos</option>
                <option value="/">🏠 Inicio</option>
                <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
              </select>
            </div>
          </div>
        </div>
        <div *ngIf="sec.type==='products_all'||sec.type==='products_featured'">
          <div class="form-group"><label>Título de sección (opcional)</label><input type="text" [(ngModel)]="sec.title" class="form-control"></div>
          <div class="check-row">
            <label class="chk"><input type="checkbox" [(ngModel)]="sec.show_price" [ngModelOptions]="{standalone:true}"> Mostrar precio</label>
            <label class="chk"><input type="checkbox" [(ngModel)]="sec.show_description"> Mostrar descripción</label>
          </div>
        </div>
        <div *ngIf="sec.type==='products_specific'">
          <div class="form-group"><label>Producto</label>
            <select [(ngModel)]="sec.product_id" class="form-control">
              <option value="">Selecciona...</option>
              <option *ngFor="let p of allProducts()" [value]="p.id">{{p.name}} — $ {{p.price|number:'1.0-0'}}</option>
            </select>
          </div>
          <div class="check-row">
            <label class="chk"><input type="checkbox" [(ngModel)]="sec.show_image"> Mostrar imagen</label>
            <label class="chk"><input type="checkbox" [(ngModel)]="sec.show_price"> Mostrar precio</label>
            <label class="chk"><input type="checkbox" [(ngModel)]="sec.show_description"> Mostrar descripción</label>
          </div>
          <div class="form-group"><label>Descripción personalizada</label><textarea [(ngModel)]="sec.custom_description" class="form-control" rows="2" placeholder="Deja vacío para usar la original"></textarea></div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('text')"><i class="fas fa-plus"></i> Texto</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('banner')"><i class="fas fa-plus"></i> Banner</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('products_all')"><i class="fas fa-plus"></i> Productos</button>
        <button class="btn btn-secondary btn-sm" (click)="addPageSection('products_specific')"><i class="fas fa-plus"></i> Prod. específico</button>
      </div>
      <div class="mfooter">
        <button class="btn btn-secondary btn-sm" (click)="showPageForm.set(false)">Cancelar</button>
        <button class="btn btn-primary" (click)="savePage()">{{editingPage()?'Actualizar':'Crear página'}}</button>
      </div>
    </div>
  </div>

  <!-- ══ USER PROFILE MODAL ══ -->
  <div *ngIf="viewingUser()" class="overlay">
    <div class="modal">
      <button class="mbtn-close" (click)="viewingUser.set(null)"><i class="fas fa-times"></i></button>
      <div class="user-view">
        <img [src]="viewingUser()!.profile_picture||'assets/avatar.png'" class="user-av-lg">
        <h3>{{viewingUser()!.full_name||viewingUser()!.username}}</h3>
        <span class="role-tag" [class.admin-tag]="viewingUser()!.role==='admin'">{{viewingUser()!.role}}</span>
        <div class="info-grid">
          <div class="info-cell"><i class="fas fa-user"></i>{{viewingUser()!.username}}</div>
          <div class="info-cell"><i class="fas fa-envelope"></i>{{viewingUser()!.email}}</div>
          <div *ngIf="viewingUser()!.phone" class="info-cell"><i class="fas fa-phone"></i>{{viewingUser()!.phone}}</div>
          <div *ngIf="viewingUser()!.ambiente_number" class="info-cell"><i class="fas fa-door-open"></i>Amb. {{viewingUser()!.ambiente_number}}</div>
          <div *ngIf="viewingUser()!.schedule" class="info-cell"><i class="fas fa-clock"></i>{{viewingUser()!.schedule}}</div>
          <div class="info-cell"><i class="fas fa-calendar"></i>{{viewingUser()!.created_at|date:'dd/MM/yyyy'}}</div>
        </div>
        <button class="btn btn-primary mt-md" (click)="openChatWithUser(viewingUser()!);viewingUser.set(null)"><i class="fas fa-comment"></i> Enviar mensaje</button>
      </div>
    </div>
  </div>

  <!-- ══ ORDER DETAIL MODAL ══ -->
  <div *ngIf="viewingOrder()" class="overlay">
    <div class="modal modal-lg">
      <button class="mbtn-close" (click)="viewingOrder.set(null)"><i class="fas fa-times"></i></button>
      <h3>Detalle del Pedido</h3>
      <div class="order-detail-grid">
        <div>
          <p class="section-label">Cliente</p>
          <div class="client-card">
            <img [src]="viewingOrder()!.profile_picture||'assets/avatar.png'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0">
            <div>
              <strong>{{viewingOrder()!.full_name||viewingOrder()!.username}}</strong>
              <p>{{viewingOrder()!.email}}</p>
              <p *ngIf="viewingOrder()!.phone"><i class="fas fa-phone"></i> {{viewingOrder()!.phone}}</p>
              <p *ngIf="viewingOrder()!.ambiente_number"><i class="fas fa-door-open"></i> Amb. {{viewingOrder()!.ambiente_number}}</p>
              <p *ngIf="viewingOrder()!.schedule"><i class="fas fa-clock"></i> {{viewingOrder()!.schedule}}</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm mt-md" (click)="openChatWithUser(viewingOrder()!);viewingOrder.set(null)"><i class="fas fa-comment"></i> Mensaje</button>
        </div>
        <div>
          <p class="section-label">Productos comprados</p>
          <div *ngFor="let item of (viewingOrder()!.items||[])" class="det-item">
            <img [src]="(item.images&&item.images[0])||'assets/cookie-placeholder.png'" style="width:44px;height:44px;border-radius:8px;object-fit:cover">
            <div style="flex:1"><strong>{{item.name}}</strong><p style="font-size:0.78rem;color:var(--text-light);margin:0">×{{item.quantity}} — $ {{item.unit_price|number:'1.0-0'}} c/u</p></div>
            <strong style="color:var(--warm-capuchino)">$ {{item.unit_price*item.quantity|number:'1.0-0'}}</strong>
          </div>
          <div class="det-total">
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
    /* ─ Layout ─ */
    .admin-page { background: var(--almond-light); min-height: 100vh; }
    .admin-header { background: linear-gradient(135deg, var(--mocca-bean), var(--caramel-roast)); color:#fff; padding:46px 0 26px; }
    .admin-header h1 { color:#fff; margin-bottom:4px; font-size:clamp(1.3rem,3vw,2rem); }
    .admin-header p { opacity:.7; font-size:.88rem; }
    .admin-layout { display:grid; grid-template-columns:190px 1fr; gap:18px; padding:24px 0 48px; align-items:start; }
    .sidebar-toggle { display:none; margin-bottom:10px; }
    .admin-sidebar { background:#fff; border-radius:var(--radius-lg); padding:12px; box-shadow:var(--shadow-sm); position:sticky; top:84px; }
    .slbl { font-size:.65rem; font-weight:700; text-transform:uppercase; color:var(--text-light); letter-spacing:.7px; padding:10px 6px 3px; }
    .tab-btn { width:100%; padding:9px 11px; border:none; background:none; cursor:pointer; font-size:.82rem; font-weight:600; color:var(--text-mid); border-radius:var(--radius-sm); display:flex; align-items:center; gap:8px; transition:all var(--transition); text-align:left; margin-bottom:2px; }
    .tab-btn span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tab-btn:hover { background:var(--almond-light); color:var(--warm-capuchino); }
    .tab-btn.active { background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); color:#fff; }
    .admin-content { background:#fff; border-radius:var(--radius-lg); padding:22px; box-shadow:var(--shadow-sm); min-width:0; }
    .ch { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
    .ch h2 { color:var(--mocca-bean); font-size:1.2rem; }
    /* Table */
    .tscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:var(--radius-md); }
    .atable { width:100%; border-collapse:collapse; font-size:.81rem; min-width:480px; }
    .atable th { background:var(--almond-light); padding:9px 11px; text-align:left; font-weight:700; color:var(--text-mid); font-size:.71rem; text-transform:uppercase; white-space:nowrap; }
    .atable td { padding:9px 11px; border-bottom:1px solid var(--almond-light); vertical-align:middle; }
    .timg { width:38px; height:38px; border-radius:var(--radius-sm); object-fit:cover; }
    .timg.round { border-radius:50%; }
    .stk { padding:2px 7px; border-radius:var(--radius-full); background:var(--success); color:#fff; font-size:.7rem; font-weight:700; }
    .stk-low { background:var(--error); }
    .feat { cursor:pointer; font-size:1.1rem; }
    .feat-on { filter:drop-shadow(0 0 3px gold); }
    .abts { display:flex; gap:4px; flex-wrap:wrap; }
    .ab { width:28px; height:28px; border:none; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:.76rem; transition:all var(--transition); flex-shrink:0; }
    .ab-e { background:#e8f0fe; color:#1967d2; }
    .ab-e:hover { background:#1967d2; color:#fff; }
    .ab-d { background:#fde8e8; color:var(--error); }
    .ab-d:hover { background:var(--error); color:#fff; }
    .ucell { display:flex; align-items:center; gap:7px; }
    .blk { display:block; font-size:.71rem; color:var(--text-light); }
    .role-tag { font-size:.68rem; color:var(--text-light); display:block; }
    .admin-tag { color:var(--warm-capuchino); font-weight:700; }
    .mono { font-family:monospace; font-size:.72rem; }
    .status-sel { padding:4px 7px; border:1px solid var(--almond); border-radius:6px; font-size:.76rem; max-width:130px; }
    .status-badge,.sb-pending,.sb-processing,.sb-completed,.sb-cancelled { padding:3px 8px; border-radius:var(--radius-full); font-size:.7rem; font-weight:700; }
    .sb-pending { background:#fff3e0;color:#f57c00; }
    .sb-processing { background:#e3f2fd;color:#1976d2; }
    .sb-completed { background:#e8f5e9;color:#388e3c; }
    .sb-cancelled { background:#fde8e8;color:var(--error); }
    .vtabs { display:flex; gap:5px; flex-wrap:wrap; }
    .vpill { padding:4px 12px; border-radius:var(--radius-full); border:2px solid var(--almond); background:none; cursor:pointer; font-size:.76rem; font-weight:600; color:var(--text-mid); transition:all var(--transition); }
    .vpill.active { background:var(--warm-capuchino); border-color:var(--warm-capuchino); color:#fff; }
    /* Products column in orders */
    .td-prods { max-width:200px; }
    .prod-mini { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
    .prod-mini-img { width:30px; height:30px; border-radius:6px; object-fit:cover; flex-shrink:0; }
    .prod-mini-name { display:block; font-size:.78rem; font-weight:600; color:var(--text-dark); }
    .prod-mini-qty { display:block; font-size:.71rem; color:var(--text-light); }
    /* Chat */
    .chat-layout { display:grid; grid-template-columns:220px 1fr; gap:14px; height:440px; }
    .conv-list { border:1px solid var(--almond); border-radius:var(--radius-md); overflow-y:auto; }
    .conv-item { display:flex; align-items:center; gap:7px; padding:10px; cursor:pointer; transition:background var(--transition); border-bottom:1px solid var(--almond-light); }
    .conv-item:hover,.conv-item.active { background:var(--almond-light); }
    .conv-av { width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0; }
    .conv-av-sm { width:24px; height:24px; border-radius:50%; object-fit:cover; }
    .conv-info { flex:1; overflow:hidden; }
    .conv-info strong { font-size:.82rem; display:block; }
    .conv-info p { font-size:.7rem; color:var(--text-light); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0; }
    .unread-dot { background:var(--warm-capuchino); color:#fff; border-radius:50%; width:16px; height:16px; font-size:.62rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .chat-win { border:1px solid var(--almond); border-radius:var(--radius-md); display:flex; flex-direction:column; overflow:hidden; }
    .chat-win-hdr { display:flex; align-items:center; gap:7px; padding:9px 12px; background:var(--almond-light); border-bottom:1px solid var(--almond); font-size:.88rem; }
    .chat-win-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:6px; background:#f8f4f0; }
    .chat-win-inp { display:flex; gap:7px; padding:9px; border-top:1px solid var(--almond); }
    .msg-row { display:flex; max-width:80%; }
    .msg-me { align-self:flex-end; }
    .msg-them { align-self:flex-start; }
    .mb { padding:7px 11px; border-radius:13px; font-size:.81rem; line-height:1.5; }
    .msg-me .mb { background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); color:#fff; border-bottom-right-radius:3px; }
    .msg-them .mb { background:#fff; color:var(--text-dark); border-bottom-left-radius:3px; box-shadow:var(--shadow-sm); }
    .mt { display:block; font-size:.58rem; opacity:.55; text-align:right; margin-top:2px; }
    /* Carousel */
    .slides-list { display:flex; flex-direction:column; gap:12px; }
    .slide-card { display:flex; align-items:center; gap:13px; padding:14px; }
    .slide-prev { width:86px; height:60px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
    .slide-info { flex:1; min-width:0; }
    .slide-info h4 { color:var(--mocca-bean); font-size:.92rem; margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .slide-info p { font-size:.76rem; color:var(--text-light); }
    .sst { font-size:.68rem; padding:2px 7px; border-radius:var(--radius-full); background:#fde8e8; color:var(--error); font-weight:700; }
    .sst-on { background:#e8f5e9; color:#388e3c; }
    /* Settings */
    .settings-card { padding:22px; }
    .section-label { font-size:.82rem; font-weight:700; color:var(--text-mid); display:block; margin-bottom:8px; }
    .row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .mini-card { background:var(--almond-light); padding:16px; border-radius:var(--radius-md); margin-bottom:14px; }
    .check-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:12px; }
    .chk { display:flex; align-items:center; gap:6px; cursor:pointer; font-size:.86rem; font-weight:600; color:var(--text-mid); }
    .chk-sm { display:flex; align-items:center; gap:5px; cursor:pointer; font-size:.76rem; font-weight:600; color:var(--text-mid); white-space:nowrap; }
    .link-row { display:flex; gap:7px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
    .link-row-footer { flex-wrap:wrap; }
    .btn-row { display:flex; gap:9px; flex-wrap:wrap; margin-top:10px; }
    .divider { border:none; border-top:1px solid var(--almond); margin:12px 0; }
    .cats-grid { display:flex; flex-wrap:wrap; gap:8px; }
    .cat-chip { display:flex; align-items:center; gap:7px; padding:7px 14px; background:var(--almond-light); border-radius:var(--radius-full); font-size:.82rem; font-weight:600; color:var(--text-mid); }
    .cat-chip button { background:none; border:none; cursor:pointer; color:var(--error); font-size:.7rem; }
    /* Navbar position selector */
    .nav-pos-selector { display:flex; gap:12px; flex-wrap:wrap; }
    .pos-btn { border:2px solid var(--almond); background:#fff; border-radius:var(--radius-md); padding:10px 14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:8px; transition:all var(--transition); min-width:120px; }
    .pos-btn.active { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .pos-btn span { font-size:.78rem; font-weight:600; color:var(--text-mid); }
    .pos-preview { display:flex; align-items:center; gap:4px; height:22px; width:100px; background:var(--almond-light); border-radius:4px; padding:2px 5px; }
    .pos-logo { background:var(--warm-capuchino); border-radius:3px; padding:2px 6px; font-size:.55rem; color:#fff; font-weight:700; white-space:nowrap; }
    .pos-links { background:#d8c5a5; border-radius:3px; padding:2px 7px; font-size:.55rem; color:#fff; font-weight:700; flex:1; text-align:center; }
    .pos-actions { font-size:.65rem; color:var(--text-light); }
    .pos-center { justify-content:space-between; }
    .pos-right { justify-content:space-between; }
    .mt-md { margin-top:16px; }
    /* Why us */
    .why-item-box { margin-bottom:4px; }
    .emoji-in { font-size:1.3rem !important; text-align:center; max-width:80px; }
    /* File upload button */
    .fup-btn { margin-bottom:4px; }
    .fup-label {
      display:inline-flex; align-items:center; gap:8px;
      padding:10px 18px; border-radius:var(--radius-full);
      background:var(--almond-light); border:2px dashed var(--almond);
      cursor:pointer; font-size:.86rem; font-weight:600; color:var(--text-mid);
      transition:all var(--transition); width:100%; justify-content:center;
      position:relative; overflow:hidden;
    }
    .fup-label:hover { border-color:var(--warm-capuchino); color:var(--warm-capuchino); background:#fff; }
    .fup-label.fup-loading { opacity:.6; cursor:wait; }
    .fup-input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
    /* Image grid */
    .imgs-row { display:none; }
    .imgs-row-del { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
    .img-wrap { position:relative; }
    .img-thumb { width:56px; height:56px; object-fit:cover; border-radius:var(--radius-sm); border:2px solid var(--almond); display:block; }
    .img-del-btn { position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%; background:var(--error); border:none; cursor:pointer; color:#fff; font-size:.6rem; display:flex; align-items:center; justify-content:center; }
    /* Gradient builder */
    .gradient-builder { background:var(--almond-light); border-radius:var(--radius-md); padding:14px; margin-top:8px; }
    .bg-type-sel { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; margin-bottom:12px; }
    .mode-sel { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
    .mode-btn { padding:8px 14px; border-radius:var(--radius-full); border:2px solid var(--almond); background:none; cursor:pointer; font-size:.82rem; font-weight:600; transition:all var(--transition); color:var(--text-mid); display:flex; align-items:center; gap:6px; flex-direction:column; min-width:72px; text-align:center; }
    .mode-btn span { font-size:.72rem; }
    .mode-btn.active { border-color:var(--warm-capuchino); background:var(--warm-capuchino); color:#fff; }
    .gb-direction label, .gb-colors label { font-size:.78rem; font-weight:700; color:var(--text-mid); display:block; margin-bottom:6px; }
    .dir-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
    .dir-btn { width:34px; height:34px; border:2px solid var(--almond); background:#fff; border-radius:8px; cursor:pointer; font-size:1rem; transition:all var(--transition); display:flex; align-items:center; justify-content:center; }
    .dir-btn.active { border-color:var(--warm-capuchino); background:var(--warm-capuchino); filter:brightness(0) invert(1); }
    .color-stops { display:flex; flex-direction:column; gap:7px; margin-bottom:10px; }
    .color-stop-row { display:flex; align-items:center; gap:8px; }
    .color-picker { width:40px; height:36px; border:2px solid var(--almond); border-radius:8px; cursor:pointer; padding:2px; background:none; flex-shrink:0; }
    .pos-input { max-width:58px; text-align:center; flex-shrink:0; }
    .gradient-preview-box { height:56px; border-radius:var(--radius-md); margin-top:10px; border:1px solid var(--almond); display:flex; align-items:center; justify-content:center; }
    .solid-picker { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:8px; }
    .color-picker-lg { width:52px; height:48px; border:2px solid var(--almond); border-radius:10px; cursor:pointer; padding:3px; flex-shrink:0; }
    /* Pages */
    .sec-block { background:var(--almond-light); padding:14px; border-radius:var(--radius-md); margin-bottom:10px; }
    .sec-hdr { display:flex; gap:8px; align-items:center; margin-bottom:10px; }
    /* Reviews */
    .reviews-list { display:flex; flex-direction:column; gap:12px; }
    .review-card { padding:16px; }
    .unread { border-left:3px solid var(--warm-capuchino); }
    .rev-hdr { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
    .rtype { padding:2px 9px; border-radius:var(--radius-full); font-size:.68rem; font-weight:700; }
    .rt-review { background:#e3f2fd;color:#1976d2; }
    .rt-complaint { background:#fde8e8;color:var(--error); }
    .rt-suggestion { background:#e8f5e9;color:#388e3c; }
    .rev-date { font-size:.7rem; color:var(--text-light); margin-left:auto; }
    .rev-comment { font-size:.87rem; color:var(--text-mid); line-height:1.6; margin-bottom:9px; }
    .stars-xs .fa-star { color:var(--caramel); font-size:.75rem; }
    /* Modals */
    .mbtn-close { position:absolute; top:13px; right:13px; background:none; border:none; cursor:pointer; font-size:1rem; color:var(--text-light); padding:4px; border-radius:4px; }
    .mbtn-close:hover { color:var(--error); background:#fde8e8; }
    .mfooter { display:flex; gap:9px; justify-content:flex-end; margin-top:18px; padding-top:14px; border-top:1px solid var(--almond); }
    .empty-sm { text-align:center; padding:36px 12px; color:var(--text-light); font-size:.82rem; }
    .empty-sm span { font-size:2rem; display:block; margin-bottom:6px; }
    /* User profile modal */
    .user-view { text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; }
    .user-av-lg { width:88px; height:88px; border-radius:50%; object-fit:cover; border:4px solid var(--almond); }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; width:100%; margin-top:10px; text-align:left; }
    .info-cell { display:flex; align-items:center; gap:7px; padding:7px 10px; background:var(--almond-light); border-radius:var(--radius-md); font-size:.8rem; color:var(--text-mid); }
    .info-cell i { color:var(--warm-capuchino); width:13px; flex-shrink:0; }
    /* Order detail */
    .order-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .client-card { display:flex; gap:12px; align-items:flex-start; padding:13px; background:var(--almond-light); border-radius:var(--radius-lg); margin-top:8px; }
    .client-card p { font-size:.8rem; color:var(--text-mid); margin:2px 0; }
    .det-item { display:flex; align-items:center; gap:9px; padding:8px 0; border-bottom:1px solid var(--almond-light); }
    .det-total { display:flex; align-items:center; gap:14px; padding:12px 0; flex-wrap:wrap; }
    .det-total strong { color:var(--warm-capuchino); font-size:1.05rem; font-family:var(--font-display); }
    .det-total span { font-size:.78rem; color:var(--text-light); }

    /* ─── RESPONSIVE ─── */
    @media (max-width:900px) {
      .admin-layout { grid-template-columns:1fr; padding:14px 0 32px; }
      .sidebar-toggle { display:flex; }
      .admin-sidebar { display:none; position:static; border-radius:var(--radius-md); }
      .admin-sidebar.open { display:block; }
      .row2 { grid-template-columns:1fr; gap:0; }
      .chat-layout { grid-template-columns:1fr; height:auto; }
      .chat-layout .conv-list { max-height:180px; }
      .chat-layout .chat-win { height:280px; }
      .info-grid { grid-template-columns:1fr; }
      .order-detail-grid { grid-template-columns:1fr; }
      .nav-pos-selector { gap:8px; }
      .pos-btn { min-width:90px; }
    }
    @media (max-width:600px) {
      .admin-header { padding:32px 0 18px; }
      .admin-content { padding:16px; }
      .ch { flex-direction:column; align-items:flex-start; }
      .vtabs { width:100%; }
      .link-row, .link-row-footer { flex-direction:column; align-items:stretch; }
      .link-row .form-control, .link-row-footer .form-control { width:100% !important; max-width:none !important; }
      .atable { font-size:.75rem; }
      .atable th,.atable td { padding:7px 8px; }
      .mode-btn { min-width:60px; padding:6px 10px; }
      .mode-btn span { font-size:.65rem; }
      .gradient-builder { padding:10px; }
      .dir-btn { width:28px; height:28px; font-size:.85rem; }
    }
    @media (max-width:400px) {
      .admin-content { padding:12px; }
      .nav-pos-selector { flex-direction:column; }
      .pos-btn { width:100%; flex-direction:row; padding:8px 12px; }
    }
  `]
})
export class AdminComponent implements OnInit {
  activeTab = signal<Tab>('products');
  products = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
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
  editingProduct = signal<Product|null>(null);
  editingSlide = signal<any>(null);
  editingPage = signal<any>(null);
  viewingUser = signal<User|null>(null);
  viewingOrder = signal<any>(null);
  savingProduct = signal(false);
  uploadingImg = signal(false);
  showCatForm = false;
  sidebarOpen = false;
  adminMsg = '';
  orderView = signal<'active'|'archived'|'deleted'>('active');
  slideBgMode = 'gradient';

  // Gradient builder
  slideGradientDir = 'to right';
  slideColorStops = [{ color: '#F5E6D3', pos: 0 }, { color: '#E8C99A', pos: 100 }];
  gradientDirs = [
    { label: 'Arriba', value: 'to top', icon: '⬆️' },
    { label: 'Diagonal ↗', value: 'to top right', icon: '↗️' },
    { label: 'Derecha', value: 'to right', icon: '➡️' },
    { label: 'Diagonal ↘', value: 'to bottom right', icon: '↘️' },
    { label: 'Abajo', value: 'to bottom', icon: '⬇️' },
    { label: 'Diagonal ↙', value: 'to bottom left', icon: '↙️' },
    { label: 'Izquierda', value: 'to left', icon: '⬅️' },
    { label: 'Diagonal ↖', value: 'to top left', icon: '↖️' },
  ];

  get myId() { return this.auth.currentUser()?.id || ''; }

  productForm: any = { name:'', description:'', price:0, stock:0, images:[], is_featured:false };
  slideForm: any = { title:'', subtitle:'', description:'', button_text:'Ver más', button_url:'/products', image_url:'', bg_gradient:'linear-gradient(to right,#F5E6D3 0%,#E8C99A 100%)', bg_color:'', order_index:0, is_active:true, display_mode:'emoji', emoji:'🍪' };
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
    const p = view !== 'active' ? `?${view}=true` : '';
    this.http.get<Order[]>(`${environment.apiUrl}/orders${p}`).subscribe(o => this.orders.set(o));
  }

  // Products
  openProductForm() { this.editingProduct.set(null); this.productForm = { name:'', description:'', price:0, stock:0, images:[], is_featured:false }; this.showProductForm.set(true); }
  editProduct(p:Product) { this.editingProduct.set(p); this.productForm = { ...p, images:[...(p.images||[])] }; this.showProductForm.set(true); }
  async onProductImagesChange(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (!files.length) return;
    this.uploadingImg.set(true);
    for (const file of files) {
      const b64 = await this.uploadService.fileToBase64(file);
      await new Promise<void>((resolve) => {
        this.uploadService.uploadImage(b64, 'star-crumbs/products').subscribe({
          next: r => { this.productForm.images = [...(this.productForm.images||[]), r.url]; resolve(); },
          error: () => { this.toast.error('Error al subir una imagen'); resolve(); }
        });
      });
    }
    this.uploadingImg.set(false);
    this.toast.success(`${files.length} imagen(es) subida(s) ✅`);
  }
  removeProductImg(i:number) { this.productForm.images = this.productForm.images.filter((_:any, idx:number) => idx !== i); }
  saveProduct() {
    if (!this.productForm.name) { this.toast.error('El nombre es requerido'); return; }
    this.savingProduct.set(true);
    const obs = this.editingProduct() ? this.productService.update(this.editingProduct()!.id, this.productForm) : this.productService.create(this.productForm);
    obs.subscribe({
      next: () => { this.savingProduct.set(false); this.showProductForm.set(false); this.toast.success('Producto guardado ✅'); this.productService.getAll().subscribe(p => { this.products.set(p); this.allProducts.set(p); }); },
      error: () => { this.savingProduct.set(false); this.toast.error('Error al guardar'); }
    });
  }
  deleteProduct(id:string) { if(!confirm('¿Eliminar?')) return; this.productService.delete(id).subscribe({next:()=>{this.toast.success('Eliminado');this.productService.getAll().subscribe(p=>{this.products.set(p);this.allProducts.set(p);});}}); }
  toggleFeatured(p:Product) { this.productService.update(p.id,{is_featured:!p.is_featured}).subscribe({next:()=>this.productService.getAll().subscribe(pr=>this.products.set(pr))}); }

  // Categories
  createCategory() { if(!this.newCat.name||!this.newCat.slug){this.toast.error('Nombre y slug requeridos');return;} this.http.post<Category>(`${environment.apiUrl}/categories`,this.newCat).subscribe({next:()=>{this.toast.success('Creada');this.newCat={name:'',slug:''};this.showCatForm=false;this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c=>this.categories.set(c));}}); }
  deleteCategory(id:string) { this.http.delete(`${environment.apiUrl}/categories/${id}`).subscribe({next:()=>this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c=>this.categories.set(c))}); }

  // Orders
  updateOrderStatus(id:string, status:string) { this.http.put(`${environment.apiUrl}/orders/${id}/status`,{status}).subscribe({next:()=>this.toast.success('Estado actualizado')}); }
  archiveOrder(id:string) { this.http.put(`${environment.apiUrl}/orders/${id}/archive`,{}).subscribe({next:()=>{this.toast.success('Archivado');this.loadOrders('active');}}); }
  restoreOrder(id:string) { this.http.put(`${environment.apiUrl}/orders/${id}/restore`,{}).subscribe({next:()=>{this.toast.success('Restaurado');this.loadOrders(this.orderView());}}); }
  softDeleteOrder(id:string) { if(!confirm('¿Eliminar pedido?')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/admin`).subscribe({next:()=>{this.toast.success('Eliminado');this.loadOrders('active');}}); }
  permanentDeleteOrder(id:string) { if(!confirm('¿Eliminar permanentemente?')) return; this.http.delete(`${environment.apiUrl}/orders/${id}/permanent`).subscribe({next:()=>{this.toast.success('Eliminado definitivo');this.loadOrders('deleted');}}); }
  viewOrderDetail(o:any) { this.viewingOrder.set(o); }
  viewUserProfile(u:User) { this.viewingUser.set(u); }

  // Chat
  openConversation(c:any) { this.selectedConv.set(c); this.chatService.loadHistory(c.id).subscribe(m=>this.adminMessages.set(m)); this.chatService.markRead(c.id).subscribe(); }
  openChatWithUser(u:any) {
    const uid = u.user_id||u.id;
    const userObj = this.users().find(x=>x.id===uid)||u;
    this.selectedConv.set({id:uid,username:userObj.username||u.username,profile_picture:userObj.profile_picture||u.profile_picture});
    this.chatService.loadHistory(uid).subscribe(m=>this.adminMessages.set(m));
    this.setTab('chat');
  }
  sendAdminMsg() {
    const text=this.adminMsg.trim(); if(!text||!this.selectedConv()) return;
    this.adminMessages.update((m:ChatMessage[])=>[...m,{sender_id:this.myId,message:text,created_at:new Date().toISOString()}]);
    this.adminMsg='';
    this.chatService.sendMessage({receiverId:this.selectedConv().id,message:text,senderId:this.myId,senderName:this.auth.currentUser()?.username||'Admin'});
  }

  // Gradient builder
  buildGradient() {
    const stops = this.slideColorStops.map(s => `${s.color} ${s.pos}%`).join(', ');
    this.slideForm.bg_gradient = `linear-gradient(${this.slideGradientDir}, ${stops})`;
  }
  addColorStop() { this.slideColorStops.push({ color: '#C9956A', pos: 50 }); this.buildGradient(); }
  removeColorStop(i:number) { this.slideColorStops.splice(i,1); this.buildGradient(); }

  // Carousel
  openSlideForm() {
    this.editingSlide.set(null);
    this.slideColorStops = [{ color:'#F5E6D3', pos:0 }, { color:'#E8C99A', pos:100 }];
    this.slideGradientDir = 'to right';
    this.slideBgMode = 'gradient';
    this.slideForm = { title:'', subtitle:'', description:'', button_text:'Ver más', button_url:'/products', image_url:'', bg_gradient:'linear-gradient(to right,#F5E6D3 0%,#E8C99A 100%)', bg_color:'', order_index:this.carouselSlides().length, is_active:true, display_mode:'emoji', emoji:'🍪' };
    this.buildGradient();
    this.showSlideForm.set(true);
  }
  editSlide(s:any) {
    this.editingSlide.set(s); this.slideForm = { ...s };
    this.slideBgMode = s.bg_color ? 'solid' : 'gradient';
    this.showSlideForm.set(true);
  }
  async onSlideImageChange(event: Event) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    this.uploadingImg.set(true);
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/carousel').subscribe({next:r=>{this.slideForm.image_url=r.url;this.uploadingImg.set(false);},error:()=>{this.uploadingImg.set(false);this.toast.error('Error al subir');}});
  }
  saveSlide() {
    const data = { ...this.slideForm };
    if (this.slideBgMode === 'solid') data.bg_gradient = '';
    else data.bg_color = '';
    const obs = this.editingSlide() ? this.http.put(`${environment.apiUrl}/carousel/${this.editingSlide().id}`,data) : this.http.post(`${environment.apiUrl}/carousel`,data);
    obs.subscribe({next:()=>{this.toast.success('Slide guardado ✅');this.showSlideForm.set(false);this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s=>this.carouselSlides.set(s));}});
  }
  deleteSlide(id:string) { if(!confirm('¿Eliminar slide?')) return; this.http.delete(`${environment.apiUrl}/carousel/${id}`).subscribe({next:()=>{this.toast.success('Eliminado');this.http.get<any[]>(`${environment.apiUrl}/carousel/all`).subscribe(s=>this.carouselSlides.set(s));}}); }
  getSlideStyle(s:any): string {
    if(s.display_mode==='bg_image'&&s.image_url) return `background:url('${s.image_url}') center/cover`;
    if(s.bg_color) return `background:${s.bg_color}`;
    return `background:${s.bg_gradient||'linear-gradient(to right,#F5E6D3,#E8C99A)'}`;
  }

  // Why Us
  addWhyItem() { this.whyUsData.items.push({icon:'🍪',title:'Nuevo item',desc:'Descripción',image:''}); }
  removeWhyItem(i:number) { this.whyUsData.items.splice(i,1); }
  async onWhyItemImage(event: Event, i:number) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64 = await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/why-us').subscribe({next:r=>{this.whyUsData.items[i].image=r.url;this.toast.success('Imagen subida');},error:()=>this.toast.error('Error')});
  }
  saveWhyUs() { this.http.put(`${environment.apiUrl}/site-settings/why_us`,{setting_value:this.whyUsData}).subscribe({next:()=>this.toast.success('Guardado ✅')}); }

  // Navbar
  addNavLink() { this.navbarData.links.push({label:'Nuevo link',url:'/',exact:false}); }
  removeNavLink(i:number) { this.navbarData.links.splice(i,1); }
  saveNavbar() { this.http.put(`${environment.apiUrl}/site-settings/navbar`,{setting_value:this.navbarData}).subscribe({next:()=>this.toast.success('Navbar guardado ✅')}); }

  // Footer
  addFooterLink() { this.footerData.links.push({label:'Nuevo link',url:'/',icon:'',external:false}); }
  removeFooterLink(i:number) { this.footerData.links.splice(i,1); }
  saveFooter() {
    const data = JSON.parse(JSON.stringify(this.footerData));
    data.links = data.links.map((l:any) => ({...l, url: l.url==='_custom_' ? (l.custom_url||'/') : l.url}));
    this.http.put(`${environment.apiUrl}/site-settings/footer`,{setting_value:data}).subscribe({next:()=>this.toast.success('Footer guardado ✅')});
  }

  // Pages
  openPageForm() { this.editingPage.set(null); this.pageForm={title:'',slug:'',sections:[],is_active:true,show_in_nav:false}; this.showPageForm.set(true); }
  editPage(pg:any) { this.editingPage.set(pg); this.pageForm=JSON.parse(JSON.stringify(pg)); this.showPageForm.set(true); }
  addPageSection(type:string) { this.pageForm.sections.push({type,title:'',content:'',description:'',image:'',button_text:'',button_url:'/products',product_id:'',show_image:true,show_price:true,show_description:true,custom_description:''}); }
  removePageSection(i:number) { this.pageForm.sections.splice(i,1); }
  async onSectionImageChange(event:Event, i:number) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64=await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/pages').subscribe({next:r=>{this.pageForm.sections[i].image=r.url;this.toast.success('Imagen subida');},error:()=>this.toast.error('Error')});
  }
  savePage() {
    const obs=this.editingPage()?this.http.put(`${environment.apiUrl}/site-pages/${this.editingPage().id}`,this.pageForm):this.http.post(`${environment.apiUrl}/site-pages`,this.pageForm);
    obs.subscribe({next:()=>{this.toast.success('Página guardada ✅');this.showPageForm.set(false);this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p=>this.sitePages.set(p));}});
  }
  deletePage(id:string) { if(!confirm('¿Eliminar página?')) return; this.http.delete(`${environment.apiUrl}/site-pages/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.http.get<any[]>(`${environment.apiUrl}/site-pages/all`).subscribe(p=>this.sitePages.set(p));}}); }

  // Site reviews
  markReviewRead(id:string) { this.http.put(`${environment.apiUrl}/site-reviews/${id}/read`,{}).subscribe({next:()=>this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r=>this.siteReviews.set(r))}); }
  deleteSiteReview(id:string) { this.http.delete(`${environment.apiUrl}/site-reviews/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.http.get<any[]>(`${environment.apiUrl}/site-reviews/all`).subscribe(r=>this.siteReviews.set(r));}}); }
  getReviewLabel(t:string) { const m:any={review:'⭐ Reseña',complaint:'😠 Queja',suggestion:'💡 Sugerencia'}; return m[t]||t; }

  formatTime(v:any) { if(!v) return ''; return new Date(v).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
  getStars(n:number) { return Array(n).fill(0); }
}
