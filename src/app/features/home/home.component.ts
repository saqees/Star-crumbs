import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/models';
import { ProductModalComponent } from '../products/product-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductModalComponent],
  template: `
    <!-- HERO / CAROUSEL -->
    <section class="hero">
      <div class="carousel">
        <div class="carousel-track" [style.transform]="'translateX(-'+currentSlide*100+'%)'">
          <div class="slide slide-1">
            <div class="slide-content">
              <span class="slide-tag">✨ Artesanal & Fresco</span>
              <h1>Galletas que <em>enamoran</em></h1>
              <p>Rellenas con los mejores ingredientes, hechas con amor en cada mordisco.</p>
              <div class="slide-btns">
                <a routerLink="/products" class="btn btn-primary">Ver Productos</a>
                <a href="https://wa.me/573000000000" target="_blank" class="btn btn-secondary">
                  <i class="fab fa-whatsapp"></i> Pedir por encargo
                </a>
              </div>
            </div>
            <div class="slide-emoji">🍪</div>
          </div>
          <div class="slide slide-2">
            <div class="slide-content">
              <span class="slide-tag">🎁 Cajas Personalizadas</span>
              <h1>El regalo <em>perfecto</em></h1>
              <p>Arma tu caja con los sabores favoritos de quien más quieres.</p>
              <div class="slide-btns">
                <a routerLink="/products" class="btn btn-primary">Armar Caja</a>
              </div>
            </div>
            <div class="slide-emoji">🎁</div>
          </div>
          <div class="slide slide-3">
            <div class="slide-content">
              <span class="slide-tag">⭐ Más Vendidas</span>
              <h1>Sabores que <em>conquistan</em></h1>
              <p>Chocolate, caramel, red velvet y mucho más. Descúbrelos hoy.</p>
              <div class="slide-btns">
                <a routerLink="/products" class="btn btn-primary">Explorar</a>
              </div>
            </div>
            <div class="slide-emoji">💫</div>
          </div>
        </div>
        <!-- Dots -->
        <div class="carousel-dots">
          <button *ngFor="let s of [0,1,2]" class="dot" [class.active]="currentSlide===s" (click)="goToSlide(s)"></button>
        </div>
        <!-- Arrows -->
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

        <!-- Skeleton -->
        <div *ngIf="loading()" class="products-grid">
          <div *ngFor="let s of [1,2,3,4]" class="skeleton-card">
            <div class="skeleton" style="height:200px"></div>
            <div style="padding:16px">
              <div class="skeleton" style="height:20px;margin-bottom:8px;width:70%"></div>
              <div class="skeleton" style="height:16px;width:50%"></div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading()" class="products-grid">
          <div *ngFor="let p of featured()" class="product-card card" (click)="openModal(p)">
            <div class="product-img-wrap">
              <img [src]="p.images[0] || 'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
              <span *ngIf="p.is_featured" class="featured-badge">⭐ Destacado</span>
              <div class="product-overlay">
                <button class="btn btn-primary btn-sm" (click)="addToCart($event, p)">
                  <i class="fas fa-bag-shopping"></i> Agregar
                </button>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{p.name}}</h3>
              <p class="product-desc">{{p.description | slice:0:70}}{{p.description && p.description.length>70 ? '...' : ''}}</p>
              <div class="product-footer">
                <span class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                <div class="product-rating">
                  <span class="stars">
                    <i *ngFor="let s of getStars(p.rating_avg)" class="fas fa-star"></i>
                    <i *ngFor="let s of getEmptyStars(p.rating_avg)" class="far fa-star star-empty"></i>
                  </span>
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
        <h2 class="text-center">¿Por qué <span class="highlight">Star Crumbs</span>?</h2>
        <div class="why-grid">
          <div class="why-card" *ngFor="let w of whyUs">
            <div class="why-icon">{{w.icon}}</div>
            <h3>{{w.title}}</h3>
            <p>{{w.desc}}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Modal -->
    <app-product-modal
      *ngIf="selectedProduct()"
      [product]="selectedProduct()!"
      (close)="selectedProduct.set(null)">
    </app-product-modal>
  `,
  styles: [`
    /* Hero / Carousel */
    .hero { background: var(--creamy-latte); overflow: hidden; }
    .carousel { position: relative; overflow: hidden; }
    .carousel-track { display: flex; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
    .slide {
      min-width: 100%; padding: 100px 24px;
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1280px; margin: 0 auto; position: relative;
    }
    .slide-1 { background: linear-gradient(135deg, var(--creamy-latte) 60%, var(--almond)); }
    .slide-2 { background: linear-gradient(135deg, var(--almond) 60%, var(--warm-capuchino) 100%); }
    .slide-3 { background: linear-gradient(135deg, var(--almond-light) 60%, var(--caramel) 100%); }
    .slide-content { max-width: 560px; z-index: 1; }
    .slide-tag {
      display: inline-block; background: var(--warm-capuchino); color: #fff;
      padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 700;
      margin-bottom: 16px;
    }
    .slide-content h1 { margin-bottom: 16px; }
    .slide-content h1 em { color: var(--warm-capuchino); font-style: normal; }
    .slide-content p { color: var(--text-mid); font-size: 1.1rem; margin-bottom: 32px; }
    .slide-btns { display: flex; gap: 16px; flex-wrap: wrap; }
    .slide-emoji { font-size: clamp(6rem, 15vw, 12rem); line-height: 1; animation: bounce 3s infinite; }
    .carousel-dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--almond); border: none; cursor: pointer; transition: all var(--transition);
    }
    .dot.active { background: var(--warm-capuchino); width: 24px; border-radius: 5px; }
    .carousel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,0.8); border: none; cursor: pointer;
      font-size: 1rem; color: var(--warm-capuchino); box-shadow: var(--shadow-sm);
      transition: all var(--transition); display: flex; align-items: center; justify-content: center;
    }
    .carousel-arrow:hover { background: var(--warm-capuchino); color: #fff; }
    .prev { left: 16px; } .next { right: 16px; }

    /* Section headers */
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header p { color: var(--text-light); margin-top: 8px; font-size: 1.05rem; }
    .highlight { color: var(--warm-capuchino); }
    .featured-section { background: var(--cream-white); }

    /* Product cards */
    .skeleton-card { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    .product-card { cursor: pointer; }
    .product-img-wrap { position: relative; overflow: hidden; height: 220px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
    .product-card:hover .product-img { transform: scale(1.08); }
    .featured-badge {
      position: absolute; top: 12px; left: 12px;
      background: var(--caramel); color: #fff;
      padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;
    }
    .product-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 20px;
      opacity: 0; transition: opacity var(--transition);
    }
    .product-card:hover .product-overlay { opacity: 1; }
    .product-info { padding: 18px; }
    .product-name { font-size: 1.05rem; margin-bottom: 6px; color: var(--mocca-bean); }
    .product-desc { font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px; min-height: 38px; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; }
    .product-price { font-size: 1.2rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .product-rating { display: flex; align-items: center; gap: 4px; }
    .rating-count { font-size: 0.75rem; color: var(--text-light); }

    /* Why us */
    .why-section { background: var(--creamy-latte); }
    .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px; margin-top: 48px; }
    .why-card {
      background: #fff; border-radius: var(--radius-lg); padding: 32px 24px;
      text-align: center; box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }
    .why-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
    .why-icon { font-size: 2.5rem; margin-bottom: 16px; }
    .why-card h3 { color: var(--mocca-bean); margin-bottom: 8px; font-size: 1.1rem; }
    .why-card p { color: var(--text-light); font-size: 0.9rem; }

    @media (max-width: 768px) {
      .slide { flex-direction: column; text-align: center; padding: 60px 16px; gap: 24px; }
      .slide-btns { justify-content: center; }
      .slide-emoji { font-size: 5rem; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private timer: any;
  loading = signal(true);
  featured = signal<Product[]>([]);
  selectedProduct = signal<Product | null>(null);

  whyUs = [
    { icon: '🍪', title: 'Ingredientes Premium', desc: 'Solo lo mejor para nuestras galletas artesanales.' },
    { icon: '❤️', title: 'Hechas con Amor', desc: 'Cada galleta es preparada con dedicación y cariño.' },
    { icon: '🚀', title: 'Pedidos por Encargo', desc: 'Personaliza tu pedido para cualquier ocasión especial.' },
    { icon: '⭐', title: 'Alta Calidad', desc: 'Nuestros clientes nos avalan con reseñas de 5 estrellas.' }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.productService.getAll({ featured: true }).subscribe({
      next: p => { this.featured.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.startCarousel();
  }

  ngOnDestroy() { clearInterval(this.timer); }

  startCarousel() {
    this.timer = setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide() { this.currentSlide = (this.currentSlide + 1) % 3; }
  prevSlide() { this.currentSlide = (this.currentSlide + 2) % 3; }
  goToSlide(i: number) { this.currentSlide = i; }

  openModal(p: Product) { this.selectedProduct.set(p); }

  addToCart(e: Event, p: Product) {
    e.stopPropagation();
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    this.cartService.addToCart(p);
    this.toast.success(`${p.name} agregado al carrito 🍪`);
  }

  getStars(avg: number) { return Array(Math.round(avg)).fill(0); }
  getEmptyStars(avg: number) { return Array(5 - Math.round(avg)).fill(0); }
}
