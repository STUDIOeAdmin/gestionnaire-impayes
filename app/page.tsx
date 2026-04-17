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
            <a href="/api/export?statut=IMPAYES" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
              Export Impayés
            </a>
            <a href="/api/export?statut=TROP_PERCU" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
              Export Trop-perçus
            </a>
            <a href="/api/export?statut=tous" className="block w-full px-3 py-2 rounded-lg text-sm text-center border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
              Export complet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
