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
    commentaireInit: string | null;
  } | null;
  nbContacts: number;
  mensualise: boolean;
}

const STATUTS = [
  { value: '', label: 'Tous statuts' },
  { value: 'IMPAYES', label: 'Impayés' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TROP_PERCU', label: 'Trop-perçus' },
  { value: 'REGULARISE', label: 'Régularisés' },
];

const STATUT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  IMPAYES:    { label: 'Impayé',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  EN_COURS:   { label: 'En cours',   color: '#F9CA24', bg: 'rgba(249,194,36,0.1)' },
  TROP_PERCU: { label: 'Trop-perçu', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  REGULARISE: { label: 'Régularisé', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

export default function AdherentsPage() {
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [exclureMensualises, setExclureMensualises] = useState(false);
  const [seulementDemarches, setSeulementDemarches] = useState(false);
  const [exclureDemarches, setExclureDemarches] = useState(false);
  const [triPar, setTriPar] = useState<'nom' | 'reste' | 'statut'>('reste');
  const [triDesc, setTriDesc] = useState(true);

  const fetchAdherents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statutFilter) params.set('statut', statutFilter);
      if (exclureMensualises) params.set('exclureMensualises', '1');
      if (seulementDemarches) params.set('seulementDemarches', '1');
      if (exclureDemarches) params.set('exclureDemarches', '1');
      const res = await fetch(`/api/adherents?${params}`);
      const data = await res.json();
      setAdherents(data);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [search, statutFilter, exclureMensualises, seulementDemarches, exclureDemarches]);

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

  // Construit les paramètres d'export en reflétant les filtres actifs
  const exportParams = (format: string, statut: string) => {
    const p = new URLSearchParams({ format, statut });
    if (exclureMensualises) p.set('exclureMensualises', '1');
    if (seulementDemarches) p.set('seulementDemarches', '1');
    if (exclureDemarches) p.set('exclureDemarches', '1');
    return p.toString();
  };

  const ThBtn = ({ col, label }: { col: typeof triPar; label: string }) => (
    <button onClick={() => toggleTri(col)} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
      {label}
      {triPar === col && <span className="text-yellow-400">{triDesc ? '↓' : '↑'}</span>}
    </button>
  );

  const nbActifs = adherents.filter(a => a.statut !== 'REGULARISE').length;
  const totalReste = adherents
    .filter(a => a.dernierImpaye && a.dernierImpaye.resteAPayer > 0)
    .reduce((s, a) => s + (a.dernierImpaye?.resteAPayer ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Adhérents impayés</h1>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>{sorted.length} affiché{sorted.length > 1 ? 's' : ''}</span>
          {totalReste > 0 && (
            <span className="text-red-400 font-medium">{totalReste.toFixed(2)} € à percevoir</span>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
        {/* Ligne 1 : recherche + statut */}
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

        {/* Ligne 2 : cases à cocher */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exclureMensualises}
              onChange={e => setExclureMensualises(e.target.checked)}
              className="w-4 h-4 rounded accent-yellow-400"
            />
            <span className="text-sm text-slate-300">Exclure les VIR permanents / mensualités</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={seulementDemarches}
              onChange={e => { setSeulementDemarches(e.target.checked); if (e.target.checked) setExclureDemarches(false); }}
              className="w-4 h-4 rounded accent-yellow-400"
            />
            <span className="text-sm text-slate-300">Déjà démarchés (mail, SMS ou tél.)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exclureDemarches}
              onChange={e => { setExclureDemarches(e.target.checked); if (e.target.checked) setSeulementDemarches(false); }}
              className="w-4 h-4 rounded accent-yellow-400"
            />
            <span className="text-sm text-slate-300">Exclure les déjà démarchés (mail, SMS ou tél.)</span>
          </label>
        </div>

        {/* Ligne 3 : exports */}
        <div className="flex flex-wrap gap-2 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-xs text-slate-500 self-center">Export :</span>
          <a href={`/api/export?${exportParams('simple', statutFilter || 'tous')}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: 'rgba(249,194,36,0.3)', color: '#F9CA24' }}
          >
            Nom + Reste à payer
          </a>
          <a href={`/api/export?${exportParams('complet', statutFilter || 'tous')}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8' }}
          >
            Export complet
          </a>
        </div>
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
                      <div className="font-medium text-white flex items-center gap-2">
                        {a.nom}, {a.prenom}
                        {a.mensualise && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }} title="VIR permanent / mensualités">
                            VIR
                          </span>
                        )}
                      </div>
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
