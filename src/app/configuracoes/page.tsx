'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { UserProfile } from '@/lib/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase/client';
import { DEFAULT_RATES } from '@/lib/calculations';
import {
  Settings,
  Save,
  Database,
  CloudCheck,
  HardDrive,
  LogOut,
  Info,
  CheckCircle2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Form states
  const [cutoffDay, setCutoffDay] = useState(26);
  const [psychologyRate, setPsychologyRate] = useState(30);
  const [psychologyDuration, setPsychologyDuration] = useState(45);
  const [atHourlyRate, setAtHourlyRate] = useState(25);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getUserProfile();
      setProfile(data);
      setCutoffDay(data.cutoff_day || DEFAULT_RATES.cutoff_day);
      setPsychologyRate(data.psychology_default_rate || DEFAULT_RATES.psychology_default_rate);
      setPsychologyDuration(data.psychology_default_duration || DEFAULT_RATES.psychology_default_duration);
      setAtHourlyRate(data.at_hourly_rate || DEFAULT_RATES.at_hourly_rate);
      setUserName(data.name || '');
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveUserProfile({
        name: userName.trim() || 'Psicóloga & AT',
        cutoff_day: Number(cutoffDay),
        psychology_default_rate: Number(psychologyRate),
        psychology_default_duration: Number(psychologyDuration),
        at_hourly_rate: Number(atHourlyRate),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <Header
        title="Configurações"
        subtitle="Regras de cálculo e ciclo de pagamento"
      />

      {/* Status da Conexão com Supabase */}
      <div
        className={`rounded-2xl p-4 border flex items-start gap-3 shadow-xs ${
          isSupabaseConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
        }`}
      >
        <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0">
          <Database className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold">
              {isSupabaseConfigured ? 'Supabase Conectado' : 'Armazenamento Local Ativo'}
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isSupabaseConfigured
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-indigo-200 text-indigo-800'
              }`}
            >
              {isSupabaseConfigured ? 'Nuvem' : 'Dispositivo'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {isSupabaseConfigured
              ? 'Seus dados são sincronizados em tempo real com o banco de dados Supabase na nuvem.'
              : 'Seus atendimentos ficam salvos com segurança no navegador deste dispositivo. Para ativar a sincronização em nuvem e login em múltiplos aparelhos, configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.'}
          </p>
        </div>
      </div>

      {/* Formulário de Configuração das Regras de Negócio */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900">
            Regras de Pagamento da Clínica
          </h2>
          <p className="text-xs text-slate-500">
            Defina o dia de corte do ciclo e os valores padrão combinados
          </p>
        </div>

        {/* 1. Dia de Corte do Ciclo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dia de Corte do Período de Pagamento
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="28"
              value={cutoffDay}
              onChange={(e) => setCutoffDay(Number(e.target.value))}
              required
              className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500">
              Padrão: <strong>Dia 26</strong> (o período vai do dia 26 até dia 25 do mês seguinte)
            </span>
          </div>
        </div>

        {/* 2. Tarifa Psicóloga */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor Psicóloga (R$)
            </label>
            <input
              type="number"
              step="0.50"
              min="0"
              value={psychologyRate}
              onChange={(e) => setPsychologyRate(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duração Padrão
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="15"
                step="5"
                value={psychologyDuration}
                onChange={(e) => setPsychologyDuration(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 ml-2">min</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 -mt-2">
          Normalmente R$ 30,00 por sessão de 45 minutos.
        </p>

        {/* 3. Tarifa Hora AT */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Valor da Hora como AT (R$ por 60 min)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.50"
              min="0"
              value={atHourlyRate}
              onChange={(e) => setAtHourlyRate(Number(e.target.value))}
              required
              className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500">
              Padrão: <strong>R$ 25,00</strong> / 60 min (calculado proporcionalmente)
            </span>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-3">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>

      {/* Conta & Sessão */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Acesso & Sessão
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-700">Login e Autenticação</p>
            <p className="text-[11px] text-slate-400">Gerencie sua sessão ou acesse por outro aparelho</p>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg border border-indigo-200 transition-colors"
          >
            Acessar Conta
          </Link>
        </div>
      </div>
    </div>
  );
}
