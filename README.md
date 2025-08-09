
# Prestataires — App (React + Vite + Tailwind + Supabase)

Application pour trouver des prestataires (mécaniciens, coiffeurs, coachs sportifs...), filtrer par **Prestation**, **Ville** ou **autour de moi**, afficher **tarifs**, **téléphone**, **notes** et permettre l'**inscription** (avec authentification).

## ⚙️ Installation (local)
1. **Créer un projet Supabase** sur https://supabase.com (gratuit).
2. Dans Supabase > SQL, exécutez le fichier `supabase_auth_geo.sql` (fourni) qui crée/ajoute les colonnes + politiques d'accès.
3. Récupérez **Project URL** et **anon public key** (Settings > API).
4. Copiez `.env.example` en `.env` et remplissez :
   ```env
   VITE_SUPABASE_URL=...       # ex: https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...  # clé anonyme (public)
   ```
5. Installez et lancez :
   ```bash
   npm install
   npm run dev
   ```

## 🔐 Authentification
- E-mail + mot de passe via Supabase Auth (signup, login, logout).
- **Obligatoire** pour : créer un profil prestataire, publier des tarifs, déposer une note.
- Lecture publique (tout le monde peut chercher/voir les profils).

## 📍 Recherche par géolocalisation
- Bouton **Autour de moi** : l'app demande la localisation du navigateur.
- Choix d'un rayon (5/10/20/50 km). Les résultats sont filtrés et triés par distance.
- Les prestataires peuvent enregistrer leurs **coordonnées** en un clic via le bouton *Utiliser ma position* dans le formulaire.

⚠️ Pas besoin d'API externe : on stocke latitude/longitude, et on calcule la distance côté client (formule de Haversine).

## 🚀 Déploiement gratuit
- **Vercel** (recommandé) ou **Netlify** : ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables d'environnement.
- Déployez, et c’est en ligne.

## 🗄️ Schéma + RLS (auth + géoloc)

Exécutez `supabase_auth_geo.sql` dans Supabase (ça crée/altère les tables, et met des politiques qui **réservent l'insertion aux utilisateurs authentifiés**).

### Données de test (optionnel)
Dans l'éditeur SQL Supabase :
```sql
insert into providers (first_name,last_name,city,phone,categories,latitude,longitude)
values
('Sofia','Benali','Paris','+33 6 12 34 56 78', array['Coiffeur'], 48.8566, 2.3522),
('Amine','Khaldi','Vitry-sur-Seine','+33 7 98 76 54 32', array['Mécanicien'], 48.7872, 2.3923),
('Mouna','Chaouki','Ivry-sur-Seine','+33 6 22 11 33 55', array['Coach sportif'], 48.8157, 2.3841);

insert into services (provider_id,name,price)
select id,'Coiffure femme',45 from providers where first_name='Sofia';
insert into services (provider_id,name,price)
select id,'Brushing',25 from providers where first_name='Sofia';
insert into services (provider_id,name,price)
select id,'Révision complète',120 from providers where first_name='Amine';
insert into services (provider_id,name,price)
select id,'Changement de pneus',60 from providers where first_name='Amine';
insert into services (provider_id,name,price)
select id,'Coaching (1h)',50 from providers where first_name='Mouna';
insert into services (provider_id,name,price)
select id,'Programme mensuel',180 from providers where first_name='Mouna';
```


## 🔒 Empêcher plusieurs notes par utilisateur
Exécutez aussi `supabase_migration_ratings_unique.sql` dans Supabase > SQL. Cela crée un **index unique (provider_id, user_id)** et une **politique RLS** permettant de mettre à jour sa propre note.
