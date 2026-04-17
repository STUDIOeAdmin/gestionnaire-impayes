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
    <nav className="border-b border-purple-200 sticky top-0 z-50 bg-white/70 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <a href="/" className="flex items-center space-x-3">
              <Image src="/images/logo.png" alt="Studio e" width={36} height={36} style={{ width: 36, height: 36 }} className="object-contain" />
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold">
                  <span className="text-purple-900">Ge</span>
                  <span className="text-purple-500">ST</span>
                  <span className="text-purple-900">e</span>
                </span>
                <span className="text-sm text-purple-400">Impayés</span>
              </div>
            </a>
            <div className="hidden md:flex space-x-1">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <a href="/profil" className="text-sm text-purple-600 hover:text-purple-900 transition-colors">
                {session.user?.name}
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors"
              >
                Déconnexion
              </button>
            </div>
            <div className="flex items-center md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md text-purple-500 hover:text-purple-700" aria-label="Menu">
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
        <div className="md:hidden border-t border-purple-100 bg-white/95">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 border-b border-purple-50"
            >
              {link.label}
            </a>
          ))}
          <div className="px-4 py-3">
            <p className="text-xs text-purple-400 mb-2">{session.user?.name}</p>
            <div className="space-y-2">
              <a href="/profil" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-purple-700 hover:text-purple-900">
                Mon profil
              </a>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm font-medium text-purple-700 hover:text-purple-900">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
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
