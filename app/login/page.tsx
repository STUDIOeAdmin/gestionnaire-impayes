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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/images/logo.png" alt="Studio e" width={80} height={80} style={{ width: 'auto', height: 80 }} className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-purple-900">Ge</span>
              <span className="text-purple-500">ST</span>
              <span className="text-purple-900">e </span>
              <span className="text-purple-400 text-xl">Impayés</span>
            </h1>
            <p className="text-gray-500 text-sm">Connexion sécurisée</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg text-sm text-center bg-red-50 border border-red-200 text-red-600">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Identifiant</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
                className="w-full px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-gray-400">Studio e Danse © 2026</p>
        </div>
      </div>
    </div>
  );
}
