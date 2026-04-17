'use client';

import { useState, useRef } from 'react';

interface ImportResult {
  nbAdherents: number;
  created: number;
  updated: number;
  totalAPayer: number;
  totalTropPercu: number;
}

export default function ImportExcel({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Format non supporté. Utilisez un fichier .xlsx ou .xls');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      setResult(data);
      onImportSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(249,194,36,0.15)' }}>
          <svg className="w-5 h-5" style={{ color: '#F9CA24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-white">Import fichier GIPSE</h2>
          <p className="text-xs text-slate-400">Fichier Excel exporté depuis GIPSE (.xlsx)</p>
        </div>
      </div>

      <div
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragging ? '#F9CA24' : 'rgba(255,255,255,0.15)',
          backgroundColor: dragging ? 'rgba(249,194,36,0.05)' : 'transparent',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        {loading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Traitement en cours…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-8 h-8 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-300">Glisser-déposer ou <span style={{ color: '#F9CA24' }}>cliquer pour choisir</span></p>
            <p className="text-xs text-slate-500">Feuilles attendues : "Tri par nom" et "Tri par cours"</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <p className="text-sm font-medium text-green-400 mb-2">✓ Import réussi — {result.nbAdherents} adhérents traités</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400">
            <div><span className="text-white font-medium">{result.created}</span> nouveaux</div>
            <div><span className="text-white font-medium">{result.updated}</span> mis à jour</div>
            <div><span className="text-red-400 font-medium">{result.totalAPayer.toFixed(2)} €</span> à percevoir</div>
            <div><span className="text-purple-400 font-medium">{result.totalTropPercu.toFixed(2)} €</span> trop-perçus</div>
          </div>
        </div>
      )}
    </div>
  );
}
