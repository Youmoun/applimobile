import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Provider, Service } from '../types'

const DEPTS: Record<string, string[]> = {
  '75 - Paris': ['Paris'],
  '94 - Val-de-Marne': ['Vitry-sur-Seine', 'Ivry-sur-Seine', 'Champigny-sur-Marne', 'Créteil'],
  '93 - Seine-Saint-Denis': ['Montreuil', 'Saint-Denis'],
}

export function ProviderEdit({ providerId, onSaved }: { providerId: string; onSaved: () => void }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [first_name, setFirst] = useState('')
  const [last_name, setLast] = useState('')
  const [department, setDepartment] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [photo_url, setPhoto] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [about, setAbout] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*, services(*)')
        .eq('id', providerId)
        .single()
      if (error) { alert(error.message); return }
      const p = data as unknown as Provider & { services: Service[] }
      setFirst(p.first_name); setLast(p.last_name)
      setDepartment((p as any).department || '')
      setCity(p.city); setPhone(p.phone)
      setPhoto(p.photo_url || '')
      setAbout(p.about || '')
      setCategories(p.categories || [])
      setServices((p.services || []).map(s => ({ id: s.id, name: s.name, price: Number(s.price), provider_id: s.provider_id })))
      setLoading(false)
    })()
  }, [providerId])

  function addService(){ setServices(prev=>[...prev, { name:'', price:0 }]) }
  function removeService(i:number){ setServices(prev=>prev.filter((_,idx)=>idx!==i)) }
  function updateService(i:number, key:keyof Service, val:string){
    setServices(prev=>prev.map((s,idx)=> idx===i ? ({ ...s, [key]: key==='price' ? Number(val): val } as Service) : s ))
  }
  function toggleCategory(cat: string){
    setCategories(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat])
  }

  async function save(){
    setSaving(true)
    try{
      // upload photo si nouveau fichier
      let finalPhotoUrl = photo_url || null
      if (file) {
        const { data: { user } } = await supabase.auth.getUser()
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `providers/${user?.id}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
        finalPhotoUrl = pub.publicUrl
      }

      // update provider (RLS: owner only)
      const { error: upProv } = await supabase.from('providers').update({
        first_name, last_name, department, city, phone,
        photo_url: finalPhotoUrl,
        about: about || null,
        categories
      }).eq('id', providerId)
      if (upProv) throw upProv

      // remplace toutes les prestations
      const { error: delErr } = await supabase.from('services').delete().eq('provider_id', providerId)
      if (delErr) throw delErr
      const clean = services.filter(s => s.name && s.price > 0)
      if (clean.length){
        const payload = clean.map(s => ({ provider_id: providerId, name: s.name, price: s.price }))
        const { error: insErr } = await supabase.from('services').insert(payload)
        if (insErr) throw insErr
      }

      onSaved()
    } catch(err: any){
      console.error(err)
      alert('Erreur sauvegarde : ' + (err?.message ?? 'Vérifiez vos droits et la connexion.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Chargement…</div>

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="block text-sm mb-1">Prénom</label><input className="input" value={first_name} onChange={e=>setFirst(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Nom</label><input className="input" value={last_name} onChange={e=>setLast(e.target.value)} /></div>
        <div>
          <label className="block text-sm mb-1">Département</label>
          <select className="input" value={department} onChange={e=>{ setDepartment(e.target.value); setCity('') }}>
            <option value="">Sélectionner...</option>
            {Object.keys(DEPTS).map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Ville</label>
          <select className="input" value={city} onChange={e=>setCity(e.target.value)} disabled={!department}>
            <option value="">Sélectionner...</option>
            {(DEPTS[department] || []).map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div><label className="block text-sm mb-1">Téléphone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
        <div>
          <label className="block text-sm mb-1">Photo</label>
          <input type="file" accept="image/*" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} className="input" />
          <p className="text-xs text-gray-500 mt-1">URL actuelle (modifiable si besoin)</p>
          <input className="input mt-1" value={photo_url || ''} onChange={e=>setPhoto(e.target.value)} placeholder="https://..." />
        </div>
        <div className="sm:col-span-2"><label className="block text-sm mb-1">À propos</label><textarea className="input" value={about} onChange={e=>setAbout(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Catégories</label>
        <div className="flex flex-wrap gap-2">
          {['Coiffeur','Mécanicien','Coach sportif','Électricien','Plombier','Esthéticienne','Baby-sitter'].map(cat => (
            <button type="button" key={cat}
              className={`px-3 py-1 rounded-full border ${categories.includes(cat) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={()=>toggleCategory(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm">Prestations & tarifs</label>
          <button type="button" className="btn-secondary px-3 py-1 rounded-xl" onClick={addService}>+ Ajouter</button>
        </div>
        <div className="space-y-2">
          {services.map((s, i)=>(
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7"><input className="input" placeholder="Nom de la prestation" value={s.name} onChange={e=>updateService(i,'name', e.target.value)} /></div>
              <div className="col-span-4"><input className="input" type="number" min="0" step="0.01" placeholder="Prix (€)" value={s.price} onChange={e=>updateService(i,'price', e.target.value)} /></div>
              <div className="col-span-1 text-right">
                {services.length > 1 && (
                  <button type="button" className="btn-secondary px-3 py-2 rounded-xl" onClick={()=>removeService(i)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
      </div>
    </div>
  )
}
