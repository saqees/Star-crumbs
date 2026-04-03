import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Order[]>(`${this.api}/orders`);
  }

  place(data: { payment_method: string; notes?: string }) {
    return this.http.post<{ orderId: string; total: number }>(`${this.api}/orders`, data);
  }

  updateStatus(id: string, status: string) {
    return this.http.put<Order>(`${this.api}/orders/${id}/status`, { status });
  }
}
