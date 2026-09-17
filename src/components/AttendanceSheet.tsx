'use client';

import { useState, useEffect } from 'react';
import { Attendance, Patient, RoleType, AttendanceType, RatesConfig } from '@/lib/types';
import { calculateSessionValue, formatBRL, formatDuration } from '@/lib/calculations';
import { X, Sparkles, Plus, Check, Clock, User, Calendar as CalendarIcon, Info } from 'lucide-react';

interface AttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (att: Partial<Attendance> & {
    patient_name: string;
    date: string;
    role: RoleType;
    duration_minutes: number;
    type: AttendanceType;
    calculated_value: number;
    notes?: string;
  }, saveAsFixedPatient?: boolean) => void;
  editingAttendance?: Attendance | null;
  patients: Patient[];
  rates: RatesConfig;
}

export default function AttendanceSheet({
  isOpen,
  onClose,
  onSave,
  editingAttendance,
  patients,
  rates,
}: AttendanceSheetProps) {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayStr());
  const [patientName, setPatientName] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>('psicologa');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [durationInput, setDurationInput] = useState<string>('45');
  const [type, setType] = useState<AttendanceType>('fixo');
  const [calculatedValue, setCalculatedValue] = useState(30);
  const [isManualValue, setIsManualValue] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveAsFixed, setSaveAsFixed] = useState(false);

  // Inicializar formulário ao abrir ou alterar edição
  useEffect(() => {
    if (editingAttendance) {
      setDate(editingAttendance.date);
      setPatientName(editingAttendance.patient_name);
      setSelectedPatientId(editingAttendance.patient_id || null);
      setRole(editingAttendance.role);
      setDurationMinutes(editingAttendance.duration_minutes);
      setDurationInput(String(editingAttendance.duration_minutes));
      setType(editingAttendance.type);
      setCalculatedValue(Number(editingAttendance.calculated_value));
      setIsManualValue(true);
      setNotes(editingAttendance.notes || '');
      setSaveAsFixed(false);
    } else {
      // Novo atendimento
      setDate(getTodayStr());
      setPatientName('');
      setSelectedPatientId(null);
      setRole('psicologa');
      setDurationMinutes(45);
      setDurationInput('45');
      setType('fixo');
      const val = calculateSessionValue('psicologa', 45, rates);
      setCalculatedValue(val);
      setIsManualValue(false);
      setNotes('');
      setSaveAsFixed(false);
    }
  }, [editingAttendance, isOpen, rates]);

  // Recalcular valor quando função ou duração mudam (se não for manual)
  useEffect(() => {
    if (!isManualValue) {
      const autoVal = calculateSessionValue(role, durationMinutes, rates);
      setCalculatedValue(autoVal);
    }
  }, [role, durationMinutes, rates, isManualValue]);

  if (!isOpen) return null;

  // Selecionar paciente fixo pré-cadastrado
  const handleSelectPatient = (p: Patient) => {
    setPatientName(p.name);
    setSelectedPatientId(p.id);
    setRole(p.default_role);
    setDurationMinutes(p.default_duration);
    setDurationInput(String(p.default_duration));
    setType('fixo');
    setIsManualValue(false);
    const autoVal = calculateSessionValue(p.default_role, p.default_duration, rates);
    setCalculatedValue(autoVal);
  };

  // Alterar Função (Psicóloga ou AT)
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setIsManualValue(false);
    if (newRole === 'psicologa') {
      const d = rates.psychology_default_duration || 45;
      setDurationMinutes(d);
      setDurationInput(String(d));
      setCalculatedValue(calculateSessionValue('psicologa', d, rates));
    } else {
      setDurationMinutes(60);
      setDurationInput('60');
      setCalculatedValue(calculateSessionValue('at', 60, rates));
    }
  };

  // Alterar Duração
  const handleDurationPreset = (minutes: number) => {
    setDurationMinutes(minutes);
    setDurationInput(String(minutes));
    setIsManualValue(false);
    setCalculatedValue(calculateSessionValue(role, minutes, rates));
  };

  // Submeter
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }

    const finalMinutes = Number(durationInput) || durationMinutes;
    if (finalMinutes <= 0) {
      alert('Por favor, informe uma duração válida em minutos.');
      return;
    }

    onSave(
      {
        id: editingAttendance?.id,
        date,
        patient_name: patientName.trim(),
        patient_id: selectedPatientId,
        role,
        duration_minutes: finalMinutes,
        type,
        calculated_value: Number(calculatedValue),
        notes: notes.trim() || undefined,
      },
      saveAsFixed
    );
    onClose();
  };

  const isExistingPatient = patients.some(
    (p) => p.name.toLowerCase() === patientName.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop clicável */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92dvh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200 z-10 animate-in slide-in-from-bottom-6 duration-200 pb-safe">
        {/* Handle visual para deslizar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header da Sheet */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingAttendance ? 'Editar Atendimento' : 'Novo Atendimento'}
            </h2>
            <p className="text-xs text-slate-500">
              Preencha os dados da sessão com cálculo instantâneo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800">
          {/* 1. Data do Atendimento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data do Atendimento
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* 2. Nome do Paciente & Chips de Pacientes Fixos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Paciente
              </label>
              <span className="text-[11px] text-slate-400">
                Toque em um paciente fixo para preencher
              </span>
            </div>

            {/* Chips rápidos de pacientes fixos */}
            {patients.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1.5 no-scrollbar">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium transition-all flex items-center gap-1 active:scale-95 ${
                      patientName.toLowerCase() === p.name.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({p.default_role === 'psicologa' ? 'Psi' : 'AT'})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Campo de texto livre para o nome */}
            <input
              type="text"
              placeholder="Digite o nome do paciente..."
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                // Verificar se bate com algum fixo
                const match = patients.find(
                  (p) => p.name.toLowerCase() === e.target.value.trim().toLowerCase()
                );
                if (match) {
                  setSelectedPatientId(match.id);
                } else {
                  setSelectedPatientId(null);
                }
              }}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />

            {/* Opção para salvar novo paciente fixo */}
            {patientName.trim().length > 1 && !isExistingPatient && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveAsFixed"
                  checked={saveAsFixed}
                  onChange={(e) => setSaveAsFixed(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="saveAsFixed" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Salvar <span className="font-semibold text-slate-900">{patientName}</span> na lista de pacientes fixos
                </label>
              </div>
            )}
          </div>

          {/* 3. Função (Psicóloga vs AT) - Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Função
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleRoleChange('psicologa')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  role === 'psicologa'
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🧠 Psicóloga</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (R$ {rates.psychology_default_rate.toFixed(0)}/45m)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('at')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  role === 'at'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🤝 AT</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (R$ {rates.at_hourly_rate.toFixed(0)}/h)
                </span>
              </button>
            </div>
          </div>

          {/* 4. Duração da Sessão */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Duração: <span className="text-indigo-600 font-bold">{formatDuration(durationMinutes)}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {role === 'psicologa' ? 'Normalmente 45 min' : 'Proporcional por minuto'}
              </span>
            </div>

            {/* Presets Rápidos */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {role === 'psicologa' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(45)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 45
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    45 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(60)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 60
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    1h (60m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(90)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 90
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    1h30 (Dupla)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(30)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 30
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    30 min
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(60)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 60
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    1h (60m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(90)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    1h30 (90m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(120)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 120
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    2h (120m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPreset(135)}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border transition-all ${
                      durationMinutes === 135
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    2h15 (135m)
                  </button>
                </>
              )}
            </div>

            {/* Campo livre de minutos & botões de ajuste rápido */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const current = Number(durationInput) || durationMinutes;
                  const next = Math.max(1, current - 15);
                  handleDurationPreset(next);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors active:scale-95"
              >
                - 15 min
              </button>

              <div className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 45"
                  value={durationInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDurationInput(raw);
                    const parsed = Number(raw);
                    if (!isNaN(parsed) && parsed > 0) {
                      setDurationMinutes(parsed);
                      setIsManualValue(false);
                      setCalculatedValue(calculateSessionValue(role, parsed, rates));
                    }
                  }}
                  className="w-16 text-center text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
                />
                <span className="text-xs text-slate-500 font-medium">minutos</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const current = Number(durationInput) || durationMinutes;
                  const next = current + 15;
                  handleDurationPreset(next);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors active:scale-95"
              >
                + 15 min
              </button>
            </div>
          </div>

          {/* 5. Tipo (Fixo vs Substituição) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo do Atendimento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setType('fixo')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'fixo'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paciente Fixo
              </button>

              <button
                type="button"
                onClick={() => setType('substituicao')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  type === 'substituicao'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔄 Substituição</span>
              </button>
            </div>
          </div>

          {/* 6. Card do Valor Calculado & Ajuste Opcional */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Valor Calculado
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-slate-900">
                  {formatBRL(calculatedValue)}
                </span>
                {!isManualValue && (
                  <span className="text-[10px] text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    Automático
                  </span>
                )}
                {isManualValue && (
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    Manual
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {role === 'psicologa'
                  ? `${durationMinutes}m (R$ ${rates.psychology_default_rate.toFixed(2)}/45m)`
                  : `${durationMinutes}m ÷ 60 × R$ ${rates.at_hourly_rate.toFixed(2)}`}
              </p>
            </div>

            <div>
              {isManualValue ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={calculatedValue}
                    onChange={(e) => setCalculatedValue(Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-right"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualValue(false);
                      setCalculatedValue(calculateSessionValue(role, durationMinutes, rates));
                    }}
                    className="text-[10px] text-indigo-600 underline ml-1"
                  >
                    Resetar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsManualValue(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                >
                  Ajustar valor
                </button>
              )}
            </div>
          </div>

          {/* 7. Observações Opcionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Sala 3, substituição da Luísa, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Botão Salvar Atendimento */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Atendimento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
