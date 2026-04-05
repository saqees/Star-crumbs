import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CartItem, Product } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = environment.apiUrl;
  items = signal<CartItem[]>([]);

  total = computed(() =>
    this.items().reduce((acc, i) => acc + i.price * i.quantity, 0)
  );
  itemCount = computed(() =>
    this.items().reduce((acc, i) => acc + i.quantity, 0)
  );

  constructor(private http: HttpClient, private auth: AuthService) {
    if (this.auth.isLoggedIn) this.loadCart();
  }

  loadCart() {
    return this.http.get<CartItem[]>(`${this.api}/cart`).pipe(
      tap(items => this.items.set(items))
    ).subscribe();
  }

  addToCart(product: Product, qty = 1) {
    if (!this.auth.isLoggedIn) return;
    this.http.post<CartItem>(`${this.api}/cart`, { product_id: product.id, quantity: qty }).pipe(
      tap(() => this.loadCart())
    ).subscribe();
  }

  updateQuantity(itemId: string, quantity: number) {
    this.http.put(`${this.api}/cart/${itemId}`, { quantity }).pipe(
      tap(() => this.loadCart())
    ).subscribe();
  }

  removeItem(itemId: string) {
    this.http.delete(`${this.api}/cart/${itemId}`).pipe(
      tap(() => this.loadCart())
    ).subscribe();
  }

  clearCart() {
    this.http.delete(`${this.api}/cart`).pipe(
      tap(() => this.items.set([]))
    ).subscribe();
  }

  // Local add (optimistic, for non-logged users shown as hint)
  addLocal(product: Product, qty = 1) {
    const current = this.items();
    const idx = current.findIndex(i => i.product_id === product.id);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
      this.items.set(updated);
    } else {
      this.items.set([...current, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        stock: product.stock,
        quantity: qty
      }]);
    }
  }
}
