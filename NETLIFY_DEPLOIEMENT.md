
# Déployer sur Netlify — Guide rapide

## Option A — Depuis un dépôt GitHub (recommandé)
1. **Crée un dépôt GitHub** et envoie le projet `prestataires-app-supabase` dedans.
2. Va sur **Netlify** > *Add new site* > **Import an existing project** > choisis **GitHub** et sélectionne ton dépôt.
3. **Build command** : `npm run build`  
   **Publish directory** : `dist`
4. Dans **Site settings > Environment variables**, ajoute :
   - `VITE_SUPABASE_URL` = (URL de ton projet Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (anon public key)
5. Lance le **Deploy**. L’URL de ton site est créée automatiquement.

## Option B — Drag & Drop (sans Git)
1. En local, ouvre un terminal dans le dossier du projet et lance :
   ```bash
   npm install
   npm run build
   ```
   Cela crée un dossier `dist/`.
2. Sur Netlify, va sur **Sites** > bouton **Add new site** > **Deploy manually**. Glisse-dépose le dossier `dist/`.
3. (Si tu veux que Netlify rebuilde automatiquement, préfère l’option A avec Git).

## Important — SPA redirects
Le fichier `public/_redirects` et `netlify.toml` sont inclus. Ils redirigent toutes les routes vers `/index.html` pour éviter les erreurs 404.

## Supabase (rappel)
- Exécute `supabase_auth_geo.sql` puis `supabase_migration_ratings_unique.sql` dans **Supabase > SQL**.
- Renseigne les variables d’environnement côté Netlify (mêmes noms que `.env`).

## Tests après déploiement
- Ouvre l’URL Netlify → clique **Autour de moi** → autorise la géoloc.
- Essaie **Créer mon profil** : tu dois être connecté (crée un compte, connecte-toi).
- Laisse une note à un prestataire : une seule par utilisateur (mise à jour si tu renotes).

Besoin d’aide ? Dis-moi ce que tu vois à l’écran et je te guide pas à pas.
