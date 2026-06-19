import React, { useState, useRef } from 'react';
import { Upload, Plus, FileSpreadsheet, Sparkles, Building, Briefcase, DollarSign, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Client, Project, Payment, TimeEntry } from '../types';

interface DataIngestProps {
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
  onAddClient: (newClient: Omit<Client, 'id'>) => string;
  onAddProject: (newProj: Omit<Project, 'id'>) => void;
  onAddPayment: (newPay: Omit<Payment, 'id'>) => void;
  onAddTimeEntryDirect: (newTime: Omit<TimeEntry, 'id'>) => void;
}

export default function DataIngest({
  clients,
  projects,
  timeEntries,
  onAddClient,
  onAddProject,
  onAddPayment,
  onAddTimeEntryDirect,
}: DataIngestProps) {
  // Active form categories
  const [activeForm, setActiveForm] = useState<'client' | 'project' | 'payment' | 'time'>('client');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientCategory, setClientCategory] = useState('Branding & Identidad Corporativa');
  const [customCategory, setCustomCategory] = useState(''); // Custom category/rubro entered manually
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Project form state
  const [projClientId, setProjClientId] = useState('');
  const [projName, setProjName] = useState('');
  const [projBudget, setProjBudget] = useState('');
  const [projStatus, setProjStatus] = useState<'completado' | 'en_progreso' | 'pausado'>('en_progreso');

  // Payment form state
  const [payClientId, setPayClientId] = useState('');
  const [payProjId, setPayProjId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState<'pagado' | 'pendiente'>('pendiente');
  const [payMonth, setPayMonth] = useState<Payment['monthOfService']>('Enero');
  const [payNotes, setPayNotes] = useState('');

  // Payment calculation settings (Requirement 3)
  const [payAmountMode, setPayAmountMode] = useState<'manual' | 'calculated'>('manual');
  const [rateCalcSource, setRateCalcSource] = useState<'project_rate' | 'custom_rate'>('project_rate');
  const [customHourlyRate, setCustomHourlyRate] = useState<string>('30000');

  // Time manual entry state
  const [timeClientId, setTimeClientId] = useState('');
  const [timeProjId, setTimeProjId] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeDate, setTimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeDesc, setTimeDesc] = useState('');

  // Setup form defaults as clients update
  React.useEffect(() => {
    if (clients.length > 0) {
      if (!projClientId) setProjClientId(clients[0].id);
      if (!payClientId) setPayClientId(clients[0].id);
      if (!timeClientId) setTimeClientId(clients[0].id);
    }
  }, [clients]);

  // Track select proj dependencies
  const payClientProjects = projects.filter(p => p.clientId === payClientId);
  const timeClientProjects = projects.filter(p => p.clientId === timeClientId);

  React.useEffect(() => {
    if (payClientProjects.length > 0) {
      setPayProjId(payClientProjects[0].id);
    } else {
      setPayProjId('');
    }
  }, [payClientId, projects]);

  React.useEffect(() => {
    if (timeClientProjects.length > 0) {
      setTimeProjId(timeClientProjects[0].id);
    } else {
      setTimeProjId('');
    }
  }, [timeClientId, projects]);

  // Dynamic automatic fee calculator (Requirement 3)
  const getProjectHoursAndAmount = () => {
    if (!payProjId) return { hours: 0, rate: 0, total: 0 };
    const projTimes = timeEntries.filter(t => t.projectId === payProjId);
    const totalSeconds = projTimes.reduce((sum, t) => sum + t.durationSeconds, 0);
    const hours = totalSeconds / 3600;

    let rate = 30000; // standard default rate
    if (rateCalcSource === 'project_rate') {
      try {
        const customRatesStr = localStorage.getItem('freelance_project_rates');
        if (customRatesStr) {
          const rates = JSON.parse(customRatesStr);
          if (rates[payProjId] !== undefined && rates[payProjId] > 0) {
            rate = Number(rates[payProjId]);
          }
        }
      } catch (err) {
        console.error("Error parsing stored project rates:", err);
      }
    } else {
      rate = parseFloat(customHourlyRate) || 0;
    }

    return {
      hours,
      rate,
      total: Math.round(hours * rate)
    };
  };

  const calculatedObj = getProjectHoursAndAmount();

  React.useEffect(() => {
    if (payAmountMode === 'calculated') {
      setPayAmount(calculatedObj.total.toString());
    }
  }, [payAmountMode, payProjId, rateCalcSource, customHourlyRate, timeEntries]);

  // Form Submissions
  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      showMsg('Por favor completa los campos obligatorios de Cliente.', 'error');
      return;
    }
    const finalCategory = clientCategory === 'custom' ? customCategory.trim() : clientCategory;
    const id = onAddClient({
      name: clientName,
      category: finalCategory || 'Otros Servicios',
      email: clientEmail,
      phone: clientPhone,
    });
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setCustomCategory('');
    showMsg(`Nuevo cliente "${clientName}" registrado exitosamente. (ID generado: ${id})`, 'success');
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(projBudget);
    if (!projName.trim() || !projClientId || isNaN(parsedBudget)) {
      showMsg('Por favor completa los campos del proyecto y un presupuesto válido.', 'error');
      return;
    }
    onAddProject({
      clientId: projClientId,
      name: projName,
      budget: parsedBudget,
      status: projStatus,
      dateCreated: new Date().toISOString().split('T')[0],
    });
    setProjName('');
    setProjBudget('');
    showMsg(`Proyecto "${projName}" registrado de forma exitosa.`, 'success');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(payAmount);
    if (!payClientId || !payProjId || isNaN(parsedAmount)) {
      showMsg('Selecciona cliente, proyecto y un monto en CLP correcto.', 'error');
      return;
    }
    onAddPayment({
      clientId: payClientId,
      projectId: payProjId,
      amount: parsedAmount,
      status: payStatus,
      monthOfService: payMonth,
      dateDue: new Date().toISOString().split('T')[0],
      notes: payNotes,
      datePaid: payStatus === 'pagado' ? new Date().toISOString().split('T')[0] : undefined,
    });
    setPayAmount('');
    setPayNotes('');
    showMsg(`Facturación / Cobro de $${parsedAmount.toLocaleString('es-CL')} ingresado correctamente.`, 'success');
  };

  const handleAddTimeDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(timeHours);
    if (!timeClientId || !timeProjId || isNaN(hoursNum) || hoursNum <= 0) {
      showMsg('Indica un número de horas trabajadas correcto.', 'error');
      return;
    }
    onAddTimeEntryDirect({
      clientId: timeClientId,
      projectId: timeProjId,
      durationSeconds: hoursNum * 3600,
      date: timeDate,
      description: timeDesc.trim() || 'Desarrollo de entregables',
    });
    setTimeHours('');
    setTimeDesc('');
    showMsg(`Bitácora manual de ${hoursNum} hrs insertada correctamente.`, 'success');
  };

  const showMsg = (text: string, type: 'success' | 'error' | 'info') => {
    setUploadMessage({ text, type });
    setTimeout(() => {
      setUploadMessage({ text: '', type: null });
    }, 5000);
  };

  // Drag over handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop handler for real files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileParsing(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileParsing(e.target.files[0]);
    }
  };

  const handleFileParsing = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          processBatchImport(parsed);
        } else if (file.name.endsWith('.csv')) {
          parseCSVAndIngest(content);
        } else {
          showMsg('Formato no soportado directamente. Sube un archivo .csv o .json o usa los simuladores interactivos.', 'error');
        }
      } catch (err) {
        showMsg('Error al interpretar el archivo cargado. Asegúrate de que sea JSON o CSV válido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Direct manual mock data imports to test
  const triggerSimulatedDrop = (type: 'pending_invoices' | 'new_client_pack' | 'additional_times') => {
    if (type === 'pending_invoices') {
      const simulatedInvoices = {
        payments: [
          {
            clientId: 'c1',
            projectId: 'p1',
            amount: 850000,
            status: 'pendiente',
            monthOfService: 'Enero',
            notes: 'Mora recurrente por concepto adicional de diseño responsive.'
          },
          {
            clientId: 'c2',
            projectId: 'p2',
            amount: 400000,
            status: 'pendiente',
            monthOfService: 'Marzo',
            notes: 'Cobro de ajuste de diseño retrasado por Alpha.'
          },
          {
            clientId: 'c4',
            projectId: 'p4',
            amount: 350000,
            status: 'pendiente',
            monthOfService: 'Febrero',
            notes: 'Cuota de soporte adicional de material promocional impreso.'
          }
        ]
      };
      processBatchImport(simulatedInvoices);
      showMsg('¡Archivo simulado [Facturas Pendientes] procesado de forma exitosa! Se agregaron 3 cobros en moras.', 'success');
    } else if (type === 'new_client_pack') {
      const simulatedClients = {
        clients: [
          {
            name: 'Inmobiliaria Andes SpA',
            category: 'Identidad & Catálogos',
            email: 'finanzas@andesprop.cl',
            phone: '+56 9 7788 1122'
          }
        ],
        projects: [
          {
            clientId: 'NEW_CLIENT_INDEX_0', // custom routing
            name: 'Kit de Ventas & Brochures 2026',
            budget: 1500000,
            status: 'en_progreso'
          }
        ]
      };
      processBatchImport(simulatedClients);
      showMsg('¡Paquete de Nuevo Cliente [Inmobiliaria Andes SpA] simulado e importado con éxito!', 'success');
    } else if (type === 'additional_times') {
      const simulatedLogs = {
        timeEntries: [
          {
            clientId: 'c2', // Alpha
            projectId: 'p2',
            durationHours: 12,
            date: '2026-03-12',
            description: 'Rediseño urgente de post semanal por cambio de opinión del cliente.'
          },
          {
            clientId: 'c1', // Acme
            projectId: 'p1',
            durationHours: 8,
            date: '2026-01-20',
            description: 'Correcciones de paleta cromática solicitada por gerencia.'
          }
        ]
      };
      processBatchImport(simulatedLogs);
      showMsg('¡Carga de Bitácora de Horas simulada con éxito! Revisa la actualización del tracker de horas.', 'success');
    }
  };

  const processBatchImport = (data: any) => {
    let clientMapping: Record<string, string> = {};

    // 1. Clients
    if (data.clients && Array.isArray(data.clients)) {
      data.clients.forEach((c: any, index: number) => {
        const id = onAddClient({
          name: c.name || 'Cliente Importado',
          category: c.category || 'Otros Servicios',
          email: c.email || 'importado@freelance.cl',
          phone: c.phone || '',
        });
        clientMapping[`NEW_CLIENT_INDEX_${index}`] = id;
      });
    }

    // 2. Projects
    if (data.projects && Array.isArray(data.projects)) {
      data.projects.forEach((p: any) => {
        let actualClientId = p.clientId;
        if (p.clientId && p.clientId.startsWith('NEW_CLIENT_INDEX_')) {
          actualClientId = clientMapping[p.clientId] || clients[0]?.id;
        }
        onAddProject({
          clientId: actualClientId || clients[0]?.id,
          name: p.name || 'Proyecto Importado',
          budget: p.budget || 500000,
          status: p.status || 'en_progreso',
          dateCreated: new Date().toISOString().split('T')[0],
        });
      });
    }

    // 3. Payments
    if (data.payments && Array.isArray(data.payments)) {
      data.payments.forEach((p: any) => {
        onAddPayment({
          clientId: p.clientId || clients[0]?.id,
          projectId: p.projectId || projects.find(pr => pr.clientId === p.clientId)?.id || '',
          amount: Number(p.amount) || 200000,
          status: p.status || 'pendiente',
          monthOfService: p.monthOfService || 'Enero',
          dateDue: new Date().toISOString().split('T')[0],
          notes: p.notes || 'Subido vía CSV/JSON',
          datePaid: p.status === 'pagado' ? new Date().toISOString().split('T')[0] : undefined,
        });
      });
    }

    // 4. TimeEntries
    if (data.timeEntries && Array.isArray(data.timeEntries)) {
      data.timeEntries.forEach((t: any) => {
        const seconds = t.durationSeconds || (t.durationHours ? t.durationHours * 3600 : 3600);
        onAddTimeEntryDirect({
          clientId: t.clientId || clients[0]?.id,
          projectId: t.projectId || projects.find(pr => pr.clientId === t.clientId)?.id || '',
          durationSeconds: seconds,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Desarrollo y ajustes de diseño',
        });
      });
    }
  };

  const parseCSVAndIngest = (csvText: string) => {
    // Process standard payments or client CSV
    const lines = csvText.split('\n');
    if (lines.length < 2) return;
    
    // Quick simple parser
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const isPaymentCsv = headers.includes('monto') || headers.includes('amount');

    if (isPaymentCsv) {
      const addedPayments: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const pClientId = cols[0] || clients[0]?.id;
        const pProjId = cols[1] || projects.find(p => p.clientId === pClientId)?.id || '';
        const pAmount = parseFloat(cols[2]) || 100000;
        const pStatus = (cols[3] === 'pagado' || cols[3] === 'paid') ? 'pagado' : 'pendiente';
        const pMonth = cols[4] || 'Enero';
        const pNotes = cols[5] || 'Carga Batch CSV';

        onAddPayment({
          clientId: pClientId,
          projectId: pProjId,
          amount: pAmount,
          status: pStatus as Payment['status'],
          monthOfService: pMonth as Payment['monthOfService'],
          dateDue: new Date().toISOString().split('T')[0],
          notes: pNotes,
          datePaid: pStatus === 'pagado' ? new Date().toISOString().split('T')[0] : undefined,
        });
      }
      showMsg('Planilla de Cobros interpretada y subida exitosamente desde CSV.', 'success');
    } else {
      // Treat as clients csv
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols[0]) {
          onAddClient({
            name: cols[0],
            category: cols[1] || 'Servicios Varios',
            email: cols[2] || 'contacto@cliente.cl',
            phone: cols[3] || '',
          });
        }
      }
      showMsg('Clientes nuevos importados exitosamente desde planilla CSV.', 'success');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Forms Section */}
      <div id="forms-section" className="xl:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#4F46E5]" />
            Ingreso de Datos
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Registra paso a paso las variables operativas en el sistema de control de cobros.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-gray-150 mb-6 overflow-x-auto gap-1 pb-0">
          <button
            onClick={() => setActiveForm('client')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeForm === 'client'
                ? 'border-[#4F46E5] text-[#4F46E5] bg-indigo-50/15 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-xl'
            }`}
          >
            <Building className="w-4 h-4" />
            1. Nuevo Cliente
          </button>
          <button
            onClick={() => setActiveForm('project')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeForm === 'project'
                ? 'border-[#4F46E5] text-[#4F46E5] bg-indigo-50/15 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-xl'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            2. Proyecto
          </button>
          <button
            onClick={() => setActiveForm('payment')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeForm === 'payment'
                ? 'border-[#4F46E5] text-[#4F46E5] bg-indigo-50/15 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-xl'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            3. Cobro / Pago CLP
          </button>
          <button
            onClick={() => setActiveForm('time')}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeForm === 'time'
                ? 'border-[#4F46E5] text-[#4F46E5] bg-indigo-50/15 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-xl'
            }`}
          >
            <Clock className="w-4 h-4" />
            4. Registro de Horas
          </button>
        </div>

        {/* Global Notifications inside form */}
        {uploadMessage.text && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-start gap-3 border ${
            uploadMessage.type === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
            uploadMessage.type === 'error' ? 'bg-red-50 border-red-100 text-[#EF4444]' : 'bg-blue-50 border-blue-100 text-blue-800'
          }`}>
            {uploadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />}
            <span>{uploadMessage.text}</span>
          </div>
        )}

        {/* Form 1: Client */}
        {activeForm === 'client' && (
          <form onSubmit={handleAddClientSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre o Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Inmobiliaria Andes SpA"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Especialidad / Rubro de la Empresa</label>
                <select
                  value={clientCategory}
                  onChange={(e) => setClientCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                >
                  <option value="Branding & Identidad Corporativa">Branding & Identidad Corporativa</option>
                  <option value="Diseño Web & E-commerce">Diseño Web & E-commerce</option>
                  <option value="Consultoría de Software & Desarrollos TI">Consultoría de Software & Desarrollos TI</option>
                  <option value="Marketing Digital & Campañas de Redes">Marketing Digital & Campañas de Redes</option>
                  <option value="Servicios Legales y Asesoría Tributaria">Servicios Legales y Asesoría Tributaria</option>
                  <option value="Arquitectura, Construcción & Ingeniería de Obras">Arquitectura, Construcción & Ingeniería de Obras</option>
                  <option value="Soporte Continuo & Mantenimientos">Soporte Continuo & Mantenimientos</option>
                  <option value="Servicios Médicos, Salud & Bienestar">Servicios Médicos, Salud & Bienestar</option>
                  <option value="Educación, Capacitación & Cursos Formativos">Educación, Capacitación & Cursos Formativos</option>
                  <option value="Comercio Mayorista / Minorista & Logística">Comercio Mayorista / Minorista & Logística</option>
                  <option value="Finanzas, Contabilidad & Auditorías Contables">Finanzas, Contabilidad & Auditorías Contables</option>
                  <option value="custom">Otro (Escribir rubro manualmente...)</option>
                </select>

                {clientCategory === 'custom' && (
                  <div className="mt-3 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider mb-1">Escribe tu Categoría / Rubro Personalizado *</label>
                    <input
                      type="text"
                      placeholder="Ej: Agencia de Innovación, Productora Audiovisual, Freelancer..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-white border border-indigo-205 rounded-xl px-4 py-2 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Correo Electrónico de Contacto *</label>
                <input
                  type="email"
                  placeholder="Ej: pagos@andes.cl"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono (Celular)</label>
                <input
                  type="text"
                  placeholder="Ej: +56 9 8877 6655"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold uppercase tracking-wider transition shadow-xs border-0 cursor-pointer"
            >
              Registrar Cliente
            </button>
          </form>
        )}

        {/* Form 2: Project */}
        {activeForm === 'project' && (
          <form onSubmit={handleAddProjectSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Asignar a Cliente *</label>
              <select
                value={projClientId}
                onChange={(e) => setProjClientId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                required
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre Corto del Proyecto *</label>
              <input
                type="text"
                placeholder="Ej: Rediseño Landing Campaña Invierno"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Presupuesto Acordado (CLP) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-semibold text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Ej: 1500000"
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Estado de Avance</label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                >
                  <option value="en_progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold uppercase tracking-wider transition shadow-xs border-0 cursor-pointer"
            >
              Crear Nuevo Proyecto
            </button>
          </form>
        )}

        {/* Form 3: Payment */}
        {activeForm === 'payment' && (
          <form onSubmit={handleAddPaymentSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Cliente *</label>
                <select
                  value={payClientId}
                  onChange={(e) => setPayClientId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Proyecto Relacionado *</label>
                <select
                  value={payProjId}
                  onChange={(e) => setPayProjId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                >
                  {payClientProjects.length === 0 ? (
                    <option value="">Sin proyectos activos</option>
                  ) : (
                    payClientProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Selector de modo de cobro (Requirement 3) */}
            <div className="bg-gray-50 border border-gray-150 p-4.5 rounded-xl space-y-3 shadow-xs">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Modo de Cobro (CLP)</label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setPayAmountMode('manual')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-center border cursor-pointer transition ${
                    payAmountMode === 'manual'
                      ? 'bg-[#4F46E5] text-white border-[#4F46E5] font-bold shadow-xs'
                      : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Monto Manual
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmountMode('calculated')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                    payAmountMode === 'calculated'
                      ? 'bg-[#4F46E5] text-white border-[#4F46E5] font-bold shadow-xs'
                      : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Calcular por Horas × Tarifa
                </button>
              </div>

              {payAmountMode === 'calculated' && (
                <div className="bg-white border border-indigo-100 p-4 rounded-xl space-y-3 animate-fadeIn text-xs mt-2">
                  <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">
                    <span className="font-semibold text-gray-700">Horas registradas en este proyecto:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                      {calculatedObj.hours.toFixed(1)} hrs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-black mb-1 tracking-wider">Precio por Hora:</label>
                      <select
                        value={rateCalcSource}
                        onChange={(e) => setRateCalcSource(e.target.value as any)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-[#1A1D20] focus:outline-none focus:border-[#4F46E5]"
                      >
                        <option value="project_rate">Tarifa Contratada del Proyecto</option>
                        <option value="custom_rate">Tarifa Referencial por Hora</option>
                      </select>
                    </div>

                    {rateCalcSource === 'custom_rate' && (
                      <div className="animate-fadeIn">
                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-1 tracking-wider">Escribe Tarifa por Hora (CLP):</label>
                        <input
                          type="number"
                          value={customHourlyRate}
                          onChange={(e) => setCustomHourlyRate(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-[#1A1D20] focus:outline-none focus:border-[#4F46E5]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-gray-150 flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>Fórmula:</span>
                    <span className="font-mono text-gray-800">
                      {calculatedObj.hours.toFixed(1)} hrs × ${calculatedObj.rate.toLocaleString('es-CL')}/hr
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    <span>Monto Calculado:</span>
                    <span className="font-mono text-emerald-700 text-sm">
                      ${calculatedObj.total.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Monto Final Cobro (CLP) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-semibold text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Monto"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    disabled={payAmountMode === 'calculated'}
                    className={`w-full border rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold transition shadow-xs ${
                      payAmountMode === 'calculated'
                        ? 'bg-gray-100/80 border-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5]'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Estado de Pago</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                >
                  <option value="pendiente">Pendiente (Deuda)</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mes de Servicio</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                >
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                     <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Comentarios / Notas Internas</label>
              <input
                type="text"
                placeholder="Ej: Ajuste de horas de desarrollo o cuota de servicio pendiente"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold uppercase tracking-wider transition shadow-xs border-0 cursor-pointer"
            >
              Registrar Cobro
            </button>
          </form>
        )}

        {/* Form 4: Time Entry */}
        {activeForm === 'time' && (
          <form onSubmit={handleAddTimeDirectSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Cliente *</label>
                <select
                  value={timeClientId}
                  onChange={(e) => setTimeClientId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Proyecto Asociado *</label>
                <select
                  value={timeProjId}
                  onChange={(e) => setTimeProjId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                >
                  {timeClientProjects.length === 0 ? (
                    <option value="">Sin proyectos activos</option>
                  ) : (
                    timeClientProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Horas Trabajadas Realizadas *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 4.5"
                  value={timeHours}
                  onChange={(e) => setTimeHours(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fecha del Trabajo *</label>
                <input
                  type="date"
                  value={timeDate}
                  onChange={(e) => setTimeDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descripción del Trabajo</label>
              <textarea
                placeholder="Ej: Diseñando plantillas de correo automatizados..."
                value={timeDesc}
                onChange={(e) => setTimeDesc(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#1A1D20] focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] transition shadow-xs min-h-[80px]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold uppercase tracking-wider transition shadow-xs border-0 cursor-pointer"
            >
              Cargar Registro Manual
            </button>
          </form>
        )}
      </div>

      {/* Simulator / Drag and Drop Section */}
      <div id="drag-drop-section" className="xl:col-span-5 flex flex-col justify-between gap-6">
        {/* Dropzone Container */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-white min-h-[250px] shadow-xs ${
            dragActive
              ? 'border-[#4F46E5] bg-indigo-50/15 scale-[0.99]'
              : 'border-gray-200 hover:border-[#4F46E5]'
          }`}
        >
          <div className="w-14 h-14 bg-indigo-50 text-[#4F46E5] rounded-xl flex items-center justify-center mb-4 shadow-xs">
            <Upload className="w-6 h-6 text-[#4F46E5]" />
          </div>

          <h4 className="text-base font-bold text-gray-900">Arrastra Planilla de Datos</h4>
          <p className="text-xs text-gray-400 max-w-xs mt-1.5">
            Suelta un archivo <strong>JSON</strong> o <strong>CSV</strong> de clientes o cobros para importarlos de forma automática.
          </p>

          <div className="mt-5">
            <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-gray-200 rounded-xl shadow-xs inline-block transition">
              Examinar Archivos
              <input
                type="hidden"
                value="ignored"
              />
              <input
                type="file"
                className="hidden"
                accept=".json,.csv"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>

        {/* Dynamic Simulation Presets block */}
        <div className="bg-indigo-50/15 border border-indigo-100 p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-indigo-50">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <h4 className="text-sm font-bold text-gray-900">Preset de Simulación Rápida</h4>
          </div>
          <p className="text-xs text-gray-500">
            ¿No tienes archivos a mano? Haz clic para simular la carga de un archivo de auditoría del sistema:
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => triggerSimulatedDrop('pending_invoices')}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left transition text-xs font-semibold text-gray-700 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">deudas_pendientes.csv</span>
              </div>
              <span className="text-[10px] bg-red-50 text-[#EF4444] border border-red-50 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">Cobrar</span>
            </button>

            <button
              onClick={() => triggerSimulatedDrop('new_client_pack')}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left transition text-xs font-semibold text-gray-700 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">nuevo_cliente_portafolio.json</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-50 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">Cliente</span>
            </button>

            <button
              onClick={() => triggerSimulatedDrop('additional_times')}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl text-left transition text-xs font-semibold text-gray-700 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-[#1A1D20] shrink-0" />
                <span className="truncate">logs_horas_extras_marzo.json</span>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-50 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">Horas+</span>
            </button>
          </div>

          <div className="text-[10px] text-gray-400 bg-white/50 p-3.5 border border-gray-150 rounded-xl">
            <strong>NOTA:</strong> Al presionar cualquiera se emula una lectura batch instantánea refrescando todos los KPIs de FreelanceFlow.
          </div>
        </div>
      </div>
    </div>
  );
}
