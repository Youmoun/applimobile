# Prestataires — App (sans géolocalisation) : React + Vite + Supabase

Application pour trouver des prestataires (mécaniciens, coiffeurs, coachs sportifs, etc.), filtrer par **Prestation** et **Ville**, afficher **tarifs**, **téléphone**, **notes** et permettre l'**inscription prestataire** (auth Supabase).

## ✅ Fonctionnalités
- Recherche par **Prestation** et **Ville** (géolocalisation retirée).
- Fiche prestataire : **tarifs**, **à propos**, **notes** (1–5).
- Inscription prestataire (réservée aux **utilisateurs connectés**).
- **Un seul avis par utilisateur** et par prestataire (upsert).

## ⚙️ Installation locale
1. Créez un projet Supabase (gratuit).
2. Dans **Supabase → SQL**, exécutez les fichiers :
   - `supabase_auth.sql` (tables + RLS + insert réservé aux connectés)
   - `supabase_ratings_unique.sql` (unicité des avis + politique d'update)
3. Dans les **Settings → API** de Supabase, copiez :
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`
4. Créez un fichier `.env` à la racine (facultatif en local) :
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. En local :
   ```bash
   npm install
   npm run dev
   ```

## 🔐 E-mail de confirmation
- Pour des tests rapides : **désactivez la confirmation d’e-mail** (Supabase → Authentication → Providers → Email → décocher *Confirm email*).
- Sinon, laissez activé : l’utilisateur doit **confirmer l’e-mail**, puis se **connecter** pour créer son profil.

## 🚀 Déploiement Netlify
- Ajoutez ces **variables d’environnement** dans *Site settings → Build & deploy → Environment* :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Paramètres de build :
  - **Build command** : `npm run build`
  - **Publish directory** : `dist`
- Les fichiers `netlify.toml` et `public/_redirects` sont inclus (SPA).

## 🗄️ SQL (fichiers fournis)
- `supabase_auth.sql` : tables `providers`, `services`, `ratings` + RLS (insert = authenticated).
- `supabase_ratings_unique.sql` : index unique `(provider_id, user_id)` + politique d'update sur sa propre note.

## 🧪 Données de test (optionnel)
Dans Supabase → SQL :
```sql
insert into providers (first_name,last_name,city,phone,categories)
values
('Sofia','Benali','Paris','+33 6 12 34 56 78', array['Coiffeur']),
('Amine','Khaldi','Vitry-sur-Seine','+33 7 98 76 54 32', array['Mécanicien']),
('Mouna','Chaouki','Ivry-sur-Seine','+33 6 22 11 33 55', array['Coach sportif']);

insert into services (provider_id,name,price)
select id,'Coiffure femme',45 from providers where first_name='Sofia';
insert into services (provider_id,name,price)
select id,'Révision complète',120 from providers where first_name='Amine';
insert into services (provider_id,name,price)
select id,'Coaching (1h)',50 from providers where first_name='Mouna';
```
