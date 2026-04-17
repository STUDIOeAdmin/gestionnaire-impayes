'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilPage() {
  const { data: session } = useSession();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (nouveau !== confirm) {
      setError('Les deux nouveaux mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur inconnue');
      } else {
        setSuccess(true);
        setAncien('');
        setNouveau('');
        setConfirm('');
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold text-white">Mon profil</h1>

      <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'rgba(249,194,36,0.15)', color: '#F9CA24' }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">Administrateur</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <h2 className="font-semibold text-white mb-4">Changer le mot de passe</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
              Mot de passe modifié avec succès.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Ancien mot de passe</label>
            <input type="password" value={ancien} onChange={e => setAncien(e.target.value)} required autoComplete="current-password"
              className="w-full px-4 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nouveau mot de passe</label>
            <input type="password" value={nouveau} onChange={e => setNouveau(e.target.value)} required autoComplete="new-password" minLength={8}
              className="w-full px-4 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 text-sm"
              placeholder="8 caractères minimum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 text-sm"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
            style={{ backgroundColor: '#F9CA24', color: '#1e293b' }}
          >
            {loading ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
