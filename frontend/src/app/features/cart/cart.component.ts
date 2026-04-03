import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container">
          <h1>Mi <span style="color:var(--warm-capuchino)">Carrito</span> 🛍️</h1>
        </div>
      </div>

      <div class="container section-sm">
        <div *ngIf="cart.items().length === 0" class="empty-cart">
          <span>🛍️</span>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega algunas deliciosas galletas para empezar</p>
          <a routerLink="/products" class="btn btn-primary">Ver Productos</a>
        </div>

        <div *ngIf="cart.items().length > 0" class="cart-layout">
          <!-- Items -->
          <div class="cart-items">
            <div *ngFor="let item of cart.items()" class="cart-item card">
              <img [src]="item.images[0] || 'assets/cookie-placeholder.png'" [alt]="item.name" class="item-img">
              <div class="item-info">
                <h3 class="item-name">{{item.name}}</h3>
                <p class="item-unit">$ {{item.price | number:'1.0-0'}} c/u</p>
              </div>
              <div class="item-qty">
                <button class="qty-btn" (click)="decreaseQty(item)" [disabled]="item.quantity <= 1">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="qty-val">{{item.quantity}}</span>
                <button class="qty-btn" (click)="increaseQty(item)" [disabled]="item.quantity >= item.stock">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <div class="item-subtotal">$ {{item.price * item.quantity | number:'1.0-0'}}</div>
              <button class="remove-btn" (click)="removeItem(item.id)">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>

          <!-- Summary -->
          <div class="cart-summary card">
            <h3>Resumen del pedido</h3>
            <div class="summary-rows">
              <div *ngFor="let item of cart.items()" class="summary-row">
                <span>{{item.name}} x{{item.quantity}}</span>
                <span>$ {{item.price * item.quantity | number:'1.0-0'}}</span>
              </div>
              <hr>
              <div class="summary-total">
                <span>Total</span>
                <span class="total-val">$ {{cart.total() | number:'1.0-0'}}</span>
              </div>
            </div>

            <div class="payment-select">
              <label class="form-group">
                <span>Método de pago</span>
                <select [(ngModel)]="paymentMethod" class="form-control">
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="contra_entrega">🚚 Contra entrega</option>
                  <option value="nequi">📱 Nequi</option>
                </select>
              </label>
              <label class="form-group">
                <span>Notas (opcional)</span>
                <textarea [(ngModel)]="notes" class="form-control" rows="2" placeholder="Instrucciones especiales..."></textarea>
              </label>
            </div>

            <button class="btn btn-primary" style="width:100%;justify-content:center;font-size:1.05rem"
                    (click)="checkout()" [disabled]="ordering()">
              <i class="fas fa-check-circle"></i>
              {{ordering() ? 'Procesando...' : 'Confirmar Pedido'}}
            </button>

            <a [href]="waOrderLink()" target="_blank" class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:10px">
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
          <p>Tu pedido ha sido registrado exitosamente. Te contactaremos pronto.</p>
          <a routerLink="/products" class="btn btn-primary">Seguir comprando</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 60px 0 40px; }
    .empty-cart {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .empty-cart span { font-size: 4rem; }
    .empty-cart h3 { color: var(--mocca-bean); }
    .empty-cart p { color: var(--text-light); }
    .cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start; }
    .cart-items { display: flex; flex-direction: column; gap: 16px; }
    .cart-item {
      display: flex; align-items: center; gap: 16px; padding: 16px;
    }
    .item-img { width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0; }
    .item-info { flex: 1; }
    .item-name { font-size: 1rem; color: var(--mocca-bean); margin-bottom: 4px; }
    .item-unit { font-size: 0.85rem; color: var(--text-light); }
    .item-qty { display: flex; align-items: center; gap: 8px; }
    .qty-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid var(--almond); background: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--warm-capuchino); font-size: 0.8rem; transition: all var(--transition);
    }
    .qty-btn:hover:not(:disabled) { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    .qty-btn:disabled { opacity: 0.3; cursor: default; }
    .qty-val { font-weight: 700; min-width: 24px; text-align: center; }
    .item-subtotal { font-weight: 700; color: var(--warm-capuchino); font-size: 1.1rem; min-width: 80px; text-align: right; }
    .remove-btn { background: none; border: none; cursor: pointer; color: var(--error); font-size: 1rem; padding: 8px; border-radius: var(--radius-sm); transition: background var(--transition); }
    .remove-btn:hover { background: #ffe9e9; }
    .cart-summary { padding: 28px; position: sticky; top: 90px; }
    .cart-summary h3 { margin-bottom: 20px; color: var(--mocca-bean); }
    .summary-rows { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-mid); }
    .summary-rows hr { border: none; border-top: 1px solid var(--almond); }
    .summary-total { display: flex; justify-content: space-between; font-weight: 700; }
    .total-val { font-size: 1.3rem; color: var(--warm-capuchino); font-family: var(--font-display); }
    .payment-select { margin-bottom: 20px; }
    .payment-select label > span { display: block; margin-bottom: 6px; font-weight: 700; font-size: 0.9rem; color: var(--text-mid); }
    .clear-btn {
      width: 100%; margin-top: 12px; background: none; border: 1px solid var(--almond);
      padding: 10px; border-radius: var(--radius-full); cursor: pointer;
      color: var(--text-light); font-size: 0.85rem; display: flex; align-items: center;
      justify-content: center; gap: 6px; transition: all var(--transition);
    }
    .clear-btn:hover { border-color: var(--error); color: var(--error); }
    .order-success {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .success-icon { font-size: 4rem; animation: bounce 1s ease; }
    @media (max-width: 768px) {
      .cart-layout { grid-template-columns: 1fr; }
      .cart-item { flex-wrap: wrap; }
    }
  `]
})
export class CartComponent {
  paymentMethod = 'tarjeta';
  notes = '';
  ordering = signal(false);
  orderSuccess = signal(false);

  constructor(
    public cart: CartService,
    private http: HttpClient,
    private toast: ToastService
  ) {}

  increaseQty(item: any) { this.cart.updateQuantity(item.id, item.quantity + 1); }
  decreaseQty(item: any) {
    if (item.quantity <= 1) this.cart.removeItem(item.id);
    else this.cart.updateQuantity(item.id, item.quantity - 1);
  }
  removeItem(id: string) { this.cart.removeItem(id); }
  clearCart() { this.cart.clearCart(); }

  checkout() {
    this.ordering.set(true);
    this.http.post(`${environment.apiUrl}/orders`, {
      payment_method: this.paymentMethod,
      notes: this.notes
    }).subscribe({
      next: () => {
        this.ordering.set(false);
        this.orderSuccess.set(true);
        this.cart.items.set([]);
        this.toast.success('¡Pedido confirmado! 🎉');
      },
      error: () => {
        this.ordering.set(false);
        this.toast.error('Error al procesar el pedido');
      }
    });
  }

  waOrderLink() {
    const items = this.cart.items().map(i => `${i.name} x${i.quantity}`).join(', ');
    const msg = encodeURIComponent(`Hola! Quiero pedir: ${items}. Total: $${this.cart.total()}`);
    return `https://wa.me/573000000000?text=${msg}`;
  }
}
