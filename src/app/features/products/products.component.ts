import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Category } from '../../core/models/models';
import { ProductModalComponent } from './product-modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductModalComponent],
  template: `
    <div class="page-enter">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <h1>Nuestros <span style="color:var(--warm-capuchino)">Productos</span></h1>
          <p>Descubre nuestras galletas artesanales rellenas</p>
        </div>
      </div>

      <div class="container section-sm">
        <!-- Filters Bar -->
        <div class="filters-bar">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
                   placeholder="Buscar galletas..." class="search-input">
          </div>

          <div class="filter-chips">
            <button class="chip" [class.active]="!activeCategory" (click)="filterByCategory(null)">
              Todos
            </button>
            <button *ngFor="let c of categories()" class="chip" [class.active]="activeCategory===c.slug"
                    (click)="filterByCategory(c.slug)">
              {{c.name}}
            </button>
          </div>

          <select [(ngModel)]="sortBy" (ngModelChange)="loadProducts()" class="sort-select form-control">
            <option value="">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="popular">Más populares</option>
          </select>
        </div>

        <!-- Results count -->
        <p class="results-count">
          <strong>{{products().length}}</strong> productos encontrados
        </p>

        <!-- Skeleton -->
        <div *ngIf="loading()" class="products-grid">
          <div *ngFor="let s of [1,2,3,4,5,6]" class="skeleton-card">
            <div class="skeleton" style="height:220px;border-radius:var(--radius-lg) var(--radius-lg) 0 0"></div>
            <div style="padding:16px">
              <div class="skeleton" style="height:18px;margin-bottom:8px;width:75%"></div>
              <div class="skeleton" style="height:14px;width:50%"></div>
            </div>
          </div>
        </div>

        <!-- Products grid -->
        <div *ngIf="!loading() && products().length > 0" class="products-grid">
          <div *ngFor="let p of products()" class="product-card card" (click)="openModal(p)">
            <div class="product-img-wrap">
              <img [src]="p.images[0] || 'assets/cookie-placeholder.png'" [alt]="p.name" class="product-img">
              <span *ngIf="p.is_featured" class="featured-badge">⭐</span>
              <span *ngIf="p.stock === 0" class="out-badge-sm">Agotado</span>
              <div class="product-overlay">
                <button class="btn btn-primary btn-sm" (click)="addToCart($event, p)" [disabled]="p.stock===0">
                  <i class="fas fa-bag-shopping"></i> Agregar
                </button>
              </div>
            </div>
            <div class="product-info">
              <span class="cat-label" *ngIf="p.category_name">{{p.category_name}}</span>
              <h3 class="product-name">{{p.name}}</h3>
              <p class="product-desc">{{p.description | slice:0:65}}{{(p.description?.length || 0)>65?'...':''}}</p>
              <div class="product-footer">
                <span class="product-price">\${{ p.price | number:'1.0-0' }}</span>
                <div class="product-rating">
                  <i class="fas fa-star" style="color:var(--caramel);font-size:0.8rem"></i>
                  <span style="font-size:0.8rem;color:var(--text-light)">{{p.rating_avg | number:'1.1-1'}} ({{p.rating_count}})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && products().length === 0" class="empty-state">
          <span class="empty-icon">🍪</span>
          <h3>No se encontraron productos</h3>
          <p>Intenta con otra búsqueda o categoría</p>
          <button class="btn btn-secondary" (click)="resetFilters()">Ver todos</button>
        </div>
      </div>

      <!-- Product Modal -->
      <app-product-modal
        *ngIf="selectedProduct()"
        [product]="selectedProduct()!"
        (close)="selectedProduct.set(null)">
      </app-product-modal>
    </div>
  `,
  styles: [`
    .page-header {
      background: linear-gradient(135deg, var(--creamy-latte), var(--almond));
      padding: 60px 0 40px; margin-bottom: 0;
    }
    .page-header h1 { margin-bottom: 8px; }
    .page-header p { color: var(--text-light); font-size: 1.05rem; }
    .filters-bar {
      display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
      background: #fff; padding: 20px; border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); margin-bottom: 28px;
    }
    .search-wrap {
      display: flex; align-items: center; gap: 10px;
      background: var(--almond-light); border: 2px solid var(--almond);
      border-radius: var(--radius-full); padding: 10px 18px;
      flex: 1; min-width: 200px;
      transition: border-color var(--transition);
    }
    .search-wrap:focus-within { border-color: var(--warm-capuchino); }
    .search-wrap i { color: var(--text-light); }
    .search-input { border: none; background: none; outline: none; font-size: 0.95rem; width: 100%; }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      padding: 8px 18px; border-radius: var(--radius-full);
      border: 2px solid var(--almond); background: none;
      cursor: pointer; font-size: 0.85rem; font-weight: 600;
      color: var(--text-mid); transition: all var(--transition);
    }
    .chip:hover, .chip.active {
      background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff;
    }
    .sort-select { width: auto; min-width: 180px; border-radius: var(--radius-full); }
    .results-count { color: var(--text-light); font-size: 0.9rem; margin-bottom: 20px; }
    .skeleton-card { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    .product-card { cursor: pointer; }
    .product-img-wrap { position: relative; overflow: hidden; height: 220px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .product-card:hover .product-img { transform: scale(1.08); }
    .featured-badge {
      position: absolute; top: 10px; left: 10px;
      background: var(--caramel); color: #fff; padding: 3px 10px;
      border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;
    }
    .out-badge-sm {
      position: absolute; top: 10px; right: 10px;
      background: var(--error); color: #fff; padding: 3px 10px;
      border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700;
    }
    .product-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.35);
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 16px; opacity: 0; transition: opacity var(--transition);
    }
    .product-card:hover .product-overlay { opacity: 1; }
    .product-info { padding: 16px; }
    .cat-label { font-size: 0.72rem; color: var(--warm-capuchino); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .product-name { font-size: 1rem; margin: 4px 0 6px; color: var(--mocca-bean); }
    .product-desc { font-size: 0.82rem; color: var(--text-light); margin-bottom: 12px; min-height: 36px; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; }
    .product-price { font-size: 1.15rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .product-rating { display: flex; align-items: center; gap: 4px; }
    .empty-state {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .empty-icon { font-size: 4rem; }
    .empty-state h3 { color: var(--mocca-bean); }
    .empty-state p { color: var(--text-light); }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  selectedProduct = signal<Product | null>(null);
  searchTerm = '';
  activeCategory: string | null = null;
  sortBy = '';
  private searchTimer: any;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(c => this.categories.set(c));
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getAll({
      category: this.activeCategory || undefined,
      search: this.searchTerm || undefined,
      sort: this.sortBy || undefined
    }).subscribe({
      next: p => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterByCategory(slug: string | null) {
    this.activeCategory = slug;
    this.loadProducts();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProducts(), 400);
  }

  resetFilters() {
    this.searchTerm = '';
    this.activeCategory = null;
    this.sortBy = '';
    this.loadProducts();
  }

  openModal(p: Product) { this.selectedProduct.set(p); }

  addToCart(e: Event, p: Product) {
    e.stopPropagation();
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    this.cartService.addToCart(p);
    this.toast.success(`${p.name} agregado 🍪`);
  }
}
