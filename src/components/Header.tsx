'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export default function Header({
  title = 'Calculadora Terapêutica',
  subtitle = 'Controle de atendimentos e pagamentos',
  rightAction,
}: HeaderProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setUserEmail(user.email);
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUserEmail(session?.user?.email || null);
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
      <div className="min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-9 mt-0.5">
          {userEmail ? (
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 truncate bg-slate-100/90 hover:bg-slate-200/90 px-2 py-0.5 rounded-full transition-colors"
              title="Conta logada - Clique para ver configurações"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[190px]">{userEmail}</span>
            </Link>
          ) : (
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </header>
  );
}
