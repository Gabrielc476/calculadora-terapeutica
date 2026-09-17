'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Settings } from 'lucide-react';

export default function NavigationBar() {
  const pathname = usePathname();

  // Esconder barra na tela de login
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { label: 'Início', href: '/', icon: Home, exact: true },
    { label: 'Períodos', href: '/periodos', icon: Calendar, exact: false },
    { label: 'Pacientes', href: '/pacientes', icon: Users, exact: false },
    { label: 'Ajustes', href: '/configuracoes', icon: Settings, exact: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-2 pb-safe pointer-events-auto flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
