import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CategoryService } from '../../core/services/category.service';
import { Product } from '../../core/models/models';
import { ProductModalComponent } from './product-modal.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductModalComponent],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container ph-inner">
          <div>
            <h1>Nuestros <span class="highlight">Productos</span> 🍪</h1>
            <p>Galletas artesanales hechas con amor</p>
          </div>
          <a routerLink="/cajitas" class="btn btn-secondary cajitas-link">
            <span>🎁</span> Ver Cajitas
          </a>
        </div>
      </div>

      <div class="container section-sm">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-wrap">
            <i class="fas fa-search search-icon"></i>
            <input type="search" [(ngModel)]="searchQuery" (ngModelChange)="filter()" placeholder="Buscar galletas..." class="search-input">
          </div>
          <div class="category-pills">
            <button class="cat-pill" [class.active]="!selectedCat" (click)="selectedCat=''; filter()">Todas</button>
            <button *ngFor="let c of categories()" class="cat-pill" [class.active]="selectedCat===c.id" (click)="selectedCat=c.id; filter()">{{c.name}}</button>
          </div>
        </div>

        <!-- Grid -->
        <div *ngIf="loading()" class="products-grid">
          <div *ngFor="let s of [1,2,3,4,5,6]" class="skeleton-card">
            <div class="skeleton" style="height:190px"></div>
            <div style="padding:14px"><div class="skeleton" style="height:18px;margin-bottom:8px;width:70%"></div><div class="skeleton" style="height:14px;width:40%"></div></div>
          </div>
        </div>

        <div *ngIf="!loading() && filtered().length===0" class="empty-products">
          <span>🍪</span>
          <h3>No encontramos galletas con esa búsqueda</h3>
          <button class="btn btn-secondary" (click)="searchQuery=''; selectedCat=''; filter()">Ver todas</button>
        </div>

        <div *ngIf="!loading()" class="products-grid">
          <div *ngFor="let p of filtered()" class="product-card card">
            <!-- Image -->
            <div class="product-img-wrap" (click)="openModal(p)">
              <img [src]="p.images[0] || 'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
              <span *ngIf="p.is_featured" class="featured-badge">⭐ Destacado</span>
              <span *ngIf="p.stock===0" class="out-badge">Agotado</span>
              <!-- Overlay only on desktop (hover devices) -->
              <div class="product-overlay">
                <span class="overlay-hint">Ver detalle</span>
              </div>
            </div>

            <!-- Info -->
            <div class="product-info">
              <h3 class="product-name" (click)="openModal(p)">{{p.name}}</h3>
              <p class="product-desc" (click)="openModal(p)">{{p.description | slice:0:65}}{{(p.description?.length||0)>65?'...':''}}</p>
              <div class="product-footer">
                <span class="product-price">$ {{p.price | number:'1.0-0'}}</span>
                <div class="product-rating">
                  <i class="fas fa-star" style="color:var(--caramel);font-size:0.78rem"></i>
                  <span style="font-size:0.78rem;color:var(--text-light)">{{p.rating_avg | number:'1.1-1'}} ({{p.rating_count}})</span>
                </div>
              </div>

              <!-- Qty + Add to Cart — always visible below info -->
              <div class="card-cart-row" *ngIf="p.stock > 0">
                <div class="qty-ctrl-sm">
                  <button (click)="decQty(p)" [disabled]="getQty(p.id)<=1"><i class="fas fa-minus"></i></button>
                  <span>{{getQty(p.id)}}</span>
                  <button (click)="incQty(p)" [disabled]="getQty(p.id)>=p.stock"><i class="fas fa-plus"></i></button>
                </div>
                <button class="btn btn-primary btn-sm add-btn" (click)="addToCart(p)">
                  <i class="fas fa-bag-shopping"></i> Agregar
                </button>
              </div>
              <button *ngIf="p.stock===0" class="btn btn-secondary btn-sm" style="width:100%;justify-content:center;margin-top:10px" disabled>Sin stock</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-product-modal *ngIf="selectedProduct()" [product]="selectedProduct()!" (close)="selectedProduct.set(null)"></app-product-modal>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 56px 0 36px; }
    .ph-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .ph-inner h1 { margin-bottom: 6px; }
    .ph-inner p { color: var(--text-mid); font-size: 0.95rem; }
    .highlight { color: var(--warm-capuchino); }
    .cajitas-link { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    /* Filters */
    .filters-bar { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
    .search-wrap { position: relative; max-width: 400px; }
    .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-light); font-size: 0.9rem; }
    .search-input { width: 100%; padding: 11px 16px 11px 38px; border: 2px solid var(--almond); border-radius: var(--radius-full); font-size: 16px; background: var(--almond-light); outline: none; transition: border-color var(--transition); }
    .search-input:focus { border-color: var(--warm-capuchino); background: #fff; }
    .category-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .cat-pill { padding: 7px 18px; border-radius: var(--radius-full); border: 2px solid var(--almond); background: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--text-mid); transition: all var(--transition); }
    .cat-pill:hover, .cat-pill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    /* Skeleton */
    .skeleton-card { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    /* Product card */
    .product-card { cursor: default; display: flex; flex-direction: column; }
    .product-img-wrap { position: relative; overflow: hidden; height: 200px; cursor: pointer; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.45s ease; display: block; }
    .product-card:hover .product-img { transform: scale(1.06); }
    .featured-badge { position: absolute; top: 10px; left: 10px; background: var(--caramel); color: #fff; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
    .out-badge { position: absolute; inset: 0; background: rgba(0,0,0,0.42); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
    /* Overlay: desktop only, just a subtle hint */
    .product-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.22);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity var(--transition);
      pointer-events: none;
    }
    .product-card:hover .product-overlay { opacity: 1; }
    .overlay-hint { color: #fff; font-size: 0.85rem; font-weight: 700; background: rgba(0,0,0,0.3); padding: 6px 14px; border-radius: var(--radius-full); }
    /* Hide overlay on touch devices — no hover on mobile */
    @media (hover: none) { .product-overlay { display: none !important; } }
    /* Info */
    .product-info { padding: 14px; display: flex; flex-direction: column; flex: 1; }
    .product-name { font-size: 0.98rem; margin-bottom: 4px; color: var(--mocca-bean); cursor: pointer; }
    .product-name:hover { color: var(--warm-capuchino); }
    .product-desc { font-size: 0.82rem; color: var(--text-light); margin-bottom: 10px; flex: 1; cursor: pointer; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .product-price { font-size: 1.1rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .product-rating { display: flex; align-items: center; gap: 4px; }
    /* Cart row */
    .card-cart-row { display: flex; align-items: center; gap: 8px; margin-top: auto; }
    .qty-ctrl-sm { display: flex; align-items: center; border: 2px solid var(--almond); border-radius: var(--radius-full); overflow: hidden; flex-shrink: 0; }
    .qty-ctrl-sm button { padding: 6px 10px; background: none; border: none; cursor: pointer; color: var(--warm-capuchino); font-size: 0.75rem; transition: background var(--transition); }
    .qty-ctrl-sm button:hover:not([disabled]) { background: var(--almond-light); }
    .qty-ctrl-sm button:disabled { opacity: 0.4; cursor: default; }
    .qty-ctrl-sm span { padding: 0 10px; font-weight: 700; font-size: 0.88rem; min-width: 22px; text-align: center; }
    .add-btn { flex: 1; justify-content: center; font-size: 0.82rem; padding: 8px 12px; }
    /* Empty */
    .empty-products { text-align: center; padding: 64px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .empty-products span { font-size: 3.5rem; }
    /* Responsive */
    @media (max-width: 600px) {
      .ph-inner { flex-direction: column; align-items: flex-start; gap: 12px; }
      .product-img-wrap { height: 170px; }
      .search-wrap { max-width: 100%; }
    }
    @media (max-width: 400px) {
      .product-img-wrap { height: 150px; }
      .card-cart-row { flex-direction: column; align-items: stretch; }
      .add-btn { width: 100%; }
      .qty-ctrl-sm { justify-content: center; }
    }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  categories = signal<any[]>([]);
  loading = signal(true);
  selectedProduct = signal<Product | null>(null);
  searchQuery = '';
  selectedCat = '';
  qtys: Record<string, number> = {};

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.productService.getAll().subscribe(p => {
      this.products.set(p);
      this.filtered.set(p);
      this.loading.set(false);
    });
    this.categoryService.getAll().subscribe(c => this.categories.set(c));
  }

  filter() {
    let result = this.products();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    if (this.selectedCat) result = result.filter(p => p.category_id === this.selectedCat);
    this.filtered.set(result);
  }

  getQty(id: string) { return this.qtys[id] || 1; }
  incQty(p: Product) { const q = this.getQty(p.id); if (q < p.stock) this.qtys[p.id] = q + 1; }
  decQty(p: Product) { const q = this.getQty(p.id); if (q > 1) this.qtys[p.id] = q - 1; }

  addToCart(p: Product) {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    const qty = this.getQty(p.id);
    this.cartService.addToCart(p, qty);
    this.toast.success(`${p.name} ×${qty} agregado 🍪`);
    this.qtys[p.id] = 1;
  }

  openModal(p: Product) { this.selectedProduct.set(p); }
}
