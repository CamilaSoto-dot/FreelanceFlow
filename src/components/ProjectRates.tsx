import React, { useState, useEffect } from 'react';
import { Client, Project, TimeEntry } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  Calculator, 
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  DollarSign as CurrencyIcon
} from 'lucide-react';

interface ProjectRatesProps {
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
}

export default function ProjectRates({ clients, projects, timeEntries }: ProjectRatesProps) {
  // Local state for customized hourly rates per project
  // Mapping of projectId -> Hourly Rate (CLP)
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [globalRate, setGlobalRate] = useState<number>(30000); // Default global target hourly rate

  // Load custom rates from localStorage
  useEffect(() => {
    const savedRates = localStorage.getItem('freelance_project_rates');
    if (savedRates) {
      try {
        setCustomRates(JSON.parse(savedRates));
      } catch (err) {
        console.error("Error reading saved rates custom", err);
      }
    } else {
      // Default initial rates based on standard freelance tiers
      const defaults: Record<string, number> = {
        'p1': 45000, // Acme Corp Branding
        'p2': 20000, // Alpha (Low budget continuous soporte)
        'p3': 50000, // Flores de Chile Web
        'p4': 25000  // FitLife
      };
      setCustomRates(defaults);
      localStorage.setItem('freelance_project_rates', JSON.stringify(defaults));
    }
  }, []);

  const handleUpdateRate = (projectId: string, rate: number) => {
    const updated = { ...customRates, [projectId]: Math.max(0, rate) };
    setCustomRates(updated);
    localStorage.setItem('freelance_project_rates', JSON.stringify(updated));
  };

  const formatCLP = (amount: number) => {
    return '$' + Math.round(amount).toLocaleString('es-CL');
  };

  // Helper to get client name
  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconocido';
  };

  // Calculations per project
  const projectStats = projects.map(project => {
    // Total hours logged for this project
    const projectEntries = timeEntries.filter(entry => entry.projectId === project.id);
    const totalSeconds = projectEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    const totalHours = totalSeconds / 3600;

    // Hourly rate: customized or fallback to global target
    const hourlyRate = customRates[project.id] !== undefined ? customRates[project.id] : globalRate;

    // Value of the hours invested
    const hoursInvestedValue = totalHours * hourlyRate;

    // Balance compared to original budget
    // Positive means budget covers hours under this rate. Negative means hours exceeded budget capacity.
    const isFixedCap = project.status !== 'completado'; // ongoing projects have different risks
    
    // Difference: Budget - (Hours * HourlyRate)
    const discrepancy = project.budget - hoursInvestedValue;
    const isUnderpaid = discrepancy < 0;

    // Recommended billing:
    // If it's a fixed flat rate project, recommended total is either original budget or hours worked (if exceeded)
    // If it's a continuous service, recommend charging hours * rate
    let recommendedTotalToCharge = project.budget;
    let billingReason = 'Presupuesto fijo pactado originalmente.';
    
    if (isUnderpaid) {
      // If she worked way too many hours, suggest billing for the extra hours or renegotiating a surcharge
      recommendedTotalToCharge = hoursInvestedValue;
      billingReason = `Horas invertidas superan el presupuesto contratado. Se recomienda cobrar el tiempo adicional (${formatCLP(hoursInvestedValue - project.budget)} CLP de recargo).`;
    } else if (project.id === 'p2') { 
      // Continuous support (Estudio Creativo Alpha)
      recommendedTotalToCharge = hoursInvestedValue;
      billingReason = 'Soporte mensual continuo. Debe cobrarse por horas reales trabajadas.';
    }

    return {
      project,
      clientName: getClientName(project.clientId),
      totalHours,
      hourlyRate,
      hoursInvestedValue,
      discrepancy,
      isUnderpaid,
      recommendedTotalToCharge,
      billingReason
    };
  });

  // Global summaries
  const totalHoursTracked = projectStats.reduce((sum, item) => sum + item.totalHours, 0);
  const totalEstimatedHoursValue = projectStats.reduce((sum, item) => sum + item.hoursInvestedValue, 0);
  const totalRecommendedBillings = projectStats.reduce((sum, item) => sum + item.recommendedTotalToCharge, 0);
  const totalBudgets = projects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div id="project-rates-panel" className="space-y-8 animate-fadeIn">
      
      {/* INTRO HERO */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider rounded-md">
              Módulo de Tarifas y Facturación
            </span>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#4F46E5]" />
              Tarifas por Hora & Cobros Sugeridos
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl">
              Establece tarifas justas para cada proyecto, visualiza el valor total de las horas acumuladas en el Live Tracker, e incrementa tu rentabilidad impidiendo que tus clientes absorban horas gratis.
            </p>
          </div>
          
          {/* Default Rate Set Input Card */}
          <div className="bg-gray-50/50 p-4 border border-gray-200 rounded-xl flex items-center gap-4 w-full md:w-auto shadow-xs shrink-0">
            <Sliders className="w-5 h-5 text-indigo-500 hidden sm:block" />
            <div className="space-y-1 w-full">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Tarifa General Sugerida (CLP/h)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500 font-mono">$</span>
                <input
                  type="number"
                  step="5000"
                  min="5000"
                  value={globalRate}
                  onChange={(e) => setGlobalRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-white border border-gray-300 text-gray-900 font-bold font-mono text-xs rounded-lg px-2 py-1 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-[#4F46E5]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THREE VALUE CARDS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Horas Totales Registradas y Costo Sugerido */}
        <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Esfuerzo Acumulado</span>
            <h4 className="text-3xl font-bold font-mono text-gray-950 mt-1">{totalHoursTracked.toFixed(1)} hrs</h4>
            <p className="text-[10px] text-gray-400 mt-2.5">
              Horas cronometradas mediante bitácora de clientes.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-3.5 mt-4 text-xs flex justify-between items-center text-gray-500">
            <span>Costo ideal por estas horas:</span>
            <span className="font-mono font-bold text-gray-900">{formatCLP(totalEstimatedHoursValue)}</span>
          </div>
        </div>

        {/* Card 2: Presupuestos Contratados */}
        <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Presupuestos Totales Contratados</span>
            <h4 className="text-3xl font-bold font-mono text-gray-950 mt-1">{formatCLP(totalBudgets)}</h4>
            <p className="text-[10px] text-gray-400 mt-2.5">
              Suma total de los contratos históricos/activos de Lucía.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-3.5 mt-4 text-xs flex justify-between items-center text-gray-500">
            <span>Proyectos Administrados:</span>
            <span className="font-bold text-indigo-600">{projects.length} activos</span>
          </div>
        </div>

        {/* Card 3: Presupuesto vs Valor por Hora */}
        <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 block">Sugerencia de Facturación Recomendada</span>
            <h4 className="text-3xl font-bold font-mono text-red-650 mt-1">{formatCLP(totalRecommendedBillings)}</h4>
            <p className="text-[10px] text-gray-400 mt-2.5">
              Monto recomendado a cobrar considerando tanto horas brutas trabajadas como presupuestos base.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-3.5 mt-4 text-xs flex justify-between items-center text-amber-600 font-semibold bg-amber-50/40 rounded px-2 py-0.5">
            <span>Diferencia recuperable recomendada:</span>
            <span className="font-mono font-bold">{formatCLP(totalRecommendedBillings - totalBudgets)}</span>
          </div>
        </div>

      </div>

      {/* CORE PROJECT TARIFAS TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-900 tracking-tight">
              Análisis Detallado de Cobros y Tarifas por Proyecto
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Compara directamente el costo fijo de los entregables contra el valor de horas capturadas por el Live Tracker.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Rentable
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-800 rounded-md text-[10px] font-bold uppercase">
              <AlertTriangle className="w-3.5 h-3.5 text-red-650" /> Sobretrabajado
            </span>
          </div>
        </div>

        {/* Responsive Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <th className="p-4 pl-6">Cliente y Proyecto</th>
                <th className="p-4">Presupuesto Inicial</th>
                <th className="p-4">Horas Reales</th>
                <th className="p-4 text-center">Tarifa Configurada (CLP/hr)</th>
                <th className="p-4 text-right">Valor Horas</th>
                <th className="p-4 text-center">Estado Rentabilidad</th>
                <th className="p-4 pr-6 text-right">Cobro Sugerido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projectStats.map(({ project, clientName, totalHours, hourlyRate, hoursInvestedValue, discrepancy, isUnderpaid, recommendedTotalToCharge, billingReason }) => {
                const statusColor = isUnderpaid 
                  ? 'bg-red-50 text-red-700 border-red-100' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-100';

                return (
                  <tr key={project.id} className="hover:bg-gray-50/50 transition">
                    {/* Project and Client */}
                    <td className="p-4 pl-6 space-y-1 max-w-[240px]">
                      <div className="font-bold text-gray-900 uppercase text-[11px] tracking-tight truncate">
                        {clientName}
                      </div>
                      <div className="text-gray-400 truncate" title={project.name}>
                        {project.name}
                      </div>
                    </td>

                    {/* Original Contracted Budget */}
                    <td className="p-4 font-mono font-bold text-gray-800">
                      {formatCLP(project.budget)}
                    </td>

                    {/* Tracked Hours */}
                    <td className="p-4 font-mono">
                      <span className="font-bold text-gray-900">{totalHours.toFixed(1)}</span>
                      <span className="text-gray-400 text-[10px] ml-1">hrs</span>
                    </td>

                    {/* Hourly rate: dynamic input per project */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-indigo-100 bg-white border border-gray-200. flex px-2 py-1 rounded-lg">
                        <span className="text-gray-400 text-[10px] font-mono">$</span>
                        <input
                          type="number"
                          step="2000"
                          min="0"
                          value={customRates[project.id] !== undefined ? customRates[project.id] : ''}
                          placeholder={globalRate.toString()}
                          onChange={(e) => handleUpdateRate(project.id, parseInt(e.target.value) || 0)}
                          className="w-14 bg-transparent outline-none border-none text-center font-bold font-mono text-xs text-gray-800"
                        />
                        <span className="text-gray-400 text-[9px]">/hr</span>
                      </div>
                    </td>

                    {/* Tracked Hours × Hourly Rate */}
                    <td className="p-4 text-right font-mono font-medium text-gray-600">
                      {formatCLP(hoursInvestedValue)}
                    </td>

                    {/* Profitability Status */}
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase rounded-md tracking-wider ${statusColor}`}>
                        {isUnderpaid ? 'Mora / Fuga' : 'En Margen'}
                      </span>
                    </td>

                    {/* Recommended Total To Charge */}
                    <td className="p-4 pr-6 text-right space-y-1.5">
                      <div className="font-mono font-bold text-indigo-600 text-sm">
                        {formatCLP(recommendedTotalToCharge)}
                      </div>
                      <p className="text-[9px] text-gray-400 leading-normal max-w-[200px] inline-block text-left text-xs">
                        {billingReason}
                      </p>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDUCATIONAL CAUTION BAR */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase text-amber-950 tracking-wider">
            Lógica de Acción Freelance para Lucía (Evita regalar tiempo extra)
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed">
            Cuando el **Valor de Horas Trabajadas** supera el **Presupuesto Fijo** original contratado (caso crítico de <strong>Estudio Creativo Alpha</strong> o <strong>Acme Corp S.A.</strong>), debes aplicar una cláusula de desvío de entregables. 
          </p>
          <ul className="list-disc list-inside mt-2 text-xs text-amber-900/85 pl-1 space-y-1">
            <li><strong>Cláusula de Cambios:</strong> Si el cliente pide iteraciones imprevistas, notifica inmediatamente que se facturarán de manera independiente a tu precio por hora (configurado arriba).</li>
            <li><strong>Desvío del Presupuesto de Alpha:</strong> Has invertido 95 horas en Alpha lo que equivale a {formatCLP(projectStats.find(p=>p.project.id === 'p2')?.hoursInvestedValue || 0)} bajo tu tarifa ideal, pero el presupuesto fijo de Lucía es de sólo {formatCLP(1200000)}. ¡Hay un déficit directo de {formatCLP((projectStats.find(p=>p.project.id==='p2')?.hoursInvestedValue || 0) - 1200000)}!</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
