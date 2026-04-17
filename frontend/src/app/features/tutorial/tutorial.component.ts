import {
  Component, OnInit, OnDestroy, signal, effect, computed,
  ChangeDetectorRef, NgZone
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

interface SavedStyle {
  el: HTMLElement;
  position: string;
  zIndex: string;
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
          Aprende a usar la página en pocos pasos: cómo iniciar sesión,
          registrarte, explorar productos y hacer tu pedido. ¡Solo toma un minuto!
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

      <!-- ── Spotlight mode: 4 dark panels + elevated element ── -->
      <ng-container *ngIf="spotlightRect() && currentStep()?.tooltipPos !== 'center'; else fullDark">

        <!-- Panel superior -->
        <div class="tut-panel"
             [style.top.px]="0" [style.left.px]="0" [style.right.px]="0"
             [style.height.px]="spotlightRect()!.top">
        </div>
        <!-- Panel inferior -->
        <div class="tut-panel"
             [style.top.px]="spotlightRect()!.top + spotlightRect()!.height"
             [style.left.px]="0" [style.right.px]="0" [style.bottom.px]="0">
        </div>
        <!-- Panel izquierdo -->
        <div class="tut-panel"
             [style.top.px]="spotlightRect()!.top"
             [style.left.px]="0"
             [style.width.px]="spotlightRect()!.left"
             [style.height.px]="spotlightRect()!.height">
        </div>
        <!-- Panel derecho -->
        <div class="tut-panel"
             [style.top.px]="spotlightRect()!.top"
             [style.left.px]="spotlightRect()!.left + spotlightRect()!.width"
             [style.right.px]="0"
             [style.height.px]="spotlightRect()!.height">
        </div>

        <!-- Glow ring (solo visual, no intercepta clicks) -->
        <div class="tut-glow-ring"
             [style.top.px]="spotlightRect()!.top"
             [style.left.px]="spotlightRect()!.left"
             [style.width.px]="spotlightRect()!.width"
             [style.height.px]="spotlightRect()!.height">
        </div>

        <!-- ── FLECHA ANIMADA apuntando al elemento ── -->
        <div *ngIf="arrowPos()"
             class="tut-arrow-pointer"
             [class.tut-arrow-down]="arrowPos()!.dir === 'down'"
             [class.tut-arrow-up]="arrowPos()!.dir === 'up'"
             [class.tut-arrow-left]="arrowPos()!.dir === 'left'"
             [class.tut-arrow-right]="arrowPos()!.dir === 'right'"
             [style.top.px]="arrowPos()!.top"
             [style.left.px]="arrowPos()!.left">
          <div class="tut-arrow-shaft"></div>
          <div class="tut-arrow-head"></div>
        </div>

      </ng-container>

      <!-- Oscuro completo para pasos center -->
      <ng-template #fullDark>
        <div class="tut-dark-full-overlay"></div>
      </ng-template>

      <!-- ── Tooltip card ── -->
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

        <!-- Indicador de "debes hacer clic" cuando hay selector -->
        <div class="tut-action-required" *ngIf="requiresClick()">
          <i class="fas fa-hand-pointer"></i>
          <span>Haz clic en el botón resaltado para continuar</span>
        </div>

        <!-- Progress dots -->
        <div class="tut-progress">
          <span *ngFor="let s of tutorial.steps; let i = index"
                class="tut-dot"
                [class.tut-dot-active]="i === tutorial.currentStepIndex()"
                [class.tut-dot-done]="i < tutorial.currentStepIndex()">
          </span>
        </div>

        <!-- Botones: solo Saltar + Siguiente cuando NO hay elemento que presionar -->
        <div class="tut-tt-btns">
          <button class="tut-btn tut-btn-skip" (click)="skip()">
            <i class="fas fa-times"></i> Saltar
          </button>
          <!-- Siguiente solo aparece en pasos sin selector (center) -->
          <button *ngIf="!requiresClick()"
                  class="tut-btn tut-btn-next"
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
    /* ══════════════════════════════════════
       WELCOME MODAL
    ══════════════════════════════════════ */
    .tut-backdrop {
      position: fixed; inset: 0; z-index: 19000;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: tutFadeIn 0.3s ease;
    }
    @keyframes tutFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .tut-welcome-card {
      background: #fff; border-radius: 20px;
      padding: 36px 32px 28px; max-width: 420px; width: 100%;
      text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,0.3);
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
    .tut-welcome-sub   { font-size: 1.1rem; font-weight: 600; color: var(--warm-capuchino,#8B5E3C); margin: 0 0 14px; }
    .tut-welcome-desc  { font-size: 0.88rem; color: #666; line-height: 1.6; margin-bottom: 24px; }
    .tut-welcome-btns  { display: flex; gap: 10px; justify-content: center; }

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
    .tut-btn-no { background: #f3f4f6; color: #666; }
    .tut-btn-no:hover { background: #e5e7eb; color: #333; }
    .tut-btn-yes {
      background: linear-gradient(135deg, var(--warm-capuchino,#8B5E3C), var(--caramel-roast,#5C3A1E));
      color: #fff; box-shadow: 0 4px 16px rgba(139,94,60,0.4);
    }
    .tut-btn-yes:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,94,60,0.5); }
    .tut-btn-skip {
      background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8);
      border: 1.5px solid rgba(255,255,255,0.25);
    }
    .tut-btn-skip:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .tut-btn-next {
      background: linear-gradient(135deg, var(--warm-capuchino,#8B5E3C), var(--caramel-roast,#5C3A1E));
      color: #fff; flex: 1; box-shadow: 0 3px 12px rgba(0,0,0,0.3);
      justify-content: center;
    }
    .tut-btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(0,0,0,0.4); }

    /* ══════════════════════════════════════
       4 PANELES — fondo oscuro real
    ══════════════════════════════════════ */
    .tut-panel {
      position: fixed; z-index: 10000;
      background: rgba(0,0,0,0.82);
      pointer-events: all;
      transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .tut-dark-full-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.82);
      pointer-events: all;
    }

    /* ══════════════════════════════════════
       GLOW RING (solo visual)
    ══════════════════════════════════════ */
    .tut-glow-ring {
      position: fixed; z-index: 13001;
      border-radius: 10px;
      pointer-events: none;
      border: 2.5px solid rgba(255,255,255,0.8);
      box-shadow:
        0 0 22px 5px rgba(255,255,255,0.28),
        0 0 55px 10px rgba(255,220,100,0.18);
      animation: glowPulse 1.8s ease-in-out infinite;
    }
    @keyframes glowPulse {
      0%,100% {
        border-color: rgba(255,255,255,0.6);
        box-shadow: 0 0 16px 3px rgba(255,255,255,0.2), 0 0 40px 6px rgba(255,220,100,0.1);
      }
      50% {
        border-color: rgba(255,255,255,1);
        box-shadow: 0 0 30px 8px rgba(255,255,255,0.42), 0 0 75px 16px rgba(255,220,100,0.28);
      }
    }

    /* ══════════════════════════════════════
       FLECHA ANIMADA
    ══════════════════════════════════════ */
    .tut-arrow-pointer {
      position: fixed;
      z-index: 13002;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
    }

    /* La flecha es un conjunto: shaft (cuerpo) + head (punta) */
    .tut-arrow-shaft {
      background: linear-gradient(135deg, #FFE066, #FFB800);
      border-radius: 4px;
    }
    .tut-arrow-head {
      width: 0; height: 0;
      flex-shrink: 0;
    }

    /* ─── DOWN ─── */
    .tut-arrow-down {
      flex-direction: column;
      animation: bounceDown 0.8s ease-in-out infinite alternate;
    }
    .tut-arrow-down .tut-arrow-shaft  { width: 8px; height: 40px; }
    .tut-arrow-down .tut-arrow-head   {
      border-left: 14px solid transparent;
      border-right: 14px solid transparent;
      border-top: 22px solid #FFB800;
    }
    @keyframes bounceDown {
      from { transform: translateY(-6px); opacity: 0.85; }
      to   { transform: translateY(4px);  opacity: 1; }
    }

    /* ─── UP ─── */
    .tut-arrow-up {
      flex-direction: column-reverse;
      animation: bounceUp 0.8s ease-in-out infinite alternate;
    }
    .tut-arrow-up .tut-arrow-shaft { width: 8px; height: 40px; }
    .tut-arrow-up .tut-arrow-head  {
      border-left: 14px solid transparent;
      border-right: 14px solid transparent;
      border-bottom: 22px solid #FFB800;
    }
    @keyframes bounceUp {
      from { transform: translateY(6px);  opacity: 0.85; }
      to   { transform: translateY(-4px); opacity: 1; }
    }

    /* ─── LEFT ─── */
    .tut-arrow-left {
      flex-direction: row-reverse;
      animation: bounceLeft 0.8s ease-in-out infinite alternate;
    }
    .tut-arrow-left .tut-arrow-shaft { height: 8px; width: 40px; }
    .tut-arrow-left .tut-arrow-head  {
      border-top: 14px solid transparent;
      border-bottom: 14px solid transparent;
      border-right: 22px solid #FFB800;
    }
    @keyframes bounceLeft {
      from { transform: translateX(6px);  opacity: 0.85; }
      to   { transform: translateX(-4px); opacity: 1; }
    }

    /* ─── RIGHT ─── */
    .tut-arrow-right {
      flex-direction: row;
      animation: bounceRight 0.8s ease-in-out infinite alternate;
    }
    .tut-arrow-right .tut-arrow-shaft { height: 8px; width: 40px; }
    .tut-arrow-right .tut-arrow-head  {
      border-top: 14px solid transparent;
      border-bottom: 14px solid transparent;
      border-left: 22px solid #FFB800;
    }
    @keyframes bounceRight {
      from { transform: translateX(-6px); opacity: 0.85; }
      to   { transform: translateX(4px);  opacity: 1; }
    }

    /* ══════════════════════════════════════
       TOOLTIP CARD
    ══════════════════════════════════════ */
    .tut-tooltip {
      position: fixed; z-index: 13003;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 16px; padding: 20px 22px 16px;
      max-width: 320px; min-width: 260px; color: #fff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
      animation: tutTooltipIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: all;
    }
    @keyframes tutTooltipIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    .tut-tooltip-center { max-width: 360px !important; }

    .tut-step-badge {
      display: inline-block;
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
      color: rgba(255,220,80,0.9); background: rgba(255,220,80,0.12);
      border: 1px solid rgba(255,220,80,0.25);
      border-radius: 20px; padding: 2px 10px; margin-bottom: 10px;
    }
    .tut-tt-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .tut-tt-icon  { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }
    .tut-tt-title { font-size: 1.02rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.3; }
    .tut-tt-desc  { font-size: 0.84rem; color: rgba(255,255,255,0.82); line-height: 1.6; margin: 0 0 12px; }

    /* Indicador de acción requerida */
    .tut-action-required {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,220,70,0.15);
      border: 1px solid rgba(255,220,70,0.35);
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 0.8rem;
      color: rgba(255,220,70,0.95);
      font-weight: 600;
      animation: actionPulse 2s ease-in-out infinite;
    }
    @keyframes actionPulse {
      0%,100% { border-color: rgba(255,220,70,0.25); background: rgba(255,220,70,0.1); }
      50%      { border-color: rgba(255,220,70,0.55); background: rgba(255,220,70,0.2); }
    }
    .tut-action-required i { font-size: 1rem; flex-shrink: 0; }

    /* Progress dots */
    .tut-progress { display: flex; gap: 5px; justify-content: center; margin-bottom: 14px; }
    .tut-dot       { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: all 0.2s; }
    .tut-dot-active { background: #fff; transform: scale(1.3); }
    .tut-dot-done   { background: rgba(255,255,255,0.55); }

    .tut-tt-btns { display: flex; gap: 8px; }

    @media (max-width: 480px) {
      .tut-welcome-card { padding: 28px 20px 22px; }
      .tut-welcome-btns { flex-direction: column; }
      .tut-tooltip { max-width: calc(100vw - 32px); }
      .tut-tooltip-center { width: calc(100vw - 48px) !important; }
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

  /** El paso actual siempre sincronizado con el servicio */
  currentStep = computed<TutorialStep | null>(
    () => this.tutorial.steps[this.tutorial.currentStepIndex()] ?? null
  );

  /** True cuando el usuario debe hacer clic en el elemento real de la página */
  requiresClick = computed(() => {
    const s = this.currentStep();
    return !!s?.selector && s.tooltipPos !== 'center';
  });

  // Elementos elevados y sus estilos originales
  private elevatedEls: SavedStyle[] = [];
  private targetClickHandler?: () => void;

  constructor(
    public tutorial: TutorialService,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {
    effect(() => {
      const active = this.tutorial.isActive();
      const idx    = this.tutorial.currentStepIndex();
      if (active) {
        this.applyStep(idx);
      } else {
        this.cleanup();
      }
    });
  }

  ngOnInit() {
    window.addEventListener('resize', this.onResize);
    this.tutorial.checkFirstVisit();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.cleanup();
  }

  private onResize = () => {
    if (this.tutorial.isActive()) this.positionForStep(this.tutorial.currentStepIndex());
  };

  private async applyStep(idx: number) {
    const step = this.tutorial.steps[idx];
    if (!step) return;

    // Limpiar paso anterior
    this.cleanup();

    this.navigating.set(true);

    // Navegar si es necesario
    if (step.route) {
      const currentUrl = this.router.url.split('?')[0];
      if (currentUrl !== step.route) {
        await this.router.navigate([step.route]);
      }
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
      this.spotlightRect.set(null);
      this.arrowPos.set(null);
      this.tooltipTop.set('50%');
      this.tooltipLeft.set('50%');
      this.tooltipTransform.set('translate(-50%,-50%)');
      return;
    }

    if (step.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ── Elevar el elemento y sus ancestros sobre el overlay ──
    this.elevateElement(el);

    // ── Registrar click listener que avanza el tutorial ──
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

  /**
   * Eleva el elemento y TODOS sus ancestros al mismo plano del tutorial (z-index 13000).
   * Esto garantiza que ningún stacking context intermedio lo tape bajo los paneles oscuros.
   * Solo aplica mientras el tutorial está activo; cleanup() lo revierte todo.
   */
  private elevateElement(el: HTMLElement) {
    const TARGET_Z = 13000;
    const saved: SavedStyle[] = [];

    let node: HTMLElement | null = el;
    while (node && node !== document.body) {
      const cs       = window.getComputedStyle(node);
      const origPos  = node.style.position;
      const origZ    = node.style.zIndex;

      saved.push({ el: node, position: origPos, zIndex: origZ });

      // Necesita position != static para que z-index tenga efecto
      if (cs.position === 'static') {
        node.style.position = 'relative';
      }
      node.style.zIndex = String(TARGET_Z);

      node = node.parentElement;
    }

    this.elevatedEls = saved;
  }

  /**
   * Escucha el clic en el elemento objetivo y avanza el tutorial.
   */
  private registerClickListener(el: HTMLElement) {
    const handler = () => {
      this.zone.run(() => {
        // Pequeña pausa para que el click propio del botón procese primero
        setTimeout(() => this.tutorial.nextStep(), 100);
      });
    };
    el.addEventListener('click', handler, { once: true });
    this.targetClickHandler = () => el.removeEventListener('click', handler);
  }

  /**
   * Restaura todos los estilos elevados y elimina listeners.
   */
  private cleanup() {
    for (const saved of this.elevatedEls) {
      saved.el.style.position = saved.position;
      saved.el.style.zIndex   = saved.zIndex;
    }
    this.elevatedEls = [];

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
    const ARROW_SIZE = 70; // tamaño total de la flecha

    let top = '50%', left = '50%', transform = 'translate(-50%,-50%)';
    let arrowTop = 0, arrowLeft = 0, arrowDir: ArrowPos['dir'] = 'down';

    const elCenterX = rect.left + rect.width  / 2;
    const elCenterY = rect.top  + rect.height / 2;

    if (pos === 'top') {
      // Tooltip encima → flecha apunta hacia abajo (↓) justo encima del elemento
      const tTop  = Math.max(12, rect.top - pad - TT_H - gap);
      const tLeft = Math.min(vw - TT_W - 12, Math.max(12, elCenterX - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      arrowDir  = 'down';
      arrowTop  = rect.top - pad - ARROW_SIZE - 4;
      arrowLeft = elCenterX - 15;
    } else if (pos === 'bottom') {
      // Tooltip debajo → flecha apunta hacia arriba (↑)
      const tTop  = Math.min(vh - TT_H - 12, rect.bottom + pad + gap);
      const tLeft = Math.min(vw - TT_W - 12, Math.max(12, elCenterX - TT_W / 2));
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      arrowDir  = 'up';
      arrowTop  = rect.bottom + pad + 4;
      arrowLeft = elCenterX - 15;
    } else if (pos === 'left') {
      // Tooltip a la izquierda → flecha apunta a la derecha (→)... desde la izquierda
      const tTop  = Math.min(vh - TT_H - 12, Math.max(12, elCenterY - TT_H / 2));
      const tLeft = Math.max(12, rect.left - pad - TT_W - gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      arrowDir  = 'right';
      arrowTop  = elCenterY - 15;
      arrowLeft = rect.left - pad - ARROW_SIZE - 4;
    } else if (pos === 'right') {
      // Tooltip a la derecha → flecha apunta a la izquierda (←)
      const tTop  = Math.min(vh - TT_H - 12, Math.max(12, elCenterY - TT_H / 2));
      const tLeft = Math.min(vw - TT_W - 12, rect.right + pad + gap);
      top = `${tTop}px`; left = `${tLeft}px`; transform = 'none';
      arrowDir  = 'left';
      arrowTop  = elCenterY - 15;
      arrowLeft = rect.right + pad + 4;
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
    this.tooltipTransform.set(transform);
    this.arrowPos.set({ top: arrowTop, left: arrowLeft, dir: arrowDir });
  }

  private wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  formatDesc(desc?: string): string {
    if (!desc) return '';
    return desc.replace(/\n/g, '<br>');
  }

  onYes() { this.tutorial.startTutorial(); }
  onNo()  { this.tutorial.dismissForever(); }
  onBackdropClick(e: MouseEvent) {}

  async next() {
    if (this.navigating()) return;
    const step = this.currentStep();
    if (!step) return;
    if (step.isFinal) { this.tutorial.completeTutorial(); return; }
    this.tutorial.nextStep();
  }

  skip() { this.tutorial.dismissForever(); }
}
