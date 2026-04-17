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

const TYPE_CONTACT: Record<string, { label: string; cls: string }> = {
  DC:         { label: 'Démarche contact',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  MAIL:       { label: 'Mail',                cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  SMS:        { label: 'SMS',                 cls: 'bg-green-50 text-green-600 border-green-200' },
  TEL:        { label: 'Appel téléphonique',  cls: 'bg-pink-50 text-pink-600 border-pink-200' },
  PASSAGE:    { label: 'Passage caisse',      cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  NOTE:       { label: 'Note',                cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  REGULARISE: { label: 'Régularisé',          cls: 'bg-green-50 text-green-700 border-green-200' },
};

const STATUT_STYLES: Record<string, { label: string; cls: string }> = {
  IMPAYES:    { label: 'Impayé',     cls: 'bg-red-50 text-red-600 border-red-200' },
  EN_COURS:   { label: 'En cours',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  TROP_PERCU: { label: 'Trop-perçu', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  REGULARISE: { label: 'Régularisé', cls: 'bg-green-50 text-green-600 border-green-200' },
};

export default function FicheAdherent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [adherent, setAdherent] = useState<AdherentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [typeContact, setTypeContact] = useState('DC');
  const [noteContact, setNoteContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);

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
        <div className="text-purple-400">Chargement…</div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Adhérent introuvable.</p>
        <button onClick={() => router.back()} className="mt-4 text-purple-600 underline text-sm">Retour</button>
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
          <button onClick={() => router.back()} className="text-sm text-purple-600 hover:text-purple-900 mb-2 flex items-center gap-1">
            ← Retour à la liste
          </button>
          <h1 className="text-2xl font-bold text-purple-900">{adherent.nom}, {adherent.prenom}</h1>
          <p className="text-gray-500 text-sm">N° dossier {adherent.numeroDossier}{adherent.famille ? ` · ${adherent.famille}` : ''}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium border self-start ${style.cls}`}>
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Situation financière */}
          {dernierImpaye && (
            <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
              <h2 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                Situation financière
                <span className="text-xs font-normal text-gray-400">— {dernierImpaye.import.nomFichier}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Total dû', value: `${dernierImpaye.totalDu.toFixed(2)} €`, cls: 'text-gray-700' },
                  { label: 'Total payé', value: `${dernierImpaye.totalPaye.toFixed(2)} €`, cls: 'text-green-600' },
                  { label: 'Dont avoir', value: `${dernierImpaye.dontAvoir.toFixed(2)} €`, cls: 'text-gray-500' },
                  {
                    label: 'Reste à payer',
                    value: dernierImpaye.resteAPayer < 0
                      ? `−${Math.abs(dernierImpaye.resteAPayer).toFixed(2)} €`
                      : `${dernierImpaye.resteAPayer.toFixed(2)} €`,
                    cls: dernierImpaye.resteAPayer < 0 ? 'text-purple-600' : dernierImpaye.resteAPayer === 0 ? 'text-green-600' : 'text-red-600',
                  },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-center">
                    <div className={`text-lg font-bold ${item.cls}`}>{item.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              {dernierImpaye.cours && (
                <p className="text-sm text-gray-500">Cours : <span className="text-gray-700">{dernierImpaye.cours}</span></p>
              )}
              {dernierImpaye.commentaireInit && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                  <p className="text-xs text-gray-400 mb-1">Commentaire initial (GIPSE)</p>
                  {dernierImpaye.commentaireInit}
                </div>
              )}
            </div>
          )}

          {/* Historique des contacts */}
          <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-purple-900 mb-4">
              Historique des relances
              <span className="ml-2 text-sm font-normal text-gray-400">({adherent.contacts.length})</span>
            </h2>
            {adherent.contacts.length === 0 && (
              <p className="text-gray-400 text-sm">Aucun contact enregistré.</p>
            )}
            <div className="space-y-3">
              {adherent.contacts.map(c => {
                const tc = TYPE_CONTACT[c.type] ?? { label: c.type, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                return (
                  <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tc.cls}`}>
                          {tc.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                      {c.note && <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.note}</p>}
                    </div>
                    <button onClick={() => supprimerContact(c.id)} className="text-gray-300 hover:text-red-500 text-xs self-start transition-colors">✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historique des imports */}
          {adherent.impayes.length > 1 && (
            <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
              <h2 className="font-semibold text-purple-900 mb-4">Historique des imports</h2>
              <div className="space-y-2">
                {adherent.impayes.map(imp => (
                  <div key={imp.id} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 border border-gray-100">
                    <span className="text-gray-500">{imp.import.nomFichier}</span>
                    <span className="text-xs text-gray-400">{new Date(imp.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span className="font-medium" style={{ color: imp.resteAPayer < 0 ? '#9333ea' : imp.resteAPayer === 0 ? '#16a34a' : '#dc2626' }}>
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
          <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-purple-900 mb-3">Statut</h2>
            <select
              value={statutEdit}
              onChange={e => setStatutEdit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm mb-3"
            >
              <option value="IMPAYES">Impayé</option>
              <option value="EN_COURS">En cours</option>
              <option value="TROP_PERCU">Trop-perçu</option>
              <option value="REGULARISE">Régularisé</option>
            </select>
            <button
              onClick={changerStatut}
              disabled={savingStatut || statutEdit === adherent.statut}
              className="w-full py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40"
            >
              {savingStatut ? 'Sauvegarde…' : 'Mettre à jour'}
            </button>
          </div>

          {/* Ajouter un contact */}
          <div className="rounded-xl border border-purple-100 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-purple-900 mb-3">Ajouter une action</h2>
            <form onSubmit={ajouterContact} className="space-y-3">
              <select
                value={typeContact}
                onChange={e => setTypeContact(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
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
                className="w-full px-3 py-2 rounded-lg text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm resize-none"
              />
              <button
                type="submit"
                disabled={savingContact}
                className="w-full py-2 rounded-lg text-sm font-medium border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-40"
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
