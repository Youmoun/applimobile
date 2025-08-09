import React, { useState, useEffect } from 'react'
import { Service } from '../types'
import { supabase } from '../lib/supabase'

const CITIES = ['Paris','Vitry-sur-Seine','Ivry-sur-Seine','Champigny-sur-Marne','Créteil','Montreuil','Saint-Denis']
const CATEGORIES = ['Coiffeur','Mécanicien','Coach sportif','Électricien','Plombier','Esthéticienne','Baby-sitter']

export function ProviderSignup({ onCreated }: { onCreated: () => void }) {
  const [first_name, setFirst] = useState('')
  const [last_name, setLast] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [photo_url, setPhoto] = useState('')
  const [about, setAbout] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [services, setServices] = useState<Service[]>([{ name: '', price: 0 }])
  const [saving, setSaving] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setLoggedIn(!!session))
    return () => { sub.subscription.unsubscribe() }
  }, [])

  function addService() {
    setServices(prev => [...prev, { name: '', price: 0 }])
  }
  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateService(i: number, key: keyof Service, val: string) {
    setServices(prev => prev.map((s, idx) => (
      idx === i ? { ...s, [key]: key === 'price' ? Number(val) : val } as Service : s
    )))
  }
  function toggleCategory(cat: string) {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!loggedIn) return alert('Veuillez vous connecter pour créer un profil.')
    if (!first_name || !last_name || !city || !phone) return
    const clean = services.filter(s => s.name && s.price > 0)
    if (clean.length === 0) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p, error } = await supabase.from('providers')
        .insert({
          first_name,
          last_name,
          city,
          phone,
          photo_url: photo_url || null,
          about: about || null,
          categories,
          user_id: user?.id || null
        })
        .select('*')
        .single()
      if (error) throw error

      if (p?.id && clean.length) {
        const withPid = clean.map(s => ({ ...s, provider_id: p.id }))
        const { error: sErr } = await supabase.from('services').insert(withPid)
        if (sErr) throw sErr
      }

      onCreated()
      // reset
      setFirst(''); setLast(''); setCity(''); setPhone(''); setPhoto(''); setAbout('')
      setCategories([]); setServices([{ name: '', price: 0 }])
    } catch (err: any) {
      console.error(err)
      alert('Erreur création profil : ' + (err?.message ?? 'Vérifiez la configuration Supabase et votre connexion.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Prénom</label>
          <input className="input" value={first_name} onChange={e => setFirst(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input className="input" value={last_name} onChange={e => setLast(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Ville</label>
          <select className="input" value={city} onChange={e => setCity(e.target.value)} required>
            <option value="">Sélectionner...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Téléphone</label>
          <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 00 00 00 00" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Photo (URL)</label>
          <input className="input" value={photo_url} onChange={e => setPhoto(e.target.value)} placeholder="https://..." />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">À propos</label>
          <textarea className="input" value={about} onChange={e => setAbout(e.target.value)} placeholder="Décrivez votre activité en quelques lignes" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Catégories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              type="button"
              key={cat}
              className={`px-3 py-1 rounded-full border ${categories.includes(cat) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm">Prestations & tarifs</label>
          <button type="button" className="btn-secondary px-3 py-1 rounded-xl" onClick={addService}>+ Ajouter</button>
        </div>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7">
                <input
                  className="input"
                  placeholder="Nom de la prestation"
                  value={s.name}
                  onChange={e => updateService(i, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-4">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Prix (€)"
                  value={s.price}
                  onChange={e => updateService(i, 'price', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-1 text-right">
                {services.length > 1 && (
                  <button type="button" className="btn-secondary px-3 py-2 rounded-xl" onClick={() => removeService(i)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn w-full" disabled={saving}>
        {saving ? 'Création...' : 'Créer mon profil prestataire'}
      </button>
    </form>
  )
}
