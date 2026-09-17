'use client';

import { Attendance } from '@/lib/types';
import { formatBRL, formatDateShortBR, formatDuration } from '@/lib/calculations';
import { Trash2, Edit3, MessageSquare, Clock } from 'lucide-react';

interface AttendanceItemProps {
  attendance: Attendance;
  onEdit: (attendance: Attendance) => void;
  onDelete: (id: string) => void;
}

export default function AttendanceItem({
  attendance,
  onEdit,
  onDelete,
}: AttendanceItemProps) {
  const isPsych = attendance.role === 'psicologa';
  const isSub = attendance.type === 'substituicao';

  return (
    <div
      onClick={() => onEdit(attendance)}
      className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-3 group active:bg-slate-50"
    >
      {/* Esquerda: Data e Informações do Paciente */}
      <div className="flex items-start gap-3 min-w-0">
        {/* Caixa de Data */}
        <div className="bg-slate-100 rounded-lg px-2.5 py-1.5 text-center shrink-0">
          <span className="text-[11px] font-bold text-slate-700 block leading-tight">
            {formatDateShortBR(attendance.date)}
          </span>
        </div>

        {/* Nome do paciente e tags */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {attendance.patient_name}
            </h3>

            {/* Tag Substituição */}
            {isSub && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Substituição
              </span>
            )}
          </div>

          {/* Segunda linha: Função e Duração */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span
              className={`font-medium px-1.5 py-0.5 rounded text-[11px] ${
                isPsych
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isPsych ? 'Psicóloga' : 'AT'}
            </span>

            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDuration(attendance.duration_minutes)}
            </span>

            {attendance.notes && (
              <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                <MessageSquare className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Direita: Valor e Ações Rápidas */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 block">
            {formatBRL(attendance.calculated_value)}
          </span>
        </div>

        {/* Botão de excluir discreto */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Excluir atendimento de ${attendance.patient_name}?`)) {
              onDelete(attendance.id);
            }
          }}
          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
