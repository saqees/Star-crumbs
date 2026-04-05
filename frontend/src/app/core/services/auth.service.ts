import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('sc_token');
    const user = localStorage.getItem('sc_user');
    if (token && user) {
      try { this.currentUser.set(JSON.parse(user)); } catch {}
    }
  }

  register(data: any) {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  updateProfile(data: Partial<User>) {
    return this.http.put<User>(`${this.api}/users/me`, data).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('sc_user', JSON.stringify(user));
      })
    );
  }

  logout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem('sc_token', res.token);
    localStorage.setItem('sc_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  get token() { return localStorage.getItem('sc_token'); }
  get isLoggedIn() { return !!this.token && !!this.currentUser(); }
  get isAdmin() { return this.currentUser()?.role === 'admin'; }
}
