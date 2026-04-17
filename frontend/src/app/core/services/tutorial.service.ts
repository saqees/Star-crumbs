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
    description: 'En este tutorial aprenderás a iniciar sesión, registrarte, explorar productos y hacer tu primer pedido. ¡La pantalla se desbloqueará en cada paso para que puedas interactuar libremente!',
    icon: '🎓',
    tooltipPos: 'center',
    nextLabel: '¡Empezar!',
    isWelcome: true,
  },
  {
    id: 'login',
    step: 1,
    title: 'Paso 1: Inicia sesión',
    description: '👆 Presiona el botón <strong>"Ingresar"</strong> resaltado. Ingresa tu correo y contraseña para acceder a tu cuenta.',
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
    title: 'Paso 2: Crea tu cuenta',
    description: '👆 ¿No tienes cuenta? Presiona el botón <strong>"Registrarse"</strong> resaltado y completa tus datos para unirte a Star Crumbs.',
    icon: '✨',
    route: '/auth/register',
    selector: 'button[type="submit"]',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    padding: 16,
    scrollIntoView: true,
  },
  {
    id: 'location',
    step: 2,
    title: 'Tu ubicación 📍',
    description: '👆 En la sección <strong>"Ubicación"</strong> resaltada, selecciona tu barrio o pega el link de Google Maps con tu dirección. Así sabremos dónde entregarte.',
    icon: '📍',
    route: '/auth/register',
    selector: '.location-section',
    tooltipPos: 'top',
    nextLabel: 'Siguiente →',
    scrollIntoView: true,
    padding: 12,
  },
  {
    id: 'profile',
    step: 3,
    title: 'Paso 3: Tu perfil',
    description: '👆 Toca las <strong>pestañas de perfil</strong> resaltadas para ver tus pedidos, reseñas e información personal. Aquí puedes editar todos tus datos.',
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
    title: 'Paso 4: Explora productos',
    description: '👆 Toca cualquier <strong>tarjeta de producto</strong> resaltada para ver sus detalles, precio y opciones de pedido. ¡Hay muchas opciones deliciosas!',
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
    description: 'Tienes dos formas de hacer tu pedido:\n\n🛒 <strong>En línea:</strong> agrega productos al carrito y completa tu pedido desde la página.\n\n💬 <strong>WhatsApp:</strong> usa el botón de WhatsApp para contactarnos directamente.',
    icon: '🛒',
    route: '/products',
    tooltipPos: 'center',
    nextLabel: '¡Listo!',
    isFinal: false,
  },
  {
    id: 'complete',
    step: 6,
    title: '¡Tutorial completado! 🎉',
    description: '¡Felicitaciones! Ya sabes todo lo que necesitas para disfrutar Star Crumbs. Puedes repetir el tutorial desde el footer cuando quieras. ¡Que disfrutes tus galletas! 🍪',
    icon: '🏆',
    tooltipPos: 'center',
    nextLabel: '¡Cerrar!',
    isFinal: true,
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  isActive    = signal(false);
  currentStepIndex = signal(0);
  showWelcome = signal(false);

  private readonly STORAGE_KEY  = 'starcrumbs_tutorial_dismissed';
  private readonly COMPLETED_KEY = 'starcrumbs_tutorial_completed';

  get steps()      { return TUTORIAL_STEPS; }
  get currentStep(){ return TUTORIAL_STEPS[this.currentStepIndex()]; }
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
