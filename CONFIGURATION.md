# Configuration Locale

## Pour développer en local :

1. **Copiez le fichier d'exemple :**
   ```bash
   cp env-config.example.js env-config.js
   ```

2. **Modifiez `env-config.js` avec vos vraies clés Supabase :**
   - Remplacez `YOUR_PROJECT_ID` par votre ID de projet Supabase
   - Remplacez `YOUR_SUPABASE_ANON_KEY` par votre clé anonyme

3. **Le fichier `env-config.js` ne sera jamais commité** (il est dans `.gitignore`)

## Pour le déploiement sur Vercel :

Les variables d'environnement sont configurées dans les paramètres du projet Vercel :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Le fichier `/api/config.js` les charge automatiquement en production.
