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
    <section class="hero">
      <div class="carousel" *ngIf="slides().length > 0">
        <div class="carousel-track" [style.transform]="'translateX(-'+currentSlide*100+'%)'">
          <div *ngFor="let slide of slides()" class="slide" [style.background]="slide.bg_gradient">
            <div class="slide-content">
              <span *ngIf="slide.subtitle" class="slide-tag">{{slide.subtitle}}</span>
              <h1>{{slide.title}}</h1>
              <p *ngIf="slide.description">{{slide.description}}</p>
              <div class="slide-btns">
                <a [routerLink]="slide.button_url || '/products'" class="btn btn-primary">{{slide.button_text || 'Ver más'}}</a>
              </div>
            </div>
            <div class="slide-img-wrap">
              <img *ngIf="slide.image_url" [src]="slide.image_url" [alt]="slide.title" class="slide-img">
              <span *ngIf="!slide.image_url" class="slide-emoji">🍪</span>
            </div>
          </div>
        </div>
        <div class="carousel-dots">
          <button *ngFor="let s of slides(); let i=index" class="dot" [class.active]="currentSlide===i" (click)="goToSlide(i)"></button>
        </div>
        <button class="carousel-arrow prev" (click)="prevSlide()"><i class="fas fa-chevron-left"></i></button>
        <button class="carousel-arrow next" (click)="nextSlide()"><i class="fas fa-chevron-right"></i></button>
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
            <div style="padding:16px"><div class="skeleton" style="height:20px;margin-bottom:8px;width:70%"></div></div>
          </div>
        </div>
        <div *ngIf="!loading()" class="products-grid">
          <div *ngFor="let p of featured()" class="product-card card" (click)="openModal(p)">
            <div class="product-img-wrap">
              <img [src]="p.images[0] || 'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
              <span *ngIf="p.is_featured" class="featured-badge">⭐ Destacado</span>
              <div class="product-overlay">
                <button class="btn btn-primary btn-sm" (click)="addToCart($event, p)"><i class="fas fa-bag-shopping"></i> Agregar</button>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{p.name}}</h3>
              <p class="product-desc">{{p.description | slice:0:70}}{{(p.description?.length || 0) > 70 ? '...' : ''}}</p>
              <div class="product-footer">
                <span class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                <div class="product-rating">
                  <span class="stars"><i *ngFor="let s of getStars(p.rating_avg)" class="fas fa-star"></i></span>
                  <span class="rating-count">({{p.rating_count}})</span>
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

    <!-- Product Modal -->
    <app-product-modal *ngIf="selectedProduct()" [product]="selectedProduct()!" (close)="selectedProduct.set(null)"></app-product-modal>
  `,
  styles: [`
    .hero { background: var(--creamy-latte); overflow: hidden; }
    .carousel { position: relative; overflow: hidden; }
    .carousel-track { display: flex; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
    .slide {
      min-width: 100%; padding: 100px 24px;
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1280px; margin: 0 auto; position: relative; box-sizing: border-box;
    }
    .slide-content { max-width: 560px; z-index: 1; }
    .slide-tag { display: inline-block; background: var(--warm-capuchino); color: #fff; padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 700; margin-bottom: 16px; }
    .slide-content h1 { margin-bottom: 16px; color: var(--mocca-bean); }
    .slide-content p { color: var(--text-mid); font-size: 1.1rem; margin-bottom: 32px; }
    .slide-btns { display: flex; gap: 16px; flex-wrap: wrap; }
    .slide-img-wrap { display: flex; align-items: center; justify-content: center; }
    .slide-img { max-width: 340px; max-height: 280px; object-fit: cover; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); }
    .slide-emoji { font-size: clamp(6rem, 15vw, 12rem); line-height: 1; animation: bounce 3s infinite; }
    .carousel-dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--almond); border: none; cursor: pointer; transition: all var(--transition); }
    .dot.active { background: var(--warm-capuchino); width: 24px; border-radius: 5px; }
    .carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.8); border: none; cursor: pointer; font-size: 1rem; color: var(--warm-capuchino); box-shadow: var(--shadow-sm); transition: all var(--transition); display: flex; align-items: center; justify-content: center; }
    .carousel-arrow:hover { background: var(--warm-capuchino); color: #fff; }
    .prev { left: 16px; } .next { right: 16px; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header p { color: var(--text-light); margin-top: 8px; font-size: 1.05rem; }
    .highlight { color: var(--warm-capuchino); }
    .featured-section { background: var(--cream-white); }
    .skeleton-card { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    .product-card { cursor: pointer; }
    .product-img-wrap { position: relative; overflow: hidden; height: 220px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
    .product-card:hover .product-img { transform: scale(1.08); }
    .featured-badge { position: absolute; top: 12px; left: 12px; background: var(--caramel); color: #fff; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
    .product-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 20px; opacity: 0; transition: opacity var(--transition); }
    .product-card:hover .product-overlay { opacity: 1; }
    .product-info { padding: 18px; }
    .product-name { font-size: 1.05rem; margin-bottom: 6px; color: var(--mocca-bean); }
    .product-desc { font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px; min-height: 38px; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; }
    .product-price { font-size: 1.2rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .product-rating { display: flex; align-items: center; gap: 4px; }
    .rating-count { font-size: 0.75rem; color: var(--text-light); }
    .why-section { background: var(--creamy-latte); }
    .why-section h2 { margin-bottom: 48px; color: var(--mocca-bean); }
    .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px; }
    .why-card { background: #fff; border-radius: var(--radius-lg); padding: 32px 24px; text-align: center; box-shadow: var(--shadow-sm); transition: all var(--transition); }
    .why-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
    .why-icon { font-size: 2.5rem; margin-bottom: 16px; }
    .why-img { width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-md); }
    .why-card h3 { color: var(--mocca-bean); margin-bottom: 8px; font-size: 1.1rem; }
    .why-card p { color: var(--text-light); font-size: 0.9rem; }
    @media (max-width: 768px) {
      .slide { flex-direction: column; text-align: center; padding: 60px 16px; gap: 24px; }
      .slide-btns { justify-content: center; }
      .slide-img { max-width: 200px; }
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
    this.http.get<any>(`${environment.apiUrl}/carousel`).subscribe({
      next: slides => { this.slides.set(slides); this.startCarousel(); }
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/why_us`).subscribe({
      next: s => this.whyUs.set(s.setting_value)
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

  openModal(p: Product) { this.selectedProduct.set(p); }

  addToCart(e: Event, p: Product) {
    e.stopPropagation();
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    this.cartService.addToCart(p);
    this.toast.success(p.name + ' agregado al carrito 🍪');
  }

  getStars(avg: number) { return Array(Math.round(avg)).fill(0); }
}
