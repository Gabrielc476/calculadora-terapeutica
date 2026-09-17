'use client';

import { useState } from 'react';
import { Attendance, PeriodSummary } from '@/lib/types';
import { generateWhatsAppReport } from '@/lib/calculations';
import { X, Copy, Check, Share2, Printer, MessageSquare } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PeriodSummary;
  attendances: Attendance[];
}

export default function ExportReportModal({
  isOpen,
  onClose,
  summary,
  attendances,
}: ExportReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reportText = generateWhatsAppReport(summary, attendances);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Não foi possível copiar automaticamente. Selecione o texto abaixo.');
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 z-10 pb-safe">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Exportar Fechamento do Período
            </h2>
            <p className="text-xs text-slate-500">{summary.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleCopy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar para WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>

        {/* Prévia do Texto */}
        <div className="p-5 flex-1 overflow-y-auto">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Pré-visualização da mensagem:
          </label>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 selection:bg-indigo-500">
            {reportText}
          </pre>
        </div>

        {/* Rodapé com Impressão */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{attendances.length} sessões listadas</span>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 text-slate-700 hover:text-indigo-600 font-medium p-1 rounded-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
