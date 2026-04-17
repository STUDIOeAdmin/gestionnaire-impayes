'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Contact {
  id: string;
  date: string;
  type: string;
  note: string | null;
}

interface Impaye {
  id: string;
  cours: string | null;
  totalDu: number;
  dontRbst: number;
  totalPaye: number;
  dontAvoir: number;
  resteAPayer: number;
  commentaireInit: string | null;
  createdAt: string;
  import: { nomFichier: string; dateExtract: string | null };
}

interface AdherentDetail {
  id: string;
  numeroDossier: number;
  nom: string;
  prenom: string;
  famille: string | null;
  statut: string;
  contacts: Contact[];
  impayes: Impaye[];
}

const TYPE_CONTACT: Record<string, { label: string; color: string }> = {
  DC:         { label: 'Démarche contact',    color: '#F9CA24' },
  MAIL:       { label: 'Mail',                color: '#60a5fa' },
  SMS:        { label: 'SMS',                 color: '#34d399' },
  TEL:        { label: 'Appel téléphonique',  color: '#f472b6' },
  PASSAGE:    { label: 'Passage caisse',      color: '#fb923c' },
  NOTE:       { label: 'Note',                color: '#94a3b8' },
  REGULARISE: { label: 'Régularisé',          color: '#4ade80' },
};

