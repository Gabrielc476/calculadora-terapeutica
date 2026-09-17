import { Attendance, Patient, PeriodPayment, UserProfile } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { DEFAULT_RATES } from './calculations';

const STORAGE_KEYS = {
  ATTENDANCES: 'calc_terapeutica_attendances',
  PATIENTS: 'calc_terapeutica_patients',
  PERIOD_PAYMENTS: 'calc_terapeutica_period_payments',
  PROFILE: 'calc_terapeutica_profile',
};

// Dados padrão iniciais para primeiro uso imediato
const INITIAL_PATIENTS: Patient[] = [
  { id: '1', name: 'João', default_role: 'at', default_duration: 60, notes: 'Atendimento domiciliar' },
  { id: '2', name: 'Maria', default_role: 'psicologa', default_duration: 45, notes: 'Consultório 2' },
  { id: '3', name: 'Pedro', default_role: 'at', default_duration: 90, notes: 'Escola / Tarde' },
  { id: '4', name: 'Ana', default_role: 'at', default_duration: 135, notes: 'Acompanhamento intensivo' },
];

function getSampleAttendances(): Attendance[] {
  // Pega a data atual para gerar dados relevantes no período corrente
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  return [
    {
      id: 'att-1',
      patient_name: 'João',
      patient_id: '1',
      date: `${year}-${month}-02`,
      role: 'at',
      duration_minutes: 60,
      type: 'fixo',
      calculated_value: 25.0,
      notes: 'Sessão semanal padrão',
    },
    {
      id: 'att-2',
      patient_name: 'Maria',
      patient_id: '2',
      date: `${year}-${month}-04`,
      role: 'psicologa',
      duration_minutes: 45,
      type: 'fixo',
      calculated_value: 30.0,
      notes: '',
    },
    {
      id: 'att-3',
      patient_name: 'Carlos',
      patient_id: null,
      date: `${year}-${month}-08`,
      role: 'at',
      duration_minutes: 90,
      type: 'substituicao',
      calculated_value: 37.5,
      notes: 'Substituição da colega Luísa',
    },
    {
      id: 'att-4',
      patient_name: 'Ana',
      patient_id: '4',
      date: `${year}-${month}-12`,
      role: 'at',
      duration_minutes: 135,
      type: 'fixo',
      calculated_value: 56.25,
      notes: '',
    },
  ];
}

// -----------------------------------------------------------------------------
// PROFILE / CONFIGURAÇÕES
// -----------------------------------------------------------------------------

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) return data as UserProfile;
    }
  }

  if (typeof window === 'undefined') {
    return {
      id: 'local-user',
      name: 'Minha Conta',
      cutoff_day: DEFAULT_RATES.cutoff_day,
      psychology_default_rate: DEFAULT_RATES.psychology_default_rate,
      psychology_default_duration: DEFAULT_RATES.psychology_default_duration,
      at_hourly_rate: DEFAULT_RATES.at_hourly_rate,
    };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const defaultProfile: UserProfile = {
    id: 'local-user',
    name: 'Psicóloga & AT',
    cutoff_day: DEFAULT_RATES.cutoff_day,
    psychology_default_rate: DEFAULT_RATES.psychology_default_rate,
    psychology_default_duration: DEFAULT_RATES.psychology_default_duration,
    at_hourly_rate: DEFAULT_RATES.at_hourly_rate,
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
  return defaultProfile;
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ ...profile, id: user.id, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (!error && data) return data as UserProfile;
    }
  }

  const current = await getUserProfile();
  const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  }
  return updated;
}

// -----------------------------------------------------------------------------
// PACIENTES FIXOS
// -----------------------------------------------------------------------------

export async function getPatients(): Promise<Patient[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) return data as Patient[];
  }

  if (typeof window === 'undefined') return INITIAL_PATIENTS;

  const stored = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
  return INITIAL_PATIENTS;
}

export async function savePatient(patient: Partial<Patient> & { name: string }): Promise<Patient> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (patient.id && !patient.id.startsWith('temp-')) {
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: patient.name,
          default_role: patient.default_role || 'psicologa',
          default_duration: patient.default_duration || 45,
          notes: patient.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id)
        .select()
        .single();
      if (!error && data) return data as Patient;
    } else {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user?.id,
          name: patient.name,
          default_role: patient.default_role || 'psicologa',
          default_duration: patient.default_duration || 45,
          notes: patient.notes || null,
        })
        .select()
        .single();
      if (!error && data) return data as Patient;
    }
  }

  const list = await getPatients();
  const id = patient.id && !patient.id.startsWith('temp-') ? patient.id : `pat-${Date.now()}`;
  const now = new Date().toISOString();
  const newPatient: Patient = {
    id,
    name: patient.name.trim(),
    default_role: patient.default_role || 'psicologa',
    default_duration: Number(patient.default_duration) || 45,
    notes: patient.notes || null,
    created_at: now,
    updated_at: now,
  };

  const existingIndex = list.findIndex((p) => p.id === id);
  let updatedList: Patient[];
  if (existingIndex >= 0) {
    updatedList = [...list];
    updatedList[existingIndex] = newPatient;
  } else {
    updatedList = [...list, newPatient];
  }

  updatedList.sort((a, b) => a.name.localeCompare(b.name));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updatedList));
  }
  return newPatient;
}

