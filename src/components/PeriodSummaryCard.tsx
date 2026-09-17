'use client';

import { PeriodSummary } from '@/lib/types';
import { formatBRL } from '@/lib/calculations';
import { CheckCircle2, Clock, Share2, Sparkles, Brain, HeartHandshake, UserCheck } from 'lucide-react';

interface PeriodSummaryCardProps {
  summary: PeriodSummary;
  onOpenNewAttendance?: () => void;
  onOpenShareModal?: () => void;
  onOpenPaymentModal?: () => void;
  showActions?: boolean;
}

export default function PeriodSummaryCard({
  summary,
  onOpenNewAttendance,
  onOpenShareModal,
  onOpenPaymentModal,
  showActions = true,
}: PeriodSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
      {/* Decoração sutil no fundo */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full pointer-events-none" />

      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {summary.is_current ? 'Período Atual' : 'Período'}
          </span>
          {summary.is_current && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Em andamento
            </span>
          )}
        </div>

        {/* Badge de Pagamento Clicável */}
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 transition-all active:scale-95 ${
            summary.is_paid
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
          }`}
          title="Clique para alterar status de pagamento"
        >
          {summary.is_paid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pago</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pendente</span>
            </>
          )}
        </button>
      </div>

      {/* Datas do Período */}
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
        <span>{summary.label}</span>
      </h2>

      {/* Valor Total em Destaque */}
      <div className="bg-slate-900 text-white rounded-xl p-4 mb-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-300 font-medium">Total a Receber</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 text-white">
              {formatBRL(summary.grand_total)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300 font-medium block">Atendimentos</span>
            <span className="text-xl font-bold text-indigo-300">
              {summary.total_attendances}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown em 3 cards pequenos */}
      <div className="grid grid-cols-3 gap-2 text-center mb-5">
        {/* Psicologia */}
        <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-indigo-700 mb-1">
            <Brain className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Psicóloga</span>
          </div>
          <div className="text-base font-bold text-slate-900">{summary.psychology_count}</div>
          <div className="text-[11px] text-slate-600 font-medium">{formatBRL(summary.psychology_total)}</div>
        </div>

        {/* AT */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">AT</span>
          </div>
          <div className="text-base font-bold text-slate-900">{summary.at_count}</div>
          <div className="text-[11px] text-slate-600 font-medium">{formatBRL(summary.at_total)}</div>
        </div>

        {/* Substituições */}
        <div className="bg-amber-50/70 border border-amber-100/80 rounded-xl p-2.5">
          <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Substituição</span>
          </div>
          <div className="text-base font-bold text-slate-900">{summary.substitution_count}</div>
          <div className="text-[11px] text-slate-600 font-medium">{formatBRL(summary.substitution_total)}</div>
        </div>
      </div>

      {/* Botões de Ação */}
      {showActions && (
        <div className="flex gap-2">
          {onOpenNewAttendance && (
            <button
              type="button"
              onClick={onOpenNewAttendance}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium py-3 px-4 rounded-xl shadow-sm text-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="text-base font-bold leading-none">+</span>
              <span>Novo atendimento</span>
            </button>
          )}

          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              aria-label="Compartilhar fechamento do período"
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium py-3 px-3.5 rounded-xl border border-slate-200 text-sm transition-all flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
