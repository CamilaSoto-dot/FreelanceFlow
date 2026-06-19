import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, AlertCircle, CheckCircle2, TrendingUp, Users, Calendar, Clock, Trash2, ShieldAlert, Coins, Info, FileSpreadsheet } from 'lucide-react';
import { Client, Project, Payment, TimeEntry } from '../types';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  timeEntries: TimeEntry[];
  onTogglePaymentStatus: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onDeleteTimeEntry: (timeId: string) => void;
}

export default function Dashboard({
  clients,
  projects,
  payments,
  timeEntries,
  onTogglePaymentStatus,
  onDeletePayment,
  onDeleteTimeEntry,
}: DashboardProps) {

  // Monthly, Quarterly, and Annual balanced filters (Requirement 4)
  const [filterType, setFilterType] = useState<'todo' | 'mensual' | 'trimestral' | 'anual'>('todo');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos'); // 'Todos' or single month
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1'); // Q1, Q2, Q3, Q4
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Filter dynamic memo calculation
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterType === 'todo') return true;
      
      if (filterType === 'mensual') {
        if (selectedMonth === 'Todos') return true;
        return p.monthOfService === selectedMonth;
      }
      
      if (filterType === 'trimestral') {
        if (selectedQuarter === 'Q1') {
          return ['Enero', 'Febrero', 'Marzo'].includes(p.monthOfService);
        } else if (selectedQuarter === 'Q2') {
          return ['Abril', 'Mayo', 'Junio'].includes(p.monthOfService);
        } else if (selectedQuarter === 'Q3') {
          return ['Julio', 'Agosto', 'Septiembre'].includes(p.monthOfService);
        } else if (selectedQuarter === 'Q4') {
          return ['Octubre', 'Noviembre', 'Diciembre'].includes(p.monthOfService);
        }
        return true;
      }
      
      if (filterType === 'anual') {
        return true; // standard 2026 dataset entries format
      }
      
      return true;
    });
  }, [payments, filterType, selectedMonth, selectedQuarter, selectedYear]);

  // Dynamic calculations based on filtered balance
  const totalInvoiced = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = filteredPayments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'pendiente').reduce((sum, p) => sum + p.amount, 0);
  const totalSeconds = timeEntries.reduce((sum, t) => sum + t.durationSeconds, 0);
  const totalHours = totalSeconds / 3600;

  const formatCLP = (amount: number) => {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  };

  const formatTimeHM = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Keep alert matching global outstanding accounts
  const clientsWithEarlyDebt = clients.filter(c => {
    const clientPendingInvoices = payments.filter(p => p.clientId === c.id && p.status === 'pendiente');
    return clientPendingInvoices.some(p => p.monthOfService === 'Enero' || p.monthOfService === 'Febrero');
  });

  // Excel / Tablet spreadsheets download center generators (Requirement 5)
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    let csvContent = "\uFEFF"; // Prepend UTF-8 BOM to guarantee Excel Spanish character compatibility
    csvContent += headers.join(";") + "\n"; // Semicolon is optimal standard for Spanish Excel LOCALE settings
    
    rows.forEach(row => {
      const escapedRow = row.map(cell => {
        const text = (cell || '').toString();
        return `"${text.replace(/"/g, '""')}"`;
      });
      csvContent += escapedRow.join(";") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClientsCSV = () => {
    const headers = [
      "ID_Cliente", 
      "Razon_Social", 
      "Rubro_Especialidad", 
      "Email_Contacto", 
      "Telefono", 
      "Monto_Recaudado_CLP", 
      "Saldo_Retenido_Deuda_CLP", 
      "Total_Facturado_CLP", 
      "Metas_Recuperacion_Porcentaje", 
      "Horas_Tracker_Acumuladas"
    ];
    
    const rows = clients.map(c => {
      const clientPayments = payments.filter(p => p.clientId === c.id);
      const paid = clientPayments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);
      const pending = clientPayments.filter(p => p.status === 'pendiente').reduce((sum, p) => sum + p.amount, 0);
      const total = paid + pending;
      const recoveryPct = total > 0 ? ((paid / total) * 10).toFixed(0) + "%" : "0%";
      
      const clientTimes = timeEntries.filter(t => t.clientId === c.id);
      const totalSecs = clientTimes.reduce((sum, t) => sum + t.durationSeconds, 0);
      const hWorked = (totalSecs / 3600).toFixed(1);
      
      return [
        c.id,
        c.name,
        c.category,
        c.email,
        c.phone || "No especificado",
        paid.toString(),
        pending.toString(),
        total.toString(),
        recoveryPct,
        hWorked
      ];
    });
    
    downloadCSV("resumen_clientes_cartera.csv", headers, rows);
  };

  const handleExportProjectsCSV = () => {
    const headers = [
      "ID_Proyecto", 
      "Cliente_Asociado", 
      "Nombre_Proyecto", 
      "Presupuesto_Acordado_CLP", 
      "Estado_Avance", 
      "Fecha_Ingreso"
    ];
    
    const rows = projects.map(p => {
      const client = clients.find(c => c.id === p.clientId);
      return [
        p.id,
        client ? client.name : "No especificado",
        p.name,
        p.budget.toString(),
        p.status,
        p.dateCreated || "Sin registro"
      ];
    });
    
    downloadCSV("consolidado_proyectos_avances.csv", headers, rows);
  };

  const handleExportDiagnosticsCSV = () => {
    const headers = ["Metrica_Diagnostico", "Valor_Calculado_Analisis"];
    
    const totalTransactions = filteredPayments.length;
    const pendingCount = filteredPayments.filter(p => p.status === 'pendiente').length;
    const recoveredRatio = totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : "0";
    const totalHoursTracked = (timeEntries.reduce((sum, t) => sum + t.durationSeconds, 0) / 3600).toFixed(1);
    
    const rows = [
      ["Concepto Facturado General", formatCLP(totalInvoiced)],
      ["Ingresos Recaudados", formatCLP(totalPaid)],
      ["Saldo Total Retenido (Deuda)", formatCLP(totalPending)],
      ["Porcentaje de Recuperabilidad", `${recoveredRatio}%`],
      ["Cantidad de Cobros Emitidos", totalTransactions.toString()],
      ["Cantidad de Cobros en Mora", pendingCount.toString()],
      ["Detalle de Horas en Tracker", `${totalHoursTracked} hrs`],
      ["Estado General Financiero", parseFloat(recoveredRatio) < 65 ? "Mora Crítica (Requiere Cobranza)" : "Saludable"],
      ["Plan Accion Contable Directo", `Se registra un total consolidado de deudas de ${formatCLP(totalPending)} CLP correspondiente al periodo filtrado. Se aconseja utilizar el tracker tecnico de horas para respaldar las solicitudes de regularizacion de flujos de manera perentoria ante el docente.`]
    ];
    
    downloadCSV("diagnostico_cartera_auditoria.csv", headers, rows);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* FILTER CONTROL PANEL (Requirement 4) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-xl border border-indigo-100 shadow-2xs shrink-0">
            <Calendar className="w-5 h-5 text-[#4F46E5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
              Filtro de Período y Deudas
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">Controla el balance mensual, trimestral o anual de cobros.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
            <button
              onClick={() => { setFilterType('todo'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'todo'
                  ? 'bg-white text-[#4F46E5] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              General
            </button>
            <button
              onClick={() => { setFilterType('mensual'); setSelectedMonth('Todos'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'mensual'
                  ? 'bg-white text-[#4F46E5] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => { setFilterType('trimestral'); setSelectedQuarter('Q1'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'trimestral'
                  ? 'bg-white text-[#4F46E5] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => { setFilterType('anual'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'anual'
                  ? 'bg-white text-[#4F46E5] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Anual
            </button>
          </div>

          {filterType === 'mensual' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#1A1D20] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-150 cursor-pointer"
            >
              <option value="Todos">Todos los Meses</option>
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                 <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {filterType === 'trimestral' && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#1A1D20] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-150 cursor-pointer"
            >
              <option value="Q1">1° Trimestre (Ene - Mar)</option>
              <option value="Q2">2° Trimestre (Abr - Jun)</option>
              <option value="Q3">3° Trimestre (Jul - Sep)</option>
              <option value="Q4">4° Trimestre (Oct - Dic)</option>
            </select>
          )}

          {filterType === 'anual' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#1A1D20] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-150 cursor-pointer"
            >
              <option value="2026">Año Fiscal 2026</option>
            </select>
          )}

          {filterType !== 'todo' && (
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold uppercase px-2.5 py-1.5 rounded-lg tracking-wider">
              Filtrado
            </span>
          )}
        </div>
      </div>
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Facturado */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between transition duration-150 hover:shadow-xs hover:border-gray-300">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total Facturado</span>
            <span className="text-2xl font-bold text-[#1A1D20] mt-1.5 block tracking-tight">
              {formatCLP(totalInvoiced)}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Consolidado general</span>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-[#4F46E5] rounded-xl flex items-center justify-center shadow-xs">
            <Coins className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Recaudado / Pagado */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between transition duration-150 hover:shadow-xs hover:border-gray-300">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Ingresos Recibidos</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1.5 block tracking-tight">
              {formatCLP(totalPaid)}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 inline-block font-medium uppercase mt-1 tracking-wider rounded-md">
              {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(0) : 0}% COBRADO
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Cuentas Por Cobrar (Pendiente) */}
        <div className="bg-white border border-red-100 p-6 rounded-2xl shadow-xs flex items-center justify-between relative overflow-hidden transition duration-150 hover:shadow-xs hover:border-red-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF4444]"></div>
          <div>
            <span className="text-[11px] font-semibold text-[#EF4444] uppercase tracking-wider block">Cuentas por Cobrar</span>
            <span className="text-2xl font-bold text-[#EF4444] mt-1.5 block tracking-tight">
              {formatCLP(totalPending)}
            </span>
            <span className="text-xs text-[#EF4444]/80 mt-1 block">
              Deudas activas retenidas
            </span>
          </div>
          <div className="w-11 h-11 bg-red-50 text-[#EF4444] rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5.5 h-5.5 animate-pulse" />
          </div>
        </div>

        {/* Total de horas cronometradas */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between transition duration-150 hover:shadow-xs hover:border-gray-300">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Horas Cronometradas</span>
            <span className="text-2xl font-bold text-[#1A1D20] mt-1.5 block font-mono">
              {totalHours.toFixed(1)} hrs
            </span>
            <span className="text-xs text-gray-400 mt-1 block">
              Equivalente: {formatTimeHM(totalSeconds)}
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5.5 h-5.5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 2. CRITICAL DEBT ALERTS SECTION (Lucía's Evidence Tool) */}
      {clientsWithEarlyDebt.length > 0 && (
        <div className="bg-white border border-red-100 text-gray-900 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start justify-between relative overflow-hidden shadow-xs">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#EF4444]"></div>
          <div className="space-y-2.5 max-w-2xl min-w-0 pl-1.5">
            <div className="flex items-center gap-2 text-[#EF4444] font-bold uppercase tracking-wider text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#EF4444]" />
              ¡ALERTA DE MOROSIDAD CRÍTICA DESDE ENERO!
            </div>
            <h4 className="text-lg font-bold tracking-tight text-gray-900">
              Deudas impagas retenidas por clientes desde principios de año
            </h4>
            <p className="text-sm text-gray-600">
              El sistema identifica de manera automática aquellos clientes que registran deudas pendientes críticas correspondientes al mes de <strong>Enero o Febrero</strong>:
            </p>
            
            <div className="flex flex-wrap gap-2 mt-3.5">
              {clientsWithEarlyDebt.map(c => {
                const pendingAmt = payments
                  .filter(p => p.clientId === c.id && p.status === 'pendiente')
                  .reduce((sum, p) => sum + p.amount, 0);
                
                return (
                  <span key={c.id} className="bg-red-50 text-[#EF4444] border border-red-100 px-3 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider">
                    {c.name}: {formatCLP(pendingAmt)} (Servicios Ene/Feb)
                  </span>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 text-[#1A1D20] border border-gray-150 p-4.5 rounded-xl text-xs space-y-1.5 md:max-w-xs shrink-0 self-center shadow-xs">
            <p className="font-semibold text-[#EF4444] uppercase text-[10px] tracking-wider">Acción Comercial Correctiva</p>
            <p className="text-gray-500 leading-relaxed font-normal">
              El sistema registra estas asimetrías de flujo y permite realizar una descarga de auditoría contable inapelable ante clientes para reactivar la cobranza.
            </p>
          </div>
        </div>
      )}

      {/* 3. CLIENT AND PAYMENT ANALYSIS TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Client Status with Progress and Debt Indicators */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">Clientes y Estado de Cobros</h3>
              <p className="text-xs text-gray-400 mt-0.5">Indicadores de moras tempranas y efectividad de recaudación.</p>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {clients.map(client => {
              const clientPayments = filteredPayments.filter(p => p.clientId === client.id);
              const paidAmount = clientPayments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);
              const pendingAmount = clientPayments.filter(p => p.status === 'pendiente').reduce((sum, p) => sum + p.amount, 0);
              const totalAmount = paidAmount + pendingAmount;
              
              // Status classification
              const hasJanuaryDebt = clientPayments.some(p => p.status === 'pendiente' && (p.monthOfService === 'Enero' || p.monthOfService === 'Febrero'));
              const hasDebt = pendingAmount > 0;

              let statusText = 'Al Día';
              let statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
              if (hasJanuaryDebt) {
                statusText = 'Mora Crítica (Ene/Feb) 🚨';
                statusColor = 'bg-red-50 text-[#EF4444] border-red-100';
              } else if (hasDebt) {
                statusText = 'Mora Pendiente';
                statusColor = 'bg-amber-50 text-amber-800 border-amber-100';
              }

              // Paid Percentage
              const progressPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

              return (
                <div key={client.id} className="border border-gray-100 rounded-xl p-4.5 bg-white transition hover:bg-gray-50/20 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{client.name}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{client.category}</span>
                    </div>

                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg border uppercase tracking-wider ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Finances Brief breakdown */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4 bg-gray-50/50 border border-gray-100 p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Recaudado</span>
                      <span className="text-emerald-700 font-bold text-sm">{formatCLP(paidAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Monto Retenido</span>
                      <span className={`text-sm font-bold ${pendingAmount > 0 ? 'text-[#EF4444]' : 'text-gray-700'}`}>{formatCLP(pendingAmount)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-semibold uppercase">
                      <span className="text-gray-400 font-medium tracking-wide">Recuperabilidad del Flujo</span>
                      <span className="text-gray-700">{progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-150 h-2.5 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-300 ${hasJanuaryDebt ? 'bg-[#EF4444]' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Invoices & Payments detailed list */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">Cobros Registrados</h3>
              <p className="text-xs text-gray-400 mt-0.5">Gestión de facturación y amortizaciones del sistema de control.</p>
            </div>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-indigo-50/40 p-4 rounded-xl text-xs text-[#4F46E5] mb-5 flex items-start gap-2 border border-indigo-100 font-medium">
            <Info className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
            <span>Haz clic en el estado del pago para simular cobro o haz clic en el basurero para eliminarlo.</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredPayments.map(payment => {
              const client = clients.find(c => c.id === payment.clientId);
              const isPaid = payment.status === 'pagado';

              return (
                <div key={payment.id} className="p-3.5 bg-white border border-gray-150 hover:border-gray-250 hover:bg-gray-50/20 rounded-xl flex items-center justify-between gap-3 shadow-xs transition duration-150">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate">
                      {client ? client.name : 'Cliente Desconocido'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 font-medium uppercase mt-1">
                      <span className="bg-gray-100 border border-gray-150 px-1.5 py-0.2 rounded text-gray-600">Mes: {payment.monthOfService}</span>
                      {payment.notes && <span className="truncate max-w-[140px] italic">"{payment.notes}"</span>}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {formatCLP(payment.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onTogglePaymentStatus(payment.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer transform active:scale-95 border ${
                        isPaid 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                          : 'bg-red-50 border-red-50 text-[#EF4444] hover:bg-red-100/50'
                      }`}
                      title="Cambiar estado del cobro"
                    >
                      {isPaid ? 'Pagado' : 'Pendiente'}
                    </button>

                    <button
                      onClick={() => onDeletePayment(payment.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50/40 rounded-lg transition"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                No hay transacciones registradas para el período seleccionado.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. TIME TRACK BITÁCORA LIST */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">Bitácora de Horas Cronometradas</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sustento técnico de horas trabajadas para contrastar con tarifas fijas.</p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Cliente / Proyecto</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Duración</th>
                <th className="py-3 px-4 text-left">Descripción del Trabajo</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {timeEntries.map(entry => {
                const client = clients.find(c => c.id === entry.clientId);
                const project = projects.find(p => p.id === entry.projectId);

                return (
                  <tr key={entry.id} className="hover:bg-gray-50/30 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="text-sm">{client?.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{project?.name || 'Soporte Continuo'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-right text-indigo-600 whitespace-nowrap text-sm">
                      {formatTimeHM(entry.durationSeconds)} <span className="text-[10px] text-gray-400 uppercase font-normal">({(entry.durationSeconds/3600).toFixed(1)} hrs)</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteTimeEntry(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50/40 rounded-lg transition inline-flex justify-center"
                        title="Eliminar bitácora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    No hay registros de horas marcadas en el tracker.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DATA EXPORT CENTER (Requirement 5) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#4F46E5]" />
              Centro de Descarga e Informes de Auditoría
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Descarga planillas consolidadas de clientes y diagnósticos 100% compatibles con Excel, Tablets y Computadores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Clients Ledger spreadsheet */}
          <div className="bg-gray-50 hover:bg-indigo-50/15 border border-gray-200 border-dashed rounded-xl p-4 flex flex-col justify-between gap-4 transition text-left">
            <div>
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase text-[9px] font-bold px-2 py-0.5 rounded-lg inline-block tracking-wider mb-2.5">
                Cartera General
              </div>
              <h4 className="text-xs font-black text-gray-900 uppercase">Planilla de Clientes</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Consolidado catastral de clientes rubros, balances acumulados, metas de cobranza y volumen de horas.
              </p>
            </div>
            <button
              onClick={handleExportClientsCSV}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer border-0"
            >
              Descargar Clientes (.csv)
            </button>
          </div>

          {/* Card 2: Projects Ledger spreadsheet */}
          <div className="bg-gray-50 hover:bg-indigo-50/15 border border-gray-200 border-dashed rounded-xl p-4 flex flex-col justify-between gap-4 transition text-left">
            <div>
              <div className="bg-indigo-50 text-indigo-800 border border-indigo-100 uppercase text-[9px] font-bold px-2 py-0.5 rounded-lg inline-block tracking-wider mb-2.5">
                Proyectos y Avances
              </div>
              <h4 className="text-xs font-black text-gray-900 uppercase">Planilla de Proyectos</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Presupuestos por proyecto, estado de avance, y correspondencia de clientes de la base actulizada.
              </p>
            </div>
            <button
              onClick={handleExportProjectsCSV}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer border-0"
            >
              Descargar Proyectos (.csv)
            </button>
          </div>

          {/* Card 3: Diagnostic Brief spreadsheet */}
          <div className="bg-gray-50 hover:bg-indigo-50/15 border border-gray-200 border-dashed rounded-xl p-4 flex flex-col justify-between gap-4 transition text-left">
            <div>
              <div className="bg-amber-50 text-amber-800 border border-amber-100 uppercase text-[9px] font-bold px-2 py-0.5 rounded-lg inline-block tracking-wider mb-2.5">
                Informe Diagnóstico
              </div>
              <h4 className="text-xs font-black text-gray-900 uppercase">Métricas & Diagnóstico</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Matriz de KPIs generales, tasas críticas de mora contable y rentabilidad general calculada.
              </p>
            </div>
            <button
              onClick={handleExportDiagnosticsCSV}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer border-0"
            >
              Descargar Diagnóstico (.csv)
            </button>
          </div>
        </div>

        {/* JSON Backup export */}
        <div className="mt-5 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 text-indigo-950">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span>¿Auditoría total? Exporta o respalda la base de datos completa del sistema:</span>
          </div>
          <button
            onClick={() => {
              const fullBackup = { clients, projects, payments, timeEntries };
              const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", "freelanceflow_backup_completo.json");
              link.click();
            }}
            className="whitespace-nowrap bg-white hover:bg-gray-50 text-indigo-700 font-bold px-4 py-2 border border-indigo-200 rounded-xl shadow-xs transition cursor-pointer text-xs uppercase"
          >
            Exportar Respaldos JSON completos
          </button>
        </div>
      </div>

    </div>
  );
}
