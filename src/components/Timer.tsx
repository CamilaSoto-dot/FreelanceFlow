import React, { useEffect } from 'react';
import { Play, Square, CircleCheck, Info, Clock, Plus } from 'lucide-react';
import { Client, Project } from '../types';

interface TimerProps {
  clients: Client[];
  projects: Project[];
  onAddTimeEntry: (clientId: string, projectId: string, durationSeconds: number, description: string) => void;
  // Lifted States from App.tsx
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  description: string;
  setDescription: (desc: string) => void;
  saveStep: boolean;
  setSaveStep: (step: boolean) => void;
  recentSaved: boolean;
  setRecentSaved: (saved: boolean) => void;
}

export default function Timer({ 
  clients, 
  projects, 
  onAddTimeEntry,
  selectedClientId,
  setSelectedClientId,
  selectedProjectId,
  setSelectedProjectId,
  time,
  setTime,
  isActive,
  setIsActive,
  description,
  setDescription,
  saveStep,
  setSaveStep,
  recentSaved,
  setRecentSaved
}: TimerProps) {

  // Filter projects based on selected client
  const clientProjects = projects.filter(p => p.clientId === selectedClientId);

  useEffect(() => {
    // Auto-select first client if none is selected
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, setSelectedClientId]);

  useEffect(() => {
    // Auto-select first project of the selected client if client changes
    if (clientProjects.length > 0) {
      setSelectedProjectId(clientProjects[0].id);
    } else {
      setSelectedProjectId('');
    }
  }, [selectedClientId, projects, setSelectedProjectId]);

  const handleStart = () => {
    if (!selectedClientId) return;
    setIsActive(true);
    setSaveStep(false);
    setRecentSaved(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setSaveStep(true);
  };

  const handleSave = () => {
    if (!selectedClientId) return;
    const finalProject = selectedProjectId || (clientProjects[0] ? clientProjects[0].id : '');
    onAddTimeEntry(
      selectedClientId,
      finalProject,
      time,
      description.trim() || 'Sesión de trabajo cronometrada'
    );
    
    // Reset state
    setTime(0);
    setDescription('');
    setSaveStep(false);
    setRecentSaved(true);
    setTimeout(() => setRecentSaved(false), 3000);
  };

  const handleCancelSave = () => {
    setTime(0);
    setDescription('');
    setSaveStep(false);
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div id="time-tracker-card" className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider mb-2 rounded-md">
            Tracker de Horas
          </span>
          <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Cronómetro en Tiempo Real
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Control exacto por horas para justificar cada peso facturado.
          </p>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 text-[#EF4444] rounded-xl text-xs font-semibold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 bg-[#EF4444] rounded-full inline-block"></span>
            Grabando tiempo activo...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Selector Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Asociar Cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={isActive || saveStep}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Proyecto Vinculado
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isActive || saveStep || clientProjects.length === 0}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5] disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {clientProjects.length === 0 ? (
                <option value="">Sin proyectos activos</option>
              ) : (
                clientProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                     {project.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Big Counter and Action Buttons */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-2xl border border-gray-100 relative shadow-xs">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              TIEMPO TRABAJADO
            </p>
            <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-gray-900 tracking-wider tabular-nums leading-none">
              {formatTime(time)}
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center gap-4">
            {!isActive && !saveStep ? (
              <button
                onClick={handleStart}
                disabled={clients.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold uppercase text-xs tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current text-white border-0" />
                Iniciar Tracker
              </button>
            ) : isActive ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-3 bg-[#EF4444] hover:bg-red-650 text-white rounded-xl font-semibold uppercase text-xs tracking-wider shadow-xs transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 text-white fill-current" />
                Detener Tracker
              </button>
            ) : null}
          </div>

          {/* Quick-save input steps */}
          {saveStep && (
            <div className="absolute inset-0 bg-white rounded-2xl p-6 flex flex-col justify-between border border-gray-200 z-10 transition-all duration-300 shadow-sm">
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-900">Guardar registro de tiempo</h4>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Has cronometrado <span className="font-mono font-semibold text-[#EF4444] bg-red-50/70 px-1 py-0.5 rounded border border-red-100">{formatTime(time)}</span> para el cliente{' '}
                  <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                    {clients.find(c => c.id === selectedClientId)?.name}
                  </span>.
                </p>
                <input
                  type="text"
                  placeholder="¿En qué consistió la tarea? (ej: Ajustes de logo)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-3 bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-[#4F46E5]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancelSave}
                  className="px-4 py-2 text-xs font-semibold uppercase text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold uppercase rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white shrink-0" />
                  Agregar a Bitácora
                </button>
              </div>
            </div>
          )}

          {recentSaved && (
            <div className="mt-4 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
              <CircleCheck className="w-4 h-4 text-emerald-650 shrink-0" />
              ¡Tiempo guardado exitosamente!
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-[#1A1D20] p-4 bg-indigo-50/35 border border-indigo-100 rounded-xl">
        <Info className="w-5 h-5 text-[#4F46E5] shrink-0" />
        <span className="leading-relaxed">
          <strong>Lógica del Tracker:</strong> Las horas de trabajo registradas influyen directamente en la tarifa efectiva de cada cliente. Se recomienda registrar cada pequeña corrección para justificar de manera objetiva los costos extras.
        </span>
      </div>
    </div>
  );
}
