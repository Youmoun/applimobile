
# Guide unique — Prestataires (Auth + Géoloc)

Ce document regroupe **toutes les étapes** pour installer, configurer la base Supabase (auth + géoloc), lancer en local et déployer gratuitement (Vercel/Netlify).

---

## 1) Pré-requis
- Node.js 18+ et npm
- Un compte **Supabase** (gratuit)
- Un compte **Vercel** ou **Netlify** (gratuit) pour déployer

---

## 2) Créer le projet Supabase
1. Allez sur https://supabase.com → New project.
2. Une fois créé : **Settings → API** → copiez :  
   - `Project URL` (ex: `https://xxxxx.supabase.co`)  
   - `anon public` key (clé publique)
3. Dans **Supabase → SQL**, collez et exécutez le contenu de `supabase_auth_geo.sql` (fourni dans ce projet).  
   Ce script crée les tables, la géoloc (`latitude/longitude`), l’auth (liaison `user_id`) et met les **RLS** :
   - Lecture publique (tout le monde peut chercher/voir)
   - Insertion **réservée aux utilisateurs connectés**

> Données de test (optionnel) : reportez-vous au README pour des `INSERT` d’exemple.

---

## 3) Configurer l’app (variables d’environnement)
1. Dans le dossier du projet, dupliquez `.env.example` en `.env` et remplissez :
   ```env
   VITE_SUPABASE_URL=Votre_URL_Supabase
   VITE_SUPABASE_ANON_KEY=Votre_Anon_Key
   ```
2. Ne partagez jamais la `service_role key`. L’app utilise **uniquement** la `anon` (publique).

---

## 4) Installation & lancement local
```bash
npm install
npm run dev
```
- Ouvrez l’URL locale affichée (ex: `http://localhost:5173`).

Fonctions clés à tester :
- **Auth** (email + mot de passe) : en haut à droite (Créer un compte / Se connecter / Se déconnecter)
- **Recherche** : par **Prestation**, **Ville**
- **Autour de moi** : demande la localisation, puis filtre par rayon (5/10/20/50 km) et trie par distance
- **Inscription prestataire** : nécessite d’être connecté, bouton *“Je suis prestataire”* → formulaire avec **📍 Utiliser ma position**

---

## 5) Déploiement gratuit

### Option A — Vercel (recommandée)
1. Poussez le projet sur un repo GitHub.
2. Sur Vercel : Import Project → sélectionnez le repo.
3. Dans **Project Settings → Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Déployez. L’URL `*.vercel.app` est créée automatiquement.

### Option B — Netlify
1. Connectez le repo.
2. Build command : `npm run build`  
   Publish directory : `dist`
3. Ajoutez les variables d’environnement (mêmes noms) puis déployez.

> GitHub Pages fonctionne aussi (site SPA), mais Vercel/Netlify sont plus simples pour les variables d’environnement.

---

## 6) Sécurité / bonnes pratiques
- **RLS en place** : insertion restreinte aux utilisateurs authentifiés (providers, services, ratings).
- Pour la prod :
  - Empêcher **plusieurs notes** par le même utilisateur sur le même prestataire (contrainte unique ou politique RLS spécifique).
  - Activer la **vérification d’email** dans Supabase Auth.
  - Ajouter du **rate limiting** (Edge Functions/API Gateway) si besoin.
  - Côté client : validations supplémentaires (format téléphone, prix >= 0, etc.).

---

## 7) Architecture du code (résumé)
- `src/lib/supabase.ts` : client Supabase (lit `.env`)
- `src/components/AuthPanel.tsx` : UI d’authentification
- `src/components/ProviderSignup.tsx` : formulaire d’inscription prestataire (avec géoloc)
- `src/components/ProviderCard.tsx` : carte prestataire (liste)
- `src/components/ProviderDetail.tsx` : fiche détaillée + notation
- `src/App.tsx` : logique de recherche (Prestation/Ville/Autour de moi), tri par distance, modales

---

## 8) Commandes utiles
```bash
# Développement
npm run dev

# Build production (dossier dist/)
npm run build

# Prévisualiser le build localement
npm run preview
```

---

## 9) FAQ rapide
**Le bouton “Autour de moi” ne marche pas ?**  
Vérifiez que votre navigateur autorise la géolocalisation pour l’URL locale/site.

**Je n’arrive pas à créer un prestataire / à noter ?**  
Il faut être **connecté**. Créez un compte via le panneau d’authentification.

**La liste est vide en production ?**  
Assurez-vous d’avoir exécuté `supabase_auth_geo.sql` et d’avoir mis les variables d’environnement sur Vercel/Netlify.

---

Besoin d’un **upload d’images** (avatars/preuves), d’une **modération** d’avis, ou d’un **tableau admin** ? Dites-moi et je vous l’ajoute.
