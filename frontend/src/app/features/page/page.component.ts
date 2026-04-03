import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-enter" *ngIf="page()">
      <div class="page-header">
        <div class="container">
          <h1>{{page().title}}</h1>
        </div>
      </div>
      <div class="container section-sm">
        <div *ngFor="let section of page().sections" class="page-section">
          <!-- Products section -->
          <div *ngIf="section.type==='products'" class="section-products">
            <h2 *ngIf="section.title">{{section.title}}</h2>
            <p *ngIf="section.description">{{section.description}}</p>
            <a routerLink="/products" class="btn btn-primary mt-md">Ver productos</a>
          </div>
          <!-- Text section -->
          <div *ngIf="section.type==='text'" class="section-text">
            <h2 *ngIf="section.title">{{section.title}}</h2>
            <p>{{section.content}}</p>
          </div>
          <!-- Banner section -->
          <div *ngIf="section.type==='banner'" class="section-banner" [style.background]="section.bg || 'var(--creamy-latte)'">
            <img *ngIf="section.image" [src]="section.image" [alt]="section.title" class="banner-img">
            <h2 *ngIf="section.title">{{section.title}}</h2>
            <p *ngIf="section.description">{{section.description}}</p>
            <a *ngIf="section.button_text" [routerLink]="section.button_url || '/'" class="btn btn-primary mt-md">{{section.button_text}}</a>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="!page() && !loading()" class="container section" style="text-align:center">
      <h2>Página no encontrada</h2>
      <a routerLink="/" class="btn btn-primary mt-md">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, var(--creamy-latte), var(--almond)); padding: 60px 0 40px; }
    .page-section { margin-bottom: 48px; }
    .section-text h2, .section-products h2 { color: var(--mocca-bean); margin-bottom: 12px; }
    .section-text p, .section-products p { color: var(--text-mid); line-height: 1.7; }
    .section-banner {
      border-radius: var(--radius-xl); padding: 48px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .banner-img { max-width: 300px; border-radius: var(--radius-lg); margin-bottom: 16px; }
    .section-banner h2 { color: var(--mocca-bean); }
    .section-banner p { color: var(--text-mid); max-width: 500px; }
  `]
})
export class PageComponent implements OnInit {
  page = signal<any>(null);
  loading = signal(true);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.http.get<any>(`${environment.apiUrl}/site-pages/slug/${p['slug']}`).subscribe({
        next: pg => { this.page.set(pg); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    });
  }
}
