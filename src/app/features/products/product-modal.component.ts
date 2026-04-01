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

          <!-- Info -->
          <div class="product-details">
            <div class="detail-category" *ngIf="product.category_name">
              <i class="fas fa-tag"></i> {{product.category_name}}
            </div>
            <h2 class="detail-name">{{product.name}}</h2>

            <!-- Rating -->
            <div class="detail-rating">
              <span class="stars">
                <i *ngFor="let s of getStars(product.rating_avg)" class="fas fa-star"></i>
                <i *ngFor="let s of getEmpty(product.rating_avg)" class="far fa-star star-empty"></i>
              </span>
              <span class="rating-text">{{product.rating_avg | number:'1.1-1'}} ({{product.rating_count}} reseñas)</span>
            </div>

            <p class="detail-price">${{product.price | number:'1.0-0'}}</p>
            <p class="detail-desc">{{product.description}}</p>

            <div class="detail-stock" [class.low]="product.stock < 10">
              <i class="fas fa-box"></i>
              {{product.stock > 0 ? 'Disponibles: ' + product.stock + ' unidades' : 'Sin stock'}}
            </div>

            <!-- Quantity + Add -->
            <div class="qty-row" *ngIf="product.stock > 0">
              <div class="qty-ctrl">
                <button (click)="qty > 1 ? qty-- : null"><i class="fas fa-minus"></i></button>
                <span>{{qty}}</span>
                <button (click)="qty < product.stock ? qty++ : null"><i class="fas fa-plus"></i></button>
              </div>
              <button class="btn btn-primary" (click)="addToCart()" style="flex:1">
                <i class="fas fa-bag-shopping"></i> Agregar al carrito
              </button>
            </div>

            <!-- WhatsApp order -->
            <a [href]="waLink()" target="_blank" class="btn btn-secondary wa-btn" style="margin-top:12px;width:100%;justify-content:center">
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
                <button *ngFor="let s of [1,2,3,4,5]"
                        (click)="myRating=s"
                        [class.filled]="myRating >= s">
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
    .product-modal { max-width: 900px; padding: 0; overflow: hidden; }
    .close-btn {
      position: absolute; top: 16px; right: 16px; z-index: 10;
      background: rgba(255,255,255,0.9); border: none; cursor: pointer;
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; color: var(--text-mid); box-shadow: var(--shadow-sm);
    }
    .modal-body { display: grid; grid-template-columns: 1fr 1fr; }
    .gallery { background: var(--almond-light); }
    .main-img-wrap { position: relative; height: 360px; }
    .main-img { width: 100%; height: 100%; object-fit: cover; }
    .out-badge {
      position: absolute; inset: 0; background: rgba(0,0,0,0.45);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700;
    }
    .thumbnails { display: flex; gap: 8px; padding: 12px; overflow-x: auto; }
    .thumb { width: 70px; height: 70px; object-fit: cover; border-radius: var(--radius-sm); cursor: pointer; opacity: 0.6; border: 2px solid transparent; transition: all var(--transition); }
    .thumb.active { opacity: 1; border-color: var(--warm-capuchino); }
    .product-details { padding: 32px 28px; overflow-y: auto; max-height: 520px; }
    .detail-category { font-size: 0.8rem; color: var(--warm-capuchino); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .detail-name { margin-bottom: 12px; }
    .detail-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .rating-text { font-size: 0.85rem; color: var(--text-light); }
    .detail-price { font-size: 2rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); margin-bottom: 12px; }
    .detail-desc { color: var(--text-mid); line-height: 1.7; margin-bottom: 16px; }
    .detail-stock { font-size: 0.85rem; font-weight: 600; color: var(--success); margin-bottom: 20px; }
    .detail-stock.low { color: var(--warning); }
    .qty-row { display: flex; gap: 12px; align-items: center; margin-bottom: 4px; }
    .qty-ctrl {
      display: flex; align-items: center; gap: 0;
      border: 2px solid var(--almond); border-radius: var(--radius-full); overflow: hidden;
    }
    .qty-ctrl button {
      padding: 10px 14px; background: none; border: none; cursor: pointer;
      color: var(--warm-capuchino); font-size: 0.9rem; transition: background var(--transition);
    }
    .qty-ctrl button:hover { background: var(--almond-light); }
    .qty-ctrl span { padding: 0 16px; font-weight: 700; color: var(--text-dark); min-width: 32px; text-align: center; }
    .wa-btn { gap: 8px; }
    .reviews-section { margin-top: 28px; border-top: 1px solid var(--almond); padding-top: 20px; }
    .reviews-section h4 { margin-bottom: 14px; color: var(--mocca-bean); }
    .review-item { margin-bottom: 14px; padding: 12px; background: var(--almond-light); border-radius: var(--radius-md); }
    .reviewer { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .reviewer-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .reviewer-name { font-weight: 700; font-size: 0.85rem; color: var(--text-mid); }
    .small-stars .fa-star { font-size: 0.7rem; }
    .review-comment { font-size: 0.85rem; color: var(--text-mid); }
    .add-review { margin-top: 20px; border-top: 1px solid var(--almond); padding-top: 16px; }
    .add-review h4 { margin-bottom: 10px; color: var(--mocca-bean); }
    .star-input { display: flex; gap: 4px; margin-bottom: 10px; }
    .star-input button { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: var(--almond); transition: color var(--transition); }
    .star-input button.filled { color: var(--caramel); }
    @media (max-width: 768px) {
      .modal-body { grid-template-columns: 1fr; }
      .main-img-wrap { height: 240px; }
      .product-details { max-height: none; }
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
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  addToCart() {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión primero'); return; }
    this.cartService.addToCart(this.product, this.qty);
    this.toast.success(`${this.product.name} x${this.qty} agregado 🍪`);
    this.close.emit();
  }

  waLink() {
    const msg = encodeURIComponent(`Hola! Quiero pedir: ${this.product.name} x${this.qty} - $${this.product.price * this.qty}`);
    return `https://wa.me/573000000000?text=${msg}`;
  }

  submitReview() {
    if (!this.myRating) return;
    this.http.post(`${environment.apiUrl}/reviews`, {
      product_id: this.product.id,
      rating: this.myRating,
      comment: this.myComment
    }).subscribe({
      next: () => {
        this.toast.success('Reseña enviada ⭐');
        this.myComment = '';
        this.http.get<Review[]>(`${environment.apiUrl}/reviews/${this.product.id}`)
          .subscribe(r => this.reviews.set(r));
      },
      error: () => this.toast.error('No se pudo enviar la reseña')
    });
  }

  getStars(avg: number) { return Array(Math.round(avg)).fill(0); }
  getEmpty(avg: number) { return Array(5 - Math.round(avg)).fill(0); }
}
