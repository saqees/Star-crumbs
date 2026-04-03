import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Product, Review } from '../../core/models/models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal modal-lg product-modal" #modal>
        <button class="close-btn" (click)="close.emit()"><i class="fas fa-times"></i></button>

        <div class="modal-body">
          <!-- Image gallery -->
          <div class="gallery">
            <div class="main-img-wrap">
              <img [src]="activeImage() || 'assets/cookie-placeholder.png'" [alt]="product.name" class="main-img">
              <span *ngIf="product.stock === 0" class="out-badge">Agotado</span>
            </div>
            <div class="thumbnails" *ngIf="product.images.length > 1">
              <img *ngFor="let img of product.images"
                   [src]="img" [class.active]="activeImage()===img"
                   (click)="activeImage.set(img)" class="thumb">
            </div>
          </div>

          <!-- Info — scrollable, independent from page -->
          <div class="product-details" (wheel)="onWheel($event)" (touchmove)="onTouchMove($event)" (touchstart)="onTouchStart($event)">
            <div class="detail-category" *ngIf="product.category_name">
              <i class="fas fa-tag"></i> {{product.category_name}}
            </div>
            <h2 class="detail-name">{{product.name}}</h2>

            <div class="detail-rating">
              <span class="stars">
                <i *ngFor="let s of getStars(product.rating_avg)" class="fas fa-star"></i>
                <i *ngFor="let s of getEmpty(product.rating_avg)" class="far fa-star star-empty"></i>
              </span>
              <span class="rating-text">{{product.rating_avg | number:'1.1-1'}} ({{product.rating_count}} reseñas)</span>
            </div>

            <p class="detail-price">$ {{product.price | number:'1.0-0'}}</p>
            <p class="detail-desc">{{product.description}}</p>

            <div class="detail-stock" [class.low]="product.stock < 10">
              <i class="fas fa-box"></i>
              {{product.stock > 0 ? 'Disponibles: ' + product.stock + ' unidades' : 'Sin stock'}}
            </div>

            <!-- Qty + Add to cart (hidden on mobile, shown on desktop hover) -->
            <div class="qty-row" *ngIf="product.stock > 0">
              <div class="qty-ctrl">
                <button (click)="qty > 1 && (qty = qty - 1)"><i class="fas fa-minus"></i></button>
                <span>{{qty}}</span>
                <button (click)="qty < product.stock && (qty = qty + 1)"><i class="fas fa-plus"></i></button>
              </div>
              <button class="btn btn-primary add-cart-btn" (click)="addToCart()" style="flex:1">
                <i class="fas fa-bag-shopping"></i> Agregar al carrito
              </button>
            </div>

            <!-- WhatsApp -->
            <a [href]="waLink()" target="_blank" class="btn btn-secondary wa-btn">
              <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
            </a>

            <!-- Reviews -->
            <div class="reviews-section" *ngIf="reviews().length > 0">
              <h4>Reseñas</h4>
              <div class="review-item" *ngFor="let r of reviews()">
                <div class="reviewer">
                  <img [src]="r.profile_picture || 'assets/avatar.png'" [alt]="r.username" class="reviewer-avatar">
                  <span class="reviewer-name">{{r.username}}</span>
                  <span class="stars small-stars">
                    <i *ngFor="let s of getStars(r.rating)" class="fas fa-star"></i>
                  </span>
                </div>
                <p class="review-comment">{{r.comment}}</p>
              </div>
            </div>

            <!-- Add review -->
            <div class="add-review" *ngIf="auth.isLoggedIn">
              <h4>Dejar reseña</h4>
              <div class="star-input">
                <button *ngFor="let s of [1,2,3,4,5]" (click)="myRating=s" [class.filled]="myRating >= s">
                  <i class="fas fa-star"></i>
                </button>
              </div>
              <textarea [(ngModel)]="myComment" placeholder="¿Qué te pareció?" class="form-control" rows="3"></textarea>
              <button class="btn btn-primary btn-sm mt-sm" (click)="submitReview()">Enviar reseña</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Overlay blocks page scroll when modal is open */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 16px;
      animation: fadeIn 0.2s ease;
      overflow: hidden; /* prevent overlay itself from scrolling */
    }
    .product-modal {
      max-width: 880px; padding: 0; overflow: hidden;
      display: flex; flex-direction: column;
      max-height: 90vh;
    }
    .close-btn {
      position: absolute; top: 14px; right: 14px; z-index: 10;
      background: rgba(255,255,255,0.92); border: none; cursor: pointer;
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; color: var(--text-mid); box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }
    .close-btn:hover { background: var(--error); color: #fff; }

    .modal-body {
      display: grid;
      grid-template-columns: 45% 55%;
      height: 100%;
      overflow: hidden; /* key: clips children */
    }

    /* Left panel: image gallery — no scroll needed */
    .gallery {
      background: var(--almond-light);
      display: flex; flex-direction: column;
    }
    .main-img-wrap { position: relative; flex: 1; min-height: 220px; overflow: hidden; }
    .main-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .out-badge {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.45); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; font-weight: 700;
    }
    .thumbnails {
      display: flex; gap: 7px; padding: 10px; overflow-x: auto; flex-shrink: 0;
    }
    .thumb {
      width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);
      cursor: pointer; opacity: 0.6; border: 2px solid transparent; transition: all var(--transition); flex-shrink: 0;
    }
    .thumb.active { opacity: 1; border-color: var(--warm-capuchino); }

    /* Right panel: scrollable INDEPENDENTLY */
    .product-details {
      padding: 24px 22px;
      overflow-y: auto;         /* ← this panel scrolls */
      overscroll-behavior: contain; /* ← prevents page from scrolling when reaching end */
      -webkit-overflow-scrolling: touch;
      max-height: 90vh;
    }

    .detail-category { font-size: 0.78rem; color: var(--warm-capuchino); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px; }
    .detail-name { font-size: 1.3rem; margin-bottom: 10px; color: var(--mocca-bean); }
    .detail-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .rating-text { font-size: 0.82rem; color: var(--text-light); }
    .detail-price { font-size: 1.8rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); margin-bottom: 12px; }
    .detail-desc { color: var(--text-mid); line-height: 1.7; margin-bottom: 14px; font-size: 0.92rem; }
    .detail-stock { font-size: 0.83rem; font-weight: 600; color: var(--success); margin-bottom: 18px; }
    .detail-stock.low { color: var(--warning); }

    .qty-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .qty-ctrl {
      display: flex; align-items: center; gap: 0;
      border: 2px solid var(--almond); border-radius: var(--radius-full); overflow: hidden;
    }
    .qty-ctrl button {
      padding: 8px 12px; background: none; border: none; cursor: pointer;
      color: var(--warm-capuchino); font-size: 0.85rem; transition: background var(--transition);
    }
    .qty-ctrl button:hover { background: var(--almond-light); }
    .qty-ctrl span { padding: 0 14px; font-weight: 700; color: var(--text-dark); min-width: 28px; text-align: center; font-size: 0.9rem; }
    .wa-btn { width: 100%; justify-content: center; margin-top: 10px; display: flex; }

    .reviews-section { margin-top: 24px; border-top: 1px solid var(--almond); padding-top: 18px; }
    .reviews-section h4 { margin-bottom: 12px; color: var(--mocca-bean); font-size: 1rem; }
    .review-item { margin-bottom: 12px; padding: 10px 12px; background: var(--almond-light); border-radius: var(--radius-md); }
    .reviewer { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .reviewer-avatar { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
    .reviewer-name { font-weight: 700; font-size: 0.83rem; color: var(--text-mid); }
    .small-stars .fa-star { font-size: 0.68rem; }
    .review-comment { font-size: 0.82rem; color: var(--text-mid); }
    .add-review { margin-top: 18px; border-top: 1px solid var(--almond); padding-top: 14px; }
    .add-review h4 { margin-bottom: 8px; color: var(--mocca-bean); font-size: 1rem; }
    .star-input { display: flex; gap: 3px; margin-bottom: 9px; }
    .star-input button { background: none; border: none; cursor: pointer; font-size: 1.3rem; color: var(--almond); transition: color var(--transition); }
    .star-input button.filled { color: var(--caramel); }

    /* ─── MOBILE ─── */
    @media (max-width: 700px) {
      .product-modal { max-height: 95vh; }
      .modal-body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .gallery { max-height: 220px; }
      .main-img-wrap { min-height: 180px; }
      .product-details { max-height: calc(95vh - 220px); padding: 16px; }

      /* Hide add-to-cart button on mobile (replaced by WhatsApp) */
      .add-cart-btn { display: none !important; }
      .qty-row { justify-content: center; }
      .qty-ctrl { flex: 1; justify-content: center; }
    }

    @media (max-width: 480px) {
      .overlay { padding: 8px; }
      .gallery { max-height: 190px; }
      .product-details { padding: 14px 12px; }
      .detail-name { font-size: 1.1rem; }
      .detail-price { font-size: 1.5rem; }
    }
  `]
})
export class ProductModalComponent implements OnInit {
  @Input() product!: Product;
  @Output() close = new EventEmitter<void>();

  activeImage = signal('');
  reviews = signal<Review[]>([]);
  qty = 1;
  myRating = 5;
  myComment = '';
  private touchStartY = 0;

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.activeImage.set(this.product.images[0] || '');
    this.http.get<Review[]>(`${environment.apiUrl}/reviews/${this.product.id}`)
      .subscribe(r => this.reviews.set(r));
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  /* Prevent page scroll when scrolling inside details panel */
  onTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    const deltaY = e.touches[0].clientY - this.touchStartY;
    const atTop = el.scrollTop === 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;
    if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
      e.preventDefault();
    }
  }

  onWheel(e: WheelEvent) {
    const el = e.currentTarget as HTMLElement;
    const atTop = el.scrollTop === 0 && e.deltaY < 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0;
    if (atTop || atBottom) e.preventDefault();
  }

  addToCart() {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión primero'); return; }
    this.cartService.addToCart(this.product, this.qty);
    this.toast.success(this.product.name + ' x' + this.qty + ' agregado 🍪');
    this.close.emit();
  }

  waLink() {
    const msg = encodeURIComponent(`Hola! Quiero pedir: ${this.product.name} x${this.qty} - $${this.product.price * this.qty}`);
    return `https://wa.me/573000000000?text=${msg}`;
  }

  submitReview() {
    if (!this.myRating) return;
    this.http.post(`${environment.apiUrl}/reviews`, {
      product_id: this.product.id, rating: this.myRating, comment: this.myComment
    }).subscribe({
      next: () => {
        this.toast.success('Reseña enviada ⭐');
        this.myComment = '';
        this.http.get<Review[]>(`${environment.apiUrl}/reviews/${this.product.id}`).subscribe(r => this.reviews.set(r));
      },
      error: () => this.toast.error('No se pudo enviar la reseña')
    });
  }

  getStars(avg: number) { return Array(Math.round(avg)).fill(0); }
  getEmpty(avg: number) { return Array(5 - Math.round(avg)).fill(0); }
}
