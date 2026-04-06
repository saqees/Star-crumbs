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

    <!-- WHY US — fully dynamic -->
    <section class="section why-section"
             [style.background]="whyUs().bg_color||'var(--creamy-latte)'"
             [style.padding]="whyUs().padding||'64px 0'">
      <div class="container">
        <!-- Section header -->
        <div class="why-header"
             [style.textAlign]="whyUs().title_align||'center'">
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

        <!-- Items grid -->
        <div class="why-grid" [class]="'why-cols-' + (whyUs().columns||'3')">
          <div *ngFor="let w of whyUs().items" class="why-card"
               [class]="'why-shape-' + (w.card_shape||'rounded')"
               [class.why-card-image-bg]="w.card_style==='image_bg' && w.image"
               [style.background]="w.card_style==='image_bg' && w.image ? '' : (w.bg_color||'')">

            <!-- Image background mode -->
            <div *ngIf="w.card_style==='image_bg' && w.image"
                 class="why-card-img-bg"
                 [style.backgroundImage]="'url('+w.image+')'">
              <div class="why-card-img-overlay"></div>
              <div class="why-card-img-content">
                <h3 [style.color]="w.title_color||'#fff'" [style.fontFamily]="w.font?w.font+',serif':''">{{w.title}}</h3>
                <ng-container *ngTemplateOutlet="contentBlock; context:{w:w, dark:true}"></ng-container>
              </div>
            </div>

            <!-- Normal mode (icon/image + text) -->
            <ng-container *ngIf="w.card_style!=='image_bg' || !w.image">
              <!-- Media: icon or image -->
              <div class="why-media" *ngIf="w.icon||w.image"
                   [class.why-media-circle]="w.icon_shape==='circle'"
                   [class.why-media-square]="w.icon_shape==='square'"
                   [style.background]="w.icon_bg||''"
                   [style.alignSelf]="w.media_align||'center'">
                <img *ngIf="w.image && w.card_style!=='text_only'" [src]="w.image" [alt]="w.title"
                     class="why-item-img"
                     [class.why-img-full]="w.card_style==='full_image'"
                     [class.why-img-circle]="w.icon_shape==='circle'">
                <span *ngIf="!w.image && w.icon" class="why-item-icon">{{w.icon}}</span>
              </div>
              <!-- Text content -->
              <div class="why-text-body" [style.textAlign]="w.text_align||'center'">
                <h3 *ngIf="w.title"
                    [style.color]="w.title_color||'var(--mocca-bean)'"
                    [style.fontFamily]="w.font?w.font+',serif':''"
                    [style.fontSize]="w.title_size||''">
                  {{w.title}}
                </h3>
                <ng-container *ngTemplateOutlet="contentBlock; context:{w:w, dark:false}"></ng-container>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Content block template ── -->
    <ng-template #contentBlock let-w="w" let-dark="dark">
      <!-- Type: text (plain description) -->
      <p *ngIf="(!w.content_type||w.content_type==='text') && w.desc"
         class="why-item-desc"
         [style.color]="dark ? 'rgba(255,255,255,0.85)' : (w.desc_color||'var(--text-light)')"
         [style.fontFamily]="w.font?w.font+',sans-serif':''">
        {{w.desc}}
      </p>

      <!-- Type: list (bullet points or numbered) -->
      <ul *ngIf="w.content_type==='list' && w.list_items?.length"
          class="why-list" [class.why-list-num]="w.list_style==='numbered'"
          [style.color]="dark ? 'rgba(255,255,255,0.85)' : (w.desc_color||'var(--text-light)')">
        <li *ngFor="let li of w.list_items" [style.fontFamily]="w.font?w.font+',sans-serif':''">{{li}}</li>
      </ul>

      <!-- Type: ingredients (special bullet with cookie icons) -->
      <ul *ngIf="w.content_type==='ingredients' && w.list_items?.length" class="why-ingredients">
        <li *ngFor="let li of w.list_items"
            [style.color]="dark ? 'rgba(255,255,255,0.9)' : (w.desc_color||'var(--text-light)')"
            [style.fontFamily]="w.font?w.font+',sans-serif':''">
          <span class="ingr-dot" [style.background]="w.accent_color||'var(--warm-capuchino)'"></span>
          {{li}}
        </li>
      </ul>

      <!-- Type: button -->
      <a *ngIf="w.content_type==='button' && w.button_text" [href]="w.button_url||'/'"
         class="why-btn"
         [style.background]="w.button_color||'var(--warm-capuchino)'"
         [style.color]="w.button_text_color||'#fff'"
         [style.borderRadius]="w.button_radius||'var(--radius-full)'"
         [style.fontFamily]="w.font?w.font+',sans-serif':''">
        {{w.button_text}}
        <span *ngIf="w.button_icon">{{w.button_icon}}</span>
      </a>

      <!-- Type: mixed (desc + list) -->
      <ng-container *ngIf="w.content_type==='mixed'">
        <p *ngIf="w.desc" class="why-item-desc"
           [style.color]="dark ? 'rgba(255,255,255,0.85)' : (w.desc_color||'var(--text-light)')">{{w.desc}}</p>
        <ul *ngIf="w.list_items?.length" class="why-list"
            [style.color]="dark ? 'rgba(255,255,255,0.8)' : (w.desc_color||'var(--text-light)')">
          <li *ngFor="let li of w.list_items">{{li}}</li>
        </ul>
      </ng-container>
    </ng-template>

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
    /* ── Why-Us section header ── */
    .why-header { margin-bottom: 44px; }
    .why-eyebrow {
      display: block; font-size: .72rem; font-weight: 700;
      letter-spacing: 3.5px; text-transform: uppercase;
      color: var(--warm-capuchino); margin-bottom: 10px;
    }
    .why-header h2 {
      font-family: var(--font-display); font-size: clamp(1.6rem,3vw,2.4rem);
      color: var(--mocca-bean); margin-bottom: 12px; line-height: 1.15;
    }
    .why-section-desc {
      color: var(--text-mid); max-width: 540px;
      margin: 0 auto; font-size: .97rem; line-height: 1.7;
    }
    /* Grid column variants */
    .why-grid { display:grid; gap:24px; }
    .why-cols-2 { grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); }
    .why-cols-3 { grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
    .why-cols-4 { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
    /* ── Why-Us cards — default always beautiful ── */
    .why-card {
      background: #fff;
      border-radius: var(--radius-xl);
      padding: 28px 22px;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
      overflow: hidden;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .why-card:hover { transform: translateY(-7px); box-shadow: var(--shadow-md); }

    /* Card shape overrides */
    .why-shape-rounded  { border-radius: var(--radius-xl); }
    .why-shape-square   { border-radius: 4px; }
    .why-shape-pill     { border-radius: 999px; padding: 28px 36px; }
    .why-shape-flat     {
      border-radius: 0; border-bottom: 3px solid var(--warm-capuchino);
      box-shadow: none; background: transparent;
    }
    .why-shape-outlined {
      border-radius: var(--radius-lg); border: 2px solid var(--almond);
      box-shadow: none; background: transparent;
    }

    /* Media (icon / image container) */
    .why-media {
      margin-bottom: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    /* Icon with circle/square background */
    .why-media-circle {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--almond-light);
      display: flex; align-items: center; justify-content: center;
    }
    .why-media-square {
      width: 72px; height: 72px; border-radius: 16px;
      background: var(--almond-light);
      display: flex; align-items: center; justify-content: center;
    }

    /* Images */
    .why-item-img { width: 100%; max-height: 160px; object-fit: cover; display: block; }
    .why-img-full { max-height: none; height: 200px; }
    .why-img-circle { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }

    /* Icon emoji */
    .why-item-icon {
      font-size: 2.6rem;
      line-height: 1;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(181,98,46,0.18));
    }

    /* Text body */
    .why-text-body { width: 100%; padding: 0 4px; }
    .why-text-body h3 {
      font-size: 1.08rem;
      font-family: var(--font-display);
      color: var(--mocca-bean);
      margin-bottom: 8px;
      line-height: 1.25;
    }
    .why-item-desc {
      font-size: .875rem;
      color: var(--text-light);
      line-height: 1.7;
      margin: 0;
    }
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
    /* Responsive */
    @media(max-width:600px) {
      .why-cols-3,.why-cols-4 { grid-template-columns:1fr 1fr; }
      .why-cols-2 { grid-template-columns:1fr; }
    }
    @media(max-width:400px) {
      .why-cols-3,.why-cols-4 { grid-template-columns:1fr; }
    }
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
  whyUs = signal<any>({
    title: '¿Por qué Star Crumbs?',
    subtitle: 'LA DIFERENCIA',
    description: 'Galletas artesanales hechas con los mejores ingredientes y mucho amor.',
    bg_color: '#F5E6D3',
    title_color: '#5C3A1E',
    accent_color: '#C9956A',
    title_align: 'center',
    columns: '3',
    items: [
      {
        icon: '🍪', title: 'Ingredientes naturales',
        content_type: 'text', card_shape: 'rounded', card_style: 'default',
        bg_color: '#fff', title_color: '#5C3A1E', desc_color: '#9C7355',
        desc: 'Usamos solo ingredientes frescos y naturales, sin conservantes.',
        text_align: 'center'
      },
      {
        icon: '👩‍🍳', title: 'Hechas con amor',
        content_type: 'text', card_shape: 'rounded', card_style: 'default',
        bg_color: '#fff', title_color: '#5C3A1E', desc_color: '#9C7355',
        desc: 'Cada galleta es preparada a mano con recetas únicas y especiales.',
        text_align: 'center'
      },
      {
        icon: '🚀', title: 'Entrega rápida',
        content_type: 'text', card_shape: 'rounded', card_style: 'default',
        bg_color: '#fff', title_color: '#5C3A1E', desc_color: '#9C7355',
        desc: 'Llevamos tus galletas favoritas directo a tu ambiente del SENA.',
        text_align: 'center'
      }
    ]
  });
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
