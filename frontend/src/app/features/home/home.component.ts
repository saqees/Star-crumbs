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

    <!-- WHY US -->
    <section class="section why-section">
      <div class="container">
        <h2 class="text-center">{{whyUs().title}}</h2>
        <div class="why-grid">
          <div class="why-card" *ngFor="let w of whyUs().items">
            <div class="why-icon">
              <img *ngIf="w.image" [src]="w.image" [alt]="w.title" class="why-img">
              <span *ngIf="!w.image">{{w.icon}}</span>
            </div>
            <h3>{{w.title}}</h3>
            <p>{{w.desc}}</p>
          </div>
        </div>
      </div>
    </section>

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
    .why-section { background: var(--creamy-latte); }
    .why-section h2 { margin-bottom: 40px; color: var(--mocca-bean); }
    .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
    .why-card { background: #fff; border-radius: var(--radius-lg); padding: 28px 20px; text-align: center; box-shadow: var(--shadow-sm); transition: all var(--transition); }
    .why-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
    .why-icon { font-size: 2.2rem; margin-bottom: 14px; }
    .why-img { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-md); }
    .why-card h3 { color: var(--mocca-bean); margin-bottom: 7px; font-size: 1.05rem; }
    .why-card p { color: var(--text-light); font-size: 0.87rem; }
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
}
