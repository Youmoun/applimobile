import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { Provider } from './types'
import { ProviderCard } from './components/ProviderCard'
import { ProviderDetail } from './components/ProviderDetail'
import { ProviderSignup } from './components/ProviderSignup'
import { AuthPanel } from './components/AuthPanel'

const DEPTS: Record<string, string[]> = {
  "75 - Paris": ["Paris"],
  "94 - Val-de-Marne": ["Vitry-sur-Seine","Ivry-sur-Seine","Champigny-sur-Marne","Créteil"],
  "93 - Seine-Saint-Denis": ["Montreuil","Saint-Denis"]
}
const CITY_COORDS: Record<string, {lat:number, lng:number}> = {
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Vitry-sur-Seine": { lat: 48.7872, lng: 2.392 },
  "Ivry-sur-Seine": { lat: 48.8131, lng: 2.3889 },
  "Champigny-sur-Marne": { lat: 48.8167, lng: 2.5167 },
  "Créteil": { lat: 48.7833, lng: 2.4667 },
  "Montreuil": { lat: 48.8638, lng: 2.4485 },
  "Saint-Denis": { lat: 48.9362, lng: 2.3574 },
}
function haversine(lat1:number, lon1:number, lat2:number, lon2:number){
  const R=6371, toRad=(d:number)=>d*Math.PI/180
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1)
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(a))
}
export default function App(){
  const [providers, setProviders] = useState<Provider[]>([])
  const [queryDept, setQueryDept] = useState('')
  const [queryCity, setQueryCity] = useState('')
  const [queryCategory, setQueryCategory] = useState('')
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<Provider|null>(null)
  const [signupOpen, setSignupOpen] = useState(false)
  const [myPos, setMyPos] = useState<{lat:number, lng:number} | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)
  async function fetchProviders(){
    const { data, error } = await supabase.from('providers').select('*, services(*), ratings(stars)').order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setProviders(data as unknown as Provider[])
  }
  useEffect(()=>{ fetchProviders() }, [])
  const filtered = useMemo(()=>{
    let list = providers.filter(p => {
      const matchDept = queryDept ? (p as any).department === queryDept : true
      const matchCity = queryCity ? p.city === queryCity : true
      const matchCat  = queryCategory ? (p.categories || []).includes(queryCategory) : true
      return matchDept && matchCity && matchCat
    })
    if (myPos){
      list = list.map(p => {
        const c = CITY_COORDS[p.city]; const d = c ? haversine(myPos.lat, myPos.lng, c.lat, c.lng) : Infinity
        return { p, d }
      }).filter(x => x.d <= radiusKm).sort((a,b)=> a.d - b.d).map(x => x.p)
    }
    return list
  }, [providers, queryDept, queryCity, queryCategory, myPos, radiusKm])
  return (<div className="min-h-screen pb-20">
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-2xl" style={{background:'var(--brand)'}} /><span className="font-bold">Prestataires</span></div>
        <AuthPanel />
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-4">
      <section className="py-10 sm:py-16 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Trouvez un prestataire</h1>
          <p className="mt-3 text-gray-600">Filtrez par département, ville et prestation. “Autour de moi” sans stocker la position des prestataires.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn" onClick={()=> setStarted(true)}>🔎 Trouver un prestataire</button>
            <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>setSignupOpen(true)}>👤 Je suis prestataire</button>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Exemple de recherche</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="block text-sm mb-1">Département</label>
              <select className="input" value={queryDept} onChange={e=>{ setQueryDept(e.target.value); setQueryCity('') }}>
                <option value="">Département</option>{Object.keys(DEPTS).map(d=> <option key={d} value={d}>{d}</option>)}
              </select></div>
            <div><label className="block text-sm mb-1">Ville</label>
              <select className="input" value={queryCity} onChange={e=>setQueryCity(e.target.value)} disabled={!queryDept}>
                <option value="">Ville</option>{(DEPTS[queryDept] || []).map(v=> <option key={v} value={v}>{v}</option>)}
              </select></div>
            <div><label className="block text-sm mb-1">Prestation</label>
              <select className="input" value={queryCategory} onChange={(e)=>setQueryCategory(e.target.value)}>
                <option value="">Choisir une prestation</option>
                {['Coiffeur','Mécanicien','Coach sportif','Électricien','Plombier','Esthéticienne','Baby-sitter'].map(c=> <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="flex items-end gap-2">
              <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>{
                if (!('geolocation' in navigator)) return alert('Géolocalisation non supportée')
                navigator.geolocation.getCurrentPosition(
                  (pos)=> setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                  (_)=> alert('Géolocalisation refusée ou indisponible')
                )
              }}>📍 Autour de moi</button>
              <select className="input" value={radiusKm} onChange={e=>setRadiusKm(parseInt(e.target.value))}>
                {[5,10,20,50].map(r => <option key={r} value={r}>{r} km</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3"><button className="btn w-full" onClick={()=> setStarted(true)}>Lancer la recherche</button></div>
        </div>
      </section>

      {started && (<section className="space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <select className="input min-w-[220px]" value={queryDept} onChange={e=>{ setQueryDept(e.target.value); setQueryCity('') }}>
            <option value="">Département</option>{Object.keys(DEPTS).map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input min-w-[220px]" value={queryCity} onChange={(e)=>setQueryCity(e.target.value)} disabled={!queryDept}>
            <option value="">Ville</option>{(DEPTS[queryDept] || []).map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="input min-w-[220px]" value={queryCategory} onChange={(e)=>setQueryCategory(e.target.value)}>
            <option value="">Prestation</option>
            {['Coiffeur','Mécanicien','Coach sportif','Électricien','Plombier','Esthéticienne','Baby-sitter'].map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>{
            if (!('geolocation' in navigator)) return alert('Géolocalisation non supportée')
            navigator.geolocation.getCurrentPosition(
              (pos)=> setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (_)=> alert('Géolocalisation refusée ou indisponible')
            )
          }}>📍 Autour de moi</button>
          <select className="input min-w-[140px]" value={radiusKm} onChange={e=>setRadiusKm(parseInt(e.target.value))}>
            {[5,10,20,50].map(r => <option key={r} value={r}>{r} km</option>)}
          </select>
          <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>{ setQueryDept(''); setQueryCity(''); setQueryCategory(''); setMyPos(null); }}>Réinitialiser</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (<div key={p.id} onClick={()=>setSelected(p)}><ProviderCard provider={p} onOpen={()=>setSelected(p)} /></div>))}
        </div>
        {filtered.length === 0 && (<div className="card p-6 text-center text-gray-500">Aucun prestataire trouvé. Essayez d'élargir votre recherche.</div>)}
      </section>)}

      <section className="mt-12 grid sm:grid-cols-3 gap-4">
        <div className="card p-6">Transparence des tarifs : prix clairs par prestation.</div>
        <div className="card p-6">Avis & notes : les utilisateurs connectés peuvent noter (1–5).</div>
        <div className="card p-6">Inscription prestataire : créez votre profil (requiert un compte) et ajoutez vos tarifs.</div>
      </section>
    </main>
    <footer className="mt-12 border-t"><div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div>© {new Date().getFullYear()} Prestataires</div>
      <div className="flex items-center gap-4"><a className="hover:underline" href="#">Mentions légales</a><a className="hover:underline" href="#">Contact</a></div>
    </div></footer>
    {selected && <ProviderDetail provider={selected} onClose={()=>setSelected(null)} refresh={fetchProviders} />}
    {signupOpen && (<div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"><div className="card max-w-2xl w-full p-6 bg-white relative">
      <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-900" onClick={()=>setSignupOpen(false)}>✕</button>
      <h2 className="text-xl font-semibold mb-4">Créer mon profil prestataire</h2>
      <ProviderSignup onCreated={()=>{ setSignupOpen(false); fetchProviders(); }} /></div></div>)}
  </div>)
}
