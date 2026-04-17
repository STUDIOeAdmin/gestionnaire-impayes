'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Adherent {
  id: string;
  numeroDossier: number;
  nom: string;
  prenom: string;
  famille: string | null;
  statut: string;
  updatedAt: string;
  dernierImpaye: {
    resteAPayer: number;
    totalDu: number;
    totalPaye: number;
    dontAvoir: number;
    cours: string | null;
  } | null;
  nbContacts: number;
}

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'IMPAYES', label: 'Impayés' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TROP_PERCU', label: 'Trop-perçus' },
  { value: 'REGULARISE', label: 'Régularisés' },
];

const STATUT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  IMPAYES:    { label: 'Impayé',       color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  EN_COURS:   { label: 'En cours',     color: '#F9CA24', bg: 'rgba(249,194,36,0.1)' },
  TROP_PERCU: { label: 'Trop-perçu',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  REGULARISE: { label: 'Régularisé',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

export default function AdherentsPage() {
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [triPar, setTriPar] = useState<'nom' | 'reste' | 'statut'>('reste');
  const [triDesc, setTriDesc] = useState(true);

  const fetchAdherents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statutFilter) params.set('statut', statutFilter);
      const res = await fetch(`/api/adherents?${params}`);
      const data = await res.json();
      setAdherents(data);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [search, statutFilter]);

  useEffect(() => {
    const t = setTimeout(fetchAdherents, 300);
    return () => clearTimeout(t);
  }, [fetchAdherents]);

  const sorted = [...adherents].sort((a, b) => {
    let diff = 0;
    if (triPar === 'nom') diff = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
    else if (triPar === 'reste') diff = (a.dernierImpaye?.resteAPayer ?? 0) - (b.dernierImpaye?.resteAPayer ?? 0);
    else if (triPar === 'statut') diff = a.statut.localeCompare(b.statut);
    return triDesc ? -diff : diff;
  });

  const toggleTri = (col: typeof triPar) => {
    if (triPar === col) setTriDesc(!triDesc);
    else { setTriPar(col); setTriDesc(true); }
  };

  const ThBtn = ({ col, label }: { col: typeof triPar; label: string }) => (
    <button onClick={() => toggleTri(col)} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
      {label}
      {triPar === col && <span className="text-yellow-400">{triDesc ? '↓' : '↑'}</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Adhérents impayés</h1>
        <span className="text-sm text-slate-400">{adherents.length} résultat{adherents.length > 1 ? 's' : ''}</span>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou n° dossier…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 text-sm"
        />
        <select
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 text-sm"
        >
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <th className="px-4 py-3 font-medium"><ThBtn col="nom" label="Adhérent" /></th>
                <th className="px-4 py-3 font-medium text-slate-400">N° dossier</th>
                <th className="px-4 py-3 font-medium text-slate-400">Cours</th>
                <th className="px-4 py-3 font-medium"><ThBtn col="reste" label="Reste à payer" /></th>
                <th className="px-4 py-3 font-medium text-slate-400">Total dû</th>
                <th className="px-4 py-3 font-medium text-slate-400">Total payé</th>
                <th className="px-4 py-3 font-medium"><ThBtn col="statut" label="Statut" /></th>
                <th className="px-4 py-3 font-medium text-slate-400">Contacts</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Chargement…</td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Aucun résultat</td></tr>
              )}
              {!loading && sorted.map((a, i) => {
                const reste = a.dernierImpaye?.resteAPayer ?? 0;
                const style = STATUT_STYLES[a.statut] ?? STATUT_STYLES.IMPAYES;
                return (
                  <tr key={a.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: 'rgba(255,255,255,0.05)',
                      backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{a.nom}, {a.prenom}</div>
                      {a.famille && <div className="text-xs text-slate-500">{a.famille}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.numeroDossier}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{a.dernierImpaye?.cours ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: reste < 0 ? '#a78bfa' : reste === 0 ? '#4ade80' : '#f87171' }}>
                      {reste < 0 ? `−${Math.abs(reste).toFixed(2)} €` : `${reste.toFixed(2)} €`}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.dernierImpaye?.totalDu?.toFixed(2) ?? '—'} €</td>
                    <td className="px-4 py-3 text-slate-400">{a.dernierImpaye?.totalPaye?.toFixed(2) ?? '—'} €</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: style.color, backgroundColor: style.bg }}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-center">{a.nbContacts}</td>
                    <td className="px-4 py-3">
                      <Link href={`/adherents/${a.id}`}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                        style={{ backgroundColor: 'rgba(249,194,36,0.1)', color: '#F9CA24', border: '1px solid rgba(249,194,36,0.2)' }}
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
