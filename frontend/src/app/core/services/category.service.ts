import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }

  create(data: Partial<Category>) {
    return this.http.post<Category>(`${this.api}/categories`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/categories/${id}`);
  }
}
