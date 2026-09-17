'use client';

import Link from 'next/link';
import { Sparkles, Calendar, Settings, Heart } from 'lucide-react';

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
  return (
    <header className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-200/60 bg-white/60 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-500 font-medium ml-9">
            {subtitle}
          </p>
        )}
      </div>

      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
