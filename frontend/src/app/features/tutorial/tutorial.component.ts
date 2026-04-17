import {
  Component, OnInit, OnDestroy, signal, effect, computed, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutorialService, TutorialStep } from '../../core/services/tutorial.service';
import { AuthService } from '../../core/services/auth.service';

interface SpotlightRect { top: number; left: number; width: number; height: number; }
interface ArrowPos      { top: number; left: number; dir: 'up' | 'down' | 'left' | 'right'; }

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
          En cada paso verás resaltado exactamente qué botón presionar.
          ¡La pantalla queda libre para que puedas interactuar!
        </p>
        <div class="tut-welcome-btns">
          <button class="tut-btn tut-btn-no"  (click)="onNo()">
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

      <!-- Overlay oscuro solo en pasos center (sin botón que presionar) -->
      <div class="tut-overlay-center"
           *ngIf="!currentStep()?.selector || currentStep()?.tooltipPos === 'center'">
      </div>

      <!-- Glow ring sobre el elemento objetivo (no bloquea clicks) -->
      <div class="tut-glow-ring"
           *ngIf="spotlightRect()"
           [style.top.px]="spotlightRect()!.top"
           [style.left.px]="spotlightRect()!.left"
           [style.width.px]="spotlightRect()!.width"
           [style.height.px]="spotlightRect()!.height">
      </div>

      <!-- Flecha animada apuntando al elemento -->
      <div *ngIf="arrowPos()"
           class="tut-arrow"
           [class.arr-down]="arrowPos()!.dir==='down'"
           [class.arr-up]="arrowPos()!.dir==='up'"
           [class.arr-left]="arrowPos()!.dir==='left'"
           [class.arr-right]="arrowPos()!.dir==='right'"
           [style.top.px]="arrowPos()!.top"
           [style.left.px]="arrowPos()!.left">
        <div class="arr-shaft"></div>
        <div class="arr-head"></div>
      </div>

      <!-- Tooltip flotante -->
      <div class="tut-tooltip"
           [class.tut-center]="!currentStep()?.selector || currentStep()?.tooltipPos==='center'"
           [style.top]="tooltipTop()"
           [style.left]="tooltipLeft()"
           [style.transform]="tooltipTransform()">

        <div class="tut-badge" *ngIf="currentStep()?.step">
          Paso {{ currentStep()!.step }} de {{ totalVisibleSteps }}
        </div>

        <div class="tut-head">
          <span class="tut-icon">{{ currentStep()?.icon }}</span>
          <h3 class="tut-title">{{ currentStep()?.title }}</h3>
        </div>

        <p class="tut-desc" [innerHTML]="formatDesc(currentStep()?.description)"></p>

        <!-- Progress dots -->
        <div class="tut-dots">
          <span *ngFor="let s of tutorial.steps; let i = index"
                class="dot"
                [class.dot-active]="i === tutorial.currentStepIndex()"
                [class.dot-done]="i < tutorial.currentStepIndex()">
          </span>
        </div>

        <div class="tut-btns">
          <button class="tut-btn tut-skip" (click)="skip()">
            <i class="fas fa-times"></i> Saltar
          </button>
          <button class="tut-btn tut-next" (click)="next()" [disabled]="navigating()">
            <i class="fas fa-spinner fa-spin" *ngIf="navigating()"></i>
            <i class="fas fa-arrow-right"    *ngIf="!navigating()"></i>
            {{ navigating() ? 'Cargando...' : (currentStep()?.nextLabel || 'Siguiente →') }}
          </button>
        </div>
      </div>

    </ng-container>
  `,
  styles: [`
    /* ─── Welcome ─────────────────────────────────────────── */
    .tut-backdrop {
      position: fixed; inset: 0; z-index: 19000;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn .3s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

    .tut-welcome-card {
      background:#fff; border-radius:20px; padding:36px 32px 28px;
      max-width:420px; width:100%; text-align:center;
      box-shadow:0 24px 80px rgba(0,0,0,.3);
      animation:slideUp .4s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes slideUp {
      from{opacity:0;transform:translateY(40px) scale(.92)}
      to  {opacity:1;transform:translateY(0)    scale(1)  }
    }
    .tut-welcome-icon {
      font-size:3.5rem; margin-bottom:16px; display:block;
      animation:bounce 1s ease infinite alternate;
    }
    @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }
    .tut-welcome-title { font-size:1.5rem; font-weight:800; color:var(--mocca-bean,#3D1F0D); margin:0 0 4px; }
    .tut-welcome-sub   { font-size:1.1rem; font-weight:600; color:var(--warm-capuchino,#8B5E3C); margin:0 0 12px; }
    .tut-welcome-desc  { font-size:.88rem; color:#666; line-height:1.6; margin-bottom:24px; }
    .tut-welcome-btns  { display:flex; gap:10px; justify-content:center; }

    /* ─── Buttons ─────────────────────────────────────────── */
    .tut-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:50px; border:none;
      font-size:.88rem; font-weight:700; cursor:pointer;
      transition:all .2s; white-space:nowrap;
    }
    .tut-btn:disabled { opacity:.6; cursor:not-allowed; }
    .tut-btn-no  { background:#f3f4f6; color:#666; }
    .tut-btn-no:hover  { background:#e5e7eb; color:#333; }
    .tut-btn-yes {
      background:linear-gradient(135deg,var(--warm-capuchino,#8B5E3C),var(--caramel-roast,#5C3A1E));
      color:#fff; box-shadow:0 4px 16px rgba(139,94,60,.4);
    }
    .tut-btn-yes:hover { transform:translateY(-1px); }
    .tut-skip {
      background:rgba(255,255,255,.12); color:rgba(255,255,255,.8);
      border:1.5px solid rgba(255,255,255,.25);
    }
    .tut-skip:hover { background:rgba(255,255,255,.2); color:#fff; }
    .tut-next {
      background:linear-gradient(135deg,var(--warm-capuchino,#8B5E3C),var(--caramel-roast,#5C3A1E));
      color:#fff; flex:1; justify-content:center;
      box-shadow:0 3px 12px rgba(0,0,0,.3);
    }
    .tut-next:hover:not(:disabled) { transform:translateY(-1px); }

    /* ─── Overlay (solo pasos center) ────────────────────── */
    .tut-overlay-center {
      position:fixed; inset:0; z-index:11000;
      background:rgba(0,0,0,.82);
      pointer-events:all;
    }

    /* ─── Glow ring ───────────────────────────────────────── */
    .tut-glow-ring {
      position:fixed; z-index:13001;
      border-radius:10px;
      pointer-events:none;
      border:2.5px solid rgba(255,255,255,.85);
      box-shadow:
        0 0 0 4px rgba(255,220,80,.2),
        0 0 24px 6px rgba(255,255,255,.3),
        0 0 60px 14px rgba(255,200,50,.2);
      animation:glow 1.8s ease-in-out infinite;
    }
    @keyframes glow {
      0%,100% {
        border-color:rgba(255,255,255,.6);
        box-shadow:0 0 0 3px rgba(255,220,80,.12),0 0 18px 4px rgba(255,255,255,.2),0 0 45px 8px rgba(255,200,50,.12);
      }
      50% {
        border-color:rgba(255,255,255,1);
        box-shadow:0 0 0 5px rgba(255,220,80,.35),0 0 32px 8px rgba(255,255,255,.45),0 0 80px 20px rgba(255,200,50,.3);
      }
    }

    /* ─── Arrow ───────────────────────────────────────────── */
    .tut-arrow {
      position:fixed; z-index:13002; pointer-events:none;
      display:flex; align-items:center; justify-content:center;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,.5));
    }
    .arr-shaft { background:linear-gradient(135deg,#FFE066,#FFB800); border-radius:4px; }
    .arr-head  { width:0; height:0; flex-shrink:0; }

    .arr-down { flex-direction:column; animation:bDown .75s ease-in-out infinite alternate; }
    .arr-down .arr-shaft { width:8px; height:36px; }
    .arr-down .arr-head  { border-left:13px solid transparent; border-right:13px solid transparent; border-top:20px solid #FFB800; }
    @keyframes bDown { from{transform:translateY(-5px)} to{transform:translateY(4px)} }

    .arr-up { flex-direction:column-reverse; animation:bUp .75s ease-in-out infinite alternate; }
    .arr-up .arr-shaft { width:8px; height:36px; }
    .arr-up .arr-head  { border-left:13px solid transparent; border-right:13px solid transparent; border-bottom:20px solid #FFB800; }
    @keyframes bUp { from{transform:translateY(5px)} to{transform:translateY(-4px)} }

    .arr-left { flex-direction:row-reverse; animation:bLeft .75s ease-in-out infinite alternate; }
    .arr-left .arr-shaft { height:8px; width:36px; }
    .arr-left .arr-head  { border-top:13px solid transparent; border-bottom:13px solid transparent; border-right:20px solid #FFB800; }
    @keyframes bLeft { from{transform:translateX(5px)} to{transform:translateX(-4px)} }

    .arr-right { flex-direction:row; animation:bRight .75s ease-in-out infinite alternate; }
    .arr-right .arr-shaft { height:8px; width:36px; }
    .arr-right .arr-head  { border-top:13px solid transparent; border-bottom:13px solid transparent; border-left:20px solid #FFB800; }
    @keyframes bRight { from{transform:translateX(-5px)} to{transform:translateX(4px)} }

    /* ─── Tooltip ─────────────────────────────────────────── */
    .tut-tooltip {
      position:fixed; z-index:13003; pointer-events:all;
      background:linear-gradient(135deg,#1a1a2e,#16213e 50%,#0f3460);
      border-radius:16px; padding:20px 22px 16px;
      max-width:320px; min-width:260px; color:#fff;
      box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.1);
      animation:ttIn .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes ttIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
    .tut-center { max-width:390px !important; }

    .tut-badge {
      display:inline-block; font-size:.68rem; font-weight:800;
      text-transform:uppercase; letter-spacing:.08em;
      color:rgba(255,220,80,.9); background:rgba(255,220,80,.1);
      border:1px solid rgba(255,220,80,.3);
      border-radius:20px; padding:2px 10px; margin-bottom:10px;
    }
    .tut-head  { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .tut-icon  { font-size:1.6rem; flex-shrink:0; }
    .tut-title { font-size:1rem; font-weight:700; color:#fff; margin:0; line-height:1.3; }
    .tut-desc  { font-size:.84rem; color:rgba(255,255,255,.85); line-height:1.65; margin:0 0 14px; }
    .tut-desc strong { color:#FFE066; }

    .tut-dots { display:flex; gap:5px; justify-content:center; margin-bottom:14px; }
    .dot       { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.25); transition:all .2s; }
    .dot-active { background:#fff; transform:scale(1.3); }
    .dot-done   { background:rgba(255,255,255,.55); }

    .tut-btns { display:flex; gap:8px; }

    @media (max-width:480px) {
      .tut-welcome-card { padding:28px 20px 22px; }
      .tut-welcome-btns { flex-direction:column; }
      .tut-tooltip { max-width:calc(100vw - 32px); }
      .tut-center  { width:calc(100vw - 40px) !important; }
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

  /** Número de pasos con badge visible (excluye welcome y complete) */
  get totalVisibleSteps() {
    return this.tutorial.steps.filter(s => s.step).length;
  }

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

    // Navegar a la ruta del paso si es necesario
    if (step.route) {
      const cur = this.router.url.split('?')[0];
      if (cur !== step.route) await this.router.navigate([step.route]);
    }

    // Esperar a que el DOM se estabilice
    const delay = step.route ? 700 : 200;
    await this.wait(delay);
    this.navigating.set(false);

    if (!step.selector || step.tooltipPos === 'center') {
      // Paso sin elemento concreto → tooltip centrado, overlay oscuro
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

    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      // Elemento no encontrado: tooltip centrado sin glow
      this.spotlightRect.set(null);
      this.arrowPos.set(null);
      this.tooltipTop.set('50%');
      this.tooltipLeft.set('50%');
      this.tooltipTransform.set('translate(-50%,-50%)');
      return;
    }

    if (step.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Click listener: cuando el usuario presiona el elemento resaltado → avanza el tutorial
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
      this.zone.run(() => setTimeout(() => this.tutorial.nextStep(), 180));
    };
    el.addEventListener('click', handler, { once: true });
    this.targetClickHandler = () => el.removeEventListener('click', handler);
  }

  private clearStep() {
    this.targetClickHandler?.();
    this.targetClickHandler = undefined;
    this.spotlightRect.set(null);
    this.arrowPos.set(null);
  }

  private placeTooltipAndArrow(rect: DOMRect, pos: string, pad: number) {
    const TT_W = 320, TT_H = 260;
    const vw = window.innerWidth, vh = window.innerHeight;
    const GAP = 20, ARR = 64;
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    let top = '50%', left = '50%', transform = 'translate(-50%,-50%)';
    let aTop = 0, aLeft = 0, aDir: ArrowPos['dir'] = 'down';

    if (pos === 'top') {
      const tTop  = Math.max(8, rect.top - pad - TT_H - GAP);
      const tLeft = Math.min(vw - TT_W - 8, Math.max(8, cx - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'down'; aTop = rect.top - pad - ARR - 4; aLeft = cx - 14;
    } else if (pos === 'bottom') {
      const tTop  = Math.min(vh - TT_H - 8, rect.bottom + pad + GAP);
      const tLeft = Math.min(vw - TT_W - 8, Math.max(8, cx - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'up'; aTop = rect.bottom + pad + 4; aLeft = cx - 14;
    } else if (pos === 'left') {
      const tTop  = Math.min(vh - TT_H - 8, Math.max(8, cy - TT_H / 2));
      const tLeft = Math.max(8, rect.left - pad - TT_W - GAP);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'right'; aTop = cy - 14; aLeft = rect.left - pad - ARR - 4;
    } else if (pos === 'right') {
      const tTop  = Math.min(vh - TT_H - 8, Math.max(8, cy - TT_H / 2));
      const tLeft = Math.min(vw - TT_W - 8, rect.right + pad + GAP);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      aDir = 'left'; aTop = cy - 14; aLeft = rect.right + pad + 4;
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
    this.tooltipTransform.set(transform);
    this.arrowPos.set({ top: aTop, left: aLeft, dir: aDir });
  }

  private wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  formatDesc(desc?: string): string {
    return desc ? desc.replace(/\n/g, '<br>') : '';
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
