
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { Provider } from './types'
import { ProviderCard } from './components/ProviderCard'
import { ProviderDetail } from './components/ProviderDetail'
import { ProviderSignup } from './components/ProviderSignup'
import { AuthPanel } from './components/AuthPanel'

const CITIES = ['Paris','Vitry-sur-Seine','Ivry-sur-Seine','Champigny-sur-Marne','Créteil','Montreuil','Saint-Denis']
const CATEGORIES = ['Coiffeur','Mécanicien','Coach sportif','Électricien','Plombier','Esthéticienne','Baby-sitter']
const RADII = [5,10,20,50] // km

type WithDistance = Provider & { __distance?: number }

function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number){
  const toRad = (v:number)=> v * Math.PI / 180
  const R = 6371
  const dLat = toRad(lat2-lat1)
  const dLon = toRad(lon2-lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function App(){
  const [providers, setProviders] = useState<Provider[]>([])
  const [queryCategory, setQueryCategory] = useState('')
  const [queryCity, setQueryCity] = useState('')
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<Provider|null>(null)
  const [signupOpen, setSignupOpen] = useState(false)
  const [myLat, setMyLat] = useState<number|undefined>()
  const [myLng, setMyLng] = useState<number|undefined>()
  const [radiusKm, setRadiusKm] = useState<number>(10)
  const [geoMode, setGeoMode] = useState(false)

  async function fetchProviders(){
    const { data, error } = await supabase
      .from('providers')
      .select('*, services(*), ratings(stars)')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setProviders(data as unknown as Provider[])
  }

  useEffect(()=>{ fetchProviders() }, [])

  function askLocation(){
    if (!navigator.geolocation) return alert('La géolocalisation n\'est pas supportée par votre navigateur.')
    navigator.geolocation.getCurrentPosition((pos)=>{
      setMyLat(pos.coords.latitude)
      setMyLng(pos.coords.longitude)
      setGeoMode(true)
      setStarted(true)
    }, (err)=>{
      alert('Impossible d\'obtenir la position : ' + err.message)
    })
  }

  const filtered: WithDistance[] = useMemo(()=>{
    let arr: WithDistance[] = providers as WithDistance[]
    if (queryCity) arr = arr.filter(p => p.city === queryCity)
    if (queryCategory) arr = arr.filter(p => (p.categories || []).includes(queryCategory))
    if (geoMode && myLat !== undefined && myLng !== undefined){
      arr = arr
        .map(p => {
          const d = (p.latitude != null && p.longitude != null)
            ? haversineKm(myLat, myLng, p.latitude as unknown as number, p.longitude as unknown as number)
            : Number.POSITIVE_INFINITY
          return { ...p, __distance: d }
        })
        .filter(p => (p.__distance ?? Infinity) <= radiusKm)
        .sort((a,b) => (a.__distance ?? 0) - (b.__distance ?? 0))
    }
    return arr
  }, [providers, queryCity, queryCategory, geoMode, myLat, myLng, radiusKm])

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl" style={{background:'var(--brand)'}} />
            <span className="font-bold">Prestataires</span>
          </div>
          <AuthPanel />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <section className="py-10 sm:py-16 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Trouvez un prestataire près de chez vous</h1>
            <p className="mt-3 text-gray-600">Mécaniciens, coiffeurs, coachs sportifs… Comparez les tarifs, lisez les notes et contactez en un clic.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn" onClick={()=>{ setGeoMode(false); setStarted(true); }}>🔎 Trouver un prestataire</button>
              <button className="btn-secondary px-4 py-2 rounded-xl" onClick={askLocation}>📍 Autour de moi</button>
              <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>setSignupOpen(true)}>👤 Je suis prestataire</button>
            </div>
          </div>
          <div className="card p-4">
            <div className="font-semibold mb-2">Exemple de recherche</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Prestation</label>
                <select className="input" value={queryCategory} onChange={(e)=>setQueryCategory(e.target.value)}>
                  <option value="">Choisir une prestation</option>
                  {CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Ville</label>
                <select className="input" value={queryCity} onChange={(e)=>setQueryCity(e.target.value)}>
                  <option value="">Choisir une ville</option>
                  {CITIES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <button className="btn w-full" onClick={()=>{ setGeoMode(false); setStarted(true); }}>Lancer la recherche</button>
              <button className="btn-secondary px-4 py-2 rounded-xl w-full" onClick={askLocation}>📍 Autour de moi</button>
            </div>
          </div>
        </section>

        {started && (
          <section className="space-y-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-sm mb-1">Prestation</label>
                <select className="input min-w-[220px]" value={queryCategory} onChange={(e)=>setQueryCategory(e.target.value)}>
                  <option value="">Choisir une prestation</option>
                  {CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Ville</label>
                <select className="input min-w-[220px]" value={queryCity} onChange={(e)=>setQueryCity(e.target.value)}>
                  <option value="">Choisir une ville</option>
                  {CITIES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {geoMode && (
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-sm mb-1">Rayon (km)</label>
                    <select className="input" value={radiusKm} onChange={(e)=>setRadiusKm(parseInt(e.target.value))}>
                      {RADII.map(r => <option key={r} value={r}>{r} km</option>)}
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">Position: {myLat?.toFixed(4)}, {myLng?.toFixed(4)}</div>
                </div>
              )}
              <button className="btn-secondary px-4 py-2 rounded-xl" onClick={()=>{ setQueryCategory(''); setQueryCity(''); setGeoMode(false); }}>Réinitialiser</button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <div key={p.id} onClick={()=>setSelected(p)}>
                  <ProviderCard provider={p} onOpen={()=>setSelected(p)} />
                  {geoMode && (p as any).__distance != null && isFinite((p as any).__distance) && (
                    <div className="text-xs text-gray-500 mt-1">≈ {(p as any).__distance.toFixed(1)} km</div>
                  )}
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="card p-6 text-center text-gray-500">Aucun prestataire trouvé. Essayez d'élargir votre recherche.</div>
            )}
          </section>
        )}

        <section className="mt-12 grid sm:grid-cols-3 gap-4">
          <div className="card p-6">Transparence des tarifs : chaque prestataire affiche des prix clairs par prestation.</div>
          <div className="card p-6">Avis & notes : les utilisateurs connectés peuvent noter (1–5).</div>
          <div className="card p-6">Inscription prestataire : créez votre profil (requiert un compte) et ajoutez vos tarifs.</div>
        </section>
      </main>

      <footer className="mt-12 border-t">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Prestataires — Auth + Géoloc</div>
          <div className="flex items-center gap-4">
            <a className="hover:underline" href="#">Mentions légales</a>
            <a className="hover:underline" href="#">Contact</a>
          </div>
        </div>
      </footer>

      {selected && <ProviderDetail provider={selected} onClose={()=>setSelected(null)} refresh={fetchProviders} />}
      {signupOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full p-6 bg-white relative">
            <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-900" onClick={()=>setSignupOpen(false)}>✕</button>
            <h2 className="text-xl font-semibold mb-4">Créer mon profil prestataire</h2>
            <ProviderSignup onCreated={()=>{ setSignupOpen(false); fetchProviders(); }} />
          </div>
        </div>
      )}
    </div>
  )
}
