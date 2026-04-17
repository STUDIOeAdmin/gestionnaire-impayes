'use client';

import { useEffect, useState } from 'react';

interface ImportRecord {
  id: string;
  nomFichier: string;
  dateExtract: string | null;
  nbAdherents: number;
  totalAPayer: number;
  totalTropPercu: number;
  createdAt: string;
}

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/imports')
      .then(r => r.json())
      .then(data => setImports(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-purple-900">Historique des imports</h1>

      {loading && <p className="text-purple-400">Chargement…</p>}
      {!loading && imports.length === 0 && (
        <p className="text-gray-500">Aucun import pour l'instant. Importez un fichier GIPSE depuis l'accueil.</p>
      )}

      <div className="space-y-3">
        {imports.map((imp, i) => (
          <div key={imp.id} className={`rounded-xl border bg-white shadow-sm p-5 ${i === 0 ? 'border-purple-200' : 'border-purple-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{imp.nomFichier}</span>
                  {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Dernier</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Importé le {new Date(imp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-700">{imp.nbAdherents}</div>
                  <div className="text-xs text-gray-400">adhérents</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-500">{imp.totalAPayer.toFixed(2)} €</div>
                  <div className="text-xs text-gray-400">à percevoir</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">{imp.totalTropPercu.toFixed(2)} €</div>
                  <div className="text-xs text-gray-400">trop-perçus</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