const STATUT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  IMPAYES:    { label: 'Impayé',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  EN_COURS:   { label: 'En cours',   color: '#F9CA24', bg: 'rgba(249,194,36,0.1)' },
  TROP_PERCU: { label: 'Trop-perçu', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  REGULARISE: { label: 'Régularisé', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

export default function FicheAdherent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [adherent, setAdherent] = useState<AdherentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire nouveau contact
  const [typeContact, setTypeContact] = useState('DC');
  const [noteContact, setNoteContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Changement de statut
  const [statutEdit, setStatutEdit] = useState('');
  const [savingStatut, setSavingStatut] = useState(false);

  const fetchAdherent = async () => {
    try {
      const res = await fetch(`/api/adherents/${id}`);
      const data = await res.json();
      setAdherent(data);
      setStatutEdit(data.statut);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdherent(); }, [id]);

  const ajouterContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adherentId: id, type: typeContact, note: noteContact }),
      });
      setNoteContact('');
      await fetchAdherent();
    } catch {
      // silencieux
    } finally {
      setSavingContact(false);
    }
  };

  const changerStatut = async () => {
    if (!adherent || statutEdit === adherent.statut) return;
    setSavingStatut(true);
    try {
      await fetch(`/api/adherents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: statutEdit }),
      });
      await fetchAdherent();
    } catch {
      // silencieux
    } finally {
      setSavingStatut(false);
    }
  };

  const supprimerContact = async (contactId: string) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await fetch(`/api/contacts?id=${contactId}`, { method: 'DELETE' });
    await fetchAdherent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Chargement…</div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Adhérent introuvable.</p>
        <button onClick={() => router.back()} className="mt-4 text-yellow-400 underline text-sm">Retour</button>
      </div>
    );
  }

  const dernierImpaye = adherent.impayes[0] ?? null;
  const style = STATUT_STYLES[adherent.statut] ?? STATUT_STYLES.IMPAYES;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-yellow-400 mb-2 flex items-center gap-1">
            ← Retour à la liste
          </button>
          <h1 className="text-2xl font-bold text-white">{adherent.nom}, {adherent.prenom}</h1>
          <p className="text-slate-400 text-sm">N° dossier {adherent.numeroDossier}{adherent.famille ? ` · ${adherent.famille}` : ''}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-sm font-medium self-start" style={{ color: style.color, backgroundColor: style.bg }}>
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Situation financière (dernier import) */}
          {dernierImpaye && (
            <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                Situation financière
                <span className="text-xs font-normal text-slate-500">— {dernierImpaye.import.nomFichier}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Total dû', value: `${dernierImpaye.totalDu.toFixed(2)} €`, color: '#e2e8f0' },
                  { label: 'Total payé', value: `${dernierImpaye.totalPaye.toFixed(2)} €`, color: '#4ade80' },
                  { label: 'Dont avoir', value: `${dernierImpaye.dontAvoir.toFixed(2)} €`, color: '#94a3b8' },
                  {
                    label: 'Reste à payer',
                    value: dernierImpaye.resteAPayer < 0
                      ? `−${Math.abs(dernierImpaye.resteAPayer).toFixed(2)} €`
                      : `${dernierImpaye.resteAPayer.toFixed(2)} €`,
                    color: dernierImpaye.resteAPayer < 0 ? '#a78bfa' : dernierImpaye.resteAPayer === 0 ? '#4ade80' : '#f87171',
                  },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              {dernierImpaye.cours && (
                <p className="text-sm text-slate-400">Cours : <span className="text-slate-300">{dernierImpaye.cours}</span></p>
              )}
              {dernierImpaye.commentaireInit && (
                <div className="mt-3 p-3 rounded-lg text-sm text-slate-300 whitespace-pre-wrap" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs text-slate-500 mb-1">Commentaire initial (GIPSE)</p>
                  {dernierImpaye.commentaireInit}
                </div>
              )}
            </div>
          )}

          {/* Historique des contacts */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h2 className="font-semibold text-white mb-4">
              Historique des relances
              <span className="ml-2 text-sm font-normal text-slate-400">({adherent.contacts.length})</span>
            </h2>
            {adherent.contacts.length === 0 && (
              <p className="text-slate-500 text-sm">Aucun contact enregistré.</p>
            )}
            <div className="space-y-3">
              {adherent.contacts.map(c => {
                const tc = TYPE_CONTACT[c.type] ?? { label: c.type, color: '#94a3b8' };
                return (
                  <div key={c.id} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: tc.color, backgroundColor: `${tc.color}18` }}>
                          {tc.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                      {c.note && <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.note}</p>}
                    </div>
                    <button onClick={() => supprimerContact(c.id)} className="text-slate-600 hover:text-red-400 text-xs self-start transition-colors">✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historique des imports */}
          {adherent.impayes.length > 1 && (
            <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <h2 className="font-semibold text-white mb-4">Historique des imports</h2>
              <div className="space-y-2">
                {adherent.impayes.map(imp => (
                  <div key={imp.id} className="flex items-center justify-between text-sm p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-slate-400">{imp.import.nomFichier}</span>
                    <span className="text-xs text-slate-500">{new Date(imp.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span className="font-medium" style={{ color: imp.resteAPayer < 0 ? '#a78bfa' : imp.resteAPayer === 0 ? '#4ade80' : '#f87171' }}>
                      {imp.resteAPayer < 0 ? `−${Math.abs(imp.resteAPayer).toFixed(2)}` : imp.resteAPayer.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Changer le statut */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h2 className="font-semibold text-white mb-3">Statut</h2>
            <select
              value={statutEdit}
              onChange={e => setStatutEdit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 text-sm mb-3"
            >
              <option value="IMPAYES">Impayé</option>
              <option value="EN_COURS">En cours</option>
              <option value="TROP_PERCU">Trop-perçu</option>
              <option value="REGULARISE">Régularisé</option>
            </select>
            <button
              onClick={changerStatut}
              disabled={savingStatut || statutEdit === adherent.statut}
              className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#F9CA24', color: '#1e293b' }}
            >
              {savingStatut ? 'Sauvegarde…' : 'Mettre à jour'}
            </button>
          </div>

          {/* Ajouter un contact */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h2 className="font-semibold text-white mb-3">Ajouter une action</h2>
            <form onSubmit={ajouterContact} className="space-y-3">
              <select
                value={typeContact}
                onChange={e => setTypeContact(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 text-sm"
              >
                {Object.entries(TYPE_CONTACT).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <textarea
                value={noteContact}
                onChange={e => setNoteContact(e.target.value)}
                placeholder="Note (optionnelle)…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-slate-200 bg-slate-800/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 text-sm resize-none"
              />
              <button
                type="submit"
                disabled={savingContact}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: 'rgba(249,194,36,0.15)', color: '#F9CA24', border: '1px solid rgba(249,194,36,0.3)' }}
              >
                {savingContact ? 'Enregistrement…' : '+ Ajouter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
