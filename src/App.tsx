import React, { useState, useEffect } from 'react';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_PAYMENTS, 
  INITIAL_TIME_ENTRIES 
} from './mockData';
import { Client, Project, Payment, TimeEntry } from './types';
import Dashboard from './components/Dashboard';
import DataIngest from './components/DataIngest';
import Timer from './components/Timer';
import BusinessAnswers from './components/BusinessAnswers';
import ProjectRates from './components/ProjectRates';
import { 
  Clock, 
  Coins, 
  TrendingUp, 
  Plus, 
  RotateCcw, 
  ChevronRight, 
  User, 
  Sparkles, 
  FileSpreadsheet, 
  Building, 
  AlertCircle,
  Calculator
} from 'lucide-react';

export default function App() {
  // Navigation tabs - added 'tarifas'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingest' | 'timer' | 'diagnostico' | 'tarifas'>('dashboard');

  // Master States
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Lifted Live Tracker States (keeps ticking active in background across all views)
  const [timerTime, setTimerTime] = useState<number>(0);
  const [timerIsActive, setTimerIsActive] = useState<boolean>(false);
  const [timerClientId, setTimerClientId] = useState<string>('');
  const [timerProjectId, setTimerProjectId] = useState<string>('');
  const [timerDescription, setTimerDescription] = useState<string>('');
  const [timerSaveStep, setTimerSaveStep] = useState<boolean>(false);
  const [timerRecentSaved, setTimerRecentSaved] = useState<boolean>(false);

  // Active Background Timer Ticking Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerIsActive) {
      interval = setInterval(() => {
        setTimerTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsActive]);

  // Load from LocalStorage or Fallback to Initial Messy Mock Data
  useEffect(() => {
    const savedClients = localStorage.getItem('freelance_clients');
    const savedProjects = localStorage.getItem('freelance_projects');
    const savedPayments = localStorage.getItem('freelance_payments');
    const savedTimeEntries = localStorage.getItem('freelance_time_entries');

    if (savedClients && savedProjects && savedPayments && savedTimeEntries) {
      setClients(JSON.parse(savedClients));
      setProjects(JSON.parse(savedProjects));
      setPayments(JSON.parse(savedPayments));
      setTimeEntries(JSON.parse(savedTimeEntries));
    } else {
      // Setup default mock data
      setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS);
      setPayments(INITIAL_PAYMENTS);
      setTimeEntries(INITIAL_TIME_ENTRIES);
      
      localStorage.setItem('freelance_clients', JSON.stringify(INITIAL_CLIENTS));
      localStorage.setItem('freelance_projects', JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem('freelance_payments', JSON.stringify(INITIAL_PAYMENTS));
      localStorage.setItem('freelance_time_entries', JSON.stringify(INITIAL_TIME_ENTRIES));
    }
  }, []);

  // Sync back to localstorage when changes happen
  const updateStorage = (newClients: Client[], newProj: Project[], newPay: Payment[], newTime: TimeEntry[]) => {
    localStorage.setItem('freelance_clients', JSON.stringify(newClients));
    localStorage.setItem('freelance_projects', JSON.stringify(newProj));
    localStorage.setItem('freelance_payments', JSON.stringify(newPay));
    localStorage.setItem('freelance_time_entries', JSON.stringify(newTime));
  };

  // State Mutators
  const handleAddClient = (newC: Omit<Client, 'id'>): string => {
    const newId = `c-${Date.now()}`;
    const clientWithId: Client = { ...newC, id: newId };
    const updated = [...clients, clientWithId];
    setClients(updated);
    updateStorage(updated, projects, payments, timeEntries);
    return newId;
  };

  const handleAddProject = (newP: Omit<Project, 'id'>) => {
    const projectWithId: Project = { ...newP, id: `p-${Date.now()}` };
    const updated = [...projects, projectWithId];
    setProjects(updated);
    updateStorage(clients, updated, payments, timeEntries);
  };

  const handleAddPayment = (newPay: Omit<Payment, 'id'>) => {
    const paymentWithId: Payment = { ...newPay, id: `pay-${Date.now()}` };
    const updated = [paymentWithId, ...payments]; // add at beginning
    setPayments(updated);
    updateStorage(clients, projects, updated, timeEntries);
  };

  const handleAddTimeEntry = (clientId: string, projectId: string, durationSeconds: number, description: string) => {
    const newEntry: TimeEntry = {
      id: `t-${Date.now()}`,
      clientId,
      projectId,
      durationSeconds,
      date: new Date().toISOString().split('T')[0],
      description
    };
    const updated = [newEntry, ...timeEntries];
    setTimeEntries(updated);
    updateStorage(clients, projects, payments, updated);
  };

  const handleAddTimeEntryDirect = (newTime: Omit<TimeEntry, 'id'>) => {
    const entryWithId: TimeEntry = { ...newTime, id: `t-${Date.now()}` };
    const updated = [entryWithId, ...timeEntries];
    setTimeEntries(updated);
    updateStorage(clients, projects, payments, updated);
  };

  // Toggle single payment status (paid <-> pending) for fast simulation
  const handleTogglePaymentStatus = (paymentId: string) => {
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        const nextStatus = p.status === 'pagado' ? 'pendiente' : 'pagado';
        return {
          ...p,
          status: nextStatus,
          datePaid: nextStatus === 'pagado' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return p;
    });
    setPayments(updated);
    updateStorage(clients, projects, updated, timeEntries);
  };

  // Delete elements
  const handleDeletePayment = (paymentId: string) => {
    const updated = payments.filter(p => p.id !== paymentId);
    setPayments(updated);
    updateStorage(clients, projects, updated, timeEntries);
  };

  const handleDeleteTimeEntry = (timeId: string) => {
    const updated = timeEntries.filter(t => t.id !== timeId);
    setTimeEntries(updated);
    updateStorage(clients, projects, payments, updated);
  };

  // Restores standard "Chaos" scenario
  const handleResetToChaos = () => {
    if (window.confirm('¿Quieres reestablecer los datos al caso inicial ("Freelance en Apuros" de Lucía)? Esto sobreescribirá tus cambios actuales.')) {
      setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS);
      setPayments(INITIAL_PAYMENTS);
      setTimeEntries(INITIAL_TIME_ENTRIES);
      updateStorage(INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_PAYMENTS, INITIAL_TIME_ENTRIES);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1D20] font-sans flex flex-col">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-4.5">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl border border-indigo-100 shrink-0 shadow-xs">
              <Coins className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-[#1A1D20] leading-none">
                  FreelanceFlow Control
                </h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Caso Lucía
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Panel de control financiero, tracker de tiempo y análisis de rentabilidad profesional.
              </p>
            </div>
          </div>

          {/* Controls & Mini Profile */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Reset mock scenario controller */}
            <button
              onClick={handleResetToChaos}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-white hover:bg-red-50/50 border border-gray-200 rounded-xl shadow-sm transition duration-150 cursor-pointer"
              title="Restablecer caso de Lucía"
            >
              <RotateCcw className="w-4 h-4 text-red-500" />
              <span>Restablecer Caso</span>
            </button>

            {/* Profile Avatar */}
            <div className="h-10 flex items-center gap-3 bg-white border border-gray-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              <div className="w-6 h-6 bg-[#4F46E5] text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                L
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#1A1D20] leading-none">Lucía Freelance</p>
                <p className="text-[10px] text-gray-400 mt-0.5">UI/UX & Branding</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB NAVIGATION ROW */}
        <div className="flex bg-white p-1 border border-gray-200 rounded-2xl shadow-xs max-w-4xl mx-auto overflow-x-auto whitespace-nowrap gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#4F46E5] text-white rounded-xl shadow-sm font-bold'
                : 'text-gray-500 hover:text-[#1A1D20] hover:bg-gray-50 rounded-xl'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            Panel de Control
          </button>

          <button
            onClick={() => setActiveTab('ingest')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === 'ingest'
                ? 'bg-[#4F46E5] text-white rounded-xl shadow-sm font-bold'
                : 'text-gray-500 hover:text-[#1A1D20] hover:bg-gray-50 rounded-xl'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            Ingesta de Datos
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-[#4F46E5] text-white rounded-xl shadow-sm font-bold'
                : 'text-gray-500 hover:text-[#1A1D20] hover:bg-gray-50 rounded-xl'
            }`}
          >
            <Clock className={`w-4 h-4 shrink-0 ${timerIsActive ? 'text-[#EF4444] animate-pulse' : ''}`} />
            <span>Tracker en Vivo</span>
            {timerIsActive && (
              <span className="ml-1.5 bg-red-50 border border-red-200 text-red-650 font-mono text-[9px] px-1.5 py-0.5 rounded-md animate-pulse">
                {Math.floor(timerTime / 3600).toString().padStart(2, '0')}:
                {Math.floor((timerTime % 3600) / 60).toString().padStart(2, '0')}:
                {(timerTime % 60).toString().padStart(2, '0')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === 'diagnostico'
                ? 'bg-[#4F46E5] text-white rounded-xl shadow-sm font-bold'
                : 'text-gray-500 hover:text-[#1A1D20] hover:bg-gray-50 rounded-xl'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            Diagnóstico (Q1-Q3)
          </button>

          <button
            onClick={() => setActiveTab('tarifas')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === 'tarifas'
                ? 'bg-[#4F46E5] text-white rounded-xl shadow-sm font-bold'
                : 'text-gray-500 hover:text-[#1A1D20] hover:bg-gray-50 rounded-xl'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            Tarifas por Proyecto
          </button>
        </div>

        {/* GLOBAL BACKGROUND TIMER BAR */}
        {timerIsActive && activeTab !== 'timer' && (
          <div className="bg-red-50/70 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs max-w-2xl mx-auto text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-ping"></span>
              <span>
                <strong>Sesión de Trabajo Activa:</strong>{' '}
                {clients.find(c => c.id === timerClientId)?.name || 'Cliente'} ({Math.floor(timerTime / 3600).toString().padStart(2, '0')}:
                {Math.floor((timerTime % 3600) / 60).toString().padStart(2, '0')}:
                {(timerTime % 60).toString().padStart(2, '0')})
              </span>
            </div>
            <button
              onClick={() => setActiveTab('timer')}
              className="px-3 py-1 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-lg uppercase text-[9px] tracking-wider transition-all cursor-pointer border-0"
            >
              Ver Tracker
            </button>
          </div>
        )}

        {/* COMPONENT BODY */}
        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard 
              clients={clients}
              projects={projects}
              payments={payments}
              timeEntries={timeEntries}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onDeletePayment={handleDeletePayment}
              onDeleteTimeEntry={handleDeleteTimeEntry}
            />
          )}

          {activeTab === 'ingest' && (
            <DataIngest
              clients={clients}
              projects={projects}
              onAddClient={handleAddClient}
              onAddProject={handleAddProject}
              onAddPayment={handleAddPayment}
              onAddTimeEntryDirect={handleAddTimeEntryDirect}
            />
          )}

          {activeTab === 'timer' && (
            <Timer 
              clients={clients}
              projects={projects}
              onAddTimeEntry={handleAddTimeEntry}
              selectedClientId={timerClientId}
              setSelectedClientId={setTimerClientId}
              selectedProjectId={timerProjectId}
              setSelectedProjectId={setTimerProjectId}
              time={timerTime}
              setTime={setTimerTime}
              isActive={timerIsActive}
              setIsActive={setTimerIsActive}
              description={timerDescription}
              setDescription={setTimerDescription}
              saveStep={timerSaveStep}
              setSaveStep={setTimerSaveStep}
              recentSaved={timerRecentSaved}
              setRecentSaved={setTimerRecentSaved}
            />
          )}

          {activeTab === 'diagnostico' && (
            <BusinessAnswers 
              clients={clients}
              projects={projects}
              payments={payments}
              timeEntries={timeEntries}
            />
          )}

          {activeTab === 'tarifas' && (
            <ProjectRates 
              clients={clients}
              projects={projects}
              timeEntries={timeEntries}
            />
          )}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FreelanceFlow — Plataforma Profesional de Finanzas.</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#1A1D20] font-semibold">FreelanceFlow</span>
            <span className="text-gray-300">|</span>
            <span className="text-[#4F46E5] font-bold">CONTROL FINANCIERO ACTIVO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
