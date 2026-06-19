import React, { useState } from 'react';
import { HelpCircle, ChevronRight, TrendingUp, AlertTriangle, AlertCircle, CircleCheck, Info, Sparkles, Award, Clock, Calendar } from 'lucide-react';
import { Client, Project, Payment, TimeEntry } from '../types';

interface BusinessAnswersProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  timeEntries: TimeEntry[];
}

export default function BusinessAnswers({
  clients,
  projects,
  payments,
  timeEntries,
}: BusinessAnswersProps) {
  const [activeTab, setActiveTab] = useState<'q1' | 'q2' | 'q3'>('q1');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // States for diagnostic filters (Requirement 1 & 4)
  const [filterType, setFilterType] = useState<'todo' | 'mensual' | 'trimestral' | 'anual'>('todo');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Trigger analytical simulation delay
  const handleRecalculate = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 750);
  };

  // ----------------------------------------------------
  // PREGUNTA 1: Balance Mensual (Mapeo de Facturado vs Cuentas Por Cobrar)
  // ----------------------------------------------------
  // Filtered payments specifically for the Diagnostic Balance (Requirement 1 requested specifically here)
  const filteredPaymentsQ1 = React.useMemo(() => {
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
        return true;
      }
      
      return true;
    });
  }, [payments, filterType, selectedMonth, selectedQuarter, selectedYear]);

  // Aggregate stats based on filtered subsets for diagnostic integrity
  const totalFacturado = filteredPaymentsQ1.reduce((sum, p) => sum + p.amount, 0);
  const totalPagado = filteredPaymentsQ1.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);
  const totalCuentasPorCobrar = filteredPaymentsQ1.filter(p => p.status === 'pendiente').reduce((sum, p) => sum + p.amount, 0);

  // Debt percentage of selected period
  const debtPercentage = totalFacturado > 0 ? (totalCuentasPorCobrar / totalFacturado) * 100 : 0;

  // ----------------------------------------------------
  // PREGUNTA 2: Rentabilidad de Clientes (Cruce de Datos)
  // Genera más ingresos vs Consume más horas
  // ----------------------------------------------------
  const clientAnalysisList = clients.map(client => {
    // Total income from this client (both paid and pending)
    const clientPayments = payments.filter(p => p.clientId === client.id);
    const totalRevenue = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidRevenue = clientPayments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.amount, 0);

    // Total tracked hours
    const clientTimes = timeEntries.filter(t => t.clientId === client.id);
    const totalDurationSeconds = clientTimes.reduce((sum, t) => sum + t.durationSeconds, 0);
    const totalHours = totalDurationSeconds / 3600;

    // Effective rate
    const effectiveRate = totalHours > 0 ? totalPaidRevenue / totalHours : 0;

    return {
      client,
      totalRevenue,
      totalPaidRevenue,
      totalHours,
      effectiveRate,
    };
  });

  // Client with most revenue
  let maxRevenueClient = clientAnalysisList.reduce((max, current) => 
    current.totalRevenue > (max?.totalRevenue || 0) ? current : max
  , clientAnalysisList[0]);

  // Client with most hours consumed
  let maxHoursClient = clientAnalysisList.reduce((max, current) => 
    current.totalHours > (max?.totalHours || 0) ? current : max
  , clientAnalysisList[0]);

  // ----------------------------------------------------
  // PREGUNTA 3: Tarifa Efectiva Real (Ingresos Percibidos / Horas Registradas)
  // ----------------------------------------------------
  // We sort clients by effective rate to show who is the most profitable
  const sortedByRate = [...clientAnalysisList].sort((a, b) => b.effectiveRate - a.effectiveRate);

  const formatCLP = (amount: number) => {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  };  return (
    <div id="analytics-panel-card" className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
            Lógica de Negocio y Análisis de Decisiones
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Respuestas dinámicas de control contable y optimización de cartera financiera.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 text-white ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Procesando Variables...' : 'Analizar & Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation / Diagnostic select tabs */}
        <div className="lg:col-span-4 space-y-3">
          <button
            onClick={() => setActiveTab('q1')}
            className={`w-full flex items-center justify-between text-left p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'q1'
                ? 'bg-indigo-50 border-indigo-200 text-[#4F46E5] font-bold shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className={`text-[9px] uppercase font-bold tracking-wider block ${activeTab === 'q1' ? 'text-[#4F46E5]' : 'text-gray-400'}`}>Pregunta de Negocio 1</span>
              <p className="font-bold text-xs truncate mt-1 text-gray-900">Balance Mensual de Deudas</p>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === 'q1' ? 'text-[#4F46E5]' : 'text-gray-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('q2')}
            className={`w-full flex items-center justify-between text-left p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'q2'
                ? 'bg-indigo-50 border-indigo-200 text-[#4F46E5] font-bold shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className={`text-[9px] uppercase font-bold tracking-wider block ${activeTab === 'q2' ? 'text-[#4F46E5]' : 'text-gray-400'}`}>Pregunta de Negocio 2</span>
              <p className="font-bold text-xs truncate mt-1 text-gray-900">Rentabilidad de Clientes</p>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === 'q2' ? 'text-[#4F46E5]' : 'text-gray-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('q3')}
            className={`w-full flex items-center justify-between text-left p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'q3'
                ? 'bg-indigo-50 border-indigo-200 text-[#4F46E5] font-bold shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className={`text-[9px] uppercase font-bold tracking-wider block ${activeTab === 'q3' ? 'text-[#4F46E5]' : 'text-gray-400'}`}>Pregunta de Negocio 3</span>
              <p className="font-bold text-xs truncate mt-1 text-gray-900">Tarifa Efectiva Real</p>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === 'q3' ? 'text-[#4F46E5]' : 'text-gray-400'}`} />
          </button>

          <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1.5 shadow-xs">
            <p className="font-bold uppercase tracking-wider text-[10px] text-[#4F46E5]">Simulación del Sistema</p>
            <p className="leading-relaxed text-gray-700 font-medium">
              Las consultas diagnósticas consolidan cobros emitidos, estados de pago (<em>Enero</em> a la fecha) y bitácoras cronometradas. El cálculo es analógico en tiempo real.
            </p>
          </div>
        </div>

        {/* Content Panel Area */}
        <div className="lg:col-span-8 bg-gray-50/50 border border-gray-200 rounded-2xl p-6 md:p-8 min-h-[360px] relative overflow-hidden shadow-xs">
          {analyzing && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-2 border-indigo-100 border-t-[#4F46E5] rounded-full animate-spin mb-4"></div>
              <h4 className="text-sm font-bold uppercase text-gray-950">Cruzando Variables...</h4>
              <p className="text-xs text-gray-500 mt-1">Recalculando ingresos vs horas reales en CLP.</p>
            </div>
          )}

          {/* TAB 1: Balance Facturado vs Deudas pendientes */}
          {activeTab === 'q1' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-start justify-between pb-3 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight text-gray-900">Mapeo Mensual: Facturado v/s Deuda</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Dinámica contable que demuestra la morosidad acumulada del negocio.</p>
                </div>
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </div>

              {/* FILTROS DE PERÍODO Y DEUDAS (Punto de Diagnóstico de Balance) */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <Calendar className="w-4.5 h-4.5 text-[#4F46E5]" />
                  <span>Filtrar Período de Diagnóstico actual</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px] font-bold">
                    <button
                      onClick={() => setFilterType('todo')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer border-0 ${
                        filterType === 'todo'
                          ? 'bg-white text-[#4F46E5] shadow-3xs font-extrabold'
                          : 'text-gray-500 hover:text-gray-900 bg-transparent'
                      }`}
                    >
                      General
                    </button>
                    <button
                      onClick={() => { setFilterType('mensual'); setSelectedMonth('Todos'); }}
                      className={`px-3 py-1 rounded-md transition cursor-pointer border-0 ${
                        filterType === 'mensual'
                          ? 'bg-white text-[#4F46E5] shadow-3xs font-extrabold'
                          : 'text-gray-500 hover:text-gray-900 bg-transparent'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      onClick={() => { setFilterType('trimestral'); setSelectedQuarter('Q1'); }}
                      className={`px-3 py-1 rounded-md transition cursor-pointer border-0 ${
                        filterType === 'trimestral'
                          ? 'bg-white text-[#4F46E5] shadow-3xs font-extrabold'
                          : 'text-gray-500 hover:text-gray-900 bg-transparent'
                      }`}
                    >
                      Trimestral
                    </button>
                    <button
                      onClick={() => setFilterType('anual')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer border-0 ${
                        filterType === 'anual'
                          ? 'bg-white text-[#4F46E5] shadow-3xs font-extrabold'
                          : 'text-gray-500 hover:text-gray-900 bg-transparent'
                      }`}
                    >
                      Anual
                    </button>
                  </div>

                  {filterType === 'mensual' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-[#1A1D20] font-semibold focus:outline-none cursor-pointer"
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
                      className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-[#1A1D20] font-bold focus:outline-none cursor-pointer"
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
                      className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-[#1A1D20] font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="2026">Año Fiscal 2026</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">Total Facturado Emitido</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">{formatCLP(totalFacturado)}</div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase mt-2.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                    Suma total de cobros registrados
                  </p>
                </div>

                <div className="bg-red-50/70 p-5 rounded-xl border border-red-100 shadow-xs relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 text-red-650">
                    <AlertCircle className="w-24 h-24 text-[#EF4444]" />
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-red-600 block">Cuentas por Cobrar (Deuda)</span>
                  <div className="text-2xl font-bold text-red-600 mt-1 font-mono">{formatCLP(totalCuentasPorCobrar)}</div>
                  <p className="text-[10px] text-red-600 mt-2.5 flex items-center gap-1.5 font-semibold uppercase">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    Dinero retenido en facturas impagas
                  </p>
                </div>
              </div>

              {/* Progress Bar Representation */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3.5 shadow-xs">
                <div className="flex justify-between items-center text-xs font-semibold uppercase">
                  <span className="text-gray-500">Porcentaje de Cobros en Mora:</span>
                  <span className="text-red-600 text-sm font-bold font-mono">
                    {totalFacturado > 0 ? ((totalCuentasPorCobrar / totalFacturado) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden relative border border-gray-100">
                  <div 
                    className="bg-[#EF4444] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, totalFacturado > 0 ? (totalCuentasPorCobrar / totalFacturado) * 100 : 0)}%` }}
                  ></div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3 mt-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Impacto en Flujo de Caja:</strong> Hay clientes con pagos vencidos desde el mes de <strong>Enero</strong> (p.ej., Acme Corp S.A. y Gimnasio FitLife). Se está cubriendo la operación con tiempo de trabajo mientras ocurren retrasos en los desembolsos.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cruzamiento de rentabilidad de clientes */}
          {activeTab === 'q2' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-start justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-bold uppercase text-gray-900">Cruce de Rentabilidad: Ingresos v/s Horas</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Identificación inmediata de desviaciones críticas en los clientes.</p>
                </div>
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max Cash Client */}
                <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg">
                    <Award className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-500 block">MAYOR GENERADOR DE INGRESOS</span>
                  <h5 className="font-bold uppercase text-xs text-gray-900 mt-3 truncate">
                    {maxRevenueClient ? maxRevenueClient.client.name : 'No hay datos'}
                  </h5>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {maxRevenueClient ? formatCLP(maxRevenueClient.totalRevenue) : '$0'}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2.5 leading-snug">
                    Corresponde a la facturación total pactada. Una alta suma, pero ojo con las retenciones de pago.
                  </p>
                </div>

                {/* Max Hours Client */}
                <div className="bg-white p-5 rounded-xl border border-red-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-[#EF4444] bg-red-50 border border-red-100 p-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-red-550" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-red-600 block">MAYOR CONSUMIDOR DE HORAS</span>
                  <h5 className="font-bold uppercase text-xs text-gray-900 mt-3 truncate">
                    {maxHoursClient ? maxHoursClient.client.name : 'No hay datos'}
                  </h5>
                  <div className="text-2xl font-bold text-[#EF4444] mt-1 font-mono">
                    {maxHoursClient ? `${maxHoursClient.totalHours.toFixed(1)} Horas` : '0 Horas'}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2.5 leading-snug">
                    Este cliente está acaparando la mayor parte de la agenda operativa mensual.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs text-indigo-900 font-medium shadow-xs">
                <h5 className="font-bold flex items-center gap-1.5 mb-2.5 text-[#4F46E5] uppercase">
                  <Info className="w-4.5 h-4.5 text-[#4F46E5]" />
                  Diagnóstico Revelador del Conflicto Freelance:
                </h5>
                <p className="leading-relaxed text-gray-700">
                  {maxHoursClient && maxRevenueClient && maxHoursClient.client.id !== maxRevenueClient.client.id ? (
                    <span>
                      ¡Alerta de asimetría! Mientras <strong>{maxRevenueClient.client.name}</strong> es quien más valor monetario inyecta al negocio ({formatCLP(maxRevenueClient.totalRevenue)}), <strong>{maxHoursClient.client.name}</strong> es el que vacía tus recursos temporales acaparando <strong>{maxHoursClient.totalHours.toFixed(1)} horas de trabajo</strong> logradas. Esto explica el escenario de alta carga de trabajo técnica pero con limitado flujo de caja inmediato.
                    </span>
                  ) : (
                    <span>
                      Ambas métricas coinciden en el mismo cliente. El control estricto de horas permitirá negociar cobros adicionales de forma inapelable en base al contrato.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Calculador de tarifa de eficiencia real */}
          {activeTab === 'q3' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-bold uppercase text-gray-900">Métrica de Eficiencia: Tarifa Efectiva Real</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Calculada dividiendo los ingresos reales percibidos entre las horas registradas.</p>
                </div>
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-500 font-medium">
                <span className="font-mono bg-gray-100 rounded-lg border border-gray-200 px-2 py-0.5 text-gray-900 font-semibold leading-none mr-2">Tarifa Efectiva Real</span> = (Ingresos Percibidos / Horas Reales Cronometradas)
              </div>

              <div className="space-y-4">
                {sortedByRate.map((item, index) => {
                  const rate = item.effectiveRate;
                  const isLow = rate < 10000;
                  const isOutstanding = rate > 40000;

                  return (
                    <div key={item.client.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2 border-b border-gray-100 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                          <span className="font-bold text-xs text-gray-900 uppercase tracking-tight">{item.client.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Tarifa Efectiva:</span>
                          <span className={`font-mono text-base font-bold ${isLow ? 'text-red-500' : isOutstanding ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {formatCLP(rate)} <span className="text-[10px] font-semibold text-gray-400">/ hora</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center py-1 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Cobros Recibidos</span>
                          <span className="font-semibold text-gray-700 font-mono">{formatCLP(item.totalPaidRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Horas de Tracker</span>
                          <span className="font-semibold text-gray-700 font-mono">{item.totalHours.toFixed(1)} hrs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Estado General</span>
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full mt-1 ${
                            isLow ? 'bg-red-50 text-red-650 border border-red-100' : isOutstanding ? 'bg-emerald-55/65 text-emerald-800 border border-emerald-100' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}>
                            {isLow ? 'Déficit Crítico' : isOutstanding ? 'Excelente' : 'Aceptable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs text-indigo-900 mt-2 font-medium">
                <strong>Análisis Diagnóstico de Rentabilidad:</strong> Permite identificar de manera inequívoca qué clientes rinden tarifas excepcionales y cuáles representan retrasos u horas extraordinarias desmedidas en relación a los ingresos. Entrega argumentos técnicos e incontestables para respaldar la readecuación de honorarios.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
