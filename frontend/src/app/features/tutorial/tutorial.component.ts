import {
  Component, OnInit, OnDestroy, signal, effect, computed, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutorialService, TutorialStep } from '../../core/services/tutorial.service';
import { AuthService } from '../../core/services/auth.service';

interface SpotlightRect {
  top: number; left: number; width: number; height: number;
}
interface ArrowPos {
  top: number; left: number;
  dir: 'up' | 'down' | 'left' | 'right';
}

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ═══ BIENVENIDA ═══ -->
    <div class="tut-backdrop" *ngIf="tutorial.showWelcome()">
      <div class="tut-welcome-card" (click)="$event.stopPropagation()">
        <div class="tut-welcome-icon">🎓</div>
        <h2 class="tut-welcome-title">¡Bienvenido a Star Crumbs!</h2>
        <p class="tut-welcome-sub">¿Quieres hacer el tutorial?</p>
        <p class="tut-welcome-desc">
          Aprende a usar la página en pocos pasos. ¡Solo toma un minuto!
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

    <!-- ═══ TUTORIAL ACTIVO ═══ -->
    <ng-container *ngIf="tutorial.isActive()">

      <!-- ── Overlay oscuro SOLO en pasos centrados (sin interacción) ── -->
      <div class="tut-dark-full-overlay"
           *ngIf="currentStep()?.tooltipPos === 'center' || !currentStep()?.selector">
      </div>

      <!-- ── Glow ring: resalta el elemento sin bloquear la pantalla ── -->
      <div class="tut-glow-ring"
           *ngIf="spotlightRect() && currentStep()?.tooltipPos !== 'center'"
           [style.top.px]="spotlightRect()!.top"
           [style.left.px]="spotlightRect()!.left"
           [style.width.px]="spotlightRect()!.width"
           [style.height.px]="spotlightRect()!.height">
      </div>

      <!-- ── Flecha animada apuntando al elemento ── -->
      <div *ngIf="arrowPos() && currentStep()?.tooltipPos !== 'center'"
           class="tut-arrow-pointer"
           [class.tut-arrow-anim-down]="arrowPos()!.dir === 'down'"
           [class.tut-arrow-anim-up]="arrowPos()!.dir === 'up'"
           [class.tut-arrow-anim-left]="arrowPos()!.dir === 'left'"
           [class.tut-arrow-anim-right]="arrowPos()!.dir === 'right'"
           [style.top.px]="arrowPos()!.top"
           [style.left.px]="arrowPos()!.left">
        <div class="tut-arr-shaft"></div>
        <div class="tut-arr-head"></div>
      </div>

      <!-- ── Tooltip flotante ── -->
      <div class="tut-tooltip"
           [class.tut-tooltip-center]="currentStep()?.tooltipPos === 'center'"
           [style.top]="tooltipTop()"
           [style.left]="tooltipLeft()"
           [style.transform]="tooltipTransform()">

        <div class="tut-step-badge" *ngIf="currentStep()?.step">
          Paso {{ currentStep()!.step }}
        </div>

        <div class="tut-tt-header">
          <span class="tut-tt-icon">{{ currentStep()?.icon }}</span>
          <h3 class="tut-tt-title">{{ currentStep()?.title }}</h3>
        </div>

        <p class="tut-tt-desc" [innerHTML]="formatDesc(currentStep()?.description)"></p>

        <!-- Progress dots -->
        <div class="tut-progress">
          <span *ngFor="let s of tutorial.steps; let i = index"
                class="tut-dot"
                [class.tut-dot-active]="i === tutorial.currentStepIndex()"
                [class.tut-dot-done]="i < tutorial.currentStepIndex()">
          </span>
        </div>

        <div class="tut-tt-btns">
          <button class="tut-btn tut-btn-skip" (click)="skip()">
            <i class="fas fa-times"></i> Saltar
          </button>
          <button class="tut-btn tut-btn-next"
                  (click)="next()"
                  [disabled]="navigating()">
            <i class="fas fa-spinner fa-spin" *ngIf="navigating()"></i>
            <i class="fas fa-arrow-right" *ngIf="!navigating()"></i>
            {{ navigating() ? 'Cargando...' : (currentStep()?.nextLabel || 'Siguiente →') }}
          </button>
        </div>
      </div>

    </ng-container>
  `,
  styles: [`
    /* ══════════ WELCOME ══════════ */
    .tut-backdrop {
      position: fixed; inset: 0; z-index: 19000;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: tutFadeIn 0.3s ease;
    }
    @keyframes tutFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .tut-welcome-card {
      background: #fff; border-radius: 20px; padding: 36px 32px 28px;
      max-width: 420px; width: 100%; text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      animation: tutSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes tutSlideUp {
      from { opacity: 0; transform: translateY(40px) scale(0.92); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .tut-welcome-icon {
      font-size: 3.5rem; line-height: 1; margin-bottom: 16px;
      animation: tutBounce 1s ease infinite alternate;
    }
    @keyframes tutBounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
    .tut-welcome-title { font-size: 1.5rem; font-weight: 800; color: var(--mocca-bean,#3D1F0D); margin: 0 0 4px; }
    .tut-welcome-sub   { font-size: 1.1rem; font-weight: 600; color: var(--warm-capuchino,#8B5E3C); margin: 0 0 12px; }
    .tut-welcome-desc  { font-size: 0.88rem; color: #666; line-height: 1.6; margin-bottom: 24px; }
    .tut-welcome-btns  { display: flex; gap: 10px; justify-content: center; }

    /* ══════════ BUTTONS ══════════ */
    .tut-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 50px; border: none;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .tut-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .tut-btn-no  { background: #f3f4f6; color: #666; }
    .tut-btn-no:hover { background: #e5e7eb; color: #333; }
    .tut-btn-yes {
      background: linear-gradient(135deg, var(--warm-capuchino,#8B5E3C), var(--caramel-roast,#5C3A1E));
      color: #fff; box-shadow: 0 4px 16px rgba(139,94,60,0.4);
    }
    .tut-btn-yes:hover { transform: translateY(-1px); }
    .tut-btn-skip {
      background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);
      border: 1.5px solid rgba(255,255,255,0.25);
    }
    .tut-btn-skip:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .tut-btn-next {
      background: linear-gradient(135deg, var(--warm-capuchino,#8B5E3C), var(--caramel-roast,#5C3A1E));
      color: #fff; flex: 1; justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3);
    }
    .tut-btn-next:hover:not(:disabled) { transform: translateY(-1px); }

    /* ══════════ OVERLAY OSCURO (solo pasos center) ══════════ */
    .tut-dark-full-overlay {
      position: fixed; inset: 0; z-index: 11000;
      background: rgba(0,0,0,0.82);
      pointer-events: all;
    }

    /* ══════════ GLOW RING (indicador visual, no bloquea) ══════════ */
    .tut-glow-ring {
      position: fixed; z-index: 13001;
      border-radius: 10px;
      pointer-events: none;
      border: 2.5px solid rgba(255,255,255,0.85);
      box-shadow:
        0 0 0 4px rgba(255,220,80,0.25),
        0 0 24px 6px rgba(255,255,255,0.3),
        0 0 60px 12px rgba(255,220,100,0.2);
      animation: glowPulse 1.8s ease-in-out infinite;
    }
    @keyframes glowPulse {
      0%,100% {
        border-color: rgba(255,255,255,0.65);
        box-shadow: 0 0 0 3px rgba(255,220,80,0.15), 0 0 18px 4px rgba(255,255,255,0.2), 0 0 45px 8px rgba(255,220,100,0.12);
      }
      50% {
        border-color: rgba(255,255,255,1);
        box-shadow: 0 0 0 5px rgba(255,220,80,0.35), 0 0 32px 8px rgba(255,255,255,0.45), 0 0 80px 18px rgba(255,220,100,0.3);
      }
    }

    /* ══════════ FLECHA ANIMADA ══════════ */
    .tut-arrow-pointer {
      position: fixed; z-index: 13002;
      pointer-events: none;
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
    }
    .tut-arr-shaft { background: linear-gradient(135deg,#FFE066,#FFB800); border-radius: 4px; }
    .tut-arr-head  { width: 0; height: 0; flex-shrink: 0; }

    /* Down */
    .tut-arrow-anim-down { flex-direction: column; animation: arrowBounceDown 0.75s ease-in-out infinite alternate; }
    .tut-arrow-anim-down .tut-arr-shaft { width: 8px; height: 38px; }
    .tut-arrow-anim-down .tut-arr-head  { border-left: 13px solid transparent; border-right: 13px solid transparent; border-top: 20px solid #FFB800; }
    @keyframes arrowBounceDown { from { transform: translateY(-5px); } to { transform: translateY(4px); } }

    /* Up */
    .tut-arrow-anim-up { flex-direction: column-reverse; animation: arrowBounceUp 0.75s ease-in-out infinite alternate; }
    .tut-arrow-anim-up .tut-arr-shaft { width: 8px; height: 38px; }
    .tut-arrow-anim-up .tut-arr-head  { border-left: 13px solid transparent; border-right: 13px solid transparent; border-bottom: 20px solid #FFB800; }
    @keyframes arrowBounceUp { from { transform: translateY(5px); } to { transform: translateY(-4px); } }

    /* Left */
    .tut-arrow-anim-left { flex-direction: row-reverse; animation: arrowBounceLeft 0.75s ease-in-out infinite alternate; }
    .tut-arrow-anim-left .tut-arr-shaft { height: 8px; width: 38px; }
    .tut-arrow-anim-left .tut-arr-head  { border-top: 13px solid transparent; border-bottom: 13px solid transparent; border-right: 20px solid #FFB800; }
    @keyframes arrowBounceLeft { from { transform: translateX(5px); } to { transform: translateX(-4px); } }

    /* Right */
    .tut-arrow-anim-right { flex-direction: row; animation: arrowBounceRight 0.75s ease-in-out infinite alternate; }
    .tut-arrow-anim-right .tut-arr-shaft { height: 8px; width: 38px; }
    .tut-arrow-anim-right .tut-arr-head  { border-top: 13px solid transparent; border-bottom: 13px solid transparent; border-left: 20px solid #FFB800; }
    @keyframes arrowBounceRight { from { transform: translateX(-5px); } to { transform: translateX(4px); } }

    /* ══════════ TOOLTIP ══════════ */
    .tut-tooltip {
      position: fixed; z-index: 13003;
      background: linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);
      border-radius: 16px; padding: 20px 22px 16px;
      max-width: 320px; min-width: 260px; color: #fff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
      animation: tooltipIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: all;
    }
    @keyframes tooltipIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
    .tut-tooltip-center { max-width: 380px !important; }

    .tut-step-badge {
      display: inline-block; font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: rgba(255,220,80,0.9); background: rgba(255,220,80,0.12);
      border: 1px solid rgba(255,220,80,0.3);
      border-radius: 20px; padding: 2px 10px; margin-bottom: 10px;
    }
    .tut-tt-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .tut-tt-icon  { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }
    .tut-tt-title { font-size: 1.02rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.3; }
    .tut-tt-desc  { font-size: 0.84rem; color: rgba(255,255,255,0.85); line-height: 1.65; margin: 0 0 14px; }
    .tut-tt-desc strong { color: #FFE066; }

    .tut-progress { display: flex; gap: 5px; justify-content: center; margin-bottom: 14px; }
    .tut-dot       { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: all 0.2s; }
    .tut-dot-active { background: #fff; transform: scale(1.3); }
    .tut-dot-done   { background: rgba(255,255,255,0.55); }

    .tut-tt-btns { display: flex; gap: 8px; }

    @media (max-width: 480px) {
      .tut-welcome-card { padding: 28px 20px 22px; }
      .tut-welcome-btns { flex-direction: column; }
      .tut-tooltip { max-width: calc(100vw - 32px); }
      .tut-tooltip-center { width: calc(100vw - 40px) !important; }
    }
  `]
})
export class TutorialComponent implements OnInit, OnDestroy {
  spotlightRect    = signal<SpotlightRect | null>(null);
  tooltipTop       = signal<string>('50%');
  tooltipLeft      = signal<string>('50%');
  tooltipTransform = signal<string>('translate(-50%,-50%)');
  navigating       = signal(false);
  arrowPos         = signal<ArrowPos | null>(null);

  currentStep = computed<TutorialStep | null>(
    () => this.tutorial.steps[this.tutorial.currentStepIndex()] ?? null
  );

  private targetClickHandler?: () => void;

  constructor(
    public tutorial: TutorialService,
    private router: Router,
    private auth: AuthService,
    private zone: NgZone,
  ) {
    effect(() => {
      const active = this.tutorial.isActive();
      const idx    = this.tutorial.currentStepIndex();
      if (active) {
        this.applyStep(idx);
      } else {
        this.clearStep();
      }
    });
  }

  ngOnInit() {
    window.addEventListener('resize', this.onResize);
    this.tutorial.checkFirstVisit();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.clearStep();
  }

  private onResize = () => {
    if (this.tutorial.isActive()) this.positionForStep(this.tutorial.currentStepIndex());
  };

  private async applyStep(idx: number) {
    const step = this.tutorial.steps[idx];
    if (!step) return;

    this.clearStep();
    this.navigating.set(true);

    if (step.route) {
      const cur = this.router.url.split('?')[0];
      if (cur !== step.route) await this.router.navigate([step.route]);
    }

    await this.wait(step.route ? 650 : 250);
    this.navigating.set(false);

    if (step.tooltipPos === 'center' || !step.selector) {
      this.spotlightRect.set(null);
      this.arrowPos.set(null);
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
      // Elemento no encontrado: tooltip centrado, sin glow
      this.spotlightRect.set(null);
      this.arrowPos.set(null);
      this.tooltipTop.set('50%');
      this.tooltipLeft.set('50%');
      this.tooltipTransform.set('translate(-50%,-50%)');
      return;
    }

    if (step.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Registrar click listener: avanza el tutorial cuando el usuario presiona el elemento
    this.registerClickListener(el);

    const pad  = step.padding ?? 12;
    const rect = el.getBoundingClientRect();

    this.spotlightRect.set({
      top:    rect.top    - pad,
      left:   rect.left   - pad,
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
    });

    this.placeTooltipAndArrow(rect, step.tooltipPos ?? 'bottom', pad);
  }

  private registerClickListener(el: HTMLElement) {
    const handler = () => {
      this.zone.run(() => setTimeout(() => this.tutorial.nextStep(), 150));
    };
    el.addEventListener('click', handler, { once: true });
    this.targetClickHandler = () => el.removeEventListener('click', handler);
  }

  private clearStep() {
    if (this.targetClickHandler) {
      this.targetClickHandler();
      this.targetClickHandler = undefined;
    }
    this.spotlightRect.set(null);
    this.arrowPos.set(null);
  }

  private placeTooltipAndArrow(rect: DOMRect, pos: string, pad: number) {
    const TT_W = 320, TT_H = 260;
    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = 20;
    const ARR = 66; // tamaño total flecha

    let top = '50%', left = '50%', transform = 'translate(-50%,-50%)';
    let aTop = 0, aLeft = 0, aDir: ArrowPos['dir'] = 'down';
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    if (pos === 'top') {
      const tTop  = Math.max(8, rect.top - pad - TT_H - gap);
      const tLeft = Math.min(vw - TT_W - 8, Math.max(8, cx - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'down'; aTop = rect.top - pad - ARR - 6; aLeft = cx - 14;
    } else if (pos === 'bottom') {
      const tTop  = Math.min(vh - TT_H - 8, rect.bottom + pad + gap);
      const tLeft = Math.min(vw - TT_W - 8, Math.max(8, cx - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'up'; aTop = rect.bottom + pad + 6; aLeft = cx - 14;
    } else if (pos === 'left') {
      const tTop  = Math.min(vh - TT_H - 8, Math.max(8, cy - TT_H / 2));
      const tLeft = Math.max(8, rect.left - pad - TT_W - gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'right'; aTop = cy - 14; aLeft = rect.left - pad - ARR - 6;
    } else if (pos === 'right') {
      const tTop  = Math.min(vh - TT_H - 8, Math.max(8, cy - TT_H / 2));
      const tLeft = Math.min(vw - TT_W - 8, rect.right + pad + gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'left'; aTop = cy - 14; aLeft = rect.right + pad + 6;
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
    this.tooltipTransform.set(transform);
    this.arrowPos.set({ top: aTop, left: aLeft, dir: aDir });
  }

  private wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  formatDesc(desc?: string): string {
    if (!desc) return '';
    return desc.replace(/\n/g, '<br>');
  }

  onYes() { this.tutorial.startTutorial(); }
  onNo()  { this.tutorial.dismissForever(); }

  async next() {
    if (this.navigating()) return;
    const step = this.currentStep();
    if (!step) return;
    if (step.isFinal) { this.tutorial.completeTutorial(); return; }
    this.tutorial.nextStep();
  }

  skip() { this.tutorial.dismissForever(); }
}
