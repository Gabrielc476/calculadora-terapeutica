import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavigationBar from "@/components/NavigationBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Calculadora Terapêutica | Controle de Atendimentos",
  description: "Controle simples de atendimentos e cálculo de períodos de pagamento para Psicólogas e ATs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atendimentos",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100 flex flex-col items-center justify-start text-slate-900 font-sans">
        <div className="w-full max-w-lg min-h-screen bg-slate-50 flex flex-col relative shadow-xl sm:border-x sm:border-slate-200 pb-20">
          <main className="flex-1 w-full pb-6">{children}</main>
          <NavigationBar />
        </div>
      </body>
    </html>
  );
}
