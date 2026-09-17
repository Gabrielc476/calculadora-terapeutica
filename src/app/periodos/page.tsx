'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ExportReportModal from '@/components/ExportReportModal';
import MarkPaidModal from '@/components/MarkPaidModal';
import {
  Attendance,
  PeriodPayment,
  PeriodSummary,
  RatesConfig,
  UserProfile,
} from '@/lib/types';
import {
  getAttendances,
  getPeriodPayments,
  savePeriodPayment,
  getUserProfile,
} from '@/lib/storage';
import {
  getPeriodForDate,
  summarizePeriod,
  formatBRL,
  formatDateBR,
  DEFAULT_RATES,
} from '@/lib/calculations';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Share2,
  ChevronRight,
  Filter,
  DollarSign,
  Brain,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function PeriodosPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [periodPayments, setPeriodPayments] = useState<Record<string, PeriodPayment>>({});
  const [loading, setLoading] = useState(true);

  // Modais
  const [selectedSummary, setSelectedSummary] = useState<PeriodSummary | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filtro
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'pagos'>('todos');

  const loadData = async () => {
    try {
      const [profData, attData, payData] = await Promise.all([
        getUserProfile(),
        getAttendances(),
        getPeriodPayments(),
      ]);
      setProfile(profData);
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

  // Agrupar todos os períodos existentes
  const allPeriodSummaries = useMemo(() => {
    const periodMap = new Map<string, Attendance[]>();

    // Garante que o período atual sempre exista na lista
    const currentPeriod = getPeriodForDate(new Date(), rates.cutoff_day);
    periodMap.set(currentPeriod.periodKey, []);

    // Agrupa atendimentos por período
    attendances.forEach((att) => {
      const p = getPeriodForDate(att.date, rates.cutoff_day);
      const existing = periodMap.get(p.periodKey) || [];
      existing.push(att);
      periodMap.set(p.periodKey, existing);
    });

    const summaries: PeriodSummary[] = [];
    periodMap.forEach((atts, periodKey) => {
      const payment = periodPayments[periodKey];
      summaries.push(summarizePeriod(periodKey, atts, payment, rates.cutoff_day));
    });

    // Ordenar do período mais recente para o mais antigo
    summaries.sort((a, b) => b.start_date.localeCompare(a.start_date));
    return summaries;
  }, [attendances, periodPayments, rates.cutoff_day]);

  // Filtrar períodos
  const filteredSummaries = useMemo(() => {
    return allPeriodSummaries.filter((s) => {
      if (statusFilter === 'todos') return true;
      if (statusFilter === 'pagos') return s.is_paid;
      if (statusFilter === 'pendentes') return !s.is_paid;
      return true;
    });
  }, [allPeriodSummaries, statusFilter]);

  // Total acumulado em aberto (pendente)
  const totalPendente = useMemo(() => {
    return allPeriodSummaries
      .filter((s) => !s.is_paid)
      .reduce((acc, curr) => acc + curr.grand_total, 0);
  }, [allPeriodSummaries]);

  // Salvar status de pagamento
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

  const getAttendancesForPeriod = (periodKey: string) => {
    return attendances.filter(
      (a) => getPeriodForDate(a.date, rates.cutoff_day).periodKey === periodKey
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Carregando períodos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <Header
        title="Histórico de Períodos"
        subtitle="Acompanhe seus fechamentos e pagamentos"
      />

      {/* Card de Resumo Geral de Valores Pendentes */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm">
        <span className="text-xs text-slate-400 font-medium">
          Total Pendente a Receber
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-2xl font-bold text-emerald-400">
            {formatBRL(totalPendente)}
          </p>
          <span className="text-xs text-slate-400">
            {allPeriodSummaries.filter((s) => !s.is_paid).length} período(s) em aberto
          </span>
        </div>
      </div>

      {/* Filtros por Status */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            statusFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({allPeriodSummaries.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pendentes')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            statusFilter === 'pendentes'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Pendentes
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pagos')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            statusFilter === 'pagos'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Pagos
        </button>
      </div>

      {/* Lista de Cards de Períodos */}
      <div className="space-y-3">
        {filteredSummaries.map((summary) => (
          <div
            key={summary.period_key}
            className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
              summary.is_current
                ? 'border-indigo-300 ring-1 ring-indigo-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Header do Período */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {summary.label}
                </span>
                {summary.is_current && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Atual
                  </span>
                )}
              </div>

              {/* Badge de Pagamento */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSummary(summary);
                  setIsPaymentModalOpen(true);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 transition-all active:scale-95 ${
                  summary.is_paid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {summary.is_paid ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Pago {summary.paid_at ? `(${formatDateBR(summary.paid_at)})` : ''}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Pendente</span>
                  </>
                )}
              </button>
            </div>

            {/* Valor total e contagem */}
            <div className="flex items-end justify-between my-3 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  Total do Período
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {formatBRL(summary.grand_total)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-medium text-slate-500">
                  {summary.total_attendances} atendimento(s)
                </span>
              </div>
            </div>

            {/* Breakdown Rápido */}
            <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 mb-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Psicologia</span>
                <span className="font-semibold text-slate-800">
                  {summary.psychology_count} ({formatBRL(summary.psychology_total)})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AT</span>
                <span className="font-semibold text-slate-800">
                  {summary.at_count} ({formatBRL(summary.at_total)})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Substituições</span>
                <span className="font-semibold text-slate-800">
                  {summary.substitution_count} ({formatBRL(summary.substitution_total)})
                </span>
              </div>
            </div>

            {/* Ações: Ver Detalhes e Exportar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedSummary(summary);
                  setIsShareModalOpen(true);
                }}
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copiar WhatsApp</span>
              </button>

              <Link
                href={`/periodos/${summary.period_key}`}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <span>Ver sessões</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modais */}
      {selectedSummary && (
        <>
          <ExportReportModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
              setSelectedSummary(null);
            }}
            summary={selectedSummary}
            attendances={getAttendancesForPeriod(selectedSummary.period_key)}
          />

          <MarkPaidModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedSummary(null);
            }}
            summary={selectedSummary}
            onSavePayment={handleSavePayment}
          />
        </>
      )}
    </div>
  );
}
