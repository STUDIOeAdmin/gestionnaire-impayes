'use client';

import "./globals.css";
import { useState } from "react";
import Image from "next/image";
import { SessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";

function NavBar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/adherents', label: 'Impayés' },
    { href: '/imports', label: 'Imports' },
  ];

  if (!session) return null;

  return (
    <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(249, 194, 36, 0.2)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <a href="/" className="flex items-center space-x-3">
              <Image src="/images/logo.png" alt="Studio e" width={36} height={36} style={{ width: 36, height: 36 }} className="object-contain" />
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold">
                  <span className="text-white">Ge</span>
                  <span style={{ color: '#F9CA24' }}>ST</span>
                  <span className="text-white">e</span>
                </span>
                <span className="text-sm text-slate-400">Impayés</span>
              </div>
            </a>
            <div className="hidden md:flex space-x-1">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 transition-colors"
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F9CA24'; (e.target as HTMLElement).style.backgroundColor = 'rgba(249,194,36,0.1)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = ''; (e.target as HTMLElement).style.backgroundColor = ''; }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-slate-400">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
              >
                Déconnexion
              </button>
            </div>
            <div className="flex items-center md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md text-slate-400 hover:text-yellow-400" aria-label="Menu">
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t" style={{ borderColor: 'rgba(249,194,36,0.2)', backgroundColor: 'rgba(15,23,42,0.98)' }}>
          {navLinks.map(link => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-yellow-400 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              {link.label}
            </a>
          ))}
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500 mb-2">{session.user?.name}</p>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm font-medium text-slate-300 hover:text-yellow-400">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)' }}>
        <SessionProvider>
          <NavBar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
