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

  // Suivre la session et charger "mon" provider
  useEffect(()=>{
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionEmail(data.session?.user?.email ?? null)

      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) { setMyProvider(null); return }
      const { data: mine } = await supabase
        .from('providers')
        .select('*, services(*), ratings(stars)')
        .eq('user_id', uid)
        .maybeSingle()
      setMyProvider((mine || null) as unknown as Provider | null)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, _session) => load())
    return () => { sub.subscription.unsubscribe() }
  }, [])

  async function signUp(){
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return alert(error.message)
    if (data.session) alert('Inscription réussie. Vous êtes connecté.')
    else alert('Inscription réussie. Vérifiez votre e-mail puis connectez-vous.')
  }
  async function signIn(){
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return alert(error.message)
  }
  async function signOut(){
    await supabase.auth.signOut()
  }

  // UI quand connecté : email + Mon profil (si existe) + Déconnexion
  if (sessionEmail){
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 truncate max-w-[180px]" title={sessionEmail}>
          Connecté : {sessionEmail}
        </span>

        {myProvider && (
          <button
            className="btn-secondary px-3 py-1 rounded-xl"
            onClick={()=> setEditOpen(true)}
            title="Modifier mon profil prestataire"
          >
            Mon profil
          </button>
        )}

        <button className="btn-secondary px-3 py-1 rounded-xl" onClick={signOut}>
          Se déconnecter
        </button>

        {/* Modal d’édition du profil */}
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
                  // Recharge mon provider pour refléter les changements
                  const { data: userData } = await supabase.auth.getUser()
                  const uid = userData.user?.id
                  if (uid){
                    const { data: mine } = await supabase
                      .from('providers')
                      .select('*, services(*), ratings(stars)')
                      .eq('user_id', uid)
                      .maybeSingle()
                    setMyProvider((mine || null) as unknown as Provider | null)
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // UI quand NON connecté : formulaire rapide login/signup
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
      <button className="btn-secondary px-3 py-2 rounded-xl" onClick={signIn} disabled={loading}>
        Se connecter
      </button>
      <button className="btn px-3 py-2 rounded-xl" onClick={signUp} disabled={loading}>
        {loading ? '...' : 'Créer un compte'}
      </button>
    </div>
  )
}
