'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import PeriodSummaryCard from '@/components/PeriodSummaryCard';
import AttendanceItem from '@/components/AttendanceItem';
import AttendanceSheet from '@/components/AttendanceSheet';
import ExportReportModal from '@/components/ExportReportModal';
import MarkPaidModal from '@/components/MarkPaidModal';
import {
  Attendance,
  Patient,
  PeriodPayment,
  RatesConfig,
  RoleType,
  UserProfile,
} from '@/lib/types';
import {
  getAttendances,
  saveAttendance,
  deleteAttendance,
  getPatients,
  savePatient,
  getPeriodPayments,
  savePeriodPayment,
  getUserProfile,
} from '@/lib/storage';
import {
  getPeriodForDate,
  summarizePeriod,
  DEFAULT_RATES,
} from '@/lib/calculations';
import { Plus, Filter, Calendar, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [periodPayments, setPeriodPayments] = useState<Record<string, PeriodPayment>>({});
  const [loading, setLoading] = useState(true);

  // Modais e Sheets
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filtro de exibição na lista
  const [roleFilter, setRoleFilter] = useState<'todos' | 'psicologa' | 'at' | 'substituicao'>('todos');

  // Carregar dados
  const loadData = async () => {
    try {
      const [profData, patData, attData, payData] = await Promise.all([
        getUserProfile(),
        getPatients(),
        getAttendances(),
        getPeriodPayments(),
      ]);
      setProfile(profData);
      setPatients(patData);
      setAttendances(attData);
      setPeriodPayments(payData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rates: RatesConfig = useMemo(() => {
    return {
      psychology_default_rate: profile?.psychology_default_rate ?? DEFAULT_RATES.psychology_default_rate,
      psychology_default_duration: profile?.psychology_default_duration ?? DEFAULT_RATES.psychology_default_duration,
      at_hourly_rate: profile?.at_hourly_rate ?? DEFAULT_RATES.at_hourly_rate,
      cutoff_day: profile?.cutoff_day ?? DEFAULT_RATES.cutoff_day,
    };
  }, [profile]);

  // Período Atual calculado com base no dia de corte
  const currentPeriodInfo = useMemo(() => {
    return getPeriodForDate(new Date(), rates.cutoff_day);
  }, [rates.cutoff_day]);

  // Atendimentos que pertencem ao período atual
  const currentPeriodAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const attPeriod = getPeriodForDate(att.date, rates.cutoff_day);
      return attPeriod.periodKey === currentPeriodInfo.periodKey;
    });
  }, [attendances, currentPeriodInfo.periodKey, rates.cutoff_day]);

  // Resumo estatístico e financeiro do período atual
  const currentSummary = useMemo(() => {
    const payment = periodPayments[currentPeriodInfo.periodKey];
    return summarizePeriod(
      currentPeriodInfo.periodKey,
      currentPeriodAttendances,
      payment,
      rates.cutoff_day
    );
  }, [currentPeriodInfo.periodKey, currentPeriodAttendances, periodPayments, rates.cutoff_day]);

  // Atendimentos filtrados para a listagem
  const filteredAttendances = useMemo(() => {
    return currentPeriodAttendances.filter((att) => {
      if (roleFilter === 'todos') return true;
      if (roleFilter === 'substituicao') return att.type === 'substituicao';
      return att.role === roleFilter;
    });
  }, [currentPeriodAttendances, roleFilter]);

  // Salvar Atendimento
  const handleSaveAttendance = async (
    attData: Parameters<typeof saveAttendance>[0],
    saveAsFixed?: boolean
  ) => {
    try {
      const saved = await saveAttendance(attData);

      // Se marcou para salvar como paciente fixo e não existia
      if (saveAsFixed && attData.patient_name) {
        await savePatient({
          name: attData.patient_name,
          default_role: attData.role,
          default_duration: attData.duration_minutes,
        });
      }

      await loadData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar o atendimento.');
    }
  };

  // Excluir Atendimento
  const handleDeleteAttendance = async (id: string) => {
    try {
      await deleteAttendance(id);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir.');
    }
  };

  // Salvar status de pagamento do período
  const handleSavePayment = async (
    periodKey: string,
    startDate: string,
    endDate: string,
    isPaid: boolean,
    paidAt?: string | null,
    notes?: string | null
  ) => {
    try {
      await savePeriodPayment(periodKey, startDate, endDate, isPaid, paidAt, notes);
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
    }
  };

  const openNewModal = () => {
    setEditingAttendance(null);
    setIsSheetOpen(true);
  };

  const openEditModal = (att: Attendance) => {
    setEditingAttendance(att);
    setIsSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Carregando seus atendimentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <Header
        title="Calculadora Terapêutica"
        subtitle="Controle pessoal de sessões e ganhos"
        rightAction={
          <button
            type="button"
            onClick={openNewModal}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-2 rounded-xl shadow-xs transition-all flex items-center justify-center"
            title="Novo atendimento"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* Card do Período Atual com totais calculados */}
      <PeriodSummaryCard
        summary={currentSummary}
        onOpenNewAttendance={openNewModal}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
      />

      {/* Seção da Lista de Atendimentos */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Atendimentos do Período
            </h2>
            <p className="text-[11px] text-slate-500">
              {currentPeriodAttendances.length} sessões registradas de {currentPeriodInfo.label}
            </p>
          </div>

          <Link
            href="/periodos"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Ver outros períodos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filtros Rápidos (Pills) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setRoleFilter('todos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              roleFilter === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({currentPeriodAttendances.length})
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('psicologa')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              roleFilter === 'psicologa'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Psicóloga ({currentSummary.psychology_count})
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('at')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              roleFilter === 'at'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            AT ({currentSummary.at_count})
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('substituicao')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              roleFilter === 'substituicao'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Substituições ({currentSummary.substitution_count})
          </button>
        </div>

        {/* Lista de Atendimentos */}
        {filteredAttendances.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 my-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Nenhum atendimento neste filtro
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
              Toque no botão abaixo para lançar o primeiro atendimento deste período.
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar atendimento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAttendances.map((att) => (
              <AttendanceItem
                key={att.id}
                attendance={att}
                onEdit={openEditModal}
                onDelete={handleDeleteAttendance}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botão Flutuante (FAB) para Mobile */}
      <div className="fixed bottom-20 right-4 sm:hidden z-30">
        <button
          type="button"
          onClick={openNewModal}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          title="Novo Atendimento"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Modais */}
      <AttendanceSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingAttendance(null);
        }}
        onSave={handleSaveAttendance}
        editingAttendance={editingAttendance}
        patients={patients}
        rates={rates}
      />

      <ExportReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        summary={currentSummary}
        attendances={currentPeriodAttendances}
      />

      <MarkPaidModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        summary={currentSummary}
        onSavePayment={handleSavePayment}
      />
    </div>
  );
}
