import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/models';
import { ProductModalComponent } from '../products/product-modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductModalComponent],
  template: `
    <!-- HERO / CAROUSEL -->
    <section class="hero" *ngIf="slides().length > 0">
      <div class="carousel">
        <div class="carousel-track" [style.transform]="'translateX(-'+currentSlide*100+'%)'">
          <div *ngFor="let slide of slides()" class="slide" [style]="getSlideStyle(slide)">
            <div class="slide-content">
              <span *ngIf="slide.subtitle" class="slide-tag" [style.background]="slide.tag_bg_color||'var(--warm-capuchino)'" [style.color]="'#fff'">{{slide.subtitle}}</span>
              <h1 [style.color]="slide.title_color||'var(--mocca-bean)'" [style.fontFamily]="slide.title_font||'var(--font-display)'">{{slide.title}}</h1>
              <p *ngIf="slide.description" [style.color]="slide.desc_color||'var(--text-mid)'" [style.fontFamily]="slide.body_font||'var(--font-body)'">{{slide.description}}</p>
              <div class="slide-btns">
                <a [routerLink]="slide.button_url || '/products'"
                   class="btn"
                   [class.btn-primary]="!slide.btn_style||slide.btn_style==='primary'"
                   [class.btn-secondary]="slide.btn_style==='secondary'"
                   [style.background]="slide.btn_style==='white'?'#fff':slide.btn_style==='dark'?'#5C3A1E':''"
                   [style.color]="slide.btn_style==='white'?'#5C3A1E':slide.btn_style==='dark'?'#fff':''"
                   [style.border]="slide.btn_style==='white'?'2px solid #ddd':''">
                  {{slide.button_text || 'Ver más'}}
                </a>
              </div>
            </div>
            <!-- Right side: emoji, small image, or nothing -->
            <div class="slide-right" *ngIf="slide.display_mode !== 'none'">
              <span *ngIf="slide.display_mode === 'emoji' || !slide.display_mode" class="slide-emoji">
                {{slide.emoji || '🍪'}}
              </span>
              <img *ngIf="slide.display_mode === 'small_image' && slide.image_url"
                   [src]="slide.image_url" [alt]="slide.title" class="slide-small-img">
            </div>
          </div>
        </div>
        <!-- Nav bar: prev • dots • next — below content -->
        <div class="carousel-nav">
          <button class="carousel-arrow" (click)="prevSlide()"><i class="fas fa-chevron-left"></i></button>
          <div class="carousel-dots">
            <button *ngFor="let s of slides(); let i=index"
                    class="dot" [class.active]="currentSlide===i"
                    (click)="goToSlide(i)"></button>
          </div>
          <button class="carousel-arrow" (click)="nextSlide()"><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </section>

    <!-- FEATURED PRODUCTS -->
    <section class="section featured-section">
      <div class="container">
        <div class="section-header">
          <h2>Nuestras <span class="highlight">Estrellas</span> 🌟</h2>
          <p>Los favoritos de nuestros clientes</p>
        </div>
        <div *ngIf="loading()" class="products-grid">
          <div *ngFor="let s of [1,2,3,4]" class="skeleton-card">
            <div class="skeleton" style="height:200px"></div>
            <div style="padding:14px"><div class="skeleton" style="height:18px;margin-bottom:8px;width:70%"></div></div>
          </div>
        </div>
        <div *ngIf="!loading()" class="products-grid">
          <div *ngFor="let p of featured()" class="product-card card" (click)="openModal(p)">
            <div class="product-img-wrap">
              <img [src]="p.images[0] || 'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
              <span *ngIf="p.is_featured" class="featured-badge">⭐</span>
              <div class="product-overlay">
                <button class="btn btn-primary btn-sm" (click)="addToCart($event, p)">
                  <i class="fas fa-bag-shopping"></i> Agregar
                </button>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{p.name}}</h3>
              <p class="product-desc">{{p.description | slice:0:65}}{{(p.description?.length||0)>65?'...':''}}</p>
              <div class="product-footer">
                <span class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                <div class="product-rating">
                  <i class="fas fa-star" style="color:var(--caramel);font-size:0.78rem"></i>
                  <span style="font-size:0.78rem;color:var(--text-light)">{{p.rating_avg | number:'1.1-1'}} ({{p.rating_count}})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-lg">
          <a routerLink="/products" class="btn btn-secondary">Ver todos los productos</a>
        </div>
      </div>
    </section>

    <!-- CAJITAS DESTACADAS -->
    <section class="section cajitas-home-section" *ngIf="featuredCombos().length">
      <div class="container">
        <div class="section-header">
          <h2>Nuestras <span class="highlight">Cajitas</span> 🎁</h2>
          <p>Arma tu combinación perfecta de galletas</p>
        </div>
        <div class="combos-home-grid">
          <div *ngFor="let combo of featuredCombos()" class="combo-home-card" [routerLink]="['/cajitas']">
            <!-- CSS Box -->
            <div class="combo-css-box" [style.background]="combo.bg_color||'#F5E6D3'">
              <div class="chb-lid" [style.background]="combo.accent_color||'#C9956A'">
                <span>🎀</span>
                <div class="chb-stripe"></div>
              </div>
              <div class="chb-body" [style.background]="combo.accent_color||'#C9956A'">
                <div class="chb-inner">
                  <span *ngFor="let d of getCookies(combo.max_units)" class="chb-ck">🍪</span>
                </div>
              </div>
              <div class="chb-shadow"></div>
            </div>
            <div class="combo-home-info">
              <span class="combo-type-pill" [class]="'ctp-'+combo.box_type">
                {{combo.box_type==='classic'?'Clásica':combo.box_type==='special'?'Especial':'Combinada'}}
              </span>
              <h3>{{combo.name}}</h3>
              <p>{{combo.description}}</p>
              <div class="combo-home-specs">
                <span><i class="fas fa-cookie-bite"></i> {{combo.max_units}} galletas</span>
                <span *ngIf="combo.discount_percent>0" class="combo-disc">-{{combo.discount_percent}}% OFF</span>
              </div>
              <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:10px">
                <i class="fas fa-box-open"></i> Armar cajita
              </button>
            </div>
          </div>
        </div>
        <div class="text-center mt-lg">
          <a routerLink="/cajitas" class="btn btn-secondary">Ver todas las cajitas</a>
        </div>
      </div>
    </section>

    <!-- WHY US — tarjetas con modal al click -->
    <section class="section why-section"
             [style.background]="whyUs().bg_color||'var(--creamy-latte)'"
             [style.padding]="whyUs().padding||'64px 0'">
      <div class="container">
        <!-- Section header -->
        <div class="why-header" [style.textAlign]="whyUs().title_align||'center'">
          <span *ngIf="whyUs().subtitle" class="why-eyebrow"
                [style.color]="whyUs().accent_color||'var(--warm-capuchino)'">
            {{whyUs().subtitle}}
          </span>
          <h2 [style.color]="whyUs().title_color||'var(--mocca-bean)'"
              [style.fontFamily]="whyUs().title_font?whyUs().title_font+',serif':''">
            {{whyUs().title || '¿Por qué Star Crumbs?'}}
          </h2>
          <p *ngIf="whyUs().description" class="why-section-desc"
             [style.color]="whyUs().desc_color||'var(--text-mid)'">
            {{whyUs().description}}
          </p>
        </div>

        <!-- Items grid — solo icono/imagen + título + desc corta, click abre modal -->
        <div class="why-grid" [class]="'why-cols-' + (whyUs().columns||'3')">
          <div *ngFor="let w of whyUs().items"
               class="why-card"
               [class]="'why-shape-' + (w.card_shape||'rounded')"
               [class.why-card-has-detail]="w.modal_content?.blocks?.length || w.list_items?.length"
               [style.background]="w.card_style==='image_bg' && w.image ? '' : (w.bg_color||'')"
               (click)="openWhyModal(w)">

            <!-- Image background mode -->
            <div *ngIf="w.card_style==='image_bg' && w.image"
                 class="why-card-img-bg"
                 [style.backgroundImage]="'url('+w.image+')'">
              <div class="why-card-img-overlay"></div>
              <div class="why-card-img-content">
                <span *ngIf="w.icon" class="why-card-img-icon">{{w.icon}}</span>
                <h3 [style.color]="w.title_color||'#fff'" [style.fontFamily]="w.font?w.font+',serif':''">{{w.title}}</h3>
                <p *ngIf="w.desc" class="why-card-img-desc">{{w.desc | slice:0:80}}{{w.desc?.length>80?'…':''}}</p>
              </div>
            </div>

            <!-- Normal mode: solo icono/imagen + título + desc corta -->
            <ng-container *ngIf="w.card_style!=='image_bg' || !w.image">
              <div class="why-media" *ngIf="w.icon||w.image"
                   [class.why-media-circle]="w.icon_shape==='circle'"
                   [class.why-media-square]="w.icon_shape==='square'"
                   [style.background]="w.icon_bg||''">
                <img *ngIf="w.image && w.card_style!=='text_only'" [src]="w.image" [alt]="w.title"
                     class="why-item-img"
                     [class.why-img-full]="w.card_style==='full_image'"
                     [class.why-img-circle]="w.icon_shape==='circle'">
                <span *ngIf="!w.image && w.icon" class="why-item-icon">{{w.icon}}</span>
              </div>
              <div class="why-text-body" [style.textAlign]="w.text_align||'center'">
                <h3 *ngIf="w.title"
                    [style.color]="w.title_color||'var(--mocca-bean)'"
                    [style.fontFamily]="w.font?w.font+',serif':''"
                    [style.fontSize]="w.title_size||''">
                  {{w.title}}
                </h3>
                <p *ngIf="w.desc" class="why-item-desc"
                   [style.color]="w.desc_color||'var(--text-light)'"
                   [style.fontFamily]="w.font?w.font+',sans-serif':''">
                  {{w.desc | slice:0:100}}{{w.desc?.length>100?'…':''}}
                </p>
              </div>
              <div *ngIf="w.modal_content?.blocks?.length || w.list_items?.length" class="why-card-hint">
                <span>Ver más <i class="fas fa-arrow-right"></i></span>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </section>

    <!-- ── MODAL DE TARJETA WHY US ── -->
    <div class="why-modal-overlay" *ngIf="whyModal" (click)="onWhyOverlayClick($event)">
      <div class="why-modal">
        <div class="why-modal-header"
             [style.background]="whyModal.bg_color||'#fff'"
             [style.borderColor]="whyModal.accent_color||'var(--almond)'">
          <div class="why-modal-media">
            <img *ngIf="whyModal.image" [src]="whyModal.image" [alt]="whyModal.title" class="why-modal-img">
            <span *ngIf="!whyModal.image && whyModal.icon" class="why-modal-icon">{{whyModal.icon}}</span>
          </div>
          <div class="why-modal-title-wrap">
            <h2 [style.color]="whyModal.title_color||'var(--mocca-bean)'"
                [style.fontFamily]="whyModal.font?whyModal.font+',serif':''">
              {{whyModal.title}}
            </h2>
            <p *ngIf="whyModal.desc" class="why-modal-subtitle"
               [style.color]="whyModal.desc_color||'var(--text-mid)'">
              {{whyModal.desc}}
            </p>
          </div>
          <button class="why-modal-close" (click)="whyModal=null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="why-modal-body">
          <ng-container *ngFor="let block of whyModal.modal_content?.blocks">
            <p *ngIf="block.type==='text'" class="wmb-text"
               [style.color]="block.color||'var(--text-mid)'"
               [style.fontFamily]="whyModal.font?whyModal.font+',sans-serif':''">{{block.value}}</p>
            <h3 *ngIf="block.type==='heading'" class="wmb-heading"
                [style.color]="whyModal.title_color||'var(--mocca-bean)'">{{block.value}}</h3>
            <ul *ngIf="block.type==='list'" class="wmb-list">
              <li *ngFor="let li of block.items" [style.color]="block.color||'var(--text-mid)'">
                <span class="wmb-dot" [style.background]="whyModal.accent_color||'var(--warm-capuchino)'"></span>{{li}}
              </li>
            </ul>
            <ol *ngIf="block.type==='numbered'" class="wmb-list wmb-numbered">
              <li *ngFor="let li of block.items" [style.color]="block.color||'var(--text-mid)'">{{li}}</li>
            </ol>
            <div *ngIf="block.type==='image' && block.url" class="wmb-image-wrap">
              <img [src]="block.url" [alt]="block.caption||''" class="wmb-image">
              <p *ngIf="block.caption" class="wmb-caption">{{block.caption}}</p>
            </div>
            <hr *ngIf="block.type==='divider'" class="wmb-divider">
            <blockquote *ngIf="block.type==='quote'" class="wmb-quote"
                        [style.borderColor]="whyModal.accent_color||'var(--warm-capuchino)'">{{block.value}}</blockquote>
          </ng-container>
          <!-- Fallback legacy content -->
          <ng-container *ngIf="!whyModal.modal_content?.blocks?.length">
            <ul *ngIf="whyModal.list_items?.length" class="wmb-list"
                [class.wmb-numbered]="whyModal.list_style==='numbered'">
              <li *ngFor="let li of whyModal.list_items">
                <span *ngIf="whyModal.list_style!=='numbered'" class="wmb-dot"
                      [style.background]="whyModal.accent_color||'var(--warm-capuchino)'"></span>{{li}}
              </li>
            </ul>
          </ng-container>
        </div>
        <div class="why-modal-footer">
          <button class="btn btn-primary btn-sm" (click)="whyModal=null">Cerrar</button>
        </div>
      </div>
    </div>

    <app-product-modal *ngIf="selectedProduct()" [product]="selectedProduct()!" (close)="selectedProduct.set(null)"></app-product-modal>
  `,
  styles: [`
    .hero { overflow: hidden; }
    .carousel { position: relative; overflow: hidden; }
    .carousel-track { display: flex; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
    .slide {
      min-width: 100%; padding: 72px 60px 80px;
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; position: relative; box-sizing: border-box;
      gap: 32px; min-height: 420px;
    }
    .slide-content { max-width: 560px; z-index: 1; flex: 1; }
    .slide-tag { display: inline-block; background: var(--warm-capuchino); color: #fff; padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 700; margin-bottom: 16px; }
    .slide-content h1 { margin-bottom: 14px; color: var(--mocca-bean); }
    .slide-content p { color: var(--text-mid); font-size: 1.05rem; margin-bottom: 28px; }
    .slide-btns { display: flex; gap: 14px; flex-wrap: wrap; }
    .slide-right { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .slide-emoji { font-size: clamp(5rem, 12vw, 10rem); line-height: 1; animation: bounce 3s infinite; display: block; }
    .slide-small-img { width: clamp(160px, 25vw, 300px); height: clamp(160px, 25vw, 300px); object-fit: cover; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); }
    /* Navigation bar at bottom: arrows + dots together */
    .carousel-nav {
      position: absolute; bottom: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 12px 20px; 
      background: linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%);
    }
    .carousel-dots { display: flex; gap: 8px; align-items: center; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.55); border: none; cursor: pointer; transition: all var(--transition); -webkit-tap-highlight-color: transparent; }
    .dot.active { background: var(--warm-capuchino); width: 22px; border-radius: 5px; }
    .carousel-arrow {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.88); border: none; cursor: pointer;
      font-size: 0.82rem; color: var(--warm-capuchino);
      box-shadow: var(--shadow-sm); transition: all var(--transition);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; -webkit-tap-highlight-color: transparent;
    }
    .carousel-arrow:hover { background: var(--warm-capuchino); color: #fff; }
    .section-header { text-align: center; margin-bottom: 40px; }
    .section-header p { color: var(--text-light); margin-top: 8px; }
    .highlight { color: var(--warm-capuchino); }
    .featured-section { background: var(--cream-white); }
    .skeleton-card { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    .product-card { cursor: pointer; }
    .product-img-wrap { position: relative; overflow: hidden; height: 200px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .product-card:hover .product-img { transform: scale(1.08); }
    .featured-badge { position: absolute; top: 10px; left: 10px; background: var(--caramel); color: #fff; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
    .product-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 16px; opacity: 0; transition: opacity var(--transition); }
    .product-card:hover .product-overlay { opacity: 1; }
    /* Hide overlay completely on touch/mobile - no hover on touch devices */
    @media (hover: none) { .product-overlay { display: none !important; } }
    .product-info { padding: 14px; }
    .product-name { font-size: 1rem; margin-bottom: 5px; color: var(--mocca-bean); }
    .product-desc { font-size: 0.82rem; color: var(--text-light); margin-bottom: 10px; min-height: 34px; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; }
    .product-price { font-size: 1.1rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .product-rating { display: flex; align-items: center; gap: 4px; }
    /* Cajitas home section */
    .cajitas-home-section { background: var(--almond-light); }
    .combos-home-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:24px; }
    .combo-home-card { background:#fff; border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); cursor:pointer; transition:all .35s ease; overflow:hidden; display:flex; flex-direction:column; }
    .combo-home-card:hover { transform:translateY(-7px); box-shadow:var(--shadow-md); }
    .combo-css-box { padding:24px 0 12px; display:flex; flex-direction:column; align-items:center; perspective:500px; }
    .chb-lid { width:100px; height:30px; margin-left:-4px; border-radius:7px 7px 0 0; display:flex; align-items:center; justify-content:center; position:relative; transform-origin:top center; transition:transform .55s cubic-bezier(.4,0,.2,1); }
    .chb-lid span { font-size:1rem; }
    .chb-stripe { position:absolute; width:100%; height:5px; background:rgba(255,255,255,.25); bottom:4px; }
    .chb-body { width:94px; height:66px; border-radius:0 0 9px 9px; display:flex; align-items:center; justify-content:center; }
    .chb-inner { display:flex; flex-wrap:wrap; gap:2px; max-width:72px; justify-content:center; }
    .chb-ck { font-size:.95rem; opacity:.75; }
    .chb-shadow { width:84px; height:10px; background:radial-gradient(ellipse,rgba(0,0,0,.12),transparent); border-radius:50%; margin-top:4px; }
    .combo-home-card:hover .chb-lid { transform:rotateX(-25deg); }
    .combo-home-info { padding:16px; display:flex; flex-direction:column; gap:6px; flex:1; }
    .combo-type-pill { display:inline-block; padding:3px 9px; border-radius:var(--radius-full); font-size:.68rem; font-weight:700; width:fit-content; }
    .ctp-classic  { background:#e3f2fd; color:#1565c0; }
    .ctp-special  { background:#fce4ec; color:#c62828; }
    .ctp-combined { background:#e8f5e9; color:#2e7d32; }
    .combo-home-info h3 { color:var(--mocca-bean); font-size:.98rem; margin:0; }
    .combo-home-info p  { font-size:.79rem; color:var(--text-light); margin:0; min-height:28px; }
    .combo-home-specs { display:flex; align-items:center; gap:8px; font-size:.75rem; color:var(--text-mid); }
    .combo-disc { background:var(--error); color:#fff; padding:2px 7px; border-radius:var(--radius-full); font-weight:700; }
    /* ── Why section ── */
    .why-header { margin-bottom: 40px; }
    .why-eyebrow { display:block; font-size:.78rem; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px; }
    .why-header h2 { margin-bottom:10px; }
    .why-section-desc { color:var(--text-mid); max-width:560px; margin:0 auto; font-size:.95rem; }
    /* Grid column variants */
    .why-grid { display:grid; gap:24px; }
    .why-cols-2 { grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); }
    .why-cols-3 { grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
    .why-cols-4 { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
    /* Card shapes */
    .why-card { background:#fff; transition:all var(--transition); overflow:hidden; }
    .why-card:hover { transform:translateY(-6px); box-shadow:var(--shadow-md); }
    .why-shape-rounded  { border-radius:var(--radius-xl); padding:28px 22px; box-shadow:var(--shadow-sm); }
    .why-shape-square   { border-radius:4px; padding:28px 22px; box-shadow:var(--shadow-sm); }
    .why-shape-pill     { border-radius:999px; padding:28px 32px; box-shadow:var(--shadow-sm); }
    .why-shape-flat     { border-radius:0; border-bottom:3px solid var(--warm-capuchino); padding:24px 18px; box-shadow:none; }
    .why-shape-outlined { border-radius:var(--radius-lg); border:2px solid var(--almond); padding:26px 20px; box-shadow:none; background:transparent; }
    /* Media */
    .why-media { margin-bottom:16px; display:flex; justify-content:center; }
    .why-media-circle,.why-media-square { width:64px; height:64px; display:flex; align-items:center; justify-content:center; }
    .why-media-circle { border-radius:50%; }
    .why-media-square  { border-radius:12px; }
    .why-item-img { width:100%; max-height:160px; object-fit:cover; display:block; }
    .why-img-full { max-height:none; height:200px; }
    .why-img-circle { width:72px; height:72px; border-radius:50%; object-fit:cover; }
    .why-item-icon { font-size:2.4rem; line-height:1; }
    /* Text body */
    .why-text-body { padding:0 4px; }
    .why-text-body h3 { font-size:1.05rem; margin-bottom:8px; }
    .why-item-desc { font-size:.88rem; line-height:1.65; }
    /* List */
    .why-list { list-style:disc; padding-left:20px; font-size:.85rem; line-height:1.7; text-align:left; margin-top:6px; }
    .why-list-num { list-style:decimal; }
    /* Ingredients */
    .why-ingredients { list-style:none; padding:0; margin-top:7px; display:flex; flex-direction:column; gap:5px; text-align:left; }
    .why-ingredients li { display:flex; align-items:center; gap:8px; font-size:.85rem; line-height:1.4; }
    .ingr-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    /* Button */
    .why-btn { display:inline-flex; align-items:center; gap:6px; margin-top:12px; padding:10px 22px; font-size:.85rem; font-weight:700; text-decoration:none; transition:all var(--transition); }
    .why-btn:hover { opacity:.9; transform:translateY(-2px); }
    /* Image background card */
    .why-card-img-bg { min-height:220px; background-size:cover; background-position:center; position:relative; border-radius:inherit; display:flex; align-items:flex-end; }
    .why-card-img-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.1) 60%); border-radius:inherit; }
    .why-card-img-content { position:relative; z-index:1; padding:20px; }
    .why-card-img-content h3 { color:#fff; margin-bottom:6px; }
    .why-card-img-icon { font-size:1.8rem; display:block; margin-bottom:6px; }
    .why-card-img-desc { color:rgba(255,255,255,0.85); font-size:.84rem; margin:4px 0 0; }
    /* Card clickable + hint */
    .why-card { cursor:pointer; position:relative; }
    .why-card-has-detail:hover { transform:translateY(-6px); box-shadow:var(--shadow-md); }
    .why-card-hint { margin-top:10px; text-align:center; font-size:.78rem; font-weight:700;
      color:var(--warm-capuchino); opacity:0; transition:opacity var(--transition); }
    .why-card:hover .why-card-hint { opacity:1; }
    /* Responsive */
    @media(max-width:600px) {
      .why-cols-3,.why-cols-4 { grid-template-columns:1fr 1fr; }
      .why-cols-2 { grid-template-columns:1fr; }
    }
    @media(max-width:400px) {
      .why-cols-3,.why-cols-4 { grid-template-columns:1fr; }
    }
    /* ── MODAL WHY US ── */
    .why-modal-overlay { position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,0.55);
      backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center;
      padding:16px; animation:wmoFadeIn 0.2s ease; }
    @keyframes wmoFadeIn { from{opacity:0} to{opacity:1} }
    .why-modal { background:var(--cream-white); border-radius:20px; width:100%; max-width:520px;
      max-height:88vh; overflow:hidden; display:flex; flex-direction:column;
      box-shadow:0 24px 80px rgba(93,58,30,0.28); animation:wmoSlideUp 0.25s cubic-bezier(0.4,0,0.2,1); }
    @keyframes wmoSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    .why-modal-header { display:flex; align-items:center; gap:14px; padding:20px;
      border-bottom:3px solid var(--almond); flex-shrink:0; }
    .why-modal-media { flex-shrink:0; }
    .why-modal-img { width:64px; height:64px; border-radius:14px; object-fit:cover;
      box-shadow:0 4px 14px rgba(0,0,0,0.12); }
    .why-modal-icon { font-size:3rem; line-height:1; }
    .why-modal-title-wrap { flex:1; }
    .why-modal-title-wrap h2 { font-size:1.2rem; margin:0 0 4px; }
    .why-modal-subtitle { font-size:.86rem; margin:0; }
    .why-modal-close { width:34px; height:34px; border-radius:50%; border:none;
      background:var(--almond-light); cursor:pointer; display:flex; align-items:center;
      justify-content:center; font-size:.9rem; color:var(--mocca-bean);
      flex-shrink:0; transition:background var(--transition); }
    .why-modal-close:hover { background:var(--almond); }
    .why-modal-body { flex:1; overflow-y:auto; padding:22px 24px; display:flex; flex-direction:column; gap:14px; }
    .wmb-text { font-size:.92rem; line-height:1.7; margin:0; }
    .wmb-heading { font-size:1.05rem; font-weight:700; color:var(--mocca-bean); margin:6px 0 2px; }
    .wmb-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
    .wmb-list li { display:flex; align-items:flex-start; gap:10px; font-size:.9rem; line-height:1.5; }
    .wmb-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
    .wmb-numbered { list-style:decimal; padding-left:20px; }
    .wmb-numbered li { display:list-item; }
    .wmb-image-wrap { border-radius:12px; overflow:hidden; }
    .wmb-image { width:100%; max-height:220px; object-fit:cover; display:block; }
    .wmb-caption { font-size:.75rem; color:var(--text-light); text-align:center; margin:6px 0 0; }
    .wmb-divider { border:none; border-top:1px solid var(--almond-light); margin:4px 0; }
    .wmb-quote { border-left:4px solid var(--warm-capuchino); margin:0; padding:10px 16px;
      font-style:italic; font-size:.9rem; background:var(--almond-light); border-radius:0 8px 8px 0; }
    .why-modal-footer { padding:14px 20px; border-top:1px solid var(--almond-light);
      display:flex; justify-content:flex-end; flex-shrink:0; background:var(--cream-white); }
    @media (max-width: 768px) {
      .slide { flex-direction: column; text-align: center; padding: 40px 20px 72px; gap: 16px; min-height: 360px; }
      .slide-btns { justify-content: center; }
      .slide-right { order: -1; }
      .slide-emoji { font-size: 3.5rem; animation: none; }
      .slide-small-img { width: 110px; height: 110px; }
      .carousel-nav { padding: 8px 16px; gap: 8px; }
      .carousel-arrow { width: 30px; height: 30px; font-size: 0.75rem; }
      .dot { width: 7px; height: 7px; }
      .dot.active { width: 18px; }
    }
    @media (max-width: 480px) {
      .slide { padding: 32px 16px 64px; min-height: 320px; }
      .slide-content h1 { font-size: 1.4rem; }
      .slide-content p { font-size: 0.9rem; margin-bottom: 18px; }
      .slide-emoji { font-size: 3rem; }
    }
    @media (max-width: 480px) {
      .product-img-wrap { height: 160px; }
      .product-info { padding: 10px; }
      .product-name { font-size: 0.9rem; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private timer: any;
  loading = signal(true);
  featured = signal<Product[]>([]);
  slides = signal<any[]>([]);
  selectedProduct = signal<Product | null>(null);
  whyUs = signal<any>({ title: '¿Por qué Star Crumbs?', items: [] });
  whyModal: any = null;

  openWhyModal(w: any) { this.whyModal = w; }
  onWhyOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('why-modal-overlay')) this.whyModal = null;
  }
  featuredCombos = signal<any[]>([]);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.productService.getAll({ featured: true }).subscribe({
      next: p => { this.featured.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.http.get<any[]>(`${environment.apiUrl}/carousel`).subscribe({
      next: slides => { this.slides.set(slides); if (slides.length > 1) this.startCarousel(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/combos`).subscribe({
      next: c => this.featuredCombos.set(c.filter((x:any) => x.is_featured).slice(0,3))
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/why_us`).subscribe({
      next: s => { if (s?.setting_value) this.whyUs.set(s.setting_value); }
    });
  }

  ngOnDestroy() { clearInterval(this.timer); }

  startCarousel() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.slides().length; }
  prevSlide() { this.currentSlide = (this.currentSlide + this.slides().length - 1) % this.slides().length; }
  goToSlide(i: number) { this.currentSlide = i; }

  getSlideStyle(slide: any): string {
    let bg = '';
    if (slide.display_mode === 'bg_image' && slide.image_url) {
      bg = `background: url('${slide.image_url}') center/cover no-repeat;`;
    } else if (slide.bg_color) {
      bg = `background: ${slide.bg_color};`;
    } else {
      bg = `background: ${slide.bg_gradient || 'linear-gradient(135deg, #F5E6D3 60%, #E8C99A)'};`;
    }
    return bg;
  }

  openModal(p: Product) { this.selectedProduct.set(p); }

  addToCart(e: Event, p: Product) {
    e.stopPropagation();
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    this.cartService.addToCart(p);
    this.toast.success(p.name + ' agregado 🍪');
  }
  getCookies(n: number) { return Array(Math.min(n, 6)).fill(0); }
}
