'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Adherent {
  id: string;
  numeroDossier: number;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  famille: string | null;
  familleMembers: { prenom: string; numeroDossier: number }[];
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

const STATUT_STYLES: Record<string, { label: string; cls: string }> = {
  IMPAYES:    { label: 'Impayé',     cls: 'bg-red-50 text-red-600 border-red-200' },
  EN_COURS:   { label: 'En cours',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  TROP_PERCU: { label: 'Trop-perçu', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  REGULARISE: { label: 'Régularisé', cls: 'bg-green-50 text-green-600 border-green-200' },
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

  const exportParams = (format: string, statut: string) => {
    const p = new URLSearchParams({ format, statut });
    if (exclureMensualises) p.set('exclureMensualises', '1');
    if (seulementDemarches) p.set('seulementDemarches', '1');
    if (exclureDemarches) p.set('exclureDemarches', '1');
    return p.toString();
  };

  const ThBtn = ({ col, label }: { col: typeof triPar; label: string }) => (
    <button onClick={() => toggleTri(col)} className="flex items-center gap-1 text-purple-600 hover:text-purple-900 transition-colors font-semibold text-xs uppercase tracking-wider">
      {label}
      {triPar === col && <span className="text-purple-400">{triDesc ? '↓' : '↑'}</span>}
    </button>
  );

  const totalReste = adherents
    .filter(a => a.dernierImpaye && a.dernierImpaye.resteAPayer > 0)
    .reduce((s, a) => s + (a.dernierImpaye?.resteAPayer ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-purple-900">Adhérents impayés</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{sorted.length} affiché{sorted.length > 1 ? 's' : ''}</span>
          {totalReste > 0 && (
            <span className="text-red-500 font-medium">{totalReste.toFixed(2)} € à percevoir</span>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou n° dossier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm"
          />
          <select
            value={statutFilter}
            onChange={e => setStatutFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
          >
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={exclureMensualises} onChange={e => setExclureMensualises(e.target.checked)} className="w-4 h-4 rounded accent-purple-600" />
            <span className="text-sm text-gray-600">Exclure les VIR permanents / mensualités</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={seulementDemarches} onChange={e => { setSeulementDemarches(e.target.checked); if (e.target.checked) setExclureDemarches(false); }} className="w-4 h-4 rounded accent-purple-600" />
            <span className="text-sm text-gray-600">Déjà démarchés (mail, SMS ou tél.)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={exclureDemarches} onChange={e => { setExclureDemarches(e.target.checked); if (e.target.checked) setSeulementDemarches(false); }} className="w-4 h-4 rounded accent-purple-600" />
            <span className="text-sm text-gray-600">Exclure les déjà démarchés (mail, SMS ou tél.)</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-purple-50">
          <span className="text-xs text-gray-400 self-center">Export :</span>
          <a href={`/api/export?${exportParams('simple', statutFilter || 'IMPAYES')}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
          >
            Export Relances
          </a>
          <a href={`/api/export?${exportParams('complet', statutFilter || 'tous')}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Export détaillé
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-purple-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-50 border-b border-purple-100">
              <tr>
                <th className="px-4 py-3 text-left"><ThBtn col="nom" label="Adhérent" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">Date naiss.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">N° dossier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">Cours</th>
                <th className="px-4 py-3 text-left"><ThBtn col="reste" label="Reste à payer" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">Total dû</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">Total payé</th>
                <th className="px-4 py-3 text-left"><ThBtn col="statut" label="Statut" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">Contacts</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-purple-400">Chargement…</td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Aucun résultat</td></tr>
              )}
              {!loading && sorted.map((a, i) => {
                const reste = a.dernierImpaye?.resteAPayer ?? 0;
                const style = STATUT_STYLES[a.statut] ?? STATUT_STYLES.IMPAYES;
                const rowBg = reste > 0
                  ? (i % 2 === 0 ? 'rgba(248,113,113,0.04)' : 'rgba(248,113,113,0.07)')
                  : (i % 2 === 0 ? '#ffffff' : '#faf5ff');
                return (
                  <tr key={a.id}
                    className="border-b border-gray-100 transition-colors"
                    style={{ backgroundColor: rowBg, borderLeft: reste > 0 ? '3px solid #f87171' : 'none' }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {a.nom}, {a.prenom}
                        {a.mensualise && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100" title="VIR permanent / mensualités">
                            VIR
                          </span>
                        )}
                      </div>
                      {a.famille && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {a.famille.replace(/ - \([SP]\)$/, '')}
                          {a.familleMembers.length > 0 && (
                            <span className="ml-1">
                              — {a.familleMembers.map(m => `${m.prenom} (n°${m.numeroDossier})`).join(' · ')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.dateNaissance ? new Date(a.dateNaissance).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.numeroDossier}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{a.dernierImpaye?.cours ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: reste < 0 ? '#9333ea' : reste === 0 ? '#16a34a' : '#dc2626' }}>
                      {reste < 0 ? `−${Math.abs(reste).toFixed(2)} €` : `${reste.toFixed(2)} €`}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.dernierImpaye?.totalDu?.toFixed(2) ?? '—'} €</td>
                    <td className="px-4 py-3 text-gray-500">{a.dernierImpaye?.totalPaye?.toFixed(2) ?? '—'} €</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style.cls}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-center">{a.nbContacts}</td>
                    <td className="px-4 py-3 w-16">
                      <Link href={`/adherents/${a.id}`}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
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
