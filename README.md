# Prestataires — Département + Ville, Upload Photo, Geo-Search (sans stocker lat/lon des prestataires)

## Étapes
1) Supabase → Storage → crée un bucket **public** nommé `photos`.
2) Supabase → SQL → exécute `supabase_schema.sql`, puis `supabase_ratings_unique.sql`.
3) Netlify → variables d’environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4) Déploie.

## Remarques
- Le bouton **📍 Autour de moi** compare ta position aux **centres des villes** connues (voir `CITY_COORDS`), puis filtre par rayon (5/10/20/50 km). Aucune coordonnée de prestataire n’est stockée.
- Pour supporter d'autres villes/départements, ajoute-les dans `DEPTS` et `CITY_COORDS`.
