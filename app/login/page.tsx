'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { username, password, redirect: false });
      if (result?.error) {
        setError('Identifiant ou mot de passe incorrect');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-lg shadow-2xl p-8" style={{ backgroundColor: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(249,194,36,0.2)' }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/images/logo.png" alt="Studio e" width={80} height={80} style={{ width: 'auto', height: 80 }} className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-white">Ge</span>
              <span style={{ color: '#F9CA24' }}>ST</span>
              <span className="text-white">e </span>
              <span className="text-slate-300 text-xl">Impayés</span>
            </h1>
            <p className="text-slate-400 text-sm">Connexion sécurisée</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md text-sm text-center" style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">Identifiant</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
                className="w-full px-4 py-2 rounded-md text-slate-200 bg-slate-700/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full px-4 py-2 rounded-md text-slate-200 bg-slate-700/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-md font-semibold text-slate-900 transition-all disabled:opacity-50"
              style={{ backgroundColor: '#F9CA24', boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(249,194,36,0.39)' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Studio e Danse © 2026</p>
        </div>
      </div>
    </div>
  );
}
