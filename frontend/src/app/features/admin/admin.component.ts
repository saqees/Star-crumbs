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

type Tab = 'products'|'categories'|'orders'|'users'|'chat'|'carousel'|'cajitas'|'why_us'|'navbar'|'footer'|'pages'|'site_reviews'|'product_reviews'|'store_theme'|'page_banners'|'page_banners_extra'|'social_favicon'|'push_notifications'|'announcements';

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
      <button *ngFor="let t of tabs.slice(0,4)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i><span>{{t.label}}</span>
      </button>
      <p class="slbl">Gestión</p>
      <button *ngFor="let t of tabs.slice(4,8)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
        <i [class]="t.icon"></i><span>{{t.label}}</span>
      </button>
      <p class="slbl">Personalización</p>
      <button *ngFor="let t of tabs.slice(9)" class="tab-btn" [class.active]="activeTab()===t.key" (click)="setTab(t.key)">
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
            <thead><tr><th>Avatar</th><th>Usuario</th><th>Email</th><th>Jornada</th><th>Amb.</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users()" [class.row-inactive]="u.is_active===false">
                <td><img [src]="u.profile_picture||'assets/avatar.png'" class="timg round" [style.opacity]="u.is_active===false?0.4:1"></td>
                <td>
                  <strong>{{u.username}}</strong><br>
                  <small class="role-tag" [class.admin-tag]="u.role==='admin'">{{u.role}}</small>
                  <small *ngIf="u.is_active===false" class="inactive-tag"> · inactivo</small>
                </td>
                <td style="font-size:.77rem">{{u.email}}</td>
                <td>{{u.schedule||'—'}}</td>
                <td>{{u.ambiente_number||'—'}}</td>
                <td><span class="sst" [class.sst-on]="u.is_active!==false">{{u.is_active===false?'Inactivo':'Activo'}}</span></td>
                <td>{{u.created_at | date:'dd/MM/yy'}}</td>
                <td class="abts">
                  <button class="ab ab-e" (click)="viewUserProfile(u)" title="Ver perfil"><i class="fas fa-eye"></i></button>
                  <button class="ab" style="background:#e3f2fd;color:#1976d2" (click)="openChatWithUser(u)" title="Mensaje"><i class="fas fa-comment"></i></button>
                  <button class="ab" [style.background]="u.is_active===false?'#e8f5e9':'#fff3e0'" [style.color]="u.is_active===false?'#388e3c':'#f57c00'" (click)="toggleUserActive(u)" [title]="u.is_active===false?'Activar':'Desactivar'">
                    <i class="fas" [class.fa-user-check]="u.is_active===false" [class.fa-user-slash]="u.is_active!==false"></i>
                  </button>
                  <button *ngIf="u.role!=='admin'" class="ab ab-d" (click)="deleteUser(u)" title="Eliminar cuenta"><i class="fas fa-trash"></i></button>
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

        <!-- Section global settings -->
        <div class="settings-card card" style="margin-bottom:18px">
          <p class="section-label">⚙️ Configuración general de la sección</p>
          <div class="row2">
            <div class="form-group"><label>Título principal</label><input type="text" [(ngModel)]="whyUsData.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo / eyebrow (opcional)</label><input type="text" [(ngModel)]="whyUsData.subtitle" class="form-control" placeholder="LA DIFERENCIA"></div>
          </div>
          <div class="form-group"><label>Descripción de la sección (opcional)</label><input type="text" [(ngModel)]="whyUsData.description" class="form-control" placeholder="Texto debajo del título..."></div>
          <div class="row2">
            <div class="form-group">
              <label>Columnas</label>
              <select [(ngModel)]="whyUsData.columns" class="form-control">
                <option value="2">2 columnas</option>
                <option value="3">3 columnas</option>
                <option value="4">4 columnas</option>
              </select>
            </div>
            <div class="form-group">
              <label>Alineación del título</label>
              <select [(ngModel)]="whyUsData.title_align" class="form-control">
                <option value="center">Centro</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>
          </div>
          <div class="row2">
            <div class="form-group"><label>Color de fondo de la sección</label><div class="color-row"><input type="color" [(ngModel)]="whyUsData.bg_color" class="color-picker"><input type="text" [(ngModel)]="whyUsData.bg_color" class="form-control color-hex"></div></div>
            <div class="form-group"><label>Color del título</label><div class="color-row"><input type="color" [(ngModel)]="whyUsData.title_color" class="color-picker"><input type="text" [(ngModel)]="whyUsData.title_color" class="form-control color-hex"></div></div>
            <div class="form-group"><label>Color acento (eyebrow)</label><div class="color-row"><input type="color" [(ngModel)]="whyUsData.accent_color" class="color-picker"><input type="text" [(ngModel)]="whyUsData.accent_color" class="form-control color-hex"></div></div>
          </div>
          <div class="form-group">
            <label>Fuente del título</label>
            <select [(ngModel)]="whyUsData.title_font" class="form-control" [style.fontFamily]="whyUsData.title_font">
              <option value="">Por defecto</option>
              <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
            </select>
          </div>
        </div>

        <!-- Items list -->
        <div class="ch" style="margin-bottom:12px">
          <h3 style="color:var(--mocca-bean);font-size:1rem">Tarjetas / Items</h3>
          <button class="btn btn-primary btn-sm" (click)="addWhyItem()"><i class="fas fa-plus"></i> Agregar tarjeta</button>
        </div>

        <div *ngFor="let item of whyUsData.items; let i=index" class="why-item-editor card">
          <!-- Item header with live mini-preview -->
          <div class="why-editor-header">
            <div class="why-mini-preview"
                 [style.background]="item.bg_color||'#fff'"
                 [style.borderRadius]="item.card_shape==='square'?'4px':item.card_shape==='pill'?'999px':item.card_shape==='flat'?'0':'12px'">
              <span *ngIf="!item.image" style="font-size:1.4rem">{{item.icon||'🍪'}}</span>
              <img *ngIf="item.image" [src]="item.image" style="width:32px;height:32px;object-fit:cover;border-radius:6px">
              <small [style.color]="item.title_color||'var(--mocca-bean)'">{{item.title||'Sin título'}}</small>
            </div>
            <button class="ab ab-d" (click)="removeWhyItem(i)"><i class="fas fa-trash"></i></button>
          </div>

          <!-- Tabs: Estilo | Contenido | Apariencia -->
          <div class="why-editor-tabs">
            <button class="wet-btn" [class.wet-active]="(whyEditorTab[i]||0)===0" (click)="setWhyEditorTab(i,0)">📐 Estilo</button>
            <button class="wet-btn" [class.wet-active]="(whyEditorTab[i]||0)===1" (click)="setWhyEditorTab(i,1)">✍️ Contenido</button>
            <button class="wet-btn" [class.wet-active]="(whyEditorTab[i]||0)===2" (click)="setWhyEditorTab(i,2)">🎨 Apariencia</button>
          </div>

          <!-- TAB 0: Estilo de tarjeta -->
          <div *ngIf="(whyEditorTab[i]||0)===0" class="wet-panel">
            <div class="form-group">
              <label>Estilo de tarjeta</label>
              <div class="card-style-grid">
                <button class="cst-btn" [class.cst-active]="item.card_style==='default'||!item.card_style" (click)="item.card_style='default'">
                  <div class="cst-prev" style="border-radius:12px;border:1px solid #ddd"><span>🍪</span><small>Título</small><small style="font-size:.5rem;color:#999">Texto</small></div>
                  <span>Icono + texto</span>
                </button>
                <button class="cst-btn" [class.cst-active]="item.card_style==='full_image'" (click)="item.card_style='full_image'">
                  <div class="cst-prev" style="border-radius:12px;background:var(--almond);overflow:hidden"><div style="height:30px;background:var(--warm-capuchino);opacity:.5"></div><small>Título</small></div>
                  <span>Imagen arriba</span>
                </button>
                <button class="cst-btn" [class.cst-active]="item.card_style==='image_bg'" (click)="item.card_style='image_bg'">
                  <div class="cst-prev" style="border-radius:12px;background:var(--mocca-bean);display:flex;align-items:flex-end;padding:4px"><small style="color:#fff">Título</small></div>
                  <span>Foto de fondo</span>
                </button>
                <button class="cst-btn" [class.cst-active]="item.card_style==='text_only'" (click)="item.card_style='text_only'">
                  <div class="cst-prev" style="border-radius:12px;padding:4px;text-align:center"><small style="font-weight:700">Solo texto</small></div>
                  <span>Solo texto</span>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Forma de la tarjeta</label>
              <div class="card-shape-grid">
                <button class="csh-btn" [class.csh-active]="item.card_shape==='rounded'||!item.card_shape" (click)="item.card_shape='rounded'"><div class="csh-prev" style="border-radius:16px"></div><span>Redondeada</span></button>
                <button class="csh-btn" [class.csh-active]="item.card_shape==='square'" (click)="item.card_shape='square'"><div class="csh-prev" style="border-radius:4px"></div><span>Cuadrada</span></button>
                <button class="csh-btn" [class.csh-active]="item.card_shape==='pill'" (click)="item.card_shape='pill'"><div class="csh-prev" style="border-radius:999px"></div><span>Pill</span></button>
                <button class="csh-btn" [class.csh-active]="item.card_shape==='flat'" (click)="item.card_shape='flat'"><div class="csh-prev" style="border-radius:0;border-bottom:3px solid var(--warm-capuchino)"></div><span>Flat</span></button>
                <button class="csh-btn" [class.csh-active]="item.card_shape==='outlined'" (click)="item.card_shape='outlined'"><div class="csh-prev" style="border-radius:16px;border:2px solid var(--almond);background:transparent"></div><span>Outlined</span></button>
              </div>
            </div>
          </div>

          <!-- TAB 1: Contenido -->
          <div *ngIf="(whyEditorTab[i]||0)===1" class="wet-panel">
            <div class="row2">
              <div class="form-group"><label>Emoji / Ícono</label><input type="text" [(ngModel)]="item.icon" class="form-control emoji-in" placeholder="🍪"></div>
              <div class="form-group">
                <label>Imagen</label>
                <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{item.image?'Cambiar':'Subir imagen'}}<input type="file" accept="image/*" class="fup-input" (change)="onWhyItemImage($event,i)"></label></div>
                <div *ngIf="item.image" class="img-prev-row"><img [src]="item.image" style="width:44px;height:44px;object-fit:cover;border-radius:8px"><button class="ab ab-d" style="height:auto;padding:3px 8px" (click)="item.image=''"><i class="fas fa-trash"></i></button></div>
              </div>
            </div>
            <div class="form-group"><label>Título de la tarjeta</label><input type="text" [(ngModel)]="item.title" class="form-control"></div>

            <!-- Content type selector -->
            <div class="form-group">
              <label>Tipo de contenido</label>
              <div class="content-type-grid">
                <button class="ct-btn" [class.ct-active]="!item.content_type||item.content_type==='text'" (click)="item.content_type='text'"><i class="fas fa-align-left"></i><span>Texto</span></button>
                <button class="ct-btn" [class.ct-active]="item.content_type==='list'" (click)="item.content_type='list';ensureList(item)"><i class="fas fa-list-ul"></i><span>Lista</span></button>
                <button class="ct-btn" [class.ct-active]="item.content_type==='ingredients'" (click)="item.content_type='ingredients';ensureList(item)"><i class="fas fa-cookie-bite"></i><span>Ingredientes</span></button>
                <button class="ct-btn" [class.ct-active]="item.content_type==='button'" (click)="item.content_type='button'"><i class="fas fa-hand-pointer"></i><span>Botón</span></button>
                <button class="ct-btn" [class.ct-active]="item.content_type==='mixed'" (click)="item.content_type='mixed';ensureList(item)"><i class="fas fa-layer-group"></i><span>Mixto</span></button>
              </div>
            </div>

            <!-- Text type -->
            <div *ngIf="!item.content_type||item.content_type==='text'||item.content_type==='mixed'" class="form-group">
              <label>Descripción</label>
              <textarea [(ngModel)]="item.desc" class="form-control" rows="3" placeholder="Escribe una descripción..."></textarea>
            </div>

            <!-- List / Ingredients type -->
            <div *ngIf="item.content_type==='list'||item.content_type==='ingredients'||item.content_type==='mixed'" class="form-group">
              <label>Elementos de la lista</label>
              <div *ngFor="let li of (item.list_items||[]); let j=index" class="list-item-row">
                <input type="text" [(ngModel)]="item.list_items[j]" class="form-control" placeholder="Elemento {{j+1}}">
                <button class="ab ab-d" (click)="removeListItem(item,j)"><i class="fas fa-times"></i></button>
              </div>
              <button class="btn btn-secondary btn-sm" style="margin-top:6px" (click)="addListItem(item)"><i class="fas fa-plus"></i> Agregar elemento</button>
              <div *ngIf="item.content_type==='list'" class="form-group" style="margin-top:10px">
                <label>Estilo de lista</label>
                <select [(ngModel)]="item.list_style" class="form-control">
                  <option value="bullets">• Puntos</option>
                  <option value="numbered">1. Numerada</option>
                </select>
              </div>
            </div>

            <!-- Button type -->
            <div *ngIf="item.content_type==='button'" class="form-group">
              <div class="row2">
                <div class="form-group"><label>Texto del botón</label><input type="text" [(ngModel)]="item.button_text" class="form-control" placeholder="Ver más"></div>
                <div class="form-group"><label>Ícono del botón</label><input type="text" [(ngModel)]="item.button_icon" class="form-control emoji-in" placeholder="→"></div>
              </div>
              <div class="form-group"><label>URL destino</label>
                <select [(ngModel)]="item.button_url" class="form-control">
                  <option value="/products">🍪 Productos</option>
                  <option value="/cajitas">🎁 Cajitas</option>
                  <option value="/">🏠 Inicio</option>
                  <option value="/orders">📦 Mis Pedidos</option>
                  <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
                </select>
              </div>
              <div class="row2">
                <div class="form-group"><label>Color del botón</label><div class="color-row"><input type="color" [(ngModel)]="item.button_color" class="color-picker"><input type="text" [(ngModel)]="item.button_color" class="form-control color-hex"></div></div>
                <div class="form-group"><label>Color del texto del botón</label><div class="color-row"><input type="color" [(ngModel)]="item.button_text_color" class="color-picker"><input type="text" [(ngModel)]="item.button_text_color" class="form-control color-hex"></div></div>
                <div class="form-group"><label>Border radius</label>
                  <select [(ngModel)]="item.button_radius" class="form-control">
                    <option value="var(--radius-full)">Redondeado</option>
                    <option value="8px">Suave</option>
                    <option value="0">Cuadrado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: Apariencia -->
          <div *ngIf="(whyEditorTab[i]||0)===2" class="wet-panel">
            <div class="form-group"><label>Fuente</label>
              <select [(ngModel)]="item.font" class="form-control" [style.fontFamily]="item.font">
                <option value="">Por defecto</option>
                <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
              </select>
              <p class="font-preview" [style.fontFamily]="item.font">{{item.title||'Vista previa del texto'}}</p>
            </div>
            <div class="color-text-grid">
              <div class="form-group"><label>Color de fondo de tarjeta</label><div class="color-row"><input type="color" [(ngModel)]="item.bg_color" class="color-picker"><input type="text" [(ngModel)]="item.bg_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Color del título</label><div class="color-row"><input type="color" [(ngModel)]="item.title_color" class="color-picker"><input type="text" [(ngModel)]="item.title_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Color del texto/descripción</label><div class="color-row"><input type="color" [(ngModel)]="item.desc_color" class="color-picker"><input type="text" [(ngModel)]="item.desc_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Color del punto / acento</label><div class="color-row"><input type="color" [(ngModel)]="item.accent_color" class="color-picker"><input type="text" [(ngModel)]="item.accent_color" class="form-control color-hex"></div></div>
            </div>
            <div class="row2">
              <div class="form-group"><label>Alineación del texto</label>
                <select [(ngModel)]="item.text_align" class="form-control">
                  <option value="center">Centro</option>
                  <option value="left">Izquierda</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <div class="form-group"><label>Tamaño del título</label>
                <select [(ngModel)]="item.title_size" class="form-control">
                  <option value="">Normal (1.05rem)</option>
                  <option value="0.9rem">Pequeño</option>
                  <option value="1.3rem">Grande</option>
                  <option value="1.6rem">Muy grande</option>
                </select>
              </div>
            </div>
            <div class="form-group"><label>Forma del ícono/imagen</label>
              <div class="card-shape-grid">
                <button class="csh-btn" [class.csh-active]="item.icon_shape==='circle'" (click)="item.icon_shape='circle'"><div class="csh-prev" style="border-radius:50%"></div><span>Círculo</span></button>
                <button class="csh-btn" [class.csh-active]="item.icon_shape==='square'" (click)="item.icon_shape='square'"><div class="csh-prev" style="border-radius:8px"></div><span>Cuadrado</span></button>
                <button class="csh-btn" [class.csh-active]="!item.icon_shape" (click)="item.icon_shape=''"><div class="csh-prev"></div><span>Sin forma</span></button>
              </div>
            </div>
            <div *ngIf="item.icon_shape" class="form-group"><label>Color del fondo del ícono</label><div class="color-row"><input type="color" [(ngModel)]="item.icon_bg" class="color-picker"><input type="text" [(ngModel)]="item.icon_bg" class="form-control color-hex"></div></div>
          </div>
        </div>

        <div *ngIf="!whyUsData.items?.length" class="empty-sm"><span>🍪</span><p>Sin tarjetas. Agrega la primera.</p></div>
        <div class="btn-row mt-md">
          <button class="btn btn-primary" (click)="saveWhyUs()"><i class="fas fa-save"></i> Guardar sección</button>
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
            <div class="form-group"><label>Ícono del logo (emoji)</label><input type="text" [(ngModel)]="navbarData.logo_icon" class="form-control emoji-in"></div>
            <div class="form-group"><label>Texto del logo</label><input type="text" [(ngModel)]="navbarData.logo_text" class="form-control"></div>
          </div>
          <div class="form-group">
            <label>Imagen del logo (opcional — reemplaza el emoji)</label>
            <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{navbarData.logo_image?'Cambiar imagen':'Subir imagen del logo'}}<input type="file" class="fup-input" accept="image/*" (change)="onNavbarLogoImageChange($event)"></label></div>
            <div *ngIf="navbarData.logo_image" class="nav-logo-img-row">
              <img [src]="navbarData.logo_image" style="width:40px;height:40px;object-fit:contain;border-radius:8px;border:1px solid var(--almond)">
              <button class="btn btn-danger btn-sm" (click)="navbarData.logo_image=''"><i class="fas fa-trash"></i> Quitar imagen</button>
            </div>
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
              <option value="/cajitas">🎁 Cajitas</option>
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
            <div class="form-group"><label>Ícono (emoji)</label><input type="text" [(ngModel)]="footerData.brand_icon" class="form-control emoji-in"></div>
            <div class="form-group"><label>Nombre</label><input type="text" [(ngModel)]="footerData.brand_text" class="form-control"></div>
          </div>
          <div class="form-group">
            <label>Imagen del logo en el footer (opcional)</label>
            <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{footerData.brand_image?'Cambiar imagen':'Subir imagen'}}<input type="file" class="fup-input" accept="image/*" (change)="onFooterLogoImageChange($event)"></label></div>
            <div *ngIf="footerData.brand_image" class="nav-logo-img-row">
              <img [src]="footerData.brand_image" style="width:40px;height:40px;object-fit:contain;border-radius:8px;border:1px solid rgba(255,255,255,.2)">
              <button class="btn btn-danger btn-sm" (click)="footerData.brand_image=''"><i class="fas fa-trash"></i> Quitar</button>
            </div>
          </div>
          <div class="form-group"><label>Tagline</label><input type="text" [(ngModel)]="footerData.tagline" class="form-control"></div>
          <div class="form-group"><label>Copyright</label><input type="text" [(ngModel)]="footerData.copyright" class="form-control"></div>
          <p class="section-label" style="margin-top:16px">Links del footer</p>
          <div *ngFor="let link of footerData.links; let i=index" class="link-row link-row-footer">
            <input type="text" [(ngModel)]="link.label" class="form-control" placeholder="Etiqueta" style="flex:0.7">
            <select [(ngModel)]="link.url" class="form-control" style="flex:1">
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/cajitas">🎁 Cajitas</option>
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

      <!-- ── PRODUCT REVIEWS ── -->
      <div *ngIf="activeTab()==='product_reviews'">
        <div class="ch"><h2>Reseñas de productos</h2></div>
        <div class="form-group">
          <label>Filtrar por producto</label>
          <select class="form-control" [(ngModel)]="selectedReviewProduct" style="max-width:320px" (ngModelChange)="loadProductReviews(selectedReviewProduct)">
            <option value="">Todos los productos</option>
            <option *ngFor="let p of allProducts()" [value]="p.id">{{p.name}}</option>
          </select>
        </div>
        <div class="reviews-list">
          <div *ngFor="let r of productReviews()" class="review-card card" [class.unread]="!r.is_visible">
            <div class="rev-hdr">
              <img [src]="r.profile_picture||'assets/avatar.png'" class="timg round">
              <div>
                <strong>{{r.username}}</strong>
                <small class="blk" style="color:var(--warm-capuchino)">{{r.product_name}}</small>
              </div>
              <div class="stars-xs"><i *ngFor="let s of getStars(r.rating)" class="fas fa-star"></i></div>
              <span style="font-size:0.7rem;color:var(--text-light);margin-left:auto">{{r.created_at|date:'dd/MM/yy HH:mm'}}</span>
            </div>
            <p class="rev-comment">{{r.comment}}</p>
            <div *ngIf="r.admin_reply" class="admin-reply-show"><i class="fas fa-reply"></i> <strong>Respuesta:</strong> {{r.admin_reply}}</div>
            <!-- Reply form -->
            <div *ngIf="replyingReviewId===r.id" class="reply-form">
              <textarea [(ngModel)]="replyText" class="form-control" rows="2" placeholder="Escribe tu respuesta..."></textarea>
              <div class="btn-row mt-sm"><button class="btn btn-primary btn-sm" (click)="submitReply(r.id)">Enviar respuesta</button><button class="btn btn-secondary btn-sm" (click)="replyingReviewId=''">Cancelar</button></div>
            </div>
            <div class="abts mt-sm">
              <button class="ab ab-e" (click)="replyToReview(r.id)" title="Responder"><i class="fas fa-reply"></i></button>
              <button class="ab" style="background:#e8f5e9;color:#388e3c" (click)="toggleReviewVisibility(r.id)" title="Ocultar/Mostrar"><i class="fas" [class.fa-eye]="r.is_visible!==false" [class.fa-eye-slash]="r.is_visible===false"></i></button>
              <button class="ab ab-d" (click)="deleteProductReview(r.id)" title="Eliminar"><i class="fas fa-trash"></i></button>
              <span style="font-size:0.75rem;color:var(--text-light);margin-left:4px"><i class="fas fa-heart" style="color:var(--error)"></i> {{r.likes||0}}</span>
            </div>
          </div>
          <div *ngIf="!productReviews().length" class="empty-sm"><span>⭐</span><p>Sin reseñas aún</p></div>
        </div>
      </div>

      <!-- ── CAJITAS ── -->
      <div *ngIf="activeTab()==='cajitas'">
        <div class="ch">
          <h2>Cajitas</h2>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" (click)="openComboForm()"><i class="fas fa-plus"></i> Nueva cajita</button>
          </div>
        </div>
        <div class="combos-admin-list">
          <div *ngFor="let c of combos()" class="combo-admin-card card">
            <!-- CSS Box Preview -->
            <div class="combo-box-mini" [style.background]="c.bg_color||'#F5E6D3'">
              <div class="cbm-lid" [style.background]="c.accent_color||'#C9956A'">🎀</div>
              <div class="cbm-body" [style.background]="c.accent_color||'#C9956A'">🍪</div>
            </div>
            <div class="combo-admin-info">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
                <h4 style="margin:0">{{c.name}}</h4>
                <span class="btype-sm" [class]="'bts-'+c.box_type">{{c.box_type==='classic'?'Clásica':c.box_type==='special'?'Especial':'Combinada'}}</span>
              </div>
              <p>{{c.description|slice:0:55}}{{(c.description?.length||0)>55?'...':''}}</p>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">
                <span class="vpill" style="font-size:0.68rem">×{{c.max_units}} und.</span>
                <span *ngIf="c.category_name" class="vpill" style="font-size:0.68rem;background:#fff3e0;color:#e65100"><i class="fas fa-tag"></i> {{c.category_name}}</span>
                <span *ngIf="c.box_type==='combined'" class="vpill" style="font-size:0.68rem;background:#e8f5e9;color:#2e7d32"><i class="fas fa-shuffle"></i> Cualquier</span>
                <span *ngIf="c.discount_percent>0" class="vpill" style="font-size:0.68rem;background:#fde8e8;color:var(--error)">-{{c.discount_percent}}%</span>
                <span class="sst" [class.sst-on]="c.is_active">{{c.is_active?'Activa':'Inactiva'}}</span>
              </div>
            </div>
            <div class="abts"><button class="ab ab-e" (click)="editCombo(c)"><i class="fas fa-edit"></i></button><button class="ab ab-d" (click)="deleteCombo(c.id)"><i class="fas fa-trash"></i></button></div>
          </div>
          <div *ngIf="!combos().length" class="empty-sm"><span>🎁</span><p>Sin cajitas. Crea la primera.</p></div>
        </div>
      </div>

      <!-- ── STORE THEME ── -->
      <div *ngIf="activeTab()==='store_theme'">
        <div class="ch"><h2>Personalización de tienda</h2></div>
        <div class="settings-card card">
          <!-- Colors -->
          <p class="section-label">🎨 Colores</p>
          <div class="theme-grid">
            <div class="theme-field">
              <label>Color primario (botones, links)</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.primary_color" class="color-picker"><input type="text" [(ngModel)]="storeTheme.primary_color" class="form-control color-hex"></div>
            </div>
            <div class="theme-field">
              <label>Color primario oscuro (hover)</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.primary_dark" class="color-picker"><input type="text" [(ngModel)]="storeTheme.primary_dark" class="form-control color-hex"></div>
            </div>
            <div class="theme-field">
              <label>Color secundario (encabezados)</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.secondary_color" class="color-picker"><input type="text" [(ngModel)]="storeTheme.secondary_color" class="form-control color-hex"></div>
            </div>
            <div class="theme-field">
              <label>Color acento (bordes, fondo suave)</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.accent_color" class="color-picker"><input type="text" [(ngModel)]="storeTheme.accent_color" class="form-control color-hex"></div>
            </div>
            <div class="theme-field">
              <label>Fondo general de la página</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.bg_color" class="color-picker"><input type="text" [(ngModel)]="storeTheme.bg_color" class="form-control color-hex"></div>
            </div>
            <div class="theme-field">
              <label>Color del texto</label>
              <div class="color-row"><input type="color" [(ngModel)]="storeTheme.text_color" class="color-picker"><input type="text" [(ngModel)]="storeTheme.text_color" class="form-control color-hex"></div>
            </div>
          </div>

          <!-- Fonts -->
          <p class="section-label mt-md">🔤 Fuentes</p>
          <div class="row2">
            <div class="form-group">
              <label>Fuente de encabezados</label>
              <select [(ngModel)]="storeTheme.heading_font" class="form-control" [style.fontFamily]="storeTheme.heading_font">
                <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
              </select>
              <p class="font-preview" [style.fontFamily]="storeTheme.heading_font">Hola Star Crumbs 🍪</p>
            </div>
            <div class="form-group">
              <label>Fuente del cuerpo</label>
              <select [(ngModel)]="storeTheme.body_font" class="form-control" [style.fontFamily]="storeTheme.body_font">
                <option value="Lato">Lato — moderno</option>
                <option value="Open Sans">Open Sans — legible</option>
                <option value="Nunito">Nunito — amigable</option>
                <option value="Roboto">Roboto — neutro</option>
                <option value="Poppins">Poppins — redondeado</option>
                <option value="Raleway">Raleway — delgado</option>
              </select>
              <p class="font-preview" [style.fontFamily]="storeTheme.body_font">Galletas hechas con amor y los mejores ingredientes.</p>
            </div>
          </div>

          <!-- Border radius -->
          <p class="section-label mt-md">🔘 Redondeado de botones y tarjetas</p>
          <div class="row2">
            <div class="form-group">
              <label>Botones (border-radius)</label>
              <div class="radius-options">
                <button class="radius-btn" [class.active]="storeTheme.btn_radius==='4px'" (click)="storeTheme.btn_radius='4px'">
                  <div class="rbtn-prev" style="border-radius:4px"></div><span>Cuadrado</span>
                </button>
                <button class="radius-btn" [class.active]="storeTheme.btn_radius==='12px'" (click)="storeTheme.btn_radius='12px'">
                  <div class="rbtn-prev" style="border-radius:12px"></div><span>Suave</span>
                </button>
                <button class="radius-btn" [class.active]="storeTheme.btn_radius==='9999px'" (click)="storeTheme.btn_radius='9999px'">
                  <div class="rbtn-prev" style="border-radius:9999px"></div><span>Redondeado</span>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Tarjetas (border-radius)</label>
              <div class="radius-options">
                <button class="radius-btn" [class.active]="storeTheme.card_radius==='8px'" (click)="storeTheme.card_radius='8px'">
                  <div class="rcard-prev" style="border-radius:8px"></div><span>Cuadrado</span>
                </button>
                <button class="radius-btn" [class.active]="storeTheme.card_radius==='16px'" (click)="storeTheme.card_radius='16px'">
                  <div class="rcard-prev" style="border-radius:16px"></div><span>Suave</span>
                </button>
                <button class="radius-btn" [class.active]="storeTheme.card_radius==='24px'" (click)="storeTheme.card_radius='24px'">
                  <div class="rcard-prev" style="border-radius:24px"></div><span>Redondeado</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <p class="section-label mt-md">👁️ Vista previa</p>
          <div class="theme-preview" [style.background]="storeTheme.bg_color||'#FFF9F4'">
            <h3 [style.color]="storeTheme.secondary_color||'#5C3A1E'" [style.fontFamily]="storeTheme.heading_font+', serif'">Star Crumbs 🍪</h3>
            <p [style.color]="storeTheme.text_color||'#2D1B0E'" [style.fontFamily]="storeTheme.body_font+', sans-serif'">Galletas artesanales hechas con amor y los mejores ingredientes.</p>
            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
              <button class="prev-btn" [style.background]="'linear-gradient(135deg,'+storeTheme.primary_color+','+storeTheme.primary_dark+')'" [style.borderRadius]="storeTheme.btn_radius||'9999px'" [style.fontFamily]="storeTheme.body_font+', sans-serif'">Agregar al carrito</button>
              <button class="prev-btn-sec" [style.borderColor]="storeTheme.primary_color" [style.color]="storeTheme.primary_color" [style.borderRadius]="storeTheme.btn_radius||'9999px'" [style.fontFamily]="storeTheme.body_font+', sans-serif'">Ver productos</button>
            </div>
            <div class="prev-card" [style.borderRadius]="storeTheme.card_radius||'24px'" [style.borderColor]="storeTheme.accent_color">
              <div [style.background]="storeTheme.accent_color" style="height:60px;border-radius:inherit inherit 0 0"></div>
              <div style="padding:10px 12px"><p [style.color]="storeTheme.secondary_color" [style.fontFamily]="storeTheme.heading_font+', serif'" style="font-weight:700;margin:0 0 4px">Galleta de Chocolate</p><p [style.color]="storeTheme.primary_color" style="font-weight:700;font-size:1.1rem;margin:0">$ 4.500</p></div>
            </div>
          </div>

          <div class="btn-row mt-md">
            <button class="btn btn-secondary btn-sm" (click)="resetTheme()"><i class="fas fa-undo"></i> Restablecer</button>
            <button class="btn btn-primary" (click)="saveStoreTheme()"><i class="fas fa-save"></i> Guardar y aplicar</button>
          </div>
        </div>
      </div>


      <!-- ── PAGE BANNERS ── -->
      <div *ngIf="activeTab()==='page_banners'">
        <div class="ch"><h2>Banners de páginas</h2></div>

        <!-- Productos banner -->
        <div class="settings-card card" style="margin-bottom:20px">
          <p class="section-label">🍪 Página de Productos</p>
          <div class="banner-prev" [style.background]="pageBannerProducts.bg_gradient">
            <h3 [style.color]="pageBannerProducts.text_color" [style.fontFamily]="pageBannerProducts.font+',serif'">{{pageBannerProducts.title}}</h3>
            <p [style.color]="pageBannerProducts.text_color">{{pageBannerProducts.subtitle}}</p>
          </div>
          <div class="row2 mt-sm">
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="pageBannerProducts.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo</label><input type="text" [(ngModel)]="pageBannerProducts.subtitle" class="form-control"></div>
          </div>
          <div class="form-group"><label>CSS Gradiente de fondo</label><input type="text" [(ngModel)]="pageBannerProducts.bg_gradient" class="form-control" placeholder="linear-gradient(135deg,#F5E6D3,#E8C99A)"></div>
          <div class="form-group">
            <label>Color del texto</label>
            <div class="color-row"><input type="color" [(ngModel)]="pageBannerProducts.text_color" class="color-picker"><input type="text" [(ngModel)]="pageBannerProducts.text_color" class="form-control color-hex"></div>
          </div>
          <div class="form-group">
            <label>Fuente del título</label>
            <select [(ngModel)]="pageBannerProducts.font" class="form-control">
              <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" (click)="savePageBanner('products')"><i class="fas fa-save"></i> Guardar banner productos</button>
        </div>

        <!-- Cajitas banner -->
        <div class="settings-card card">
          <p class="section-label">🎁 Página de Cajitas</p>
          <div class="banner-prev" [style.background]="pageBannerCajitas.bg_gradient">
            <h3 [style.color]="pageBannerCajitas.text_color" [style.fontFamily]="pageBannerCajitas.font+',serif'">{{pageBannerCajitas.title}}</h3>
            <p [style.color]="pageBannerCajitas.text_color">{{pageBannerCajitas.subtitle}}</p>
          </div>
          <div class="row2 mt-sm">
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="pageBannerCajitas.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo</label><input type="text" [(ngModel)]="pageBannerCajitas.subtitle" class="form-control"></div>
          </div>
          <div class="form-group"><label>CSS Gradiente de fondo</label><input type="text" [(ngModel)]="pageBannerCajitas.bg_gradient" class="form-control"></div>
          <div class="form-group">
            <label>Color del texto</label>
            <div class="color-row"><input type="color" [(ngModel)]="pageBannerCajitas.text_color" class="color-picker"><input type="text" [(ngModel)]="pageBannerCajitas.text_color" class="form-control color-hex"></div>
          </div>
          <div class="form-group">
            <label>Fuente del título</label>
            <select [(ngModel)]="pageBannerCajitas.font" class="form-control">
              <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" (click)="savePageBanner('cajitas')"><i class="fas fa-save"></i> Guardar banner cajitas</button>
        </div>
      </div>

      <!-- ── EXTRA PAGE BANNERS ── -->
      <div *ngIf="activeTab()==='page_banners_extra'">
        <div class="ch"><h2>Banners — Pedidos, Perfil, Carrito</h2></div>

        <!-- Orders banner -->
        <div class="settings-card card" style="margin-bottom:18px">
          <p class="section-label">📦 Página de Mis Pedidos</p>
          <div class="banner-prev" [style.background]="pageBannerOrders.bg_gradient">
            <h3 [style.color]="pageBannerOrders.text_color" [style.fontFamily]="pageBannerOrders.font+',serif'">{{pageBannerOrders.title}}</h3>
            <p [style.color]="pageBannerOrders.text_color">{{pageBannerOrders.subtitle}}</p>
          </div>
          <div class="row2 mt-sm">
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="pageBannerOrders.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo</label><input type="text" [(ngModel)]="pageBannerOrders.subtitle" class="form-control"></div>
          </div>
          <div class="form-group"><label>Gradiente CSS</label><input type="text" [(ngModel)]="pageBannerOrders.bg_gradient" class="form-control"></div>
          <div class="form-group"><label>Color texto</label>
            <div class="color-row"><input type="color" [(ngModel)]="pageBannerOrders.text_color" class="color-picker"><input type="text" [(ngModel)]="pageBannerOrders.text_color" class="form-control color-hex"></div>
          </div>
          <div class="form-group"><label>Fuente</label>
            <select [(ngModel)]="pageBannerOrders.font" class="form-control"><option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option></select>
          </div>
          <button class="btn btn-primary btn-sm" (click)="savePageBanner('orders')"><i class="fas fa-save"></i> Guardar</button>
        </div>

        <!-- Profile banner -->
        <div class="settings-card card" style="margin-bottom:18px">
          <p class="section-label">👤 Página de Perfil</p>
          <div class="banner-prev" [style.background]="pageBannerProfile.bg_gradient">
            <h3 [style.color]="pageBannerProfile.text_color" [style.fontFamily]="pageBannerProfile.font+',serif'">{{pageBannerProfile.title}}</h3>
            <p [style.color]="pageBannerProfile.text_color">{{pageBannerProfile.subtitle}}</p>
          </div>
          <div class="row2 mt-sm">
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="pageBannerProfile.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo</label><input type="text" [(ngModel)]="pageBannerProfile.subtitle" class="form-control"></div>
          </div>
          <div class="form-group"><label>Gradiente CSS</label><input type="text" [(ngModel)]="pageBannerProfile.bg_gradient" class="form-control"></div>
          <div class="form-group"><label>Color texto</label>
            <div class="color-row"><input type="color" [(ngModel)]="pageBannerProfile.text_color" class="color-picker"><input type="text" [(ngModel)]="pageBannerProfile.text_color" class="form-control color-hex"></div>
          </div>
          <div class="form-group"><label>Fuente</label>
            <select [(ngModel)]="pageBannerProfile.font" class="form-control"><option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option></select>
          </div>
          <button class="btn btn-primary btn-sm" (click)="savePageBanner('profile')"><i class="fas fa-save"></i> Guardar</button>
        </div>

        <!-- Cart banner -->
        <div class="settings-card card">
          <p class="section-label">🛍️ Página del Carrito</p>
          <div class="banner-prev" [style.background]="pageBannerCart.bg_gradient">
            <h3 [style.color]="pageBannerCart.text_color" [style.fontFamily]="pageBannerCart.font+',serif'">{{pageBannerCart.title}}</h3>
            <p [style.color]="pageBannerCart.text_color">{{pageBannerCart.subtitle}}</p>
          </div>
          <div class="row2 mt-sm">
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="pageBannerCart.title" class="form-control"></div>
            <div class="form-group"><label>Subtítulo</label><input type="text" [(ngModel)]="pageBannerCart.subtitle" class="form-control"></div>
          </div>
          <div class="form-group"><label>Gradiente CSS</label><input type="text" [(ngModel)]="pageBannerCart.bg_gradient" class="form-control"></div>
          <div class="form-group"><label>Color texto</label>
            <div class="color-row"><input type="color" [(ngModel)]="pageBannerCart.text_color" class="color-picker"><input type="text" [(ngModel)]="pageBannerCart.text_color" class="form-control color-hex"></div>
          </div>
          <div class="form-group"><label>Fuente</label>
            <select [(ngModel)]="pageBannerCart.font" class="form-control"><option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option></select>
          </div>
          <button class="btn btn-primary btn-sm" (click)="savePageBanner('cart')"><i class="fas fa-save"></i> Guardar</button>
        </div>
      </div>

      <!-- ── PUSH NOTIFICATIONS ── -->
      <div *ngIf="activeTab()==='push_notifications'">
        <div class="ch"><h2>Notificaciones Push</h2></div>
        <div class="settings-card card" style="margin-bottom:18px">
          <p class="section-label">📤 Enviar notificación a usuarios</p>
          <p style="font-size:.83rem;color:var(--text-light);margin-bottom:16px">
            Los usuarios deben tener las notificaciones activadas para recibirlas.
            Las notificaciones llegan aunque la app esté cerrada.
          </p>
          <div class="row2">
            <div class="form-group"><label>Título *</label><input type="text" [(ngModel)]="pushForm.title" class="form-control" placeholder="🍪 Nueva galleta disponible"></div>
            <div class="form-group">
              <label>Enviar a</label>
              <select [(ngModel)]="pushForm.target" class="form-control">
                <option value="users">👥 Todos los usuarios</option>
                <option value="admins">👑 Solo admins</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Mensaje *</label><textarea [(ngModel)]="pushForm.body" class="form-control" rows="3" placeholder="Describe la novedad o producto..."></textarea></div>
          <div class="form-group">
            <label>URL al hacer clic</label>
            <select [(ngModel)]="pushForm.url" class="form-control">
              <option value="/">🏠 Inicio</option>
              <option value="/products">🍪 Productos</option>
              <option value="/cajitas">🎁 Cajitas</option>
              <option value="/orders">📦 Mis Pedidos</option>
              <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="sendPushNotification()" [disabled]="sendingPush()">
            <i class="fas fa-paper-plane"></i> {{sendingPush()?'Enviando...':'Enviar notificación'}}
          </button>
        </div>

        <div class="settings-card card">
          <p class="section-label">ℹ️ Notificaciones automáticas</p>
          <div class="auto-notif-list">
            <div class="auto-notif-row">
              <div class="an-icon" style="background:#e3f2fd;color:#1976d2"><i class="fas fa-shopping-bag"></i></div>
              <div><strong>Nuevo pedido</strong><p>Los admins reciben una notificación push cuando un usuario hace un pedido</p></div>
              <span class="sst sst-on">Activo</span>
            </div>
            <div class="auto-notif-row">
              <div class="an-icon" style="background:#e8f5e9;color:#388e3c"><i class="fas fa-comment"></i></div>
              <div><strong>Nuevo mensaje</strong><p>Notificación push cuando recibes un mensaje de chat</p></div>
              <span class="sst sst-on">Activo</span>
            </div>
            <div class="auto-notif-row">
              <div class="an-icon" style="background:#fff3e0;color:#f57c00"><i class="fas fa-star"></i></div>
              <div><strong>Nueva reseña</strong><p>Notificación cuando un usuario deja una reseña de producto</p></div>
              <span class="sst sst-on">Activo</span>
            </div>
            <div class="auto-notif-row">
              <div class="an-icon" style="background:#fce4ec;color:#c62828"><i class="fas fa-comment-dots"></i></div>
              <div><strong>Nueva queja o sugerencia</strong><p>Notificación cuando un usuario envía feedback del sitio</p></div>
              <span class="sst sst-on">Activo</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── ANNOUNCEMENTS ── -->
      <div *ngIf="activeTab()==='announcements'">
        <div class="ch"><h2>Anuncios y Banners</h2></div>

        <!-- Confirmation announcement (post-order) -->
        <div class="settings-card card" style="margin-bottom:20px">
          <p class="section-label">🎉 Mensaje de pedido confirmado</p>
          <p style="font-size:.82rem;color:var(--text-light);margin-bottom:14px">
            Este mensaje aparece en grande después de que el usuario confirma su pedido. Editable libremente.
          </p>
          <!-- Live preview -->
          <div class="ann-preview" [style.background]="confirmAnnouncement.bg_color"
               [style.color]="confirmAnnouncement.text_color"
               [style.border-color]="confirmAnnouncement.border_color">
            <span class="ann-prev-icon">{{confirmAnnouncement.icon}}</span>
            <div>
              <strong [style.fontFamily]="confirmAnnouncement.font">{{confirmAnnouncement.title}}</strong>
              <p [style.fontFamily]="confirmAnnouncement.font">{{confirmAnnouncement.message}}</p>
            </div>
          </div>
          <label class="chk" style="margin:12px 0"><input type="checkbox" [(ngModel)]="confirmAnnouncement.enabled"> Mostrar este anuncio</label>
          <div class="row2">
            <div class="form-group"><label>Ícono</label><input type="text" [(ngModel)]="confirmAnnouncement.icon" class="form-control emoji-in"></div>
            <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="confirmAnnouncement.title" class="form-control"></div>
          </div>
          <div class="form-group"><label>Mensaje</label><textarea [(ngModel)]="confirmAnnouncement.message" class="form-control" rows="3"></textarea></div>
          <div class="color-text-grid">
            <div class="form-group"><label>Color de fondo</label><div class="color-row"><input type="color" [(ngModel)]="confirmAnnouncement.bg_color" class="color-picker"><input type="text" [(ngModel)]="confirmAnnouncement.bg_color" class="form-control color-hex"></div></div>
            <div class="form-group"><label>Color de texto</label><div class="color-row"><input type="color" [(ngModel)]="confirmAnnouncement.text_color" class="color-picker"><input type="text" [(ngModel)]="confirmAnnouncement.text_color" class="form-control color-hex"></div></div>
            <div class="form-group"><label>Color de borde</label><div class="color-row"><input type="color" [(ngModel)]="confirmAnnouncement.border_color" class="color-picker"><input type="text" [(ngModel)]="confirmAnnouncement.border_color" class="form-control color-hex"></div></div>
            <div class="form-group"><label>Fuente</label>
              <select [(ngModel)]="confirmAnnouncement.font" class="form-control">
                <option value="inherit">Por defecto</option>
                <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" (click)="saveConfirmAnnouncement()"><i class="fas fa-save"></i> Guardar anuncio de confirmación</button>
        </div>

        <!-- Page announcements -->
        <div class="settings-card card">
          <div class="ch"><p class="section-label" style="margin:0">📢 Anuncios en páginas</p>
            <button class="btn btn-primary btn-sm" (click)="addPageAnnouncement()"><i class="fas fa-plus"></i> Nuevo anuncio</button>
          </div>
          <p style="font-size:.82rem;color:var(--text-light);margin-bottom:16px">
            Agrega anuncios en cualquier página: arriba, abajo, en el centro, con banners, imágenes, texto, etc.
          </p>
          <div *ngFor="let ann of pageAnnouncements; let i=index" class="ann-item-editor card">
            <div class="ann-item-header">
              <label class="chk"><input type="checkbox" [(ngModel)]="ann.enabled"> Activo</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap;flex:1;justify-content:flex-end">
                <div style="display:flex;align-items:center;gap:5px">
                  <label style="font-size:.74rem;color:var(--text-light)">Página:</label>
                  <select [(ngModel)]="ann.page" class="form-control" style="font-size:.8rem;padding:4px 8px">
                    <option value="*">Todas las páginas</option>
                    <option value="home">Inicio</option>
                    <option value="products">Productos</option>
                    <option value="cajitas">Cajitas</option>
                    <option value="cart">Carrito</option>
                    <option value="orders">Pedidos</option>
                    <option value="profile">Perfil</option>
                  </select>
                </div>
                <div style="display:flex;align-items:center;gap:5px">
                  <label style="font-size:.74rem;color:var(--text-light)">Posición:</label>
                  <select [(ngModel)]="ann.position" class="form-control" style="font-size:.8rem;padding:4px 8px">
                    <option value="top">Arriba</option>
                    <option value="bottom">Abajo</option>
                    <option value="center">Centro</option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                    <option value="floating">Flotante</option>
                  </select>
                </div>
                <button class="ab ab-d" (click)="removePageAnnouncement(i)"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <!-- Preview -->
            <div class="ann-page-preview" [style.background]="ann.bg_color" [style.color]="ann.text_color" [style.border-color]="ann.border_color">
              <img *ngIf="ann.image_url" [src]="ann.image_url" class="ann-preview-img" alt="">
              <div>
                <strong [style.fontFamily]="ann.font">{{ann.icon}} {{ann.title}}</strong>
                <p *ngIf="ann.message" [style.fontFamily]="ann.font">{{ann.message}}</p>
              </div>
            </div>
            <!-- Edit fields -->
            <div class="row2 mt-sm">
              <div class="form-group"><label>Ícono</label><input type="text" [(ngModel)]="ann.icon" class="form-control emoji-in"></div>
              <div class="form-group"><label>Título</label><input type="text" [(ngModel)]="ann.title" class="form-control"></div>
            </div>
            <div class="form-group"><label>Mensaje / Descripción</label><textarea [(ngModel)]="ann.message" class="form-control" rows="2"></textarea></div>
            <div class="color-text-grid">
              <div class="form-group"><label>Fondo</label><div class="color-row"><input type="color" [(ngModel)]="ann.bg_color" class="color-picker"><input type="text" [(ngModel)]="ann.bg_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Texto</label><div class="color-row"><input type="color" [(ngModel)]="ann.text_color" class="color-picker"><input type="text" [(ngModel)]="ann.text_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Borde</label><div class="color-row"><input type="color" [(ngModel)]="ann.border_color" class="color-picker"><input type="text" [(ngModel)]="ann.border_color" class="form-control color-hex"></div></div>
              <div class="form-group"><label>Fuente</label>
                <select [(ngModel)]="ann.font" class="form-control">
                  <option value="inherit">Por defecto</option>
                  <option *ngFor="let f of fontOptions" [value]="f.value">{{f.label}}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Imagen del anuncio (opcional)</label>
              <div class="fup-btn"><label class="fup-label"><i class="fas fa-image"></i> {{ann.image_url?'Cambiar imagen':'Subir imagen'}}<input type="file" class="fup-input" accept="image/*" (change)="onAnnoucementImageChange($event,i)"></label></div>
              <img *ngIf="ann.image_url" [src]="ann.image_url" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:6px;object-fit:cover">
            </div>
            <label class="chk"><input type="checkbox" [(ngModel)]="ann.show_close"> Mostrar botón de cerrar</label>
          </div>
          <div *ngIf="!pageAnnouncements.length" class="empty-sm"><span>📢</span><p>Sin anuncios. Agrega el primero.</p></div>
          <div class="btn-row mt-md">
            <button class="btn btn-primary" (click)="savePageAnnouncements()"><i class="fas fa-save"></i> Guardar todos los anuncios</button>
          </div>
        </div>
      </div>

      <!-- ── SOCIAL MEDIA & FAVICON ── -->
      <div *ngIf="activeTab()==='social_favicon'">
        <div class="ch"><h2>Redes Sociales & Favicon</h2></div>

        <!-- Favicon -->
        <div class="settings-card card" style="margin-bottom:20px">
          <p class="section-label">🌐 Icono de la pestaña (Favicon)</p>
          <div class="favicon-preview">
            <div class="favicon-box">
              <img *ngIf="faviconData.type==='image'&&faviconData.image_url" [src]="faviconData.image_url" style="width:32px;height:32px;object-fit:contain">
              <span *ngIf="faviconData.type==='emoji'||!faviconData.image_url" style="font-size:1.5rem">{{faviconData.emoji||'🍪'}}</span>
            </div>
            <span class="fav-tab-sim">Star Crumbs</span>
          </div>
          <div class="mode-sel" style="margin-bottom:14px">
            <button class="mode-btn" [class.active]="faviconData.type==='emoji'" (click)="faviconData.type='emoji'">😀<span>Emoji</span></button>
            <button class="mode-btn" [class.active]="faviconData.type==='image'" (click)="faviconData.type='image'">🖼️<span>Imagen</span></button>
          </div>
          <div *ngIf="faviconData.type==='emoji'" class="form-group">
            <label>Emoji</label>
            <input type="text" [(ngModel)]="faviconData.emoji" class="form-control emoji-in" style="max-width:100px">
          </div>
          <div *ngIf="faviconData.type==='image'" class="form-group">
            <label>Imagen (PNG/ICO recomendado)</label>
            <div class="fup-btn"><label class="fup-label" [class.fup-loading]="uploadingImg()"><i class="fas fa-image"></i> {{uploadingImg()?'Subiendo...':faviconData.image_url?'Cambiar imagen':'Subir imagen'}}<input type="file" class="fup-input" accept="image/*" (change)="onFaviconImageChange($event)"></label></div>
            <img *ngIf="faviconData.image_url" [src]="faviconData.image_url" style="width:48px;height:48px;object-fit:contain;margin-top:8px;border:1px solid var(--almond);border-radius:8px">
          </div>
          <button class="btn btn-primary btn-sm" (click)="saveFavicon()"><i class="fas fa-save"></i> Guardar favicon</button>
        </div>

        <!-- Social Media -->
        <div class="settings-card card">
          <p class="section-label">📱 Redes Sociales en el footer</p>
          <div *ngFor="let link of socialMedia.links; let i=index" class="social-edit-row">
            <div class="social-platform-sel">
              <select [(ngModel)]="link.platform" class="form-control" style="max-width:160px">
                <option value="instagram">📷 Instagram</option>
                <option value="facebook">👥 Facebook</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="twitter">🐦 X / Twitter</option>
                <option value="youtube">▶️ YouTube</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="pinterest">📌 Pinterest</option>
              </select>
              <div class="social-icon-prev" [class]="'si-'+link.platform">
                <i [class]="getSocialIcon(link.platform)"></i>
              </div>
            </div>
            <input type="text" [(ngModel)]="link.url" class="form-control" [placeholder]="link.platform==='whatsapp'?'573001234567 (solo número)':'https://instagram.com/...'">
            <button class="ab ab-d" (click)="removeSocialLink(i)"><i class="fas fa-times"></i></button>
          </div>
          <div *ngIf="!socialMedia.links?.length" class="empty-sm" style="padding:20px"><span>📱</span><p>Sin redes sociales agregadas</p></div>
          <div class="btn-row mt-sm">
            <button class="btn btn-secondary btn-sm" (click)="addSocialLink()"><i class="fas fa-plus"></i> Agregar red social</button>
            <button class="btn btn-primary" (click)="saveSocialMedia()"><i class="fas fa-save"></i> Guardar redes</button>
          </div>
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
            <option value="/cajitas">🎁 Cajitas</option>
            <option value="/">🏠 Inicio</option>
            <option value="/orders">📦 Mis Pedidos</option>
            <option *ngFor="let pg of sitePages()" [value]="'/page/'+pg.slug">📄 {{pg.title}}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="section-label">🎨 Colores del texto</label>
        <div class="color-text-grid">
          <div class="color-field">
            <label>Color del título</label>
            <div class="color-row"><input type="color" [(ngModel)]="slideForm.title_color" (ngModelChange)="null" class="color-picker"><input type="text" [(ngModel)]="slideForm.title_color" class="form-control color-hex"></div>
          </div>
          <div class="color-field">
            <label>Color del subtítulo/tag</label>
            <div class="color-row"><input type="color" [(ngModel)]="slideForm.subtitle_color" class="color-picker"><input type="text" [(ngModel)]="slideForm.subtitle_color" class="form-control color-hex"></div>
          </div>
          <div class="color-field">
            <label>Color de la descripción</label>
            <div class="color-row"><input type="color" [(ngModel)]="slideForm.desc_color" class="color-picker"><input type="text" [(ngModel)]="slideForm.desc_color" class="form-control color-hex"></div>
          </div>
          <div class="color-field">
            <label>Color fondo del tag</label>
            <div class="color-row"><input type="color" [(ngModel)]="slideForm.tag_bg_color" class="color-picker"><input type="text" [(ngModel)]="slideForm.tag_bg_color" class="form-control color-hex"></div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="section-label">🔤 Fuentes del texto</label>
        <div class="row2">
          <div class="form-group">
            <label>Fuente del título</label>
            <select [(ngModel)]="slideForm.title_font" class="form-control">
              <option value="Playfair Display">Playfair Display (Elegante)</option>
              <option value="Georgia">Georgia (Clásico)</option>
              <option value="Merriweather">Merriweather (Legible)</option>
              <option value="Lato">Lato (Moderno)</option>
              <option value="Poppins">Poppins (Redondeado)</option>
              <option value="Raleway">Raleway (Delgado)</option>
              <option value="Montserrat">Montserrat (Bold)</option>
              <option value="Dancing Script">Dancing Script (Cursiva)</option>
              <option value="Lobster">Lobster (Decorativo)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fuente del cuerpo/descripción</label>
            <select [(ngModel)]="slideForm.body_font" class="form-control">
              <option value="Lato">Lato (Moderno)</option>
              <option value="Poppins">Poppins (Redondeado)</option>
              <option value="Raleway">Raleway (Delgado)</option>
              <option value="Open Sans">Open Sans (Legible)</option>
              <option value="Nunito">Nunito (Amigable)</option>
              <option value="Roboto">Roboto (Neutro)</option>
              <option value="Georgia">Georgia (Clásico)</option>
            </select>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="section-label">🔘 Estilo del botón</label>
        <div class="mode-sel">
          <button class="mode-btn" [class.active]="slideForm.btn_style==='primary'" (click)="slideForm.btn_style='primary'">
            <span style="background:linear-gradient(135deg,#C9956A,#B5622E);color:#fff;padding:4px 12px;border-radius:20px;font-size:0.72rem">Principal</span>
          </button>
          <button class="mode-btn" [class.active]="slideForm.btn_style==='secondary'" (click)="slideForm.btn_style='secondary'">
            <span style="border:2px solid #C9956A;color:#C9956A;padding:3px 12px;border-radius:20px;font-size:0.72rem">Secundario</span>
          </button>
          <button class="mode-btn" [class.active]="slideForm.btn_style==='white'" (click)="slideForm.btn_style='white'">
            <span style="background:#fff;color:#5C3A1E;padding:4px 12px;border-radius:20px;font-size:0.72rem;border:1px solid #ddd">Blanco</span>
          </button>
          <button class="mode-btn" [class.active]="slideForm.btn_style==='dark'" (click)="slideForm.btn_style='dark'">
            <span style="background:#5C3A1E;color:#fff;padding:4px 12px;border-radius:20px;font-size:0.72rem">Oscuro</span>
          </button>
        </div>
      </div>
      <!-- Preview -->
      <div class="slide-text-preview" [style]="getSlidePreviewFull()">
        <span class="prev-tag" [style.background]="slideForm.tag_bg_color||'#C9956A'">{{slideForm.subtitle||'Tag del slide'}}</span>
        <h3 class="prev-title" [style.color]="slideForm.title_color||'#3B2010'" [style.fontFamily]="slideForm.title_font||'Playfair Display'">{{slideForm.title||'Título del slide'}}</h3>
        <p class="prev-desc" [style.color]="slideForm.desc_color||'#6B4226'" [style.fontFamily]="slideForm.body_font||'Lato'">{{slideForm.description||'Descripción del slide'}}</p>
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
                <option value="/cajitas">🎁 Cajitas</option>
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

  <!-- ══ COMBO FORM MODAL ══ -->
  <div *ngIf="showComboForm()" class="overlay">
    <div class="modal modal-lg">
      <button class="mbtn-close" (click)="showComboForm.set(false)"><i class="fas fa-times"></i></button>
      <h3>{{editingCombo()?'Editar':'Nueva'}} Cajita</h3>

      <div class="row2">
        <div class="form-group"><label>Nombre *</label><input type="text" [(ngModel)]="comboForm.name" class="form-control" placeholder="Cajita Clásica x4"></div>
        <div class="form-group">
          <label>Tipo de cajita</label>
          <select [(ngModel)]="comboForm.box_type" class="form-control">
            <option value="classic">🍪 Clásica — categoría específica</option>
            <option value="special">⭐ Especial — categoría específica</option>
            <option value="combined">🎲 Combinada — cualquier producto</option>
          </select>
        </div>
      </div>

      <div class="form-group"><label>Descripción</label><textarea [(ngModel)]="comboForm.description" class="form-control" rows="2"></textarea></div>

      <div class="row2">
        <div class="form-group">
          <label>Máximo de unidades</label>
          <input type="number" [(ngModel)]="comboForm.max_units" class="form-control" min="1" max="24">
        </div>
        <div class="form-group">
          <label>Categoría de galletas {{comboForm.box_type==='combined'?'(ignorada en combinadas)':'*'}}</label>
          <select [(ngModel)]="comboForm.category_id" class="form-control" [disabled]="comboForm.box_type==='combined'">
            <option value="">Todas las categorías (combinada)</option>
            <option *ngFor="let c of categories()" [value]="c.id">{{c.name}}</option>
          </select>
        </div>
      </div>

      <div class="row2">
        <div class="form-group">
          <label>Precio por unidad (0 = usar precio del producto)</label>
          <input type="number" [(ngModel)]="comboForm.price_per_unit" class="form-control" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label>% Descuento</label>
          <input type="number" [(ngModel)]="comboForm.discount_percent" class="form-control" min="0" max="100" placeholder="0">
        </div>
      </div>

      <div class="form-group">
        <label class="section-label">🎨 Colores de la cajita</label>
        <div class="color-text-grid">
          <div class="color-field">
            <label>Color del cuerpo</label>
            <div class="color-row"><input type="color" [(ngModel)]="comboForm.bg_color" class="color-picker"><input type="text" [(ngModel)]="comboForm.bg_color" class="form-control color-hex"></div>
          </div>
          <div class="color-field">
            <label>Color de la tapa</label>
            <div class="color-row"><input type="color" [(ngModel)]="comboForm.accent_color" class="color-picker"><input type="text" [(ngModel)]="comboForm.accent_color" class="form-control color-hex"></div>
          </div>
        </div>
        <!-- Live box preview -->
        <div class="combo-live-preview">
          <div class="clp-lid" [style.background]="comboForm.accent_color||'#C9956A'">🎀</div>
          <div class="clp-body" [style.background]="comboForm.bg_color||'#E8C99A'">
            <span *ngFor="let d of [1,2,3,4]" style="font-size:1.2rem">🍪</span>
          </div>
        </div>
      </div>

      <div class="check-row">
        <label class="chk"><input type="checkbox" [(ngModel)]="comboForm.is_active"> Activa</label>
        <label class="chk"><input type="checkbox" [(ngModel)]="comboForm.is_featured"> Destacada</label>
      </div>
      <div class="mfooter">
        <button class="btn btn-secondary btn-sm" (click)="showComboForm.set(false)">Cancelar</button>
        <button class="btn btn-primary" (click)="saveCombo()">{{editingCombo()?'Actualizar':'Crear cajita'}}</button>
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
          <!-- Allergies -->
          <div *ngIf="viewingOrder()!.allergies" class="mt-sm order-info-row">
            <span class="order-info-lbl"><i class="fas fa-allergies" style="color:#e65100"></i> Alergias:</span>
            <span class="order-info-val" style="color:#e65100;font-weight:600">{{viewingOrder()!.allergies}}</span>
          </div>
          <!-- Location -->
          <div *ngIf="viewingOrder()!.location_type" class="mt-sm order-info-row">
            <span class="order-info-lbl"><i class="fas fa-map-marker-alt"></i> Ubicación:</span>
            <span class="order-info-val">{{viewingOrder()!.location_type==='sena'?'SENA':'Específica'}} — {{viewingOrder()!.location_detail||''}}</span>
          </div>
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
          <!-- Notes & Allergies -->
          <div *ngIf="viewingOrder()!.notes" class="det-notes"><i class="fas fa-sticky-note"></i> {{viewingOrder()!.notes}}</div>
          <div *ngIf="viewingOrder()!.allergies" class="det-allergy"><i class="fas fa-allergies"></i> <strong>Alergias:</strong> {{viewingOrder()!.allergies}}</div>
          <!-- Receipt -->
          <div class="receipt-admin-wrap">
            <p class="receipt-admin-lbl"><i class="fas fa-file-image"></i> Comprobante de pago</p>
            <div *ngIf="viewingOrder()!.receipt_url" class="receipt-admin-img-wrap">
              <a [href]="viewingOrder()!.receipt_url" target="_blank">
                <img [src]="viewingOrder()!.receipt_url" class="receipt-admin-thumb" alt="Comprobante">
              </a>
              <a [href]="viewingOrder()!.receipt_url" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:6px">
                <i class="fas fa-external-link-alt"></i> Abrir comprobante
              </a>
            </div>
            <div *ngIf="!viewingOrder()!.receipt_url" class="receipt-none">
              <i class="fas fa-file-slash"></i> Sin comprobante adjunto
            </div>
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
    /* Color/Font editor */
    .color-text-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .color-field label { font-size:.78rem; font-weight:600; color:var(--text-mid); display:block; margin-bottom:5px; }
    .color-row { display:flex; gap:8px; align-items:center; }
    .color-picker { width:38px; height:34px; border:2px solid var(--almond); border-radius:8px; cursor:pointer; padding:2px; flex-shrink:0; }
    .color-hex { flex:1; font-size:.82rem !important; }
    /* Slide text preview */
    .slide-text-preview {
      border-radius:var(--radius-md); padding:22px 24px;
      margin:12px 0; min-height:100px;
      display:flex; flex-direction:column; gap:6px;
      transition:all .3s;
    }
    .prev-tag { display:inline-block; padding:4px 14px; border-radius:var(--radius-full); font-size:.8rem; font-weight:700; color:#fff; width:fit-content; }
    .prev-title { font-size:1.4rem; font-weight:700; margin:0; line-height:1.2; }
    .prev-desc { font-size:.9rem; margin:0; line-height:1.5; }
    @media (max-width:600px) {
      .color-text-grid { grid-template-columns:1fr; }
    }
    /* Push notifications */
    .auto-notif-list { display:flex; flex-direction:column; gap:12px; }
    .auto-notif-row { display:flex; align-items:center; gap:14px; padding:13px; background:var(--almond-light); border-radius:var(--radius-md); }
    .an-icon { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
    .auto-notif-row div { flex:1; }
    .auto-notif-row strong { display:block; font-size:.88rem; color:var(--text-dark); margin-bottom:2px; }
    .auto-notif-row p { font-size:.76rem; color:var(--text-light); margin:0; }
    /* User states */
    .row-inactive td { opacity:.65; }
    .inactive-tag { color:var(--error); font-size:.68rem; }
    /* Product reviews */
    .admin-reply-show { font-size:0.8rem; color:var(--warm-capuchino); border-left:3px solid var(--warm-capuchino); padding-left:8px; margin-bottom:6px; background:rgba(201,149,106,0.08); border-radius:0 6px 6px 0; padding:6px 8px; }
    .reply-form { background:var(--almond-light); border-radius:var(--radius-md); padding:12px; margin-top:8px; }
    /* Combos */
    .combos-admin-list { display:flex; flex-direction:column; gap:12px; }
    .combo-admin-card { display:flex; align-items:center; gap:14px; padding:14px; }
    .combo-admin-img { width:60px; height:60px; object-fit:cover; border-radius:var(--radius-md); flex-shrink:0; }
    .combo-admin-info { flex:1; min-width:0; }
    .combo-admin-info h4 { color:var(--mocca-bean); font-size:0.92rem; margin-bottom:3px; }
    .combo-admin-info p { font-size:0.78rem; color:var(--text-light); }
    /* Combo items editor */
    .combo-item-row { display:flex; gap:7px; align-items:center; padding:8px; background:var(--almond-light); border-radius:var(--radius-md); margin-bottom:7px; flex-wrap:wrap; }
    .combo-item-row .form-control { flex:1; min-width:80px; }
    .price-calc { background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); color:#fff; border-radius:var(--radius-lg); padding:16px 20px; margin-top:14px; }
    .price-calc .row { display:flex; justify-content:space-between; padding:4px 0; font-size:0.88rem; }
    .price-calc .total-row { font-size:1.1rem; font-weight:700; border-top:1px solid rgba(255,255,255,0.3); margin-top:6px; padding-top:8px; }
    /* Store theme */
    .theme-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .theme-field label { font-size:0.78rem; font-weight:600; color:var(--text-mid); display:block; margin-bottom:5px; }
    .color-row { display:flex; gap:8px; align-items:center; }
    .color-picker { width:40px; height:36px; border:2px solid var(--almond); border-radius:8px; cursor:pointer; padding:2px; flex-shrink:0; }
    .color-hex { flex:1; font-size:.82rem !important; }
    .font-preview { margin-top:6px; font-size:1rem; color:var(--text-mid); padding:7px 10px; background:var(--almond-light); border-radius:var(--radius-md); }
    .radius-options { display:flex; gap:8px; flex-wrap:wrap; }
    .radius-btn { display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 12px; border:2px solid var(--almond); border-radius:var(--radius-md); background:#fff; cursor:pointer; transition:all var(--transition); font-size:0.74rem; color:var(--text-mid); }
    .radius-btn.active { border-color:var(--warm-capuchino); background:var(--almond-light); color:var(--warm-capuchino); }
    .rbtn-prev { width:60px; height:26px; background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast)); }
    .rcard-prev { width:60px; height:40px; background:var(--almond-light); border:2px solid var(--almond); }
    .theme-preview { padding:22px; border-radius:var(--radius-lg); border:1px solid var(--almond); margin-top:8px; }
    .theme-preview h3 { margin-bottom:6px; font-size:1.2rem; }
    .theme-preview p { font-size:0.88rem; margin-bottom:0; }
    .prev-btn { padding:9px 20px; border:none; cursor:pointer; color:#fff; font-size:0.85rem; font-weight:600; }
    .prev-btn-sec { padding:8px 20px; border:2px solid; background:none; cursor:pointer; font-size:0.85rem; font-weight:600; }
    .prev-card { border:1px solid; overflow:hidden; width:160px; margin-top:14px; }

    @media (max-width:600px) {
      .theme-grid { grid-template-columns:1fr; }
      .color-text-grid { grid-template-columns:1fr; }
    }
    /* Banner preview */
    .banner-prev { padding:24px; border-radius:var(--radius-md); margin-bottom:10px; text-align:center; }
    .banner-prev h3 { margin:0 0 6px; font-size:1.2rem; }
    .banner-prev p { margin:0; font-size:.9rem; opacity:.85; }
    /* Favicon */
    .favicon-preview { display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--almond-light); border-radius:var(--radius-md); margin-bottom:14px; }
    .favicon-box { width:32px; height:32px; background:#fff; border-radius:4px; border:1px solid var(--almond); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fav-tab-sim { font-size:.82rem; color:var(--text-mid); font-weight:600; }
    /* Social edit */
    .social-edit-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
    .social-platform-sel { display:flex; align-items:center; gap:6px; }
    .social-icon-prev { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.9rem; flex-shrink:0; color:#fff; }
    .si-instagram { background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); }
    .si-facebook  { background:#1877f2; }
    .si-tiktok    { background:#010101; }
    .si-twitter,.si-x { background:#000; }
    .si-youtube   { background:#ff0000; }
    .si-whatsapp  { background:#25D366; }
    .si-linkedin  { background:#0a66c2; }
    .si-pinterest { background:#e60023; }
    /* Cajitas admin */
    .combo-box-mini { width:60px; height:68px; flex-shrink:0; border-radius:8px 8px 0 0; overflow:visible; position:relative; }
    .cbm-lid { width:64px; height:22px; margin-left:-2px; border-radius:5px 5px 0 0; display:flex; align-items:center; justify-content:center; font-size:.8rem; }
    .cbm-body { width:60px; height:46px; border-radius:0 0 6px 6px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
    .btype-sm { font-size:.65rem; font-weight:700; padding:2px 7px; border-radius:var(--radius-full); }
    .bts-classic  { background:#e3f2fd; color:#1565c0; }
    .bts-special  { background:#fce4ec; color:#c62828; }
    .bts-combined { background:#e8f5e9; color:#2e7d32; }
    /* Combo live preview */
    .combo-live-preview { display:flex; flex-direction:column; align-items:center; margin-top:12px; width:fit-content; }
    .clp-lid { width:88px; height:26px; border-radius:6px 6px 0 0; display:flex; align-items:center; justify-content:center; font-size:.9rem; }
    .clp-body { width:80px; height:56px; border-radius:0 0 8px 8px; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:2px; padding:4px; }
    /* Navbar logo image in admin preview */
    .nav-logo-img-row { display:flex; align-items:center; gap:10px; margin-top:8px; }
    @media (max-width:600px) {
      .banner-prev h3 { font-size:1rem; }
      .social-edit-row { flex-direction:column; align-items:stretch; }
      .theme-grid { grid-template-columns:1fr; }
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
  productReviews = signal<any[]>([]);
  combos = signal<any[]>([]);
  selectedReviewProduct = '';
  replyingReviewId = '';
  replyText = '';
  pageBannerOrders:  any = {title:'Mis Pedidos',subtitle:'Revisa el estado de tus pedidos 📦',bg_gradient:'linear-gradient(135deg,#F5E6D3,#E8C99A)',text_color:'#5C3A1E',font:'Playfair Display'};
  pageBannerProfile: any = {title:'Mi Perfil',subtitle:'Gestiona tu cuenta 👤',bg_gradient:'linear-gradient(135deg,#F5E6D3,#E8C99A)',text_color:'#5C3A1E',font:'Playfair Display'};
  pageBannerCart:    any = {title:'Mi Carrito',subtitle:'Revisa tu selección 🛍️',bg_gradient:'linear-gradient(135deg,#F5E6D3,#E8C99A)',text_color:'#5C3A1E',font:'Playfair Display'};
  pageBannerProducts: any = { title:'Nuestros Productos', subtitle:'Galletas artesanales hechas con amor 🍪', bg_gradient:'linear-gradient(135deg,#F5E6D3,#E8C99A)', text_color:'#5C3A1E', font:'Playfair Display' };
  pageBannerCajitas: any = { title:'Cajitas Star Crumbs', subtitle:'Arma tu caja perfecta 🎁', bg_gradient:'linear-gradient(135deg,#FDF6EC,#F5E6D3,#E8C99A)', text_color:'#5C3A1E', font:'Playfair Display' };
  socialMedia: any = { links: [] };
  faviconData: any = { type:'emoji', emoji:'🍪', image_url:'' };
  pushForm: any = { title:'', body:'', url:'/', target:'users' };
  confirmAnnouncement: any = {
    enabled:true, title:'🍪 Consejo Star Crumbs',
    message:'Para una mejor experiencia, puedes calentar tu galleta en el microondas de la cafetería del SENA por 10-15 segundos. ¡Estará perfecta y crujiente!',
    style:'warm', icon:'🔥', bg_color:'#FFF3E0', text_color:'#E65100', border_color:'#FFB74D',
    font:'inherit', position:'center'
  };
  pageAnnouncements: any[] = [];  // List of page-specific announcements
  sendingPush = signal(false);
  storeTheme: any = { primary_color:'#C9956A', primary_dark:'#B5622E', secondary_color:'#5C3A1E', accent_color:'#E8C99A', bg_color:'#FFF9F4', text_color:'#2D1B0E', heading_font:'Playfair Display', body_font:'Lato', btn_radius:'9999px', card_radius:'24px' };
  comboForm: any = { name:'', description:'', image_url:'', units:4, items:[], original_price:0, discount_amount:0, discount_percent:0, final_price:0, is_active:true, is_featured:false };
  editingCombo = signal<any>(null);
  showComboForm = signal(false);
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

  fontOptions = [
    {value:'Playfair Display',label:'Playfair Display — Elegante clásico'},
    {value:'Cormorant Garamond',label:'Cormorant Garamond — Lujo serif'},
    {value:'Cinzel',label:'Cinzel — Majestuoso romano'},
    {value:'Georgia',label:'Georgia — Clásico'},
    {value:'IM Fell English',label:'IM Fell English — Antiguo'},
    {value:'Philosopher',label:'Philosopher — Filosófico'},
    {value:'Abril Fatface',label:'Abril Fatface — Display bold'},
    {value:'Poppins',label:'Poppins — Moderno'},
    {value:'Montserrat',label:'Montserrat — Limpio'},
    {value:'Raleway',label:'Raleway — Delgado'},
    {value:'Oswald',label:'Oswald — Condensado'},
    {value:'Bebas Neue',label:'Bebas Neue — Impactante'},
    {value:'Josefin Sans',label:'Josefin Sans — Minimalista'},
    {value:'Comfortaa',label:'Comfortaa — Redondeado'},
    {value:'Nunito',label:'Nunito — Amigable'},
    {value:'Pacifico',label:'Pacifico — Playful'},
    {value:'Dancing Script',label:'Dancing Script — Script elegante'},
    {value:'Sacramento',label:'Sacramento — Caligráfico'},
    {value:'Great Vibes',label:'Great Vibes — Caligrafía fina'},
    {value:'Satisfy',label:'Satisfy — Firma'},
    {value:'Lobster',label:'Lobster — Retro'},
    {value:'Righteous',label:'Righteous — Retro bold'},
    {value:'Lato',label:'Lato — Sans limpio'},
  ];
  tabs = [
    { key:'products' as Tab, label:'Productos', icon:'fas fa-cookie-bite' },
    { key:'categories' as Tab, label:'Categorías', icon:'fas fa-tags' },
    { key:'carousel' as Tab, label:'Carrusel', icon:'fas fa-images' },
    { key:'cajitas' as Tab, label:'Cajitas', icon:'fas fa-gift' },
    { key:'orders' as Tab, label:'Pedidos', icon:'fas fa-shopping-bag' },
    { key:'users' as Tab, label:'Usuarios', icon:'fas fa-users' },
    { key:'chat' as Tab, label:'Chat', icon:'fas fa-comments' },
    { key:'product_reviews' as Tab, label:'Reseñas', icon:'fas fa-star' },
    { key:'why_us' as Tab, label:'¿Por qué nosotros?', icon:'fas fa-star' },
    { key:'navbar' as Tab, label:'Navbar', icon:'fas fa-bars' },
    { key:'footer' as Tab, label:'Footer', icon:'fas fa-grip-lines' },
    { key:'pages' as Tab, label:'Páginas', icon:'fas fa-file-alt' },
    { key:'site_reviews' as Tab, label:'Reseñas del sitio', icon:'fas fa-comment-dots' },
    { key:'store_theme' as Tab, label:'Personalización', icon:'fas fa-palette' },
    { key:'page_banners' as Tab, label:'Banners de páginas', icon:'fas fa-panorama' },
    { key:'page_banners_extra' as Tab, label:'Banners extras', icon:'fas fa-layer-group' },
    { key:'social_favicon' as Tab, label:'Redes & Favicon', icon:'fas fa-share-alt' },
    { key:'push_notifications' as Tab, label:'Notificaciones Push', icon:'fas fa-bell' },
    { key:'announcements' as Tab, label:'Anuncios y Banners', icon:'fas fa-bullhorn' }
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
    this.http.get<any>(`${environment.apiUrl}/site-settings/store_theme`).subscribe(s => { if(s?.setting_value) this.storeTheme = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any[]>(`${environment.apiUrl}/combos/all`).subscribe(c => this.combos.set(c));
    this.loadProductReviews();
    this.http.get<any>(`${environment.apiUrl}/site-settings/order_confirmation_announcement`).subscribe(s => { if(s?.setting_value) this.confirmAnnouncement = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/announcements`).subscribe(s => { if(s?.setting_value) this.pageAnnouncements = s.setting_value.items || []; });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_products`).subscribe(s => { if(s?.setting_value) this.pageBannerProducts = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_orders`).subscribe(s => { if(s?.setting_value) this.pageBannerOrders = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_profile`).subscribe(s => { if(s?.setting_value) this.pageBannerProfile = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_cart`).subscribe(s => { if(s?.setting_value) this.pageBannerCart = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_cajitas`).subscribe(s => { if(s?.setting_value) this.pageBannerCajitas = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/social_media`).subscribe(s => { if(s?.setting_value) this.socialMedia = JSON.parse(JSON.stringify(s.setting_value)); });
    this.http.get<any>(`${environment.apiUrl}/site-settings/favicon`).subscribe(s => { if(s?.setting_value) this.faviconData = JSON.parse(JSON.stringify(s.setting_value)); });
  }

  loadProductReviews(productId?: string) {
    const url = productId && productId.length > 5
      ? `${environment.apiUrl}/reviews?product_id=${productId}`
      : `${environment.apiUrl}/reviews`;
    this.http.get<any[]>(url).subscribe(r => this.productReviews.set(r));
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
    this.slideForm = { title:'', subtitle:'', description:'', button_text:'Ver más', button_url:'/products', image_url:'', bg_gradient:'linear-gradient(to right,#F5E6D3 0%,#E8C99A 100%)', bg_color:'', order_index:this.carouselSlides().length, is_active:true, display_mode:'emoji', emoji:'🍪', title_color:'#3B2010', subtitle_color:'#ffffff', desc_color:'#6B4226', title_font:'Playfair Display', body_font:'Lato', tag_bg_color:'#C9956A', btn_style:'primary' };
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
  getSlidePreviewFull(): string {
    const f = this.slideForm;
    if (this.slideBgMode === 'solid' && f.bg_color) return `background:${f.bg_color};border:1px solid var(--almond)`;
    return `background:${f.bg_gradient||'linear-gradient(to right,#F5E6D3,#E8C99A)'};border:1px solid var(--almond)`;
  }

  getSlideStyle(s:any): string {
    if(s.display_mode==='bg_image'&&s.image_url) return `background:url('${s.image_url}') center/cover`;
    if(s.bg_color) return `background:${s.bg_color}`;
    return `background:${s.bg_gradient||'linear-gradient(to right,#F5E6D3,#E8C99A)'}`;
  }

  // Why Us
  addWhyItem() { this.whyUsData.items.push({icon:'🍪',title:'Nueva tarjeta',desc:'Descripción',image:'',content_type:'text',card_shape:'rounded',card_style:'default',bg_color:'#ffffff',title_color:'#5C3A1E',desc_color:'#9C7355',text_align:'center',list_items:[]}); }
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
  getStars(n:number) { return Array(Math.min(Math.round(n||0),5)).fill(0); }

  // ── Product Reviews ──
  replyToReview(id:string) { this.replyingReviewId = id; this.replyText=''; }
  submitReply(id:string) {
    this.http.put(`${environment.apiUrl}/reviews/${id}/reply`,{admin_reply:this.replyText}).subscribe({
      next:()=>{this.toast.success('Respuesta enviada');this.replyingReviewId = '';this.loadProductReviews(this.selectedReviewProduct);}
    });
  }
  toggleReviewVisibility(id:string) {
    this.http.put(`${environment.apiUrl}/reviews/${id}/visibility`,{}).subscribe({next:()=>this.loadProductReviews(this.selectedReviewProduct)});
  }
  deleteProductReview(id:string) {
    if(!confirm('¿Eliminar reseña?')) return;
    this.http.delete(`${environment.apiUrl}/reviews/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.loadProductReviews(this.selectedReviewProduct);}});
  }

  // ── Why-us editor tabs state ──
  whyEditorTab: Record<number, number> = {};
  setWhyEditorTab(i: number, tab: number) { this.whyEditorTab = { ...this.whyEditorTab, [i]: tab }; }

  // ── Why-us list helpers ──
  ensureList(item: any) { if (!item.list_items) item.list_items = ['']; }
  addListItem(item: any) { item.list_items = [...(item.list_items || []), '']; }
  removeListItem(item: any, j: number) { item.list_items.splice(j, 1); }

  // ── Cajitas / Combos ── (see methods below)

  // ── Store Theme ──
  saveStoreTheme() {
    this.http.put(`${environment.apiUrl}/site-settings/store_theme`,{setting_value:this.storeTheme}).subscribe({
      next:()=>{
        this.toast.success('Tema guardado ✅');
        // Apply immediately
        const root=document.documentElement;
        const t=this.storeTheme;
        if(t.primary_color) root.style.setProperty('--warm-capuchino',t.primary_color);
        if(t.primary_dark) root.style.setProperty('--caramel-roast',t.primary_dark);
        if(t.secondary_color) root.style.setProperty('--mocca-bean',t.secondary_color);
        if(t.accent_color) root.style.setProperty('--almond',t.accent_color);
        if(t.bg_color) root.style.setProperty('--cream-white',t.bg_color);
        if(t.text_color) root.style.setProperty('--text-dark',t.text_color);
        if(t.btn_radius) root.style.setProperty('--radius-full',t.btn_radius);
        if(t.card_radius) root.style.setProperty('--radius-lg',t.card_radius);
        if(t.heading_font) root.style.setProperty('--font-display',t.heading_font+', serif');
        if(t.body_font) root.style.setProperty('--font-body',t.body_font+', sans-serif');
      }
    });
  }
  resetTheme() { this.storeTheme={primary_color:'#C9956A',primary_dark:'#B5622E',secondary_color:'#5C3A1E',accent_color:'#E8C99A',bg_color:'#FFF9F4',text_color:'#2D1B0E',heading_font:'Playfair Display',body_font:'Lato',btn_radius:'9999px',card_radius:'24px'}; }

  // Page banners
  savePageBanner(page: string) {
    const map: Record<string,any> = {
      products: this.pageBannerProducts,
      cajitas:  this.pageBannerCajitas,
      orders:   this.pageBannerOrders,
      profile:  this.pageBannerProfile,
      cart:     this.pageBannerCart
    };
    const data = map[page] || this.pageBannerProducts;
    this.http.put(`${environment.apiUrl}/site-settings/page_banner_${page}`, {setting_value: data}).subscribe({next: () => this.toast.success('Banner guardado ✅')});
  }

  // User management
  toggleUserActive(u: any) {
    const action = u.is_active === false ? 'activar' : 'desactivar';
    if (!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} la cuenta de ${u.username}?`)) return;
    this.http.put(`${environment.apiUrl}/users/${u.id}/toggle-active`, {}).subscribe({
      next: (res: any) => {
        this.toast.success(`Cuenta ${res.is_active ? 'activada' : 'desactivada'}`);
        this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe(us => this.users.set(us));
      },
      error: () => this.toast.error('Error al actualizar')
    });
  }

  deleteUser(u: any) {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE la cuenta de ${u.username}?\n\nEsta acción no se puede deshacer.`)) return;
    this.http.delete(`${environment.apiUrl}/users/${u.id}`).subscribe({
      next: () => {
        this.toast.success('Cuenta eliminada');
        this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe(us => this.users.set(us));
      },
      error: (e) => this.toast.error(e.error?.message || 'Error al eliminar')
    });
  }

  // Social media
  addSocialLink() { this.socialMedia.links = [...(this.socialMedia.links||[]), {platform:'instagram',url:'',label:'Instagram'}]; }
  removeSocialLink(i:number) { this.socialMedia.links.splice(i,1); }
  saveSocialMedia() { this.http.put(`${environment.apiUrl}/site-settings/social_media`,{setting_value:this.socialMedia}).subscribe({next:()=>this.toast.success('Redes sociales guardadas ✅')}); }

  // Favicon
  async onFaviconImageChange(event:Event) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    this.uploadingImg.set(true);
    const b64=await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/favicon').subscribe({
      next:r=>{this.faviconData.image_url=r.url;this.faviconData.type='image';this.uploadingImg.set(false);},
      error:()=>{this.uploadingImg.set(false);this.toast.error('Error al subir');}
    });
  }
  saveFavicon() { this.http.put(`${environment.apiUrl}/site-settings/favicon`,{setting_value:this.faviconData}).subscribe({next:()=>this.toast.success('Favicon guardado ✅')}); }

  // Navbar logo image
  async onNavbarLogoImageChange(event:Event) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64=await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/logo').subscribe({next:r=>{this.navbarData.logo_image=r.url;},error:()=>this.toast.error('Error')});
  }
  // Footer logo image
  async onFooterLogoImageChange(event:Event) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64=await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/logo').subscribe({next:r=>{this.footerData.brand_image=r.url;},error:()=>this.toast.error('Error')});
  }
  sendPushNotification() {
    if (!this.pushForm.title || !this.pushForm.body) { this.toast.error('Título y mensaje requeridos'); return; }
    this.sendingPush.set(true);
    this.http.post(`${environment.apiUrl}/push/send`, this.pushForm).subscribe({
      next: () => { this.toast.success('Notificación enviada ✅'); this.sendingPush.set(false); this.pushForm = { title:'', body:'', url:'/', target:'users' }; },
      error: () => { this.sendingPush.set(false); this.toast.error('Error al enviar'); }
    });
  }

  saveConfirmAnnouncement() {
    this.http.put(`${environment.apiUrl}/site-settings/order_confirmation_announcement`,{setting_value:this.confirmAnnouncement}).subscribe({next:()=>this.toast.success('Anuncio de confirmación guardado ✅')});
  }
  addPageAnnouncement() {
    this.pageAnnouncements = [...this.pageAnnouncements,{
      id:Date.now().toString(), enabled:true, page:'*', position:'top',
      style:'info', title:'Nuevo anuncio', message:'', icon:'📢',
      bg_color:'#E3F2FD', text_color:'#1565C0', border_color:'#90CAF9',
      font:'inherit', show_close:true, image_url:''
    }];
  }
  removePageAnnouncement(i:number) { this.pageAnnouncements.splice(i,1); }
  savePageAnnouncements() {
    this.http.put(`${environment.apiUrl}/site-settings/announcements`,{setting_value:{items:this.pageAnnouncements}}).subscribe({next:()=>this.toast.success('Anuncios guardados ✅')});
  }
  async onAnnoucementImageChange(event:Event, i:number) {
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file) return;
    const b64=await this.uploadService.fileToBase64(file);
    this.uploadService.uploadImage(b64,'star-crumbs/announcements').subscribe({next:r=>{this.pageAnnouncements[i].image_url=r.url;}});
  }

  getSocialIcon(p:string):string { const m:any={instagram:'fab fa-instagram',facebook:'fab fa-facebook-f',tiktok:'fab fa-tiktok',twitter:'fab fa-x-twitter',youtube:'fab fa-youtube',whatsapp:'fab fa-whatsapp',linkedin:'fab fa-linkedin-in',pinterest:'fab fa-pinterest'}; return m[p?.toLowerCase()]||'fas fa-link'; }
  getSocialLabel(p:string):string { const m:any={instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',twitter:'X / Twitter',youtube:'YouTube',whatsapp:'WhatsApp',linkedin:'LinkedIn',pinterest:'Pinterest'}; return m[p?.toLowerCase()]||p; }

  // Combo redesign admin methods
  openComboForm() { this.editingCombo.set(null); this.comboForm={name:'',description:'',box_type:'classic',category_id:'',max_units:4,price_per_unit:0,discount_percent:0,final_price:0,bg_color:'#E8C99A',accent_color:'#C9956A',is_active:true,is_featured:false}; this.showComboForm.set(true); }
  editCombo(c:any) { this.editingCombo.set(c); this.comboForm={...c}; this.showComboForm.set(true); }
  async saveCombo() {
    if(!this.comboForm.name){this.toast.error('Nombre requerido');return;}
    const obs=this.editingCombo()
      ?this.http.put(`${environment.apiUrl}/combos/${this.editingCombo().id}`,this.comboForm)
      :this.http.post(`${environment.apiUrl}/combos`,this.comboForm);
    obs.subscribe({next:()=>{this.toast.success('Guardado ✅');this.showComboForm.set(false);this.http.get<any[]>(`${environment.apiUrl}/combos/all`).subscribe(c=>this.combos.set(c));}});
  }
  deleteCombo(id:string) {
    if(!confirm('¿Eliminar cajita?')) return;
    this.http.delete(`${environment.apiUrl}/combos/${id}`).subscribe({next:()=>{this.toast.success('Eliminada');this.http.get<any[]>(`${environment.apiUrl}/combos/all`).subscribe(c=>this.combos.set(c));}});
  }
}
