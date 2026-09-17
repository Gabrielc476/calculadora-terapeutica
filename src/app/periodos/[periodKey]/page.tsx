'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AttendanceItem from '@/components/AttendanceItem';
import AttendanceSheet from '@/components/AttendanceSheet';
import ExportReportModal from '@/components/ExportReportModal';
import MarkPaidModal from '@/components/MarkPaidModal';
import PeriodSummaryCard from '@/components/PeriodSummaryCard';
import {
  Attendance,
  Patient,
  PeriodPayment,
  RatesConfig,
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
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PeriodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const periodKey = params?.periodKey as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [periodPayments, setPeriodPayments] = useState<Record<string, PeriodPayment>>({});
  const [loading, setLoading] = useState(true);

  // Modais
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  // Atendimentos específicos deste período
  const periodAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const p = getPeriodForDate(att.date, rates.cutoff_day);
      return p.periodKey === periodKey;
    });
  }, [attendances, periodKey, rates.cutoff_day]);

  // Resumo deste período
  const summary = useMemo(() => {
    if (!periodKey) return null;
    const payment = periodPayments[periodKey];
    return summarizePeriod(periodKey, periodAttendances, payment, rates.cutoff_day);
  }, [periodKey, periodAttendances, periodPayments, rates.cutoff_day]);

  // Salvar atendimento
  const handleSaveAttendance = async (
    attData: Parameters<typeof saveAttendance>[0],
    saveAsFixed?: boolean
  ) => {
    try {
      await saveAttendance(attData);
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
    }
  };

  // Excluir atendimento
  const handleDeleteAttendance = async (id: string) => {
    try {
      await deleteAttendance(id);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  // Salvar pagamento
  const handleSavePayment = async (
    pk: string,
    start: string,
    end: string,
    isPaid: boolean,
    paidAt?: string | null,
    notes?: string | null
  ) => {
    try {
      await savePeriodPayment(pk, start, end, isPaid, paidAt, notes);
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Carregando detalhes do período...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">
            {summary.label}
          </h1>
          <p className="text-xs text-slate-500">Detalhes dos atendimentos</p>
        </div>
      </div>

      {/* Card do Período com Resumo */}
      <PeriodSummaryCard
        summary={summary}
        onOpenNewAttendance={() => {
          setEditingAttendance(null);
          setIsSheetOpen(true);
        }}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
      />

      {/* Lista de Atendimentos */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Sessões Realizadas ({periodAttendances.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditingAttendance(null);
              setIsSheetOpen(true);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar neste período</span>
          </button>
        </div>

        {periodAttendances.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-slate-200 text-slate-500 text-xs">
            Nenhum atendimento registrado neste período ainda.
          </div>
        ) : (
          periodAttendances.map((att) => (
            <AttendanceItem
              key={att.id}
              attendance={att}
              onEdit={(a) => {
                setEditingAttendance(a);
                setIsSheetOpen(true);
              }}
              onDelete={handleDeleteAttendance}
            />
          ))
        )}
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
        summary={summary}
        attendances={periodAttendances}
      />

      <MarkPaidModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        summary={summary}
        onSavePayment={handleSavePayment}
      />
    </div>
  );
}
