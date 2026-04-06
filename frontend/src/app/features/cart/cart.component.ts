import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UploadService } from '../../core/services/upload.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-enter">
      <div class="page-header" [style.background]="banner?.bg_gradient||'linear-gradient(135deg,var(--creamy-latte),var(--almond))'">
        <div class="container">
          <h1 [style.color]="banner?.text_color||''" [style.fontFamily]="banner?.font?(banner.font+',serif'):''">{{banner?.title||'Mi Carrito'}} 🛍️</h1>
        </div>
      </div>

      <div class="container section-sm">
        <div *ngIf="cart.items().length === 0 && !orderSuccess()" class="empty-cart">
          <span>🛍️</span>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega algunas deliciosas galletas para empezar</p>
          <a routerLink="/products" class="btn btn-primary">Ver Productos</a>
        </div>

        <div *ngIf="cart.items().length > 0 && !orderSuccess()" class="cart-layout">
          <!-- Items -->
          <div class="cart-items">
            <div *ngFor="let item of cart.items()" class="cart-item card">
              <img [src]="item.images[0] || 'assets/cookie-placeholder.png'" [alt]="item.name" class="item-img">
              <div class="item-info">
                <h3 class="item-name">{{item.name}}</h3>
                <p class="item-unit">$ {{item.price | number:'1.0-0'}} c/u</p>
              </div>
              <div class="item-qty">
                <button class="qty-btn" (click)="decreaseQty(item)" [disabled]="item.quantity <= 1"><i class="fas fa-minus"></i></button>
                <span class="qty-val">{{item.quantity}}</span>
                <button class="qty-btn" (click)="increaseQty(item)" [disabled]="item.quantity >= item.stock"><i class="fas fa-plus"></i></button>
              </div>
              <div class="item-subtotal">$ {{item.price * item.quantity | number:'1.0-0'}}</div>
              <button class="remove-btn" (click)="removeItem(item.id)"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>

          <!-- Summary -->
          <div class="cart-summary card">
            <h3>Resumen del pedido</h3>
            <div class="summary-rows">
              <div *ngFor="let item of cart.items()" class="summary-row">
                <span>{{item.name}} ×{{item.quantity}}</span>
                <span>$ {{item.price * item.quantity | number:'1.0-0'}}</span>
              </div>
              <hr>
              <div class="summary-total">
                <span>Total</span>
                <span class="total-val">$ {{cart.total() | number:'1.0-0'}}</span>
              </div>
            </div>

            <!-- Notes -->
            <!-- Notes -->
            <div class="form-group" style="margin-bottom:14px">
              <label style="font-weight:700;font-size:0.88rem;color:var(--text-mid);display:block;margin-bottom:5px">Notas (opcional)</label>
              <textarea [(ngModel)]="notes" class="form-control" rows="2" placeholder="Dirección, indicaciones especiales..."></textarea>
            </div>
            <!-- Allergies -->
            <div class="form-group" style="margin-bottom:14px">
              <label class="allergy-label"><i class="fas fa-allergies"></i> ¿A qué eres alérgico/a?</label>
              <input type="text" [(ngModel)]="allergies" class="form-control"
                     placeholder="Ej: nueces, maní, gluten, lactosa... (opcional)">
            </div>

            <!-- Pay button -->
            <button class="btn btn-primary" style="width:100%;justify-content:center;font-size:1rem;margin-bottom:10px"
                    (click)="showPayModal=true">
              <i class="fas fa-lock"></i> Pagar pedido
            </button>

            <!-- WhatsApp order -->
            <a [href]="waOrderLink()" target="_blank" class="btn-wa-cart">
              <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
            </a>

            <button class="clear-btn" (click)="clearCart()">
              <i class="fas fa-trash"></i> Vaciar carrito
            </button>
          </div>
        </div>

        <!-- Success -->
        <div *ngIf="orderSuccess()" class="order-success">
          <div class="success-icon">🎉</div>
          <h2>¡Pedido confirmado!</h2>
          <p>Tu pedido fue registrado. Te contactaremos pronto.</p>

          <!-- Dynamic announcement from admin -->
          <div *ngIf="confirmationAnnouncement()?.enabled" class="confirm-announcement"
               [style.background]="confirmationAnnouncement()!.bg_color||'#FFF3E0'"
               [style.color]="confirmationAnnouncement()!.text_color||'#E65100'"
               [style.border-color]="confirmationAnnouncement()!.border_color||'#FFB74D'">
            <div class="confirm-ann-icon">{{confirmationAnnouncement()!.icon||'🍪'}}</div>
            <div class="confirm-ann-body">
              <strong>{{confirmationAnnouncement()!.title}}</strong>
              <p>{{confirmationAnnouncement()!.message}}</p>
            </div>
          </div>

          <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:20px">
            <a routerLink="/orders" class="btn btn-secondary">Ver mis pedidos</a>
            <a routerLink="/products" class="btn btn-primary">Seguir comprando</a>
          </div>
        </div>
      </div>
    </div>

    <!-- PAYMENT MODAL -->
    <div *ngIf="showPayModal" class="pay-overlay" (click)="onOverlayClick($event)">
      <div class="pay-modal">
        <button class="pay-close" (click)="showPayModal=false"><i class="fas fa-times"></i></button>
        <h3><i class="fas fa-lock"></i> Método de pago</h3>
        <p class="pay-total">Total: <strong>$ {{cart.total() | number:'1.0-0'}}</strong></p>

        <div class="pay-opts">
          <!-- Nequi -->
          <button class="pay-btn" [class.pay-sel]="paymentMethod==='nequi'" (click)="paymentMethod='nequi'">
            <div class="picon nq-ic">N</div>
            <div><strong>Nequi</strong><span>Transferencia instantánea</span></div>
            <i *ngIf="paymentMethod==='nequi'" class="fas fa-check-circle pay-check"></i>
          </button>
          <!-- Avanza / Tarjeta -->
          <button class="pay-btn" [class.pay-sel]="paymentMethod==='tarjeta'" (click)="paymentMethod='tarjeta'">
            <div class="picon cd-ic"><i class="fas fa-credit-card"></i></div>
            <div><strong>Avanza Visa Débito</strong><span>Transferencia bancaria</span></div>
            <i *ngIf="paymentMethod==='tarjeta'" class="fas fa-check-circle pay-check"></i>
          </button>
          <!-- Efectivo -->
          <button class="pay-btn" [class.pay-sel]="paymentMethod==='efectivo'" (click)="paymentMethod='efectivo'">
            <div class="picon ca-ic"><i class="fas fa-money-bill-wave"></i></div>
            <div><strong>Efectivo contra entrega</strong><span>Paga al recibir</span></div>
            <i *ngIf="paymentMethod==='efectivo'" class="fas fa-check-circle pay-check"></i>
          </button>
        </div>

        <!-- Nequi detail -->
        <div *ngIf="paymentMethod==='nequi'" class="pay-detail nequi-box">
          <div class="nq-header"><div class="nq-logo">N</div><span>Nequi</span></div>
          <div class="nq-number">321 590 3340</div>
          <p class="nq-hint">Envía <strong>$ {{cart.total()|number:'1.0-0'}}</strong> a este número y adjunta el comprobante</p>
          <div class="pay-links">
            <a href="https://www.nequi.com.co/" target="_blank" class="btn btn-primary btn-sm">
              <i class="fas fa-external-link-alt"></i> Abrir Nequi
            </a>
            <button class="btn btn-secondary btn-sm" (click)="copy('3215903340')">
              <i class="fas fa-copy"></i> Copiar número
            </button>
          </div>
        </div>

        <!-- Avanza Visa detail — solo link de pago -->
        <div *ngIf="paymentMethod==='tarjeta'" class="pay-detail avanza-box">
          <div class="avanza-header">
            <div class="avanza-logo"><i class="fas fa-credit-card"></i></div>
            <span>Avanza Visa Débito</span>
          </div>
          <p class="avanza-hint">
            Envía <strong>$ {{cart.total()|number:'1.0-0'}}</strong> desde tu app bancaria a la cuenta Avanza Visa Débito.
            Usa el botón para ir directo al pago.
          </p>
          <div class="pay-links">
            <a href="https://daviplata.com" target="_blank" class="btn btn-primary btn-sm">
              <i class="fas fa-external-link-alt"></i> Ir a pagar
            </a>
            <button class="btn btn-secondary btn-sm" (click)="copy('4771700760166680')">
              <i class="fas fa-copy"></i> Copiar número tarjeta
            </button>
          </div>
        </div>

        <!-- Efectivo detail -->
        <div *ngIf="paymentMethod==='efectivo'" class="pay-detail cash-box">
          <span class="cash-emoji">💵</span>
          <p>Ten listo el valor exacto: <strong>$ {{cart.total()|number:'1.0-0'}}</strong> al recibir tu pedido.</p>
        </div>

        <button class="btn btn-primary confirm-btn" (click)="checkout()" [disabled]="!paymentMethod || ordering()">
          <i class="fas fa-check-circle"></i> {{ordering() ? 'Procesando...' : 'Confirmar pedido'}}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 56px 0 36px; }
    .empty-cart { text-align:center; padding:80px 20px; display:flex; flex-direction:column; align-items:center; gap:16px; }
    .empty-cart span { font-size:4rem; }
    .cart-layout { display:grid; grid-template-columns:1fr 370px; gap:24px; align-items:start; }
    .cart-items { display:flex; flex-direction:column; gap:14px; }
    .cart-item { display:flex; align-items:center; gap:14px; padding:14px; }
    .item-img { width:76px; height:76px; border-radius:var(--radius-md); object-fit:cover; flex-shrink:0; }
    .item-info { flex:1; }
    .item-name { font-size:.98rem; color:var(--mocca-bean); margin-bottom:3px; }
    .item-unit { font-size:.83rem; color:var(--text-light); }
    .item-qty { display:flex; align-items:center; gap:7px; }
    .qty-btn { width:30px; height:30px; border-radius:50%; border:2px solid var(--almond); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--warm-capuchino); font-size:.75rem; transition:all var(--transition); }
    .qty-btn:hover:not(:disabled) { background:var(--warm-capuchino); border-color:var(--warm-capuchino); color:#fff; }
    .qty-btn:disabled { opacity:.3; cursor:default; }
    .qty-val { font-weight:700; min-width:22px; text-align:center; }
    .item-subtotal { font-weight:700; color:var(--warm-capuchino); font-size:1.05rem; min-width:76px; text-align:right; }
    .remove-btn { background:none; border:none; cursor:pointer; color:var(--error); font-size:.95rem; padding:7px; border-radius:var(--radius-sm); transition:background var(--transition); }
    .remove-btn:hover { background:#ffe9e9; }
    .cart-summary { padding:24px; position:sticky; top:88px; }
    .cart-summary h3 { margin-bottom:18px; color:var(--mocca-bean); }
    .summary-rows { display:flex; flex-direction:column; gap:9px; margin-bottom:18px; }
    .summary-row { display:flex; justify-content:space-between; font-size:.88rem; color:var(--text-mid); }
    .summary-rows hr { border:none; border-top:1px solid var(--almond); }
    .summary-total { display:flex; justify-content:space-between; font-weight:700; }
    .total-val { font-size:1.3rem; color:var(--warm-capuchino); font-family:var(--font-display); }
    .btn-wa-cart { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#25D366,#128C7E); color:#fff; padding:11px; border-radius:var(--radius-full); font-weight:700; font-size:.9rem; text-decoration:none; margin-bottom:10px; transition:all var(--transition); border:none; cursor:pointer; }
    .btn-wa-cart:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(37,211,102,.4); color:#fff; }
    .clear-btn { width:100%; margin-top:8px; background:none; border:1px solid var(--almond); padding:9px; border-radius:var(--radius-full); cursor:pointer; color:var(--text-light); font-size:.83rem; display:flex; align-items:center; justify-content:center; gap:6px; transition:all var(--transition); }
    .clear-btn:hover { border-color:var(--error); color:var(--error); }
    .order-success { text-align:center; padding:80px 20px; display:flex; flex-direction:column; align-items:center; gap:16px; }
    .success-icon { font-size:4rem; animation:bounce 1s ease; }
    /* Payment modal */
    .pay-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:14px; animation:fadeIn .2s ease; }
    .pay-modal { background:#fff; border-radius:var(--radius-xl); width:100%; max-width:440px; padding:26px; box-shadow:var(--shadow-lg); animation:slideUp .3s ease; position:relative; max-height:90vh; overflow-y:auto; }
    .pay-close { position:absolute; top:13px; right:13px; background:none; border:none; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.9rem; color:var(--text-light); }
    .pay-close:hover { background:var(--error); color:#fff; }
    .pay-modal h3 { color:var(--mocca-bean); margin-bottom:4px; font-size:1.15rem; }
    .pay-total { color:var(--text-mid); font-size:.9rem; margin-bottom:18px; }
    .pay-opts { display:flex; flex-direction:column; gap:9px; margin-bottom:16px; }
    .pay-btn { display:flex; align-items:center; gap:12px; padding:13px 15px; border:2px solid var(--almond); border-radius:var(--radius-md); background:#fff; cursor:pointer; transition:all var(--transition); text-align:left; }
    .pay-btn:hover { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .pay-sel { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .pay-btn div:last-of-type { flex:1; }
    .pay-btn strong { display:block; font-size:.9rem; color:var(--text-dark); }
    .pay-btn span { font-size:.76rem; color:var(--text-light); }
    .pay-check { color:var(--warm-capuchino); font-size:1rem; }
    .picon { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; flex-shrink:0; }
    .nq-ic { background:#7b2d8b; color:#fff; font-size:1.1rem; }
    .cd-ic { background:linear-gradient(135deg,#1565c0,#0d47a1); color:#fff; }
    .ca-ic { background:linear-gradient(135deg,#388e3c,#1b5e20); color:#fff; }
    .pay-detail { margin-bottom:16px; border-radius:var(--radius-lg); padding:18px; }
    /* Nequi */
    .nequi-box { background:linear-gradient(135deg,#7b2d8b,#4a148c); color:#fff; }
    .nq-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .nq-logo { width:28px; height:28px; background:rgba(255,255,255,.2); border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:.95rem; }
    .nq-header span { font-size:.95rem; font-weight:700; }
    .nq-number { font-size:1.7rem; font-weight:700; letter-spacing:3px; margin-bottom:7px; }
    .nq-hint { font-size:.8rem; opacity:.85; margin-bottom:13px; line-height:1.5; }
    /* Avanza */
    .avanza-box { background:linear-gradient(135deg,#1a237e,#1565c0); color:#fff; }
    .avanza-header { display:flex; align-items:center; gap:9px; margin-bottom:10px; }
    .avanza-logo { width:32px; height:32px; background:rgba(255,255,255,.2); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.95rem; }
    .avanza-header span { font-size:.95rem; font-weight:700; }
    .avanza-hint { font-size:.82rem; opacity:.88; margin-bottom:13px; line-height:1.6; }
    /* Cash */
    .cash-box { background:var(--almond-light); text-align:center; }
    .cash-emoji { font-size:2rem; display:block; margin-bottom:7px; }
    .cash-box p { font-size:.88rem; color:var(--text-mid); }
    .pay-links { display:flex; gap:8px; flex-wrap:wrap; }
    .confirm-btn { width:100%; justify-content:center; padding:13px; font-size:.95rem; }
    @media(max-width:768px) { .cart-layout { grid-template-columns:1fr; } .cart-item { flex-wrap:wrap; } }
    @media(max-width:480px) { .pay-modal { padding:18px; } .nq-number { font-size:1.4rem; } }
    /* Allergies */
    .allergy-label { font-weight:700; font-size:.88rem; color:var(--text-mid); display:flex; align-items:center; gap:6px; margin-bottom:5px; }
    .allergy-label i { color:#e65100; }
    /* Receipt Upload */
    .receipt-upload-section { margin-bottom:16px; }
    .receipt-label { font-weight:700; font-size:.88rem; color:var(--text-mid); display:flex; align-items:center; gap:6px; margin-bottom:3px; }
    .receipt-label i { color:var(--warm-capuchino); }
    .receipt-sub { font-size:.76rem; color:var(--text-light); margin-bottom:10px; }
    .receipt-upload-area {
      border:2px dashed var(--almond); border-radius:var(--radius-lg);
      background:#fff; transition:all .2s; overflow:hidden;
    }
    .receipt-upload-area:hover { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .receipt-has-file { border-style:solid; border-color:var(--warm-capuchino); }
    .receipt-file-input { display:none; }
    .receipt-empty { padding:4px; }
    .receipt-upload-btn {
      display:flex; align-items:center; gap:14px;
      padding:16px 18px; cursor:pointer;
    }
    .rub-icon {
      width:48px; height:48px; border-radius:12px;
      background:linear-gradient(135deg,var(--warm-capuchino),var(--caramel-roast));
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.3rem; flex-shrink:0;
    }
    .rub-text strong { display:block; font-size:.9rem; color:var(--mocca-bean); margin-bottom:2px; }
    .rub-text span { font-size:.75rem; color:var(--text-light); }
    .receipt-loading { display:flex; align-items:center; gap:12px; padding:16px 18px; font-size:.85rem; color:var(--text-mid); }
    .receipt-spinner { width:20px; height:20px; border:2px solid var(--almond); border-top-color:var(--warm-capuchino); border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .receipt-preview { display:flex; flex-direction:column; }
    .receipt-img { width:100%; max-height:180px; object-fit:contain; background:var(--almond-light); display:block; }
    .receipt-actions { display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--almond-light); }
    .receipt-ok { flex:1; font-size:.82rem; font-weight:700; color:#388e3c; display:flex; align-items:center; gap:5px; }
    .receipt-change-btn {
      font-size:.76rem; color:var(--warm-capuchino); cursor:pointer; font-weight:700;
      padding:5px 12px; border-radius:var(--radius-full); background:#fff;
      border:1px solid var(--warm-capuchino); display:flex; align-items:center; gap:4px;
    }
    .receipt-remove-btn {
      background:none; border:1px solid var(--error); color:var(--error);
      padding:5px 10px; border-radius:var(--radius-full); cursor:pointer; font-size:.78rem;
    }
    /* Confirmation announcement */
    .confirm-announcement {
      display:flex; align-items:flex-start; gap:14px;
      border:2px solid; border-radius:var(--radius-lg);
      padding:18px 20px; margin:20px 0 0; text-align:left; max-width:500px;
      animation:slideUp .4s ease;
    }
    .confirm-ann-icon { font-size:2rem; flex-shrink:0; }
    .confirm-ann-body strong { display:block; font-size:1rem; font-weight:700; margin-bottom:5px; }
    .confirm-ann-body p { font-size:.88rem; line-height:1.6; margin:0; }
  `]
})
export class CartComponent {
  paymentMethod = 'nequi';
  notes = '';
  ordering = signal(false);
  banner: any = null;
  orderSuccess = signal(false);
  showPayModal = false;

  constructor(public cart: CartService, private http: HttpClient, private toast: ToastService) { this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_cart`).subscribe({next:s=>{if(s?.setting_value)this.banner=s.setting_value;}}); }

  increaseQty(item: any) { this.cart.updateQuantity(item.id, item.quantity + 1); }
  decreaseQty(item: any) {
    if (item.quantity <= 1) this.cart.removeItem(item.id);
    else this.cart.updateQuantity(item.id, item.quantity - 1);
  }
  removeItem(id: string) { this.cart.removeItem(id); }
  clearCart() { this.cart.clearCart(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('pay-overlay')) this.showPayModal = false;
  }

  copy(text: string) {
    navigator.clipboard.writeText(text).then(() => this.toast.success('Copiado 📋'));
  }

  // Receipt file handlers
  async onReceiptSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.uploadReceipt(file);
  }

  onReceiptDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadReceipt(file);
  }

  async uploadReceipt(file: File) {
    this.uploadingReceipt.set(true);
    try {
      const b64 = await this.uploadService.fileToBase64(file);
      this.uploadService.uploadImage(b64, 'star-crumbs/receipts').subscribe({
        next: (r: any) => {
          this.receiptUrl = r.url;
          this.receiptPreview = r.url;
          this.uploadingReceipt.set(false);
          this.toast.success('Comprobante adjunto ✅');
        },
        error: () => {
          this.uploadingReceipt.set(false);
          this.toast.error('Error al subir el comprobante');
        }
      });
    } catch {
      this.uploadingReceipt.set(false);
    }
  }

  removeReceipt() {
    this.receiptUrl = '';
    this.receiptPreview = '';
    const input = document.getElementById('receipt-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  checkout() {
    if (!this.paymentMethod) { this.toast.error('Selecciona un método de pago'); return; }
    this.ordering.set(true);
    this.http.post(`${environment.apiUrl}/orders`, {
      payment_method: this.paymentMethod,
      notes: this.notes,
      allergies: this.allergies,
      receipt_url: this.receiptUrl
    }).subscribe({
      next: () => {
        this.ordering.set(false);
        this.showPayModal = false;
        this.orderSuccess.set(true);
        this.cart.items.set([]);
        this.toast.success('¡Pedido confirmado! 🎉');
      },
      error: () => { this.ordering.set(false); this.toast.error('Error al procesar el pedido'); }
    });
  }

  waOrderLink() {
    const items = this.cart.items();
    const lines = items.map(i => {
      const img = i.images?.[0] || '';
      return `• ${i.name} ×${i.quantity} — $${(i.price * i.quantity).toLocaleString('es-CO')}${img ? '\n  📸 ' + img : ''}`;
    }).join('\n');
    const total = this.cart.total();
    const msg = `Hola! 🍪 Quiero hacer un pedido:\n\n${lines}\n\n💰 *Total: $${total.toLocaleString('es-CO')}*\n\n¿Está disponible?`;
    return `https://wa.me/573215903340?text=${encodeURIComponent(msg)}`;
  }
}
