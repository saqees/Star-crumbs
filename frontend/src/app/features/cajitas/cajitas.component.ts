import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cajitas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-enter cajitas-page">
      <div class="cajitas-header">
        <div class="container">
          <div class="header-content">
            <div class="header-emoji">🎁</div>
            <h1>Nuestras <span>Cajitas</span></h1>
            <p>Combina tus galletas favoritas en una presentación especial. Perfectas para regalar.</p>
          </div>
        </div>
      </div>

      <div class="container section-sm">
        <!-- Loading skeleton -->
        <div *ngIf="loading()" class="combos-grid">
          <div *ngFor="let s of [1,2,3]" class="skeleton-box">
            <div class="skeleton" style="height:200px;border-radius:20px 20px 0 0"></div>
            <div style="padding:16px"><div class="skeleton" style="height:20px;margin-bottom:8px;width:60%"></div><div class="skeleton" style="height:14px;width:40%"></div></div>
          </div>
        </div>

        <!-- Combos grid -->
        <div *ngIf="!loading()" class="combos-grid">
          <div *ngFor="let combo of combos()"
               class="combo-card"
               [class.selected]="selectedCombo()?.id===combo.id"
               (click)="selectCombo(combo)">
            <!-- Box visual -->
            <div class="box-wrapper">
              <div class="box-img-wrap">
                <img *ngIf="combo.image_url" [src]="combo.image_url" [alt]="combo.name" class="box-img">
                <div *ngIf="!combo.image_url" class="box-placeholder">
                  <span class="box-icon">📦</span>
                </div>
                <div class="box-units-badge">x{{combo.units}}</div>
              </div>
            </div>
            <div class="combo-info">
              <h3>{{combo.name}}</h3>
              <p class="combo-desc">{{combo.description}}</p>
              <div class="combo-price-row">
                <span *ngIf="combo.discount_percent > 0 || combo.discount_amount > 0" class="original-price">
                  $ {{combo.original_price | number:'1.0-0'}}
                </span>
                <span class="final-price">$ {{combo.final_price || combo.original_price | number:'1.0-0'}}</span>
                <span *ngIf="combo.discount_percent > 0" class="discount-badge">-{{combo.discount_percent}}%</span>
              </div>
              <button class="btn btn-primary btn-sm open-btn">
                <i class="fas fa-box-open"></i> Ver cajita
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && !combos().length" class="empty-combos">
          <span>📦</span>
          <h3>No hay cajitas disponibles</h3>
          <p>Pronto tendremos combos especiales para ti</p>
          <a routerLink="/products" class="btn btn-primary">Ver productos</a>
        </div>
      </div>

      <!-- BOX DETAIL MODAL -->
      <div *ngIf="selectedCombo()" class="box-overlay" (click)="onOverlayClick($event)">
        <div class="box-modal">
          <!-- Animated box lid -->
          <div class="box-anim-wrap" [class.opened]="isOpened()">
            <div class="box-lid">
              <div class="lid-top">
                <span class="lid-ribbon">🎀</span>
              </div>
            </div>
            <div class="box-body">
              <img *ngIf="selectedCombo()!.image_url" [src]="selectedCombo()!.image_url" [alt]="selectedCombo()!.name" class="box-body-img">
              <div *ngIf="!selectedCombo()!.image_url" class="box-body-placeholder">
                <span>🍪</span>
              </div>
            </div>
          </div>

          <!-- Content (shown after open) -->
          <div class="box-detail" [class.visible]="isOpened()">
            <button class="modal-close" (click)="selectedCombo.set(null)"><i class="fas fa-times"></i></button>

            <div class="box-detail-header">
              <h2>{{selectedCombo()!.name}}</h2>
              <span class="units-tag"><i class="fas fa-cookie-bite"></i> {{selectedCombo()!.units}} unidades</span>
            </div>

            <p class="box-detail-desc">{{selectedCombo()!.description}}</p>

            <!-- Cookie items -->
            <div class="cookies-list">
              <h4>¿Qué hay dentro? 🍪</h4>
              <div *ngFor="let item of getComboItems(selectedCombo()!)" class="cookie-item">
                <div class="cookie-dot"></div>
                <span class="cookie-name">{{item.name}}</span>
                <span class="cookie-qty">×{{item.quantity}}</span>
              </div>
            </div>

            <!-- Pricing -->
            <div class="box-pricing">
              <div *ngIf="selectedCombo()!.discount_percent > 0 || selectedCombo()!.discount_amount > 0" class="price-row">
                <span class="label">Precio original:</span>
                <span class="price-orig">$ {{selectedCombo()!.original_price | number:'1.0-0'}}</span>
              </div>
              <div *ngIf="selectedCombo()!.discount_percent > 0" class="price-row discount-row">
                <span class="label">Descuento:</span>
                <span class="discount-val">-{{selectedCombo()!.discount_percent}}% 🎉</span>
              </div>
              <div *ngIf="selectedCombo()!.discount_amount > 0 && !selectedCombo()!.discount_percent" class="price-row discount-row">
                <span class="label">Descuento:</span>
                <span class="discount-val">-$ {{selectedCombo()!.discount_amount | number:'1.0-0'}} 🎉</span>
              </div>
              <div class="price-row total-row">
                <span class="label">Precio final:</span>
                <span class="price-final">$ {{selectedCombo()!.final_price || selectedCombo()!.original_price | number:'1.0-0'}}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="box-actions">
              <button class="btn btn-primary" (click)="addComboToCart()">
                <i class="fas fa-bag-shopping"></i> Agregar al carrito
              </button>
              <a [href]="getComboWaLink()" target="_blank" class="btn btn-secondary">
                <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Page ─── */
    .cajitas-header {
      background: linear-gradient(135deg, #FDF6EC 0%, #F5E6D3 50%, #E8C99A 100%);
      padding: 64px 0 48px;
    }
    .header-content { text-align: center; }
    .header-emoji { font-size: 3.5rem; margin-bottom: 12px; animation: bounce 2s infinite; display: block; }
    .cajitas-header h1 { color: var(--mocca-bean); margin-bottom: 12px; }
    .cajitas-header h1 span { color: var(--warm-capuchino); }
    .cajitas-header p { color: var(--text-mid); font-size: 1.05rem; max-width: 500px; margin: 0 auto; }

    /* ─── Grid ─── */
    .combos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; }
    .skeleton-box { border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-sm); }

    /* ─── Combo card ─── */
    .combo-card {
      background: #fff; border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm); overflow: hidden; cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .combo-card:hover { box-shadow: var(--shadow-md); transform: translateY(-6px); border-color: var(--almond); }
    .combo-card.selected { border-color: var(--warm-capuchino); }
    .box-wrapper { background: linear-gradient(135deg, var(--almond-light), var(--creamy-latte)); padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 180px; position: relative; }
    .box-img-wrap { position: relative; }
    .box-img { width: 140px; height: 140px; object-fit: cover; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); transition: transform 0.3s; }
    .combo-card:hover .box-img { transform: scale(1.05) rotate(-2deg); }
    .box-placeholder { width: 140px; height: 140px; background: var(--almond); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
    .box-icon { font-size: 4rem; }
    .box-units-badge {
      position: absolute; top: -8px; right: -8px;
      background: var(--warm-capuchino); color: #fff;
      font-size: 0.78rem; font-weight: 700; padding: 4px 10px;
      border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }
    .combo-info { padding: 20px; }
    .combo-info h3 { color: var(--mocca-bean); margin-bottom: 6px; font-size: 1.1rem; }
    .combo-desc { font-size: 0.84rem; color: var(--text-light); margin-bottom: 12px; min-height: 36px; }
    .combo-price-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .original-price { font-size: 0.88rem; color: var(--text-light); text-decoration: line-through; }
    .final-price { font-size: 1.3rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }
    .discount-badge { background: #e8f5e9; color: #388e3c; padding: 2px 9px; border-radius: var(--radius-full); font-size: 0.76rem; font-weight: 700; }
    .open-btn { width: 100%; justify-content: center; }

    /* ─── Box Modal Overlay ─── */
    .box-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }
    .box-modal {
      background: #fff; border-radius: var(--radius-xl);
      width: 100%; max-width: 560px; max-height: 92vh;
      overflow-y: auto; box-shadow: var(--shadow-lg);
      position: relative;
      animation: slideUp 0.3s ease;
    }

    /* ─── Box Animation ─── */
    .box-anim-wrap {
      background: linear-gradient(135deg, var(--creamy-latte), var(--almond));
      padding: 32px; display: flex; flex-direction: column; align-items: center;
      position: relative; overflow: hidden; min-height: 200px;
    }
    .box-lid {
      width: 160px; height: 48px;
      background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast));
      border-radius: 12px 12px 0 0;
      display: flex; align-items: center; justify-content: center;
      position: relative; z-index: 2;
      transform-origin: top center;
      transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
    }
    .box-anim-wrap.opened .box-lid {
      transform: rotateX(-110deg) translateY(-20px);
    }
    .lid-top { width: 100%; text-align: center; }
    .lid-ribbon { font-size: 1.5rem; }
    .box-body {
      width: 160px; min-height: 120px;
      background: var(--warm-capuchino);
      border-radius: 0 0 12px 12px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; position: relative;
      box-shadow: 0 8px 24px rgba(181,98,46,0.3);
    }
    .box-body-img { width: 100%; height: 130px; object-fit: cover; }
    .box-body-placeholder { width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }

    /* ─── Box Detail Content ─── */
    .box-detail {
      padding: 24px; opacity: 0; transform: translateY(10px);
      transition: opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s;
    }
    .box-detail.visible { opacity: 1; transform: translateY(0); }
    .modal-close {
      position: absolute; top: 14px; right: 14px;
      background: rgba(255,255,255,0.9); border: none; cursor: pointer;
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; color: var(--text-mid); box-shadow: var(--shadow-sm);
      z-index: 10; transition: all var(--transition);
    }
    .modal-close:hover { background: var(--error); color: #fff; }
    .box-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .box-detail-header h2 { color: var(--mocca-bean); font-size: 1.4rem; margin: 0; }
    .units-tag { background: var(--almond-light); color: var(--text-mid); padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 600; }
    .box-detail-desc { color: var(--text-mid); font-size: 0.92rem; line-height: 1.7; margin-bottom: 20px; }

    /* ─── Cookies list ─── */
    .cookies-list { background: var(--almond-light); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 20px; }
    .cookies-list h4 { color: var(--mocca-bean); margin-bottom: 12px; font-size: 0.95rem; }
    .cookie-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--almond); }
    .cookie-item:last-child { border-bottom: none; }
    .cookie-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--warm-capuchino); flex-shrink: 0; }
    .cookie-name { flex: 1; font-size: 0.9rem; color: var(--text-dark); font-weight: 600; }
    .cookie-qty { font-size: 0.82rem; color: var(--text-light); background: var(--almond); padding: 2px 8px; border-radius: var(--radius-full); }

    /* ─── Pricing ─── */
    .box-pricing { margin-bottom: 20px; }
    .price-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--almond-light); }
    .price-row .label { font-size: 0.88rem; color: var(--text-mid); }
    .price-orig { font-size: 0.9rem; color: var(--text-light); text-decoration: line-through; }
    .discount-row { background: #f0fdf4; margin: 0 -4px; padding: 8px 4px; border-radius: 8px; }
    .discount-val { font-size: 0.9rem; color: #388e3c; font-weight: 700; }
    .total-row { border-bottom: none; border-top: 2px solid var(--almond); margin-top: 4px; padding-top: 12px; }
    .price-final { font-size: 1.6rem; font-weight: 700; color: var(--warm-capuchino); font-family: var(--font-display); }

    /* ─── Actions ─── */
    .box-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .box-actions .btn { flex: 1; justify-content: center; }

    /* ─── Empty ─── */
    .empty-combos { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty-combos span { font-size: 4rem; }

    /* ─── Responsive ─── */
    @media (max-width: 600px) {
      .cajitas-header { padding: 44px 0 32px; }
      .header-emoji { font-size: 2.5rem; }
      .combos-grid { grid-template-columns: 1fr; gap: 18px; }
      .box-modal { max-height: 95vh; }
      .box-actions { flex-direction: column; }
      .box-actions .btn { flex: none; width: 100%; }
    }
  `]
})
export class CajitasComponent implements OnInit {
  combos = signal<any[]>([]);
  loading = signal(true);
  selectedCombo = signal<any>(null);
  isOpened = signal(false);

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/combos`).subscribe({
      next: c => { this.combos.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  selectCombo(combo: any) {
    this.selectedCombo.set(combo);
    this.isOpened.set(false);
    document.body.style.overflow = 'hidden';
    // Trigger box open animation after short delay
    setTimeout(() => this.isOpened.set(true), 200);
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('box-overlay')) {
      this.selectedCombo.set(null);
      document.body.style.overflow = '';
    }
  }

  getComboItems(combo: any): any[] {
    if (!combo?.items) return [];
    if (typeof combo.items === 'string') {
      try { return JSON.parse(combo.items); } catch { return []; }
    }
    return combo.items;
  }

  addComboToCart() {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para agregar al carrito'); return; }
    const combo = this.selectedCombo();
    // Add as a "virtual product" using combo details
    const virtualProduct = {
      id: combo.id,
      name: combo.name,
      price: combo.final_price || combo.original_price,
      images: combo.image_url ? [combo.image_url] : [],
      stock: 99,
      description: combo.description
    };
    this.cartService.addLocal(virtualProduct as any);
    this.toast.success(combo.name + ' agregado al carrito 🎁');
    this.selectedCombo.set(null);
    document.body.style.overflow = '';
  }

  getComboWaLink(): string {
    const combo = this.selectedCombo();
    if (!combo) return '#';
    const items = this.getComboItems(combo).map((i: any) => `${i.name} x${i.quantity}`).join(', ');
    const price = combo.final_price || combo.original_price;
    const discount = combo.discount_percent ? ` (${combo.discount_percent}% descuento)` : '';
    const msg = encodeURIComponent(
      `Hola! 🎁 Quiero pedir:\n*${combo.name}* (${combo.units} und)\n\n📦 Contenido: ${items}\n💰 Precio: $${price.toLocaleString()}${discount}\n\n¿Está disponible?`
    );
    return `https://wa.me/573215903340?text=${msg}`;
  }
}
