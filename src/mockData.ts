import { Client, Project, Payment, TimeEntry } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Acme Corp S.A.',
    category: 'Branding & Identidad Corporativa',
    email: 'contacto@acmecorp.cl',
    phone: '+56 9 8765 4321',
  },
  {
    id: 'c2',
    name: 'Estudio Creativo Alpha',
    category: 'Soporte de Diseño Continuo',
    email: 'diseno@estudioalpha.cl',
    phone: '+56 9 1234 5678',
  },
  {
    id: 'c3',
    name: 'Boutique Flores de Chile',
    category: 'Diseño Web E-commerce',
    email: 'pagos@floresdechile.cl',
    phone: '+56 9 5555 1234',
  },
  {
    id: 'c4',
    name: 'Gimnasio FitLife',
    category: 'Diseño Social Media',
    email: 'marketing@fitlife.cl',
    phone: '+56 9 9988 7766',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    name: 'Rebranding e Identidad de Marca Corporativa',
    budget: 2500000,
    status: 'en_progreso',
    dateCreated: '2026-01-10',
  },
  {
    id: 'p2',
    clientId: 'c2',
    name: 'Soporte Gráfico Mensual & Social Media',
    budget: 1200000,
    status: 'en_progreso',
    dateCreated: '2026-01-15',
  },
  {
    id: 'p3',
    clientId: 'c3',
    name: 'Rediseño E-commerce Shopify Profesional',
    budget: 1800000,
    status: 'completado',
    dateCreated: '2026-03-05',
  },
  {
    id: 'p4',
    clientId: 'c4',
    name: 'Diseño Kit de Lanzamiento & Flyers',
    budget: 400000,
    status: 'pausado',
    dateCreated: '2026-01-20',
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    clientId: 'c1',
    projectId: 'p1',
    amount: 1250000,
    status: 'pagado',
    monthOfService: 'Enero',
    dateDue: '2026-01-25',
    datePaid: '2026-01-24',
    notes: 'Primer hito branding aprobado'
  },
  {
    id: 'pay-2',
    clientId: 'c1',
    projectId: 'p1',
    amount: 1250000,
    status: 'pendiente',
    monthOfService: 'Enero', // Pago de enero en mora
    dateDue: '2026-01-30',
    notes: '¡DEUDA CRÍTICA DESDE ENERO! Lucía ha enviado cobro reiteradamente sin respuesta.'
  },
  {
    id: 'pay-3',
    clientId: 'c2',
    projectId: 'p2',
    amount: 600000,
    status: 'pagado',
    monthOfService: 'Febrero',
    dateDue: '2026-02-28',
    datePaid: '2026-03-02',
    notes: 'Soporte correspondiente a febrero'
  },
  {
    id: 'pay-4',
    clientId: 'c2',
    projectId: 'p2',
    amount: 600000,
    status: 'pendiente',
    monthOfService: 'Marzo',
    dateDue: '2026-03-31',
    notes: 'Pago de Marzo retenido por "revisión de entregables"'
  },
  {
    id: 'pay-5',
    clientId: 'c3',
    projectId: 'p3',
    amount: 1800000,
    status: 'pagado',
    monthOfService: 'Marzo',
    dateDue: '2026-04-10',
    datePaid: '2026-04-08',
    notes: 'Finiquito de proyecto e-commerce web. ¡Excelente cliente!'
  },
  {
    id: 'pay-6',
    clientId: 'c4',
    projectId: 'p4',
    amount: 200000,
    status: 'pagado',
    monthOfService: 'Enero',
    dateDue: '2026-01-25',
    datePaid: '2026-01-26',
    notes: 'Anticipo 50% kit de lanzamiento'
  },
  {
    id: 'pay-7',
    clientId: 'c4',
    projectId: 'p4',
    amount: 200000,
    status: 'pendiente',
    monthOfService: 'Enero', // Pago de Enero por el hito final, pausado
    dateDue: '2026-01-30',
    notes: 'Hito de entrega suspendido por congelamiento de campañas por parte del cliente.'
  }
];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  // Acme Corp time (quite active)
  {
    id: 't1',
    clientId: 'c1',
    projectId: 'p1',
    durationSeconds: 151200, // 42 Horas
    date: '2026-01-12',
    description: 'Brainstorming conceptual, moodboards y primeras propuestas de logotipo corporativo.',
  },
  // Alpha (absorbing lots of time)
  {
    id: 't2',
    clientId: 'c2',
    projectId: 'p2',
    durationSeconds: 180000, // 50 Horas
    date: '2026-01-18',
    description: 'Ajuste infinito de piezas de redes sociales, cambios de colores y correcciones del director creativo.',
  },
  {
    id: 't3',
    clientId: 'c2',
    projectId: 'p2',
    durationSeconds: 162000, // 45 Horas
    date: '2026-02-10',
    description: 'Sesión de videollamadas eternas y rediseño urgente de banners web para campaña flash.',
  },
  // Flores de Chile (highly organized)
  {
    id: 't4',
    clientId: 'c3',
    projectId: 'p3',
    durationSeconds: 72000, // 20 Horas
    date: '2026-03-10',
    description: 'Arquitectura de información, wireframes interactivos y montaje de temas base en Shopify.',
  },
  // FitLife
  {
    id: 't5',
    clientId: 'c4',
    projectId: 'p4',
    durationSeconds: 54000, // 15 Horas
    date: '2026-01-22',
    description: 'Dirección de arte aérea para folletos promocionales digitales.',
  }
];