export async function deletePatient(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) return true;
  }

  const list = await getPatients();
  const filtered = list.filter((p) => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));
  }
  return true;
}

// -----------------------------------------------------------------------------
// ATENDIMENTOS / SESSÕES
// -----------------------------------------------------------------------------

export async function getAttendances(): Promise<Attendance[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) return data as Attendance[];
  }

  if (typeof window === 'undefined') return getSampleAttendances();

  const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const samples = getSampleAttendances();
  localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(samples));
  return samples;
}

export async function saveAttendance(att: Partial<Attendance> & {
  patient_name: string;
  date: string;
  role: 'psicologa' | 'at';
  duration_minutes: number;
  type: 'fixo' | 'substituicao';
  calculated_value: number;
}): Promise<Attendance> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (att.id && !att.id.startsWith('temp-')) {
      const { data, error } = await supabase
        .from('attendances')
        .update({
          patient_name: att.patient_name,
          patient_id: att.patient_id || null,
          date: att.date,
          role: att.role,
          duration_minutes: att.duration_minutes,
          type: att.type,
          calculated_value: att.calculated_value,
          notes: att.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', att.id)
        .select()
        .single();
      if (!error && data) return data as Attendance;
    } else {
      const { data, error } = await supabase
        .from('attendances')
        .insert({
          user_id: user?.id,
          patient_name: att.patient_name,
          patient_id: att.patient_id || null,
          date: att.date,
          role: att.role,
          duration_minutes: att.duration_minutes,
          type: att.type,
          calculated_value: att.calculated_value,
          notes: att.notes || null,
        })
        .select()
        .single();
      if (!error && data) return data as Attendance;
    }
  }

  const list = await getAttendances();
  const id = att.id && !att.id.startsWith('temp-') ? att.id : `att-${Date.now()}`;
  const now = new Date().toISOString();

  const item: Attendance = {
    id,
    patient_name: att.patient_name.trim(),
    patient_id: att.patient_id || null,
    date: att.date,
    role: att.role,
    duration_minutes: Number(att.duration_minutes),
    type: att.type,
    calculated_value: Number(att.calculated_value),
    notes: att.notes || null,
    created_at: now,
    updated_at: now,
  };

  const existingIndex = list.findIndex((a) => a.id === id);
  let updatedList: Attendance[];
  if (existingIndex >= 0) {
    updatedList = [...list];
    updatedList[existingIndex] = item;
  } else {
    updatedList = [item, ...list];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(updatedList));
  }
  return item;
}

export async function deleteAttendance(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('attendances').delete().eq('id', id);
    if (!error) return true;
  }

  const list = await getAttendances();
  const filtered = list.filter((a) => a.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(filtered));
  }
  return true;
}

// -----------------------------------------------------------------------------
// PAGAMENTOS DOS PERÍODOS
// -----------------------------------------------------------------------------

export async function getPeriodPayments(): Promise<Record<string, PeriodPayment>> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('period_payments').select('*');
    if (!error && data) {
      const map: Record<string, PeriodPayment> = {};
      data.forEach((p) => {
        map[p.period_key] = p as PeriodPayment;
      });
      return map;
    }
  }

  if (typeof window === 'undefined') return {};

  const stored = localStorage.getItem(STORAGE_KEYS.PERIOD_PAYMENTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return {};
}

export async function savePeriodPayment(
  periodKey: string,
  startDate: string,
  endDate: string,
  isPaid: boolean,
  paidAt?: string | null,
  notes?: string | null
): Promise<PeriodPayment> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('period_payments')
      .upsert(
        {
          user_id: user?.id,
          period_key: periodKey,
          start_date: startDate,
          end_date: endDate,
          is_paid: isPaid,
          paid_at: paidAt || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,period_key' }
      )
      .select()
      .single();
    if (!error && data) return data as PeriodPayment;
  }

  const payments = await getPeriodPayments();
  const updated: PeriodPayment = {
    id: payments[periodKey]?.id || `pay-${Date.now()}`,
    period_key: periodKey,
    start_date: startDate,
    end_date: endDate,
    is_paid: isPaid,
    paid_at: paidAt || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  payments[periodKey] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PERIOD_PAYMENTS, JSON.stringify(payments));
  }
  return updated;
}
