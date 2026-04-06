import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(filters?: { category?: string; featured?: boolean; search?: string; sort?: string }) {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.featured)  params = params.set('featured', 'true');
    if (filters?.search)    params = params.set('search', filters.search);
    if (filters?.sort)      params = params.set('sort', filters.sort);
    return this.http.get<Product[]>(`${this.api}/products`, { params });
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  create(data: Partial<Product>) {
    return this.http.post<Product>(`${this.api}/products`, data);
  }

  update(id: string, data: Partial<Product>) {
    return this.http.put<Product>(`${this.api}/products/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/products/${id}`);
  }
}
