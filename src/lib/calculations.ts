import { Attendance, PeriodPayment, PeriodSummary, RatesConfig, RoleType } from './types';

export const DEFAULT_RATES: RatesConfig = {
  psychology_default_rate: 30.0,
  psychology_default_duration: 45,
  at_hourly_rate: 25.0,
  cutoff_day: 26,
};

/**
 * Calcula o valor da sessão com base na função, duração e taxas configuradas.
 */
export function calculateSessionValue(
  role: RoleType,
  durationMinutes: number,
  rates: Partial<RatesConfig> = {}
): number {
  const psychRate = rates.psychology_default_rate ?? DEFAULT_RATES.psychology_default_rate;
  const psychDuration = rates.psychology_default_duration ?? DEFAULT_RATES.psychology_default_duration;
  const atHourlyRate = rates.at_hourly_rate ?? DEFAULT_RATES.at_hourly_rate;

  if (role === 'psicologa') {
    // Para sessão padrão de psicologia (45m), valor exato fixado
    if (durationMinutes === psychDuration) {
      return psychRate;
    }
    // Proporcional caso duração seja diferente
    const val = (durationMinutes / psychDuration) * psychRate;
    return Math.round(val * 100) / 100;
  }

  // AT: minutos ÷ 60 × 25
  const atVal = (durationMinutes / 60) * atHourlyRate;
  return Math.round(atVal * 100) / 100;
}

/**
 * Retorna as datas de início e fim do ciclo de pagamento para uma data específica.
 * Por padrão, o corte é dia 26:
 * Ex: 28/08/2026 -> 26/08/2026 até 25/09/2026
 * Ex: 20/09/2026 -> 26/08/2026 até 25/09/2026
 */
export function getPeriodForDate(dateInput: string | Date, cutoffDay = 26): {
  startDate: string;
  endDate: string;
  periodKey: string;
  label: string;
} {
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed (0 = Jan, 7 = Ago, 8 = Set)
  const day = d.getDate();

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month;

  if (day >= cutoffDay) {
    // Pertence ao período que começou no mês atual (ex: Ago 26) e termina no próximo mês (ex: Set 25)
    startMonth = month;
    startYear = year;

    if (month === 11) {
      endMonth = 0;
      endYear = year + 1;
    } else {
      endMonth = month + 1;
    }
  } else {
    // Pertence ao período que começou no mês anterior (ex: Jul 26) e termina no mês atual (ex: Ago 25)
    if (month === 0) {
      startMonth = 11;
      startYear = year - 1;
    } else {
      startMonth = month - 1;
    }
    endMonth = month;
    endYear = year;
  }

  const endDay = cutoffDay === 1 ? getLastDayOfMonth(startYear, startMonth) : cutoffDay - 1;

  const startDateStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(cutoffDay).padStart(2, '0')}`;
  const endDateStr = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  const periodKey = `${startDateStr}_${endDateStr}`;

  const label = `${String(cutoffDay).padStart(2, '0')}/${String(startMonth + 1).padStart(2, '0')}/${startYear} a ${String(endDay).padStart(2, '0')}/${String(endMonth + 1).padStart(2, '0')}/${endYear}`;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    periodKey,
    label,
  };
}

function parseDateString(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Formata um valor numérico em moeda Real Brasileiro (R$)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

/**
 * Formata minutos em formato amigável (ex: 45 min, 1h, 1h30, 2h15)
 */
export function formatDuration(minutes: number): string {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
}

/**
 * Formata data no formato brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateInput: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata data curta DD/MM
 */
export function formatDateShortBR(dateInput: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

/**
 * Agrupa atendimentos e calcula o resumo completo do período
 */
export function summarizePeriod(
  periodKey: string,
  attendances: Attendance[],
  payment?: PeriodPayment | null,
  cutoffDay = 26
): PeriodSummary {
  const [startDateStr, endDateStr] = periodKey.split('_');
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  const label = `${startParts[2]}/${startParts[1]}/${startParts[0]} a ${endParts[2]}/${endParts[1]}/${endParts[0]}`;

  let total_attendances = 0;
  let psychology_count = 0;
  let psychology_total = 0;
  let at_count = 0;
  let at_total = 0;
  let substitution_count = 0;
  let substitution_total = 0;
  let fixed_count = 0;
  let fixed_total = 0;
  let grand_total = 0;

  for (const att of attendances) {
    total_attendances += 1;
    grand_total += Number(att.calculated_value) || 0;

    if (att.role === 'psicologa') {
      psychology_count += 1;
      psychology_total += Number(att.calculated_value) || 0;
    } else {
      at_count += 1;
      at_total += Number(att.calculated_value) || 0;
    }

    if (att.type === 'substituicao') {
      substitution_count += 1;
      substitution_total += Number(att.calculated_value) || 0;
    } else {
      fixed_count += 1;
      fixed_total += Number(att.calculated_value) || 0;
    }
  }

  const currentPeriod = getPeriodForDate(new Date(), cutoffDay);
  const is_current = periodKey === currentPeriod.periodKey;

  return {
    period_key: periodKey,
    label,
    start_date: startDateStr,
    end_date: endDateStr,
    total_attendances,
    psychology_count,
    psychology_total: Math.round(psychology_total * 100) / 100,
    at_count,
    at_total: Math.round(at_total * 100) / 100,
    substitution_count,
    substitution_total: Math.round(substitution_total * 100) / 100,
    fixed_count,
    fixed_total: Math.round(fixed_total * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100,
    is_paid: !!payment?.is_paid,
    paid_at: payment?.paid_at ?? null,
    payment_notes: payment?.notes ?? null,
    is_current,
  };
}

/**
 * Gera mensagem formatada pronta para enviar no WhatsApp
 */
export function generateWhatsAppReport(
  summary: PeriodSummary,
  attendances: Attendance[]
): string {
  const sorted = [...attendances].sort((a, b) => a.date.localeCompare(b.date));

  let msg = `📋 *RELATÓRIO DE ATENDIMENTOS*\n`;
  msg += `🗓️ *Período:* ${summary.label}\n`;
  msg += `------------------------------------\n`;
  msg += `🧠 *Psicologia:* ${summary.psychology_count} sessões (${formatBRL(summary.psychology_total)})\n`;
  msg += `🤝 *AT:* ${summary.at_count} atendimentos (${formatBRL(summary.at_total)})\n`;
  if (summary.substitution_count > 0) {
    msg += `🔄 *Substituições:* ${summary.substitution_count} (${formatBRL(summary.substitution_total)})\n`;
  }
  msg += `------------------------------------\n`;
  msg += `💰 *TOTAL A RECEBER: ${formatBRL(summary.grand_total)}*\n`;
  msg += `📌 *Status:* ${summary.is_paid ? `Pago em ${formatDateBR(summary.paid_at || '')}` : 'Pendente'}\n`;
  msg += `------------------------------------\n\n`;

  msg += `📝 *Detalhamento das sessões:*\n`;
  sorted.forEach((att, idx) => {
    const roleLabel = att.role === 'psicologa' ? 'Psicóloga' : 'AT';
    const typeLabel = att.type === 'substituicao' ? ' [Substituição]' : '';
    msg += `${idx + 1}. ${formatDateShortBR(att.date)} - ${att.patient_name} (${roleLabel}, ${formatDuration(att.duration_minutes)}${typeLabel}) = ${formatBRL(att.calculated_value)}\n`;
  });

  return msg;
}
