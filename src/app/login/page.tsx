'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase/client';
import { Heart, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const supabase = getSupabaseClient();

    if (!supabase) {
      // Modo local/offline sem Supabase configurado ainda
      setTimeout(() => {
        router.push('/');
      }, 300);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data?.session) {
          router.push('/');
        } else {
          setSuccessMessage('Conta criada com sucesso! Se a confirmação estiver ativa no Supabase, verifique sua caixa de entrada.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo & Boas-vindas */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Calculadora Terapêutica
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle pessoal de atendimentos e pagamentos
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-sm font-bold text-slate-800">
              {isSignUp ? 'Criar Nova Conta' : 'Acessar seus Registros'}
            </h2>
            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Seguro
            </span>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isSupabaseConfigured}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isSupabaseConfigured}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Acessando...'
                  : isSignUp
                  ? 'Cadastrar e Continuar'
                  : 'Entrar no Sistema'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Alternar entre login e cadastro */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              {isSignUp
                ? 'Já possui uma conta? Faça Login'
                : 'Primeira vez aqui? Crie sua conta'}
            </button>
          </div>
        </div>

        {/* Link para continuar sem login se for modo local */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
          >
            ← Voltar para a tela inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
