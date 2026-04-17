import { Injectable, signal } from '@angular/core';

export interface TutorialStep {
  id: string;
  step?: number;
  title: string;
  description: string;
  icon: string;
  route?: string;
  selector?: string;
  tooltipPos?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  nextLabel?: string;
  scrollIntoView?: boolean;
  padding?: number;
  requiresAuth?: boolean;
  isWelcome?: boolean;
  isFinal?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── 0: Bienvenida ──────────────────────────────────────────────────────────
  {
    id: 'welcome',
    title: '¡Bienvenido a Star Crumbs! 🍪',
    description: 'Te mostraré cómo usar la página paso a paso. En cada paso verás resaltado exactamente qué botón debes presionar. ¡La pantalla estará desbloqueada para que puedas interactuar!',
    icon: '🎓',
    tooltipPos: 'center',
    nextLabel: '¡Empezar!',
    isWelcome: true,
  },

  // ── 1: Botón "Ingresar" del navbar ─────────────────────────────────────────
  {
    id: 'navbar_ingresar',
    step: 1,
    title: 'Paso 1: Accede a tu cuenta',
    description: '👆 Presiona el botón <strong>"Ingresar"</strong> resaltado en la barra de navegación para ir a la pantalla de inicio de sesión.',
    icon: '🔑',
    selector: 'a.btn-primary.btn-sm',
    tooltipPos: 'bottom',
    nextLabel: 'Siguiente →',
    padding: 14,
  },

  // ── 2: Botón "Ingresar" del formulario de login ────────────────────────────
  {
    id: 'login_submit',
    step: 2,
    title: 'Paso 2: Iniciar sesión',
    description: '👆 Si ya tienes cuenta, ingresa tu correo y contraseña y presiona el botón <strong>"Ingresar"</strong> resaltado para acceder.',
    icon: '🍪',
    route: '/auth/login',
    selector: 'button[type="submit"].btn-primary',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 14,
  },

  // ── 3: Link "Regístrate aquí" en el login ──────────────────────────────────
  {
    id: 'register_link',
    step: 3,
    title: 'Paso 3: Crear cuenta nueva',
    description: '👆 ¿No tienes cuenta? Presiona el enlace <strong>"Regístrate aquí"</strong> resaltado para ir al formulario de registro.',
    icon: '✨',
    route: '/auth/login',
    selector: 'a[routerLink="/auth/register"]',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 10,
  },

  // ── 4: Botón "Crear cuenta" del formulario de registro ─────────────────────
  {
    id: 'register_submit',
    step: 4,
    title: 'Paso 4: Completa tu registro',
    description: '👆 Llena tus datos (nombre, correo, teléfono y ubicación) y presiona el botón <strong>"Crear cuenta"</strong> resaltado para registrarte.',
    icon: '🎉',
    route: '/auth/register',
    selector: 'button[type="submit"].btn-primary',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    scrollIntoView: true,
    padding: 14,
  },

  // ── 5: Pestañas de perfil ──────────────────────────────────────────────────
  {
    id: 'profile',
    step: 5,
    title: 'Paso 5: Tu perfil',
    description: '👆 Toca las <strong>pestañas de perfil</strong> resaltadas para ver tus pedidos, reseñas e información personal. Puedes editarla cuando quieras.',
    icon: '👤',
    route: '/profile',
    selector: '.profile-tabs',
    tooltipPos: 'bottom',
    nextLabel: 'Siguiente →',
    requiresAuth: true,
    padding: 14,
  },

  // ── 6: Grilla de productos ─────────────────────────────────────────────────
  {
    id: 'products',
    step: 6,
    title: 'Paso 6: Explora productos',
    description: '👆 Toca cualquier <strong>tarjeta de producto</strong> resaltada para ver detalles, precio y opciones de pedido. ¡Hay muchas opciones deliciosas!',
    icon: '🛍️',
    route: '/products',
    selector: '.products-grid',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 10,
  },

  // ── 7: Resumen de cómo pedir ───────────────────────────────────────────────
  {
    id: 'order',
    step: 7,
    title: 'Paso 7: Haz tu pedido',
    description: 'Tienes dos formas de pedir:\n\n🛒 <strong>En línea:</strong> agrega productos al carrito y finaliza tu pedido desde la página.\n\n💬 <strong>WhatsApp:</strong> usa el botón flotante para contactarnos directamente.',
    icon: '🛒',
    route: '/products',
    tooltipPos: 'center',
    nextLabel: '¡Finalizar!',
    isFinal: false,
  },

  // ── 8: Completado ──────────────────────────────────────────────────────────
  {
    id: 'complete',
    title: '¡Tutorial completado! 🎉',
    description: '¡Felicitaciones! Ya conoces todo lo que necesitas para disfrutar Star Crumbs. Puedes repetir el tutorial desde el pie de página cuando quieras. ¡Que disfrutes tus galletas! 🍪',
    icon: '🏆',
    tooltipPos: 'center',
    nextLabel: '¡Cerrar!',
    isFinal: true,
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  isActive         = signal(false);
  currentStepIndex = signal(0);
  showWelcome      = signal(false);

  private readonly STORAGE_KEY   = 'starcrumbs_tutorial_dismissed';
  private readonly COMPLETED_KEY = 'starcrumbs_tutorial_completed';

  get steps()       { return TUTORIAL_STEPS; }
  get currentStep() { return TUTORIAL_STEPS[this.currentStepIndex()]; }
  get totalSteps()  { return TUTORIAL_STEPS.length; }

  checkFirstVisit() {
    const dismissed = localStorage.getItem(this.STORAGE_KEY);
    const completed = localStorage.getItem(this.COMPLETED_KEY);
    if (!dismissed && !completed) {
      setTimeout(() => this.showWelcome.set(true), 1200);
    }
  }

  dismissForever() {
    localStorage.setItem(this.STORAGE_KEY, '1');
    this.showWelcome.set(false);
    this.isActive.set(false);
  }

  startTutorial() {
    this.showWelcome.set(false);
    this.currentStepIndex.set(0);
    this.isActive.set(true);
  }

  restartTutorial() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.COMPLETED_KEY);
    this.currentStepIndex.set(0);
    this.showWelcome.set(true);
    this.isActive.set(false);
  }

  nextStep() {
    const next = this.currentStepIndex() + 1;
    if (next >= TUTORIAL_STEPS.length) {
      this.completeTutorial();
    } else {
      this.currentStepIndex.set(next);
    }
  }

  completeTutorial() {
    localStorage.setItem(this.COMPLETED_KEY, '1');
    this.isActive.set(false);
    this.currentStepIndex.set(0);
  }

  closeTutorial() {
    this.isActive.set(false);
    this.showWelcome.set(false);
  }
}
