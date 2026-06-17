import React from 'react';
import { DollarSign, Percent, AlertCircle, CheckCircle2, TrendingUp, Users, Calendar, Clock, Trash2, ShieldAlert, Coins, Info } from 'lucide-react';
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

  // Dynamic calculations
  const totalInvoiced = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pendiente').reduce((sum, p) => sum + p.amount, 0);
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

  // Find users with early debt (Enero/Febrero)
  const clientsWithEarlyDebt = clients.filter(c => {
    const clientPendingInvoices = payments.filter(p => p.clientId === c.id && p.status === 'pendiente');
    return clientPendingInvoices.some(p => p.monthOfService === 'Enero' || p.monthOfService === 'Febrero');
  });

  return (
    <div className="space-y-8">
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
              Lucía puede utilizar esta sección de evidencia inmediata ante el comité evaluador para demostrar que los siguientes clientes registran saldos pendientes correspondientes al mes de <strong>Enero o Febrero</strong>:
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
              const clientPayments = payments.filter(p => p.clientId === client.id);
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
              <p className="text-xs text-gray-400 mt-0.5">Gestión de facturación y amortizaciones de Lucía.</p>
            </div>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-indigo-50/40 p-4 rounded-xl text-xs text-[#4F46E5] mb-5 flex items-start gap-2 border border-indigo-100 font-medium">
            <Info className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
            <span>Haz clic en el estado del pago para simular cobro o haz clic en el basurero para eliminarlo.</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {payments.map(payment => {
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

            {payments.length === 0 && (
              <div className="text-center py-12 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                No hay transacciones registradas.
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
    </div>
  );
}
