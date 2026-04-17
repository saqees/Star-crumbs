import {
  Component, OnInit, OnDestroy, signal, effect,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutorialService, TutorialStep } from '../../core/services/tutorial.service';
import { AuthService } from '../../core/services/auth.service';

interface SpotlightRect {
  top: number; left: number; width: number; height: number;
}

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ═══ BIENVENIDA ═══ -->
    <div class="tut-backdrop" *ngIf="tutorial.showWelcome()" (click)="onBackdropClick($event)">
      <div class="tut-welcome-card" (click)="$event.stopPropagation()">
        <div class="tut-welcome-icon">🎓</div>
        <h2 class="tut-welcome-title">¡Bienvenido a Star Crumbs!</h2>
        <p class="tut-welcome-sub">¿Quieres hacer el tutorial?</p>
        <p class="tut-welcome-desc">
          Aprende a usar la página en pocos pasos: cómo iniciar sesión, registrarte,
          explorar productos y hacer tu pedido. ¡Solo toma un minuto!
        </p>
        <div class="tut-welcome-btns">
          <button class="tut-btn tut-btn-no" (click)="onNo()">
            <i class="fas fa-times"></i> No, gracias
          </button>
          <button class="tut-btn tut-btn-yes" (click)="onYes()">
            <i class="fas fa-graduation-cap"></i> ¡Sí, empezar!
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ OVERLAY ACTIVO ═══ -->
    <ng-container *ngIf="tutorial.isActive()">

      <!-- Spotlight hole (box-shadow dark overlay) -->
      <div class="tut-spotlight"
           *ngIf="spotlightRect() && currentStep()?.tooltipPos !== 'center'"
           [style.top.px]="spotlightRect()!.top"
           [style.left.px]="spotlightRect()!.left"
           [style.width.px]="spotlightRect()!.width"
           [style.height.px]="spotlightRect()!.height">
      </div>

      <!-- Full dark backdrop (when no spotlight OR center step) -->
      <div class="tut-dark-overlay"
           [class.tut-dark-full]="!spotlightRect() || currentStep()?.tooltipPos === 'center'">
      </div>

      <!-- ─── Tooltip card ─── -->
      <div class="tut-tooltip"
           [class.tut-tooltip-center]="currentStep()?.tooltipPos === 'center'"
           [style.top]="tooltipTop()"
           [style.left]="tooltipLeft()"
           [style.transform]="tooltipTransform()">

        <!-- Step badge -->
        <div class="tut-step-badge" *ngIf="currentStep()?.step">
          Paso {{ currentStep()!.step }}
        </div>

        <!-- Icon + title -->
        <div class="tut-tt-header">
          <span class="tut-tt-icon">{{ currentStep()?.icon }}</span>
          <h3 class="tut-tt-title">{{ currentStep()?.title }}</h3>
        </div>

        <!-- Description -->
        <p class="tut-tt-desc" [innerHTML]="formatDesc(currentStep()?.description)"></p>

        <!-- Arrow indicator (visual only, CSS-based) -->
        <div class="tut-arrow"
             *ngIf="spotlightRect() && currentStep()?.tooltipPos !== 'center'"
             [class.tut-arrow-down]="currentStep()?.tooltipPos === 'top'"
             [class.tut-arrow-up]="currentStep()?.tooltipPos === 'bottom'"
             [class.tut-arrow-right]="currentStep()?.tooltipPos === 'left'"
             [class.tut-arrow-left]="currentStep()?.tooltipPos === 'right'">
        </div>

        <!-- Progress dots -->
        <div class="tut-progress">
          <span *ngFor="let s of tutorial.steps; let i = index"
                class="tut-dot"
                [class.tut-dot-active]="i === tutorial.currentStepIndex()"
                [class.tut-dot-done]="i < tutorial.currentStepIndex()">
          </span>
        </div>

        <!-- Buttons -->
        <div class="tut-tt-btns">
          <button class="tut-btn tut-btn-skip" (click)="skip()">
            <i class="fas fa-times"></i> Saltar
          </button>
          <button class="tut-btn tut-btn-next" (click)="next()" [disabled]="navigating()">
            <i class="fas fa-spinner fa-spin" *ngIf="navigating()"></i>
            <i class="fas fa-arrow-right" *ngIf="!navigating()"></i>
            {{ navigating() ? 'Cargando...' : (currentStep()?.nextLabel || 'Siguiente →') }}
          </button>
        </div>
      </div>

    </ng-container>
  `,
  styles: [`
    /* ══════════════════════════════════════
       WELCOME MODAL
    ══════════════════════════════════════ */
    .tut-backdrop {
      position: fixed; inset: 0; z-index: 19000;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: tutFadeIn 0.3s ease;
    }
    @keyframes tutFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .tut-welcome-card {
      background: #fff;
      border-radius: 20px;
      padding: 36px 32px 28px;
      max-width: 420px; width: 100%;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      animation: tutSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes tutSlideUp {
      from { opacity: 0; transform: translateY(40px) scale(0.92); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .tut-welcome-icon {
      font-size: 3.5rem; line-height: 1; margin-bottom: 16px;
      animation: tutBounce 1s ease infinite alternate;
    }
    @keyframes tutBounce {
      from { transform: translateY(0); }
      to   { transform: translateY(-8px); }
    }

    .tut-welcome-title {
      font-size: 1.5rem; font-weight: 800;
      color: var(--mocca-bean, #3D1F0D); margin: 0 0 4px;
    }
    .tut-welcome-sub {
      font-size: 1.1rem; font-weight: 600;
      color: var(--warm-capuchino, #8B5E3C); margin: 0 0 14px;
    }
    .tut-welcome-desc {
      font-size: 0.88rem; color: #666; line-height: 1.6; margin-bottom: 24px;
    }
    .tut-welcome-btns {
      display: flex; gap: 10px; justify-content: center;
    }

    /* ══════════════════════════════════════
       BUTTONS
    ══════════════════════════════════════ */
    .tut-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 50px; border: none;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .tut-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .tut-btn-no {
      background: #f3f4f6; color: #666;
    }
    .tut-btn-no:hover { background: #e5e7eb; color: #333; }

    .tut-btn-yes {
      background: linear-gradient(135deg, var(--warm-capuchino, #8B5E3C), var(--caramel-roast, #5C3A1E));
      color: #fff;
      box-shadow: 0 4px 16px rgba(139,94,60,0.4);
    }
    .tut-btn-yes:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,94,60,0.5); }

    .tut-btn-skip {
      background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);
      border: 1.5px solid rgba(255,255,255,0.25);
    }
    .tut-btn-skip:hover { background: rgba(255,255,255,0.2); color: #fff; }

    .tut-btn-next {
      background: linear-gradient(135deg, var(--warm-capuchino, #8B5E3C), var(--caramel-roast, #5C3A1E));
      color: #fff; flex: 1;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3);
      justify-content: center;
    }
    .tut-btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(0,0,0,0.4); }

    /* ══════════════════════════════════════
       SPOTLIGHT OVERLAY
    ══════════════════════════════════════ */
    .tut-dark-overlay {
      position: fixed; inset: 0;
      z-index: 11000;
      background: transparent;
      pointer-events: none;
      /* When full-dark (center step) */
    }
    .tut-dark-full {
      background: rgba(0,0,0,0.78) !important;
      pointer-events: all;
    }

    .tut-spotlight {
      position: fixed;
      z-index: 11001;
      border-radius: 10px;
      box-shadow:
        0 0 0 9999px rgba(0,0,0,0.75),
        0 0 0 3px rgba(255,255,255,0.35),
        0 0 28px rgba(255,255,255,0.12);
      transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }

    /* ══════════════════════════════════════
       TOOLTIP CARD
    ══════════════════════════════════════ */
    .tut-tooltip {
      position: fixed;
      z-index: 12000;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 16px;
      padding: 20px 22px 16px;
      max-width: 320px; min-width: 260px;
      color: #fff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
      animation: tutTooltipIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: all;
    }
    @keyframes tutTooltipIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* Centered tooltip (full dark steps) */
    .tut-tooltip-center {
      top: 50% !important; left: 50% !important;
      transform: translate(-50%, -50%) !important;
      max-width: 380px;
    }

    .tut-step-badge {
      display: inline-flex; align-items: center;
      background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.75);
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
      text-transform: uppercase; padding: 3px 10px; border-radius: 50px;
      margin-bottom: 10px;
    }

    .tut-tt-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .tut-tt-icon { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }
    .tut-tt-title { font-size: 1.02rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.3; }

    .tut-tt-desc {
      font-size: 0.84rem; color: rgba(255,255,255,0.82);
      line-height: 1.6; margin: 0 0 14px;
    }

    /* ─── Arrow ─── */
    .tut-arrow {
      position: absolute; width: 0; height: 0;
    }
    .tut-arrow-down {
      bottom: -11px; left: 50%;
      border-left: 11px solid transparent;
      border-right: 11px solid transparent;
      border-top: 11px solid #0f3460;
      transform: translateX(-50%);
    }
    .tut-arrow-up {
      top: -11px; left: 50%;
      border-left: 11px solid transparent;
      border-right: 11px solid transparent;
      border-bottom: 11px solid #1a1a2e;
      transform: translateX(-50%);
    }
    .tut-arrow-right {
      right: -11px; top: 50%;
      border-top: 11px solid transparent;
      border-bottom: 11px solid transparent;
      border-left: 11px solid #0f3460;
      transform: translateY(-50%);
    }
    .tut-arrow-left {
      left: -11px; top: 50%;
      border-top: 11px solid transparent;
      border-bottom: 11px solid transparent;
      border-right: 11px solid #1a1a2e;
      transform: translateY(-50%);
    }

    /* ─── Progress dots ─── */
    .tut-progress {
      display: flex; gap: 5px; justify-content: center; margin-bottom: 14px;
    }
    .tut-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      transition: all 0.2s;
    }
    .tut-dot-active { background: #fff; transform: scale(1.3); }
    .tut-dot-done { background: rgba(255,255,255,0.55); }

    .tut-tt-btns {
      display: flex; gap: 8px;
    }

    /* ══════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════ */
    @media (max-width: 480px) {
      .tut-welcome-card { padding: 28px 20px 22px; }
      .tut-welcome-btns { flex-direction: column; }
      .tut-tooltip { max-width: calc(100vw - 32px); }
      .tut-tooltip-center { width: calc(100vw - 48px) !important; }
    }
  `]
})
export class TutorialComponent implements OnInit, OnDestroy {
  spotlightRect = signal<SpotlightRect | null>(null);
  tooltipTop    = signal<string>('50%');
  tooltipLeft   = signal<string>('50%');
  tooltipTransform = signal<string>('translate(-50%,-50%)');
  navigating    = signal(false);
  currentStep   = signal<TutorialStep | null>(null);

  private resizeObs?: ResizeObserver;
  private positionTimer?: any;

  constructor(
    public tutorial: TutorialService,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    // React to step changes
    effect(() => {
      const active = this.tutorial.isActive();
      const idx    = this.tutorial.currentStepIndex();
      if (active) {
        this.applyStep(idx);
      } else {
        this.clearSpotlight();
      }
    });
  }

  ngOnInit() {
    window.addEventListener('resize', this.onResize);
    this.tutorial.checkFirstVisit();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
    clearTimeout(this.positionTimer);
    this.resizeObs?.disconnect();
  }

  private onResize = () => {
    const idx = this.tutorial.currentStepIndex();
    if (this.tutorial.isActive()) this.positionForStep(idx);
  };

  private async applyStep(idx: number) {
    const step = this.tutorial.steps[idx];
    if (!step) return;
    this.currentStep.set(step);
    this.navigating.set(true);
    this.clearSpotlight();

    // Navigate if needed
    if (step.route) {
      const currentUrl = this.router.url.split('?')[0];
      if (currentUrl !== step.route) {
        await this.router.navigate([step.route]);
      }
    }

    // Wait for DOM to settle
    await this.wait(step.route ? 600 : 200);
    this.navigating.set(false);

    if (step.tooltipPos === 'center' || !step.selector) {
      this.clearSpotlight();
      this.tooltipTop.set('50%');
      this.tooltipLeft.set('50%');
      this.tooltipTransform.set('translate(-50%,-50%)');
      return;
    }

    this.positionForStep(idx);
  }

  private positionForStep(idx: number) {
    const step = this.tutorial.steps[idx];
    if (!step?.selector) return;

    const el = document.querySelector(step.selector) as HTMLElement;
    if (!el) {
      this.clearSpotlight();
      this.tooltipTop.set('50%');
      this.tooltipLeft.set('50%');
      this.tooltipTransform.set('translate(-50%,-50%)');
      return;
    }

    if (step.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const pad = step.padding ?? 12;
    const rect = el.getBoundingClientRect();

    this.spotlightRect.set({
      top:    rect.top    - pad,
      left:   rect.left   - pad,
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
    });

    this.placeTooltip(rect, step.tooltipPos ?? 'bottom', pad);
  }

  private placeTooltip(rect: DOMRect, pos: string, pad: number) {
    const TT_W = 320;
    const TT_H = 240;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 18;

    let top = '50%', left = '50%', transform = 'translate(-50%,-50%)';

    if (pos === 'top') {
      // tooltip above element
      const tTop = Math.max(12, rect.top - pad - TT_H - gap);
      const tLeft = Math.min(vw - TT_W - 12, Math.max(12, rect.left + rect.width / 2 - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
    } else if (pos === 'bottom') {
      const tTop = Math.min(vh - TT_H - 12, rect.bottom + pad + gap);
      const tLeft = Math.min(vw - TT_W - 12, Math.max(12, rect.left + rect.width / 2 - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
    } else if (pos === 'left') {
      const tTop = Math.min(vh - TT_H - 12, Math.max(12, rect.top + rect.height / 2 - TT_H / 2));
      const tLeft = Math.max(12, rect.left - pad - TT_W - gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
    } else if (pos === 'right') {
      const tTop = Math.min(vh - TT_H - 12, Math.max(12, rect.top + rect.height / 2 - TT_H / 2));
      const tLeft = Math.min(vw - TT_W - 12, rect.right + pad + gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
    this.tooltipTransform.set(transform);
  }

  private clearSpotlight() {
    this.spotlightRect.set(null);
  }

  private wait(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  formatDesc(desc?: string): string {
    if (!desc) return '';
    return desc.replace(/\n/g, '<br>');
  }

  onYes()  { this.tutorial.startTutorial(); }
  onNo()   { this.tutorial.dismissForever(); }

  onBackdropClick(e: MouseEvent) {
    // Don't close on backdrop click for welcome
  }

  async next() {
    const step = this.currentStep();
    if (!step) return;

    if (step.isFinal) {
      this.tutorial.completeTutorial();
      return;
    }

    this.tutorial.nextStep();
  }

  skip() {
    this.tutorial.dismissForever();
  }
}
