import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-enter">
      <div class="page-header">
        <div class="container">
          <h1>Mis <span style="color:var(--warm-capuchino)">Pedidos</span> 🛍️</h1>
        </div>
      </div>
      <div class="container section-sm">

        <!-- Tabs -->
        <div class="orders-tabs">
          <button class="tab-pill" [class.active]="view()==='active'" (click)="loadOrders('active')">Activos</button>
          <button class="tab-pill" [class.active]="view()==='archived'" (click)="loadOrders('archived')">Archivados</button>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && orders().length===0" class="empty-state">
          <span>📦</span>
          <h3>No hay pedidos aquí</h3>
          <a routerLink="/products" class="btn btn-primary">Ver productos</a>
        </div>

        <!-- Orders list -->
        <div *ngIf="orders().length > 0" class="orders-list">
          <div *ngFor="let order of orders()" class="order-card card">
            <div class="order-header">
              <div>
                <span class="order-id">Pedido #{{order.id | slice:0:8}}</span>
                <span class="order-date">{{order.created_at | date:'dd/MM/yyyy HH:mm'}}</span>
              </div>
              <span class="status-badge" [class]="'status-'+order.status">
                {{getStatusLabel(order.status)}}
              </span>
            </div>

            <!-- Items -->
            <div class="order-items">
              <div *ngFor="let item of order.items" class="order-item">
                <img [src]="item.images?.[0] || 'assets/cookie-placeholder.png'" [alt]="item.name" class="item-thumb">
                <div class="item-details">
                  <span class="item-name">{{item.name}}</span>
                  <span class="item-qty">x{{item.quantity}}</span>
                </div>
                <span class="item-price">$ {{item.unit_price * item.quantity | number:'1.0-0'}}</span>
              </div>
            </div>

            <div class="order-footer">
              <div class="order-meta">
                <span><i class="fas fa-credit-card"></i> {{order.payment_method}}</span>
                <strong class="order-total">Total: $ {{order.total | number:'1.0-0'}}</strong>
              </div>
              <div class="order-actions">
                <button *ngIf="view()==='active'" class="action-sm archive-btn" (click)="archiveOrder(order.id)" title="Archivar">
                  <i class="fas fa-archive"></i> Archivar
                </button>
                <button *ngIf="view()==='active'" class="action-sm delete-btn" (click)="deleteOrder(order.id)" title="Eliminar">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
                <button *ngIf="view()==='archived'" class="action-sm restore-btn" (click)="loadOrders('active')" title="Ver activos">
                  <i class="fas fa-undo"></i> Ver activos
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 60px 0 40px; }
    .orders-tabs { display: flex; gap: 10px; margin-bottom: 28px; }
    .tab-pill {
      padding: 10px 24px; border-radius: var(--radius-full); border: 2px solid var(--almond);
      background: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
      color: var(--text-mid); transition: all var(--transition);
    }
    .tab-pill.active { background: var(--warm-capuchino); border-color: var(--warm-capuchino); color: #fff; }
    .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty-state span { font-size: 4rem; }
    .orders-list { display: flex; flex-direction: column; gap: 20px; }
    .order-card { padding: 0; overflow: hidden; }
    .order-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; background: var(--almond-light);
      border-bottom: 1px solid var(--almond);
    }
    .order-id { font-weight: 700; color: var(--mocca-bean); font-family: monospace; display: block; }
    .order-date { font-size: 0.8rem; color: var(--text-light); }
    .status-badge { padding: 4px 14px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 700; }
    .status-pending    { background: #fff3e0; color: #f57c00; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-completed  { background: #e8f5e9; color: #388e3c; }
    .status-cancelled  { background: #fde8e8; color: var(--error); }
    .order-items { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .order-item { display: flex; align-items: center; gap: 12px; }
    .item-thumb { width: 52px; height: 52px; border-radius: var(--radius-md); object-fit: cover; }
    .item-details { flex: 1; }
    .item-name { font-weight: 600; font-size: 0.9rem; color: var(--text-dark); display: block; }
    .item-qty { font-size: 0.8rem; color: var(--text-light); }
    .item-price { font-weight: 700; color: var(--warm-capuchino); }
    .order-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-top: 1px solid var(--almond); flex-wrap: wrap; gap: 12px;
    }
    .order-meta { display: flex; align-items: center; gap: 20px; font-size: 0.88rem; color: var(--text-mid); }
    .order-meta i { color: var(--warm-capuchino); margin-right: 4px; }
    .order-total { color: var(--warm-capuchino); font-size: 1.05rem; }
    .order-actions { display: flex; gap: 8px; }
    .action-sm {
      padding: 6px 14px; border-radius: var(--radius-full); border: none;
      cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 5px;
      transition: all var(--transition);
    }
    .archive-btn { background: var(--almond-light); color: var(--text-mid); }
    .archive-btn:hover { background: var(--almond); }
    .delete-btn { background: #fde8e8; color: var(--error); }
    .delete-btn:hover { background: var(--error); color: #fff; }
    .restore-btn { background: #e8f5e9; color: #388e3c; }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(true);
  view = signal<'active' | 'archived'>('active');

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() { this.loadOrders('active'); }

  loadOrders(type: 'active' | 'archived') {
    this.view.set(type);
    this.loading.set(true);
    const params = type === 'archived' ? '?archived=true' : '';
    this.http.get<any[]>(`${environment.apiUrl}/orders${params}`).subscribe({
      next: o => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  archiveOrder(id: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/user-archive`, {}).subscribe({
      next: () => { this.toast.success('Pedido archivado'); this.loadOrders('active'); },
      error: () => this.toast.error('Error al archivar')
    });
  }

  deleteOrder(id: string) {
    if (!confirm('¿Eliminar este pedido de tu historial?')) return;
    this.http.delete(`${environment.apiUrl}/orders/${id}/user-delete`).subscribe({
      next: () => { this.toast.success('Pedido eliminado'); this.loadOrders('active'); },
      error: () => this.toast.error('Error al eliminar')
    });
  }

  getStatusLabel(s: string) {
    const m: Record<string, string> = { pending: '⏳ Pendiente', processing: '🔄 En proceso', completed: '✅ Completado', cancelled: '❌ Cancelado' };
    return m[s] || s;
  }
}
