import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Provider } from '../types'
import { supabase } from '../lib/supabase'
import { Stars } from './Stars'
import { ProviderEdit } from './ProviderEdit'

type Props = {
  provider: Provider
  onClose: () => void
  refresh: () => Promise<void> | void
}

export function ProviderDetail({ provider, onClose, refresh }: Props) {
  const avg =
    provider.ratings && provider.ratings.length
      ? provider.ratings.reduce((a, r) => a + (r?.stars ?? 0), 0) / provider.ratings.length
      : 0

  const [rating, setRating] = useState(5)
  const [loggedIn, setLoggedIn] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setLoggedIn(!!session))
    return () => { sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsOwner(!!user?.id && user.id === (provider as any).user_id)
    })()
  }, [provider])

  async function sendRating() {
    if (!provider.id) return
    if (!loggedIn) return alert('Veuillez vous connecter pour noter.')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { provider_id: provider.id, user_id: user?.id, stars: rating }
    const { error } = await supabase.from('ratings').upsert(payload, { onConflict: 'provider_id,user_id' })
    if (error) { alert('Erreur enregistrement de la note : ' + error.message); return }
    await refresh()
  }

  return createPortal(
    <>
      {/* Backdrop (animée) */}
      <div className="fixed inset-0 bg-black/30 z-[9998] modal-backdrop" onClick={onClose} />

      {/* Container plein écran mobile, fenêtré desktop */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className="
            pointer-events-auto bg-white card
            w-full h-[100svh] rounded-none
            sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl
            overflow-y-auto relative modal-surface
          "
        >
          <button
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-900"
            onClick={onClose}
          >
            ✕
          </button>

          {/* Header sticky (mobile) */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-3 py-2 sm:hidden">
            <div className="font-semibold text-base">Fiche prestataire</div>
          </div>

          <div className="p-3 sm:p-6 pb-20 sm:pb-6">
            <div className="flex items-center gap-3">
              <img
                src={provider.photo_url || 'https://placehold.co/160x160?text=Photo'}
                alt={`${provider.first_name} ${provider.last_name}`}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold">
                  {provider.first_name} {provider.last_name}
                </h3>
                <div className="text-sm text-gray-500">
                  {(provider as any).department ? (provider as any).department + ' • ' : ''}{provider.city}
                </div>
                <div className="mt-1"><Stars value={avg || 0} /></div>

                {isOwner && (
                  <div className="mt-2">
                    <button
                      className="btn-secondary px-3 py-1 rounded-xl"
                      onClick={() => setEditing(true)}
                    >
                      ✏️ Modifier mon profil
                    </button>
                  </div>
                )}
              </div>
            </div>

            {provider.about && <p className="mt-3 text-sm text-gray-600">{provider.about}</p>}

            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-base sm:text-lg">Tarifs</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {provider.services?.map((s, i) => (
                  <div key={i} className="card p-3 flex items-center justify-between">
                    <span className="font-medium text-sm sm:text-base">{s.name}</span>
                    <span className="tabular-nums text-sm sm:text-base">{Number(s.price).toFixed(2)} €</span>
                  </div>
                ))}
                {(!provider.services || provider.services.length === 0) && (
                  <div className="text-sm text-gray-500">Aucune prestation renseignée.</div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Téléphone :</span>
              <a href={`tel:${provider.phone}`} className="font-medium text-blue-600 hover:underline">{provider.phone}</a>
            </div>

            <div className="mt-6 border rounded-2xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-medium">Donner une note</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={rating} onChange={(e)=>setRating(parseInt(e.target.value))} className="input w-32">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
                <button className="btn" onClick={sendRating}>Enregistrer</button>
              </div>
              {!loggedIn && <p className="text-xs text-red-500">Vous devez être connecté pour noter.</p>}
              <p className="text-xs text-gray-500">Un seul avis par utilisateur et par prestataire.</p>
            </div>
          </div>

          {/* CTA flottant mobile */}
          <div className="mobile-bottom-bar sm:hidden">
            <div className="px-3">
              <a
                href={`tel:${provider.phone}`}
                className="btn w-full rounded-2xl py-3"
              >
                📞 Appeler {provider.first_name}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sous-modal d’édition (animé aussi) */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[10000] modal-backdrop" />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div
              className="
                pointer-events-auto bg-white card
                w-full h-[100svh] rounded-none
                sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl
                overflow-y-auto relative modal-surface
              "
            >
              <button
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-900"
                onClick={()=>setEditing(false)}
              >
                ✕
              </button>

              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-3 py-2 sm:hidden">
                <div className="font-semibold text-base">Modifier mon profil</div>
              </div>

              <div className="p-3 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 hidden sm:block">Modifier mon profil</h2>
                <ProviderEdit
                  providerId={provider.id!}
                  onSaved={async ()=>{ setEditing(false); await refresh(); }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  )
}
