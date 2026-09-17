'use client';

import { useState } from 'react';
import { PeriodSummary } from '@/lib/types';
import { formatBRL, formatDateBR } from '@/lib/calculations';
import { X, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PeriodSummary;
  onSavePayment: (
    periodKey: string,
    startDate: string,
    endDate: string,
    isPaid: boolean,
    paidAt?: string | null,
    notes?: string | null
  ) => void;
}

export default function MarkPaidModal({
  isOpen,
  onClose,
  summary,
  onSavePayment,
}: MarkPaidModalProps) {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isPaid, setIsPaid] = useState(summary.is_paid);
  const [paidAt, setPaidAt] = useState(summary.paid_at || getTodayStr());
  const [notes, setNotes] = useState(summary.payment_notes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (isPaid && !summary.is_paid) {
      // Disparar confete celebratório!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    onSavePayment(
      summary.period_key,
      summary.start_date,
      summary.end_date,
      isPaid,
      isPaid ? paidAt : null,
      notes.trim() || null
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Status do Pagamento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações do Período */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-4">
          <p className="text-xs text-slate-500 font-medium">Período de referência</p>
          <p className="text-sm font-semibold text-slate-900">{summary.label}</p>
          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-600">Total a receber:</span>
            <span className="text-sm font-bold text-slate-900">
              {formatBRL(summary.grand_total)}
            </span>
          </div>
        </div>

        {/* Toggle Pago vs Pendente */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Situação do Período
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !isPaid
                  ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ⏳ Pendente
            </button>

            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                isPaid
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pago</span>
            </button>
          </div>
        </div>

        {/* Se estiver marcado como pago, pede a data de pagamento */}
        {isPaid && (
          <div className="space-y-3 mb-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Pagamento Recebido
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações do Pagamento <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Recebido via Pix no Santander"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Botão de Salvar */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>Atualizar Status</span>
        </button>
      </div>
    </div>
  );
}
