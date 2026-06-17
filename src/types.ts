export interface Client {
  id: string;
  name: string;
  category: string; // e.g., "Diseño Web", "Branding", "Social Media"
  email: string;
  phone?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  budget: number; // in CLP
  status: 'completado' | 'en_progreso' | 'pausado';
  dateCreated: string;
}

export interface Payment {
  id: string;
  clientId: string;
  projectId: string;
  amount: number; // in CLP
  status: 'pagado' | 'pendiente';
  monthOfService: 'Enero' | 'Febrero' | 'Marzo' | 'Abril' | 'Mayo' | 'Junio' | 'Julio' | 'Agosto' | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre';
  dateDue: string;
  datePaid?: string;
  notes?: string;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  projectId: string;
  durationSeconds: number; // duration in seconds
  date: string;
  description: string;
}
