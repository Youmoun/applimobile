import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ProviderEdit } from './ProviderEdit'
import type { Provider } from '../types'

export function AuthPanel(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  const [myProvider, setMyProvider] = useState<Provider | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // charge la session + mon provider
  const loadSessionAndMine = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const sEmail = data.session?.user?.email ?? null
      setSessionEmail(sEmail)

      const { data: userData, error: uErr } = await supabase.auth.getUser()
      if (uErr) console.error('getUser error:', uErr)
      const uid = userData.user?.id
      if (!uid) { setMyProvider(null); return }

      const { data: mine, error: mErr } = await supabase
        .from('providers')
        .select('*, services(*), ratings(stars)')
        .eq('user_id', uid)
        .maybeSingle()
      if (mErr && (mErr as any).code !== 'PGRST116') console.error('fetch my provider error:', mErr)

      setMyProvider((mine || null) as unknown as Provider | null)
    } catch (e) {
      console.error('loadSessionAndMine failed:', e)
    }
  }

  useEffect(()=>{
    loadSessionAndMine()
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, _session) => {
      loadSessionAndMine()
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  async function signUp(){
    try{
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { console.error('signUp error:', error); alert(error.message); return }
      if (data.session) alert('Inscription réussie. Vous êtes connecté.')
      else alert('Inscription réussie. Vérifiez votre e-mail puis connectez-vous.')
    } catch(e:any){
      console.error(e); alert(e.message || 'Erreur inconnue à l’inscription')
    } finally { setLoading(false); loadSessionAndMine() }
  }

  async function signIn(){
    try{
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { console.error('signIn error:', error); alert(error.message); return }
      // connecté
      await loadSessionAndMine()
    } catch(e:any){
      console.error(e); alert(e.message || 'Erreur inconnue à la connexion')
    } finally { setLoading(false) }
  }

  async function signOut(){
    await supabase.auth.signOut()
    await loadSessionAndMine()
  }

  if (sessionEmail){
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 truncate max-w-[180px]" title={sessionEmail}>
          Connecté : {sessionEmail}
        </span>

        {myProvider && (
          <button
            type="button"
            className="btn-secondary px-3 py-1 rounded-xl"
            onClick={()=> setEditOpen(true)}
            title="Modifier mon profil prestataire"
          >
            Mon profil
          </button>
        )}

        <button type="button" className="btn-secondary px-3 py-1 rounded-xl" onClick={signOut}>
          Se déconnecter
        </button>

        {editOpen && myProvider && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="card max-w-2xl w-full p-6 bg-white relative">
              <button
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-900"
                onClick={()=> setEditOpen(false)}
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4">Mon profil prestataire</h2>
              <ProviderEdit
                providerId={myProvider.id!}
                onSaved={async ()=>{
                  setEditOpen(false)
                  await loadSessionAndMine()
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="input"
        style={{width:220}}
        placeholder="Email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />
      <input
        className="input"
        style={{width:160}}
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e=>setPassword(e.target.value)}
      />
      <button type="button" className="btn-secondary px-3 py-2 rounded-xl" onClick={signIn} disabled={loading}>
        Se connecter
      </button>
      <button type="button" className="btn px-3 py-2 rounded-xl" onClick={signUp} disabled={loading}>
        {loading ? '...' : 'Créer un compte'}
      </button>
    </div>
  )
}
