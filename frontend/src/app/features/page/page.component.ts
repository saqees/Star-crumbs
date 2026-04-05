import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductModalComponent } from '../products/product-modal.component';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductModalComponent],
  template: `
    <div class="page-enter" *ngIf="page()">
      <div class="page-header">
        <div class="container"><h1>{{page().title}}</h1></div>
      </div>
      <div class="container section-sm">
        <div *ngFor="let sec of page().sections || []" class="page-section">

          <!-- TEXT -->
          <div *ngIf="sec.type==='text'" class="sec-text card">
            <h2 *ngIf="sec.title">{{sec.title}}</h2>
            <p *ngIf="sec.content">{{sec.content}}</p>
          </div>

          <!-- BANNER -->
          <div *ngIf="sec.type==='banner'" class="sec-banner card">
            <img *ngIf="sec.image" [src]="sec.image" [alt]="sec.title" class="banner-img">
            <div class="banner-text">
              <h2 *ngIf="sec.title">{{sec.title}}</h2>
              <p *ngIf="sec.description">{{sec.description}}</p>
              <a *ngIf="sec.button_text" [routerLink]="sec.button_url||'/'" class="btn btn-primary mt-md">{{sec.button_text}}</a>
            </div>
          </div>

          <!-- ALL PRODUCTS -->
          <div *ngIf="sec.type==='products_all'">
            <h2 *ngIf="sec.title" style="margin-bottom:24px;color:var(--mocca-bean)">{{sec.title}}</h2>
            <div *ngIf="!allProducts().length" class="loading-grid">
              <div *ngFor="let s of [1,2,3,4]" class="skeleton" style="height:220px;border-radius:16px"></div>
            </div>
            <div class="products-grid">
              <div *ngFor="let p of allProducts()" class="product-card card" (click)="selectedProduct.set(p)">
                <div class="product-img-wrap">
                  <img [src]="p.images[0]||'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
                </div>
                <div class="product-info">
                  <h3>{{p.name}}</h3>
                  <p *ngIf="sec.show_description" class="product-desc">{{p.description | slice:0:60}}{{(p.description?.length||0)>60?'...':''}}</p>
                  <span *ngIf="sec.show_price !== false" class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- FEATURED PRODUCTS -->
          <div *ngIf="sec.type==='products_featured'">
            <h2 *ngIf="sec.title" style="margin-bottom:24px;color:var(--mocca-bean)">{{sec.title || 'Productos Destacados'}}</h2>
            <div class="products-grid">
              <div *ngFor="let p of featuredProducts()" class="product-card card" (click)="selectedProduct.set(p)">
                <div class="product-img-wrap">
                  <img [src]="p.images[0]||'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
                  <span class="feat-badge">⭐</span>
                </div>
                <div class="product-info">
                  <h3>{{p.name}}</h3>
                  <span *ngIf="sec.show_price !== false" class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SPECIFIC PRODUCT -->
          <div *ngIf="sec.type==='products_specific' && getProduct(sec.product_id)" class="sec-product card">
            <img *ngIf="sec.show_image !== false" [src]="getProduct(sec.product_id)!.images[0]||'assets/cookie-placeholder.png'" [alt]="getProduct(sec.product_id)!.name" class="spec-product-img">
            <div class="spec-product-info">
              <h2>{{getProduct(sec.product_id)!.name}}</h2>
              <p *ngIf="sec.show_description !== false">{{sec.custom_description || getProduct(sec.product_id)!.description}}</p>
              <span *ngIf="sec.show_price !== false" class="product-price-lg">$ {{getProduct(sec.product_id)!.price | number:'1.0-0'}}</span>
              <button class="btn btn-primary mt-md" (click)="addToCart(getProduct(sec.product_id)!)">
                <i class="fas fa-bag-shopping"></i> Agregar al carrito
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div *ngIf="!page() && !loading()" class="container section" style="text-align:center">
      <h2>Página no encontrada</h2>
      <a routerLink="/" class="btn btn-primary mt-md">Volver al inicio</a>
    </div>

    <app-product-modal *ngIf="selectedProduct()" [product]="selectedProduct()!" (close)="selectedProduct.set(null)"></app-product-modal>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 56px 0 36px; }
    .page-section { margin-bottom: 40px; }
    .sec-text { padding: 28px; }
    .sec-text h2 { color: var(--mocca-bean); margin-bottom: 12px; }
    .sec-text p { color: var(--text-mid); line-height: 1.7; }
    .sec-banner { overflow: hidden; }
    .banner-img { width: 100%; max-height: 320px; object-fit: cover; display: block; }
    .banner-text { padding: 28px; }
    .banner-text h2 { color: var(--mocca-bean); margin-bottom: 10px; }
    .banner-text p { color: var(--text-mid); line-height: 1.7; }
    .product-card { cursor: pointer; }
    .product-img-wrap { position: relative; overflow: hidden; height: 190px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .product-card:hover .product-img { transform: scale(1.06); }
    .feat-badge { position: absolute; top: 10px; left: 10px; background: var(--caramel); color: #fff; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
    .product-info { padding: 14px; }
    .product-info h3 { color: var(--mocca-bean); font-size: 0.95rem; margin-bottom: 5px; }
    .product-desc { font-size: 0.82rem; color: var(--text-light); margin-bottom: 7px; min-height: 32px; }
    .product-price { font-size: 1.1rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .sec-product { display: grid; grid-template-columns: 340px 1fr; overflow: hidden; align-items: stretch; }
    .spec-product-img { width: 100%; height: 100%; object-fit: cover; min-height: 240px; }
    .spec-product-info { padding: 32px; display: flex; flex-direction: column; gap: 12px; }
    .spec-product-info h2 { color: var(--mocca-bean); }
    .spec-product-info p { color: var(--text-mid); line-height: 1.7; }
    .product-price-lg { font-size: 1.8rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    @media (max-width: 700px) {
      .sec-product { grid-template-columns: 1fr; }
      .spec-product-img { min-height: 200px; max-height: 220px; }
    }
  `]
})
export class PageComponent implements OnInit {
  page = signal<any>(null);
  loading = signal(true);
  allProducts = signal<any[]>([]);
  featuredProducts = signal<any[]>([]);
  selectedProduct = signal<any>(null);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public auth: AuthService,
    private cartService: CartService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Preload products for sections that need them
    this.http.get<any[]>(`${environment.apiUrl}/products`).subscribe(p => {
      this.allProducts.set(p);
      this.featuredProducts.set(p.filter(x => x.is_featured));
    });

    this.route.params.subscribe(p => {
      this.loading.set(true);
      this.http.get<any>(`${environment.apiUrl}/site-pages/slug/${p['slug']}`).subscribe({
        next: pg => {
          // Ensure sections is always an array
          if (pg && typeof pg.sections === 'string') {
            try { pg.sections = JSON.parse(pg.sections); } catch { pg.sections = []; }
          }
          if (!pg.sections) pg.sections = [];
          this.page.set(pg);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  getProduct(id: string) {
    return this.allProducts().find(p => p.id === id) || null;
  }

  addToCart(p: any) {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    this.cartService.addToCart(p, 1);
    this.toast.success(p.name + ' agregado 🍪');
  }
}
