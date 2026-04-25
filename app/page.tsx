'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImportExcel from '@/components/ImportExcel';

interface Stats {
  totalAdherents: number;
  impayes: number;
  tropPercus: number;
  enCours: number;
  regularises: number;
  totalAPayer: number;
  totalTropPercu: number;
  dernierImport: { nomFichier: string; createdAt: string } | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importingDates, setImportingDates] = useState(false);
  const [importDatesMsg, setImportDatesMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleImportDatesNaissance = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingDates(true);
    setImportDatesMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/import-dates-naissance', { method: 'POST', body: fd });
      const result = await res.json();
      if (res.ok) {
        const notFoundTxt = result.notFound > 0
          ? ` \u00b7 ${result.notFound} non trouv\u00e9(s)${result.notFoundList?.length ? ` : ${result.notFoundList.join(', ')}${result.notFound > result.notFoundList.length ? '\u2026' : ''}` : ''}`
          : '';
        const skippedTxt = result.skipped > 0 ? ` \u00b7 ${result.skipped} ignor\u00e9(s)` : '';
        setImportDatesMsg({
          type: 'success',
          text: `${result.updated} date(s) mise(s) \u00e0 jour${notFoundTxt}${skippedTxt}`,
        });
      } else {
        setImportDatesMsg({ type: 'error', text: result.error || 'Erreur inconnue' });
      }
    } catch (err) {
      setImportDatesMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setImportingDates(false);
      e.target.value = '';
    }
  };

  const statCards = stats ? [
    { label: 'Total à percevoir', value: `${stats.totalAPayer.toFixed(2)} €`, colorClass: 'text-red-500', borderClass: 'border-red-100' },
    { label: 'Adhérents impayés', value: stats.impayes.toString(), colorClass: 'text-orange-500', borderClass: 'border-orange-100' },
    { label: 'En cours de régul.', value: stats.enCours.toString(), colorClass: 'text-yellow-600', borderClass: 'border-yellow-100' },
    { label: 'Trop-perçus', value: stats.tropPercus.toString(), colorClass: 'text-purple-600', borderClass: 'border-purple-100' },
    { label: 'Régularisés', value: stats.regularises.toString(), colorClass: 'text-green-600', borderClass: 'border-green-100' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <Image src="/images/logo.png" alt="Studio e" width={100} height={100} style={{ width: 'auto', height: 100 }} className="object-contain" />
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-purple-900">Ge</span>
          <span className="text-purple-500">ST</span>
          <span className="text-purple-900">e </span>
          <span className="text-purple-400 text-2xl font-normal">Impayés</span>
        </h1>
        <p className="text-gray-500 text-lg">Suivi des paiements incomplets — Studio e Danse</p>
        {stats?.dernierImport && (
          <p className="text-xs text-purple-400 mt-2">
            Dernier import : {stats.dernierImport.nomFichier} — {new Date(stats.dernierImport.createdAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Cartes stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map(card => (
            <div key={card.label} className={`rounded-xl border ${card.borderClass} bg-white shadow-sm p-4 text-center`}>
              <div className={`text-2xl font-bold mb-1 ${card.colorClass}`}>{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-purple-100 bg-white p-4 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/adherents"
          className="group block p-5 rounded-xl border border-purple-100 bg-white shadow-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="font-semibold text-purple-900 mb-1">Liste des impayés</h2>
          <p className="text-gray-500 text-sm">Consulter, filtrer, suivre les relances par adhérent</p>
        </Link>

        <Link href="/imports"
          className="group block p-5 rounded-xl border border-purple-100 bg-white shadow-sm hover:bg-purple-50 hover:border-purple-200 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="font-semibold text-purple-900 mb-1">Historique des imports</h2>
          <p className="text-gray-500 text-sm">Voir tous les fichiers GIPSE importés</p>
        </Link>
      </div>

      {/* Import + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-purple-100 bg-white shadow-sm p-5">
          <ImportExcel onImportSuccess={fetchStats} />
        </div>
        <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h2 className="font-semibold text-purple-900">Export</h2>
          </div>
          <div className="space-y-2">
            <a href="/api/export?statut=IMPAYES&format=simple" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors font-medium">
              Export Relances Impayés
            </a>
            <a href="/api/export?statut=IMPAYES" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              Export détaillé Impayés
            </a>
            <a href="/api/export?statut=TROP_PERCU" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              Export Trop-perçus
            </a>
          </div>
        </div>

        {/* Import dates de naissance */}
        <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-purple-900">Dates de naissance</h2>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Import depuis l&apos;export BdD Membres (matching par N° de dossier).
          </p>
          <label className={`block w-full px-3 py-2 rounded-lg text-sm text-center border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer ${importingDates ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm,.csv"
              onChange={handleImportDatesNaissance}
              disabled={importingDates}
              className="hidden"
            />
            {importingDates ? 'Import en cours\u2026' : 'Importer dates de naissance'}
          </label>
          {importDatesMsg && (
            <p className={`mt-2 text-xs ${importDatesMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {importDatesMsg.type === 'success' ? '\u2713 ' : ''}{importDatesMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
