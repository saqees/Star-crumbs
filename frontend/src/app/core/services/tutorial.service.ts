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
  {
    id: 'welcome',
    title: '¡Bienvenido a Star Crumbs! 🍪',
    description: 'En este tutorial aprenderás a: iniciar sesión o registrarte, completar tu perfil, explorar nuestros productos y realizar tu primer pedido. ¡Es fácil y rápido!',
    icon: '🎓',
    tooltipPos: 'center',
    nextLabel: '¡Empezar!',
    isWelcome: true,
  },
  {
    id: 'login',
    step: 1,
    title: 'Paso 1: Inicia sesión',
    description: 'Presiona este botón para ingresar a tu cuenta. Solo necesitas tu correo electrónico y contraseña.',
    icon: '🔑',
    route: '/auth/login',
    selector: 'button[type="submit"]',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 16,
  },
  {
    id: 'register',
    step: 2,
    title: 'Paso 2: Regístrate',
    description: 'Si aún no tienes cuenta, puedes crear una aquí. Completa tus datos básicos para unirte a la familia Star Crumbs.',
    icon: '✨',
    route: '/auth/register',
    selector: '.auth-header',
    tooltipPos: 'bottom',
    nextLabel: 'Siguiente →',
    padding: 20,
  },
  {
    id: 'location',
    step: 2,
    title: 'Especifica tu ubicación 📍',
    description: 'Así sabremos dónde llevarte tu paquete. Selecciona tu barrio o ingresa tu dirección específica con el link de Google Maps.',
    icon: '📍',
    route: '/auth/register',
    selector: '.location-section',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    scrollIntoView: true,
    padding: 12,
  },
  {
    id: 'register_submit',
    step: 2,
    title: '¡Crear cuenta!',
    description: 'Una vez completados todos tus datos, presiona este botón para finalizar tu registro. ¡Bienvenido a Star Crumbs!',
    icon: '🎉',
    route: '/auth/register',
    selector: 'button[type="submit"]',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    scrollIntoView: true,
    padding: 16,
  },
  {
    id: 'profile',
    step: 3,
    title: 'Paso 3: Tu perfil',
    description: 'Al iniciar sesión, selecciona tu perfil desde el menú. Aquí puedes completar tu información personal, ver tus pedidos y dejar reseñas.',
    icon: '👤',
    route: '/profile',
    selector: '.profile-tabs',
    tooltipPos: 'bottom',
    nextLabel: 'Siguiente →',
    requiresAuth: true,
    padding: 16,
  },
  {
    id: 'products',
    step: 4,
    title: 'Paso 4: Explora los productos',
    description: 'Aquí encontrarás todos nuestros productos. Toca cualquier tarjeta para ver los detalles, precio y opciones de pedido.',
    icon: '🛍️',
    route: '/products',
    selector: '.products-grid',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 12,
  },
  {
    id: 'order',
    step: 5,
    title: 'Paso 5: Haz tu pedido',
    description: 'Tienes dos formas de hacer tu pedido:\n\n🛒 Pedido en línea: Agrega al carrito y haz tu pedido directamente desde la página.\n\n💬 WhatsApp: Usa el botón de WhatsApp para contactarnos directamente.',
    icon: '🛒',
    route: '/products',
    tooltipPos: 'center',
    nextLabel: '¡Finalizar tutorial!',
    isFinal: false,
  },
  {
    id: 'complete',
    step: 6,
    title: '¡Tutorial completado! 🎉',
    description: '¡Felicitaciones! Ya conoces todo lo que necesitas para disfrutar de Star Crumbs. Si tienes dudas, puedes repetir el tutorial desde el footer. ¡Que disfrutes tus galletas! 🍪',
    icon: '🏆',
    tooltipPos: 'center',
    nextLabel: '¡Cerrar!',
    isFinal: true,
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  isActive = signal(false);
  currentStepIndex = signal(0);
  showWelcome = signal(false);

  private readonly STORAGE_KEY = 'starcrumbs_tutorial_dismissed';
  private readonly COMPLETED_KEY = 'starcrumbs_tutorial_completed';

  get steps() { return TUTORIAL_STEPS; }
  get currentStep() { return TUTORIAL_STEPS[this.currentStepIndex()]; }
  get totalSteps() { return TUTORIAL_STEPS.length; }

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
