import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export function AuthPanel(){
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string|null>(null); const [loading, setLoading] = useState(false)
  useEffect(()=>{ supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user?.email ?? null)); const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setSessionEmail(session?.user?.email ?? null)); return () => { sub.subscription.unsubscribe() } }, [])
  async function signUp(){ setLoading(true); const { data, error } = await supabase.auth.signUp({ email, password }); setLoading(false); if (error) return alert(error.message); if (data.session) alert('Inscription réussie. Vous êtes connecté.'); else alert('Inscription réussie. Vérifiez votre e-mail puis connectez-vous.') }
  async function signIn(){ setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) return alert(error.message) }
  async function signOut(){ await supabase.auth.signOut() }
  if (sessionEmail){ return (<div className="flex items-center gap-2 text-sm"><span className="text-gray-600">Connecté : {sessionEmail}</span><button className="btn-secondary px-3 py-1 rounded-xl" onClick={signOut}>Se déconnecter</button></div>) }
  return (<div className="flex items-center gap-2">
    <input className="input" style={{width:220}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input className="input" style={{width:160}} type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} />
    <button className="btn-secondary px-3 py-2 rounded-xl" onClick={signIn} disabled={loading}>Se connecter</button>
    <button className="btn px-3 py-2 rounded-xl" onClick={signUp} disabled={loading}>{loading ? '...' : 'Créer un compte'}</button></div>)
}
