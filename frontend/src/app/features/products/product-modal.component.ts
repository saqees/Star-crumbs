import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
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
      <div class="modal modal-lg product-modal">
        <button class="close-btn" (click)="close.emit()"><i class="fas fa-times"></i></button>
        <div class="modal-body">
          <!-- Gallery -->
          <div class="gallery">
            <div class="main-img-wrap">
              <img [src]="activeImg() || 'assets/cookie-placeholder.png'" [alt]="product.name" class="main-img">
              <span *ngIf="product.stock===0" class="out-overlay">Agotado</span>
            </div>
            <div *ngIf="product.images.length > 1" class="thumbnails">
              <img *ngFor="let img of product.images" [src]="img" [class.active]="activeImg()===img" (click)="activeImg.set(img)" class="thumb">
            </div>
          </div>

          <!-- Details — scrollable independently -->
          <div class="detail-panel" (wheel)="onWheel($event)" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)">
            <span *ngIf="product.category_name" class="category-tag"><i class="fas fa-tag"></i> {{product.category_name}}</span>
            <h2 class="detail-name">{{product.name}}</h2>
            <div class="detail-rating">
              <span class="stars">
                <i *ngFor="let s of getStars(product.rating_avg)" class="fas fa-star"></i>
                <i *ngFor="let s of getEmpty(product.rating_avg)" class="far fa-star" style="color:var(--almond)"></i>
              </span>
              <span style="font-size:0.82rem;color:var(--text-light)">{{product.rating_avg|number:'1.1-1'}} ({{product.rating_count}} reseñas)</span>
            </div>
            <p class="detail-price">$ {{product.price | number:'1.0-0'}}</p>
            <p class="detail-desc">{{product.description}}</p>
            <div class="detail-stock" [class.stock-low]="product.stock < 10 && product.stock > 0">
              <i class="fas fa-box"></i>
              {{product.stock > 0 ? 'Disponible: ' + product.stock + ' und.' : 'Sin stock'}}
            </div>

            <!-- Qty + actions -->
            <div *ngIf="product.stock > 0" class="qty-row">
              <div class="qty-ctrl">
                <button (click)="qty > 1 && (qty = qty - 1)"><i class="fas fa-minus"></i></button>
                <span>{{qty}}</span>
                <button (click)="qty < product.stock && (qty = qty + 1)"><i class="fas fa-plus"></i></button>
              </div>
              <button class="btn btn-primary" style="flex:1" (click)="addToCart()">
                <i class="fas fa-bag-shopping"></i> Agregar al carrito
              </button>
            </div>

            <!-- WhatsApp: sends image URL + product text -->
            <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
              <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
            </a>

            <!-- Reviews -->
            <div *ngIf="reviews().length > 0" class="reviews-section">
              <h4>Reseñas ({{reviews().length}})</h4>
              <div *ngFor="let r of reviews()" class="review-item">
                <div class="reviewer">
                  <img [src]="r.profile_picture || 'assets/avatar.png'" class="reviewer-av">
                  <span class="reviewer-name">{{r.username}}</span>
                  <span class="stars-sm"><i *ngFor="let s of getStars(r.rating)" class="fas fa-star"></i></span>
                </div>
                <p class="review-text">{{r.comment}}</p>
                <div *ngIf="r.admin_reply" class="admin-reply">
                  <i class="fas fa-reply"></i> <strong>Star Crumbs:</strong> {{r.admin_reply}}
                </div>
                <div class="review-actions">
                  <button class="like-btn" (click)="likeReview(r)"><i class="fas fa-heart"></i> {{r.likes||0}}</button>
                </div>
              </div>
            </div>

            <!-- Add review -->
            <div *ngIf="auth.isLoggedIn" class="add-review">
              <h4>Dejar reseña</h4>
              <div class="star-input">
                <button *ngFor="let s of [1,2,3,4,5]" (click)="myRating=s" [class.filled]="myRating>=s"><i class="fas fa-star"></i></button>
              </div>
              <textarea [(ngModel)]="myComment" class="form-control" rows="3" placeholder="¿Qué te pareció?"></textarea>
              <button class="btn btn-primary btn-sm mt-sm" (click)="submitReview()">Enviar reseña</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px; animation:fadeIn 0.2s ease; overflow:hidden; }
    .product-modal { max-width:860px; padding:0; overflow:hidden; display:flex; flex-direction:column; max-height:90vh; position:relative; }
    .close-btn { position:absolute; top:12px; right:12px; z-index:10; background:rgba(255,255,255,0.92); border:none; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.9rem; color:var(--text-mid); box-shadow:var(--shadow-sm); transition:all var(--transition); }
    .close-btn:hover { background:var(--error); color:#fff; }
    .modal-body { display:grid; grid-template-columns:42% 58%; overflow:hidden; height:100%; }
    .gallery { background:var(--almond-light); display:flex; flex-direction:column; overflow:hidden; }
    .main-img-wrap { flex:1; position:relative; min-height:200px; overflow:hidden; }
    .main-img { width:100%; height:100%; object-fit:cover; display:block; }
    .out-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.45); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; }
    .thumbnails { display:flex; gap:6px; padding:8px; overflow-x:auto; flex-shrink:0; }
    .thumb { width:54px; height:54px; object-fit:cover; border-radius:var(--radius-sm); cursor:pointer; opacity:0.6; border:2px solid transparent; transition:all var(--transition); flex-shrink:0; }
    .thumb.active { opacity:1; border-color:var(--warm-capuchino); }
    /* Detail panel - scrolls independently */
    .detail-panel { padding:22px 20px; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; max-height:90vh; display:flex; flex-direction:column; gap:0; }
    .category-tag { font-size:0.76rem; color:var(--warm-capuchino); font-weight:700; text-transform:uppercase; letter-spacing:0.7px; display:block; margin-bottom:7px; }
    .detail-name { font-size:1.25rem; color:var(--mocca-bean); margin-bottom:9px; line-height:1.2; }
    .detail-rating { display:flex; align-items:center; gap:7px; margin-bottom:12px; }
    .detail-price { font-size:1.7rem; font-weight:700; color:var(--warm-capuchino); font-family:var(--font-display); margin-bottom:10px; }
    .detail-desc { font-size:0.9rem; color:var(--text-mid); line-height:1.7; margin-bottom:12px; }
    .detail-stock { font-size:0.82rem; font-weight:600; color:var(--success); margin-bottom:16px; }
    .stock-low { color:var(--warning); }
    .qty-row { display:flex; gap:9px; align-items:center; margin-bottom:10px; }
    .qty-ctrl { display:flex; align-items:center; border:2px solid var(--almond); border-radius:var(--radius-full); overflow:hidden; }
    .qty-ctrl button { padding:7px 11px; background:none; border:none; cursor:pointer; color:var(--warm-capuchino); font-size:0.8rem; transition:background var(--transition); }
    .qty-ctrl button:hover { background:var(--almond-light); }
    .qty-ctrl span { padding:0 13px; font-weight:700; font-size:0.9rem; color:var(--text-dark); min-width:26px; text-align:center; }
    .btn-wa { width:100%; justify-content:center; display:flex; gap:8px; margin-top:10px; background:linear-gradient(135deg,#25D366,#128C7E); color:#fff; border:none; border-radius:var(--radius-full); padding:11px 24px; font-weight:700; font-size:0.92rem; cursor:pointer; text-decoration:none; transition:all var(--transition); }
    .btn-wa:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(37,211,102,0.4); color:#fff; }
    /* Reviews */
    .reviews-section { margin-top:20px; border-top:1px solid var(--almond); padding-top:16px; }
    .reviews-section h4 { color:var(--mocca-bean); font-size:0.95rem; margin-bottom:12px; }
    .review-item { padding:10px 12px; background:var(--almond-light); border-radius:var(--radius-md); margin-bottom:8px; }
    .reviewer { display:flex; align-items:center; gap:7px; margin-bottom:4px; }
    .reviewer-av { width:24px; height:24px; border-radius:50%; object-fit:cover; }
    .reviewer-name { font-weight:700; font-size:0.82rem; color:var(--text-mid); flex:1; }
    .stars-sm .fa-star { color:var(--caramel); font-size:0.66rem; }
    .review-text { font-size:0.82rem; color:var(--text-mid); line-height:1.5; margin-bottom:6px; }
    .admin-reply { font-size:0.8rem; color:var(--warm-capuchino); border-left:3px solid var(--warm-capuchino); padding-left:8px; margin-bottom:6px; }
    .review-actions { display:flex; gap:8px; }
    .like-btn { background:none; border:1px solid var(--almond); border-radius:var(--radius-full); padding:3px 10px; cursor:pointer; font-size:0.76rem; color:var(--text-light); transition:all var(--transition); }
    .like-btn:hover { background:#fde8e8; border-color:var(--error); color:var(--error); }
    .add-review { margin-top:18px; border-top:1px solid var(--almond); padding-top:14px; }
    .add-review h4 { color:var(--mocca-bean); font-size:0.95rem; margin-bottom:9px; }
    .star-input { display:flex; gap:3px; margin-bottom:8px; }
    .star-input button { background:none; border:none; cursor:pointer; font-size:1.3rem; color:var(--almond); transition:color var(--transition); }
    .star-input button.filled { color:var(--caramel); }
    @media (max-width:700px) {
      .product-modal { max-height:95vh; }
      .modal-body { grid-template-columns:1fr; grid-template-rows:200px 1fr; }
      .gallery { max-height:200px; }
      .detail-panel { max-height:calc(95vh - 200px); padding:14px 12px; }
    }
    @media (max-width:480px) {
      .overlay { padding:6px; }
      .detail-name { font-size:1.05rem; }
      .detail-price { font-size:1.4rem; }
    }
  `]
})
export class ProductModalComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Output() close = new EventEmitter<void>();

  activeImg = signal('');
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
    this.activeImg.set(this.product.images[0] || '');
    this.http.get<Review[]>(`${environment.apiUrl}/reviews/${this.product.id}`)
      .subscribe(r => this.reviews.set(r));
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() { document.body.style.overflow = ''; }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  onTouchStart(e: TouchEvent) { this.touchStartY = e.touches[0].clientY; }
  onTouchMove(e: TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    const delta = e.touches[0].clientY - this.touchStartY;
    if ((el.scrollTop === 0 && delta > 0) || (el.scrollTop + el.clientHeight >= el.scrollHeight && delta < 0)) e.preventDefault();
  }
  onWheel(e: WheelEvent) {
    const el = e.currentTarget as HTMLElement;
    if ((el.scrollTop === 0 && e.deltaY < 0) || (el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0)) e.preventDefault();
  }

  addToCart() {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión primero'); return; }
    this.cartService.addToCart(this.product, this.qty);
    this.toast.success(`${this.product.name} ×${this.qty} agregado 🍪`);
    this.close.emit();
  }

  // WhatsApp: text includes product name, qty, price AND image URL as separate link
    waLink(): string {
    const imgUrl = this.product.images?.[0] || '';
    const price = this.product.price * this.qty;
    // Build rich WhatsApp message with image link that WhatsApp will preview
    const parts = [
      `Hola! 🍪 Quiero pedir:`,
      ``,
      `*${this.product.name}*`,
      `🔢 Cantidad: ${this.qty}`,
      `💰 Total: $${price.toLocaleString('es-CO')}`,
    ];
    if (this.product.description) {
      parts.push(`📝 ${this.product.description.slice(0, 80)}${this.product.description.length > 80 ? '...' : ''}`);
    }
    if (imgUrl) {
      // WhatsApp auto-previews the image when the URL is on its own line
      parts.push(``);
      parts.push(imgUrl);
    }
    parts.push(``);
    parts.push(`¿Está disponible?`);
    return `https://wa.me/573215903340?text=${encodeURIComponent(parts.join('\n'))}`;
  }

  likeReview(r: any) {
    this.http.post(`${environment.apiUrl}/reviews/${r.id}/like`, {}).subscribe({
      next: (res: any) => {
        this.reviews.update(list => list.map(x => x.id === r.id ? { ...x, likes: res.likes } : x));
      }
    });
  }

  submitReview() {
    if (!this.myRating) return;
    this.http.post(`${environment.apiUrl}/reviews`, { product_id: this.product.id, rating: this.myRating, comment: this.myComment }).subscribe({
      next: () => {
        this.toast.success('Reseña enviada ⭐');
        this.myComment = '';
        this.http.get<Review[]>(`${environment.apiUrl}/reviews/${this.product.id}`).subscribe(r => this.reviews.set(r));
      },
      error: () => this.toast.error('No se pudo enviar')
    });
  }

  getStars(n: number) { return Array(Math.round(Math.min(n || 0, 5))).fill(0); }
  getEmpty(n: number) { return Array(Math.max(0, 5 - Math.round(n || 0))).fill(0); }
}
