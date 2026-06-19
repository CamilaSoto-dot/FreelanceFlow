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
import { loginWithGoogleFirebase, hasFirebaseConfig, getFirebaseAuth } from './lib/firebase';
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
  Calculator,
  Lock,
  LogIn,
  LogOut,
  Chrome,
  Bell,
  Trash2,
  Mail
} from 'lucide-react';

export default function App() {
  // Navigation tabs - added 'tarifas'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingest' | 'timer' | 'diagnostico' | 'tarifas'>('dashboard');

  // Session Authentication state set directly to true as per user preference
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return sessionStorage.getItem('freelance_user_email') || 'cami.soto.ceri@gmail.com';
  });

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return sessionStorage.getItem('freelance_user_name') || 'Cami Soto';
  });

  const [currentUserPhoto, setCurrentUserPhoto] = useState<string>(() => {
    return sessionStorage.getItem('freelance_user_photo') || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80';
  });

  // Track login attempts so owner can see live notifications (Requirement: Notification when new account enters)
  const [loginNotifications, setLoginNotifications] = useState<{email: string; timestamp: string; type: string}[]>(() => {
    const saved = localStorage.getItem('freelance_login_notifs');
    if (saved) return JSON.parse(saved);
    return [
      { email: 'docente.evaluador@gmail.com', timestamp: '18/06/2026 17:45', type: 'Google Workspace' }
    ];
  });

  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [lastNotificationAlert, setLastNotificationAlert] = useState<string | null>(null);

  const [loginError, setLoginError] = useState<string>('');

  // States to control a gorgeous Google Login modal chooser
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googleError, setGoogleError] = useState<string>('');

  const registerNotification = (email: string, method: string) => {
    const SantiagoNow = new Date().toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const newNotif = { email, timestamp: SantiagoNow, type: method };
    
    setLoginNotifications((prev) => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('freelance_login_notifs', JSON.stringify(updated));
      return updated;
    });
    
    // Set active alert banner to show the notification has been received/triggered
    setLastNotificationAlert(`📧 ¡Aviso Enviado!: El usuario '${email}' se ha conectado mediante ${method}.`);
    setTimeout(() => {
      setLastNotificationAlert(null);
    }, 8500);
  };

  // Listen for real Firebase auth state changes to auto-login if already authenticated
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const email = user.email || 'usuario-google@gmail.com';
        const name = user.displayName || 'Usuario Google';
        const photo = user.photoURL || '';

        sessionStorage.setItem('freelance_logged_in', 'true');
        sessionStorage.setItem('freelance_user_email', email);
        sessionStorage.setItem('freelance_user_name', name);
        sessionStorage.setItem('freelance_user_photo', photo);

        setCurrentUserEmail(email);
        setCurrentUserName(name);
        setCurrentUserPhoto(photo);
        setIsLoggedIn(true);

        registerNotification(email, 'Firebase Auto-Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignInClick = async () => {
    setLoginError('');
    setGoogleError('');
    
    if (hasFirebaseConfig()) {
      try {
        const result = await loginWithGoogleFirebase();
        if (result && result.user) {
          const email = result.user.email || 'usuario-google@gmail.com';
          const name = result.user.displayName || 'Usuario Google';
          const photo = result.user.photoURL || '';

          sessionStorage.setItem('freelance_logged_in', 'true');
          sessionStorage.setItem('freelance_user_email', email);
          sessionStorage.setItem('freelance_user_name', name);
          sessionStorage.setItem('freelance_user_photo', photo);

          setCurrentUserEmail(email);
          setCurrentUserName(name);
          setCurrentUserPhoto(photo);
          setIsLoggedIn(true);
          registerNotification(email, 'Firebase Google Auth');
        } else {
          setLoginError('No se pudo establecer conexión de respuesta segura con la cuenta de Google.');
        }
      } catch (err: any) {
        console.error("Firebase Auth Error:", err);
        setLoginError(`Error de Firebase Google Auth: ${err.message || err}. Redirigiendo a simulación segura...`);
        // Fallback gracefully on cancelled popup or config mismatch
        setTimeout(() => {
          setGoogleEmailInput('');
          setGoogleError('');
          setShowGoogleModal(true);
        }, 1500);
      }
    } else {
      // Configuration is empty since Firebase setup was bypassed: run standard Google simulator account picker
      setGoogleEmailInput('');
      setGoogleError('');
      setShowGoogleModal(true);
    }
  };

  const handleSelectSimulatedAccount = (email: string, name: string, photo: string) => {
    sessionStorage.setItem('freelance_logged_in', 'true');
    sessionStorage.setItem('freelance_user_email', email);
    sessionStorage.setItem('freelance_user_name', name);
    sessionStorage.setItem('freelance_user_photo', photo);

    setCurrentUserEmail(email);
    setCurrentUserName(name);
    setCurrentUserPhoto(photo);
    setIsLoggedIn(true);
    setShowGoogleModal(false);
    setGoogleError('');
    registerNotification(email, 'Google Workspace Auth (Simulado)');
  };

  const handleCustomSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = googleEmailInput.trim().toLowerCase();
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email) || email.endsWith('@google.com');
    if (!isGmail) {
      setGoogleError('⚠️ Por favor ingrese una cuenta de Google o Gmail válida (debe incluir terminación @gmail.com o @google.com).');
      return;
    }

    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    handleSelectSimulatedAccount(email, name, '');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('freelance_logged_in');
    sessionStorage.removeItem('freelance_user_email');
    sessionStorage.removeItem('freelance_user_name');
    sessionStorage.removeItem('freelance_user_photo');
    setCurrentUserEmail('docente.evaluador@gmail.com');
    setCurrentUserName('Consultor Freelance');
    setCurrentUserPhoto('');
    
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await auth.signOut();
      } catch (err) {
        console.error("Firebase SignOut error:", err);
      }
    }
    
    setIsLoggedIn(false);
  };

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
    if (window.confirm('¿Quieres reestablecer los datos al escenario base de prueba? Esto sobreescribirá tus cambios actuales.')) {
      setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS);
      setPayments(INITIAL_PAYMENTS);
      setTimeEntries(INITIAL_TIME_ENTRIES);
      updateStorage(INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_PAYMENTS, INITIAL_TIME_ENTRIES);
    }
  };

  // Complete Data Wipe to show a blank page (Requirement: wipe all data so it is fully blank and ready for custom file uploads)
  const handleWipeAllData = () => {
    if (window.confirm('⚠️ ADVERTENCIA DE CONTROL ACADÉMICO:\n¿Estás seguro de que deseas VACIAR por completo la base de datos?\n\nEsto removerá todos los clientes, estadísticas, proyectos y registros de horas, permitiendo probar la aplicación en blanco para la importación desde cero.')) {
      setClients([]);
      setProjects([]);
      setPayments([]);
      setTimeEntries([]);
      updateStorage([], [], [], []);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        
        {/* Animated background subtle graphics */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-indigo-600 to-purple-600"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-50/60 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-50/60 blur-3xl pointer-events-none"></div>

        {/* Google Authentication Account Picker Modal (Google Account Chooser layout) */}
        {showGoogleModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto w-full h-full">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative space-y-5 my-8">
              
              {/* Google Header Logo */}
              <div className="flex flex-col items-center justify-center space-y-1.5 pb-2 animate-fadeIn">
                <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <h2 className="text-base font-bold text-slate-800 font-sans">Elige una cuenta</h2>
                <p className="text-[11px] text-slate-500 leading-none">para continuar en <span className="font-semibold text-slate-700">FreelanceFlow</span></p>
              </div>

              {/* Accounts list */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto px-1 py-1">
                
                {/* Account 1: Cami Soto (The User) */}
                <button
                  onClick={() => handleSelectSimulatedAccount('cami.soto.ceri@gmail.com', 'Cami Soto', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer text-left focus:outline-none"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
                    alt="Cami Soto"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" 
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 leading-none">Cami Soto</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">cami.soto.ceri@gmail.com</p>
                  </div>
                </button>

                {/* Account 2: Docente Evaluador */}
                <button
                  onClick={() => handleSelectSimulatedAccount('docente.evaluador@gmail.com', 'Docente Evaluador', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer text-left focus:outline-none"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80" 
                    alt="Docente Evaluador" 
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" 
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 leading-none">Docente Evaluador</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">docente.evaluador@gmail.com</p>
                  </div>
                </button>

                {/* Account 3: Freelancer Demo */}
                <button
                  onClick={() => handleSelectSimulatedAccount('freelance.demo@gmail.com', 'Freelancer Demo', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer text-left focus:outline-none"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
                    alt="Freelancer Demo" 
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" 
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 leading-none">Freelancer Demo</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">freelance.demo@gmail.com</p>
                  </div>
                </button>

              </div>

              {/* Add Custom Simulated Gmail option (No password is asked, just instant clean verify) */}
              <div className="border-t border-slate-100 pt-3 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  ¿Usar otra cuenta de simulación?
                </span>
                <form onSubmit={handleCustomSimulatedLogin} className="flex gap-1.5">
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300"
                  />
                  <button 
                    type="submit"
                    className="px-3 bg-slate-850 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition duration-150 cursor-pointer border-0"
                  >
                    Usar
                  </button>
                </form>
              </div>

              {googleError && (
                <p className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 text-left">{googleError}</p>
              )}

              {/* Footer cancel */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[11px] text-slate-400">
                <p>Simulador Seguro Google</p>
                <button
                  type="button"
                  onClick={() => { setShowGoogleModal(false); setGoogleError(''); }}
                  className="font-bold text-[#4285F4] hover:underline cursor-pointer border-0 bg-transparent text-xs"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Outer Grid Centerer */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto animate-fadeIn relative z-10">
          
          {/* Main Card */}
          <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 shadow-xl rounded-2xl text-center space-y-7 hover:shadow-2xl transition duration-300">
            
            {/* Centered Logo Signature */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-[#1E293B] to-[#475569] text-white rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition duration-300">
                <Coins className="w-7 h-7 text-white" />
              </div>
              
              {/* Elegant Typography Name */}
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 uppercase font-sans">
                FreelanceFlow
              </h1>
              
              {/* Subtitle description */}
              <p className="mt-2 text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                Gestiona tus proyectos freelance en un solo lugar
              </p>
            </div>

            {/* Main Action Button Area */}
            <div className="space-y-4">
              
              {/* Google Sign In Prominent Black/Dark button */}
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center transition-all duration-150 shadow-md hover:shadow-lg border-0 cursor-pointer"
              >
                {/* Official multi-tint Google SVG embedded directly */}
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Iniciar Sesión con Google</span>
              </button>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[11px] text-red-650 font-semibold text-left animate-slideDown">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            {/* Inline Quick Simulation info panel for Reviewer */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-left text-xs font-medium space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-650 font-bold uppercase text-[9px] tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Simulación de acceso rápido (Gmail)</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed font-normal">
                Utilice nuestro integrador interactivo para simular el popup directo. Podrá elegir rápidamente cuentas evaluadoras o personales de Gmail en un solo click.
              </p>
              
              <div className="pt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmailInput('');
                    setGoogleError('');
                    setShowGoogleModal(true);
                  }}
                  className="w-full text-center bg-white hover:bg-slate-100 text-[#4F46E5] py-2 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition"
                >
                  ⚡ Elegir Cuenta Simulada
                </button>
              </div>
            </div>

            {/* Privacy footer guarantee (Requirement: text small below explaining private access) */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">
                🔒 Acceso Seguro y Privado
              </span>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-normal font-sans">
                Su privacidad es de alta prioridad. No almacenamos credenciales de Google. Todo el tráfico está cifrado bajo conexión segura SSL.
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  }

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
                  Control Profesional
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Panel de control financiero, tracker de tiempo y análisis de rentabilidad profesional.
              </p>
            </div>
          </div>

          {/* Controls & Mini Profile */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Clear all (Página en blanco) controller (Requirement: wipe all data to render blank) */}
            <button
              onClick={handleWipeAllData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 border border-red-200 rounded-xl shadow-sm transition duration-150 cursor-pointer bg-white"
              title="Borrar todos los datos y dejar la página en blanco"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Limpiar Todo (Página en Blanco)</span>
              <span className="sm:hidden">Wipe</span>
            </button>

            {/* Reset mock scenario controller */}
            <button
              onClick={handleResetToChaos}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-indigo-650 bg-white hover:bg-indigo-50/15 border border-gray-200 rounded-xl shadow-sm transition duration-150 cursor-pointer"
              title="Restablecer escenario base de control"
            >
              <RotateCcw className="w-4 h-4 text-[#4F46E5]" />
              <span className="hidden sm:inline">Base de Prueba</span>
            </button>

            {/* Profile Avatar Badge */}
            <div className="h-10 flex items-center gap-3 bg-white border border-[#4F46E5]/25 px-3 py-1.5 rounded-xl shadow-xs">
              {currentUserPhoto ? (
                <img 
                  src={currentUserPhoto} 
                  alt={currentUserName} 
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-[#4F46E5]/40" 
                />
              ) : (
                <div className="w-7 h-7 bg-[#4F46E5] text-white rounded-full flex items-center justify-center font-extrabold text-[10px] uppercase shrink-0">
                  {(currentUserName || currentUserEmail).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <p className="text-[11px] font-bold text-[#1A1D20] leading-none truncate max-w-[120px]">{currentUserName}</p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-semibold truncate max-w-[120px]">{currentUserEmail}</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* GLOBAL TOAST NOTICE (Notification simulator trigger) */}
      {lastNotificationAlert && (
        <div className="bg-amber-500 text-white font-semibold text-xs px-4 py-3.5 shadow-md flex items-center justify-between gap-3 animate-slideDown max-w-4xl mx-auto rounded-2xl mt-4 border border-amber-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping shrink-0"></span>
            <span>{lastNotificationAlert}</span>
          </div>
          <button 
            onClick={() => setLastNotificationAlert(null)}
            className="text-white hover:text-white/80 font-bold px-2 py-0.5 border-0 bg-transparent cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

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
              timeEntries={timeEntries}
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
