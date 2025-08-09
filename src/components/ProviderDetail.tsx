import React, { useState, useEffect } from 'react'
import { Provider } from '../types'
import { supabase } from '../lib/supabase'
import { Stars } from './Stars'
export function ProviderDetail({ provider, onClose, refresh }:{ provider: Provider, onClose: () => void, refresh: () => void }) {
  const avg = provider.ratings && provider.ratings.length ? (provider.ratings.reduce((a, r) => a + (r?.stars ?? 0), 0) / provider.ratings.length) : 0
  const [rating, setRating] = useState(5); const [loggedIn, setLoggedIn] = useState(false)
  useEffect(()=>{ supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session)); const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setLoggedIn(!!session)); return () => { sub.subscription.unsubscribe() } }, [])
  async function sendRating() { if (!provider.id) return; if (!loggedIn) return alert('Veuillez vous connecter pour noter.'); const { data: { user } } = await supabase.auth.getUser(); const payload = { provider_id: provider.id, user_id: user?.id, stars: rating }; const { error } = await supabase.from('ratings').upsert(payload, { onConflict: 'provider_id,user_id' }); if (error) { alert('Erreur enregistrement de la note : ' + error.message); return } await refresh() }
  return (<div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"><div className="card max-w-2xl w-full p-6 bg-white relative">
    <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-900" onClick={onClose}>✕</button>
    <div className="flex items-center gap-4">
      <img src={provider.photo_url || 'https://placehold.co/160x160?text=Photo'} className="h-20 w-20 rounded-2xl object-cover" />
      <div><h3 className="text-xl font-semibold">{provider.first_name} {provider.last_name}</h3>
        <div className="text-sm text-gray-500">{provider.department ? provider.department + ' • ' : ''}{provider.city}</div>
        <div className="mt-1"><Stars value={avg || 0} /></div></div></div>
    {provider.about && <p className="mt-3 text-sm text-gray-600">{provider.about}</p>}
    <div className="mt-4"><h4 className="font-semibold mb-2">Tarifs</h4><div className="grid sm:grid-cols-2 gap-2">
      {provider.services?.map((s, i) => (<div key={i} className="card p-3 flex items-center justify-between"><span className="font-medium">{s.name}</span><span className="tabular-nums">{s.price.toFixed(2)} €</span></div>))}
      {(!provider.services || provider.services.length === 0) && (<div className="text-sm text-gray-500">Aucune prestation renseignée.</div>)}
    </div></div>
    <div className="mt-4 flex items-center gap-2"><span className="text-sm text-gray-600">Téléphone :</span>
      <a href={`tel:${provider.phone}`} className="font-medium text-blue-600 hover:underline">{provider.phone}</a></div>
    <div className="mt-6 border rounded-2xl p-3 space-y-3">
      <div className="flex items-center gap-2"><span className="text-lg">⭐</span><span className="font-medium">Donner une note</span></div>
      <div className="flex items-center gap-2">
        <select value={rating} onChange={(e)=>setRating(parseInt(e.target.value))} className="input w-32">{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}</select>
        <button className="btn" onClick={sendRating}>Enregistrer</button></div>
      {!loggedIn && <p className="text-xs text-red-500">Vous devez être connecté pour noter.</p>}
      <p className="text-xs text-gray-500">Un seul avis par utilisateur et par prestataire.</p></div>
  </div></div>)
}
