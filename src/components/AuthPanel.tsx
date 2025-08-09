
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthPanel(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const s = supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSessionEmail(session?.user?.email ?? null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])
  
// src/components/AuthPanel.tsx
async function signUp(){
  setLoading(true)
  const { data, error } = await supabase.auth.signUp({ email, password })
  setLoading(false)
  if (error) return alert(error.message)

  if (data.session) {
    // Email confirmation désactivée -> session directe
    alert("Inscription réussie. Vous êtes connecté.")
  } else {
    // Email confirmation activée -> pas de session tant que tu n'as pas confirmé
    alert("Inscription réussie. Vérifie ton e-mail pour confirmer, puis connecte-toi.")
  }
}

async function signIn(){
  setLoading(true)
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  setLoading(false)
  if (error) return alert(error.message)
}


  if (sessionEmail){
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Connecté : {sessionEmail}</span>
        <button className="btn-secondary px-3 py-1 rounded-xl" onClick={signOut}>Se déconnecter</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input className="input" style={{width:220}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" style={{width:160}} type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn-secondary px-3 py-2 rounded-xl" onClick={signIn} disabled={loading}>Se connecter</button>
      <button className="btn px-3 py-2 rounded-xl" onClick={signUp} disabled={loading}>{loading ? '...' : 'Créer un compte'}</button>
    </div>
  )
}
