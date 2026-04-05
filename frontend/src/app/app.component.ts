import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PwaPromptComponent } from './features/pwa/pwa-prompt.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PwaPromptComponent
  ],
  template: `
    <router-outlet></router-outlet>
    <app-pwa-prompt></app-pwa-prompt>
  `
})
export class AppComponent {}
