export type RoleType = 'psicologa' | 'at';
export type AttendanceType = 'fixo' | 'substituicao';

export interface UserProfile {
  id: string;
  name: string;
  cutoff_day: number;
  psychology_default_rate: number;
  psychology_default_duration: number;
  at_hourly_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  user_id?: string;
  name: string;
  default_role: RoleType;
  default_duration: number; // em minutos
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  user_id?: string;
  patient_id?: string | null;
  patient_name: string;
  date: string; // YYYY-MM-DD
  role: RoleType;
  duration_minutes: number;
  type: AttendanceType;
  calculated_value: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodPayment {
  id: string;
  user_id?: string;
  period_key: string; // ex: '2026-08-26_2026-09-25'
  start_date: string;
  end_date: string;
  is_paid: boolean;
  paid_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodSummary {
  period_key: string;
  label: string; // ex: '26/08/2026 a 25/09/2026'
  start_date: string;
  end_date: string;
  total_attendances: number;
  psychology_count: number;
  psychology_total: number;
  at_count: number;
  at_total: number;
  substitution_count: number;
  substitution_total: number;
  fixed_count: number;
  fixed_total: number;
  grand_total: number;
  is_paid: boolean;
  paid_at?: string | null;
  payment_notes?: string | null;
  is_current?: boolean;
}

export interface RatesConfig {
  psychology_default_rate: number;
  psychology_default_duration: number;
  at_hourly_rate: number;
  cutoff_day: number;
}
