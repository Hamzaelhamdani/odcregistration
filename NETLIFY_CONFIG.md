# 🚀 Configuration Netlify - Guide Rapide

## 📋 Étapes à suivre

### 1. Ajouter les Variables d'Environnement dans Netlify

1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Sélectionnez votre site **ODCtrainingsandevents**
3. Allez dans **Site settings** (dans le menu de gauche)
4. Cliquez sur **Environment variables** (dans Build & deploy)
5. Cliquez sur **Add a variable**

Ajoutez ces deux variables :

#### Variable 1 : SUPABASE_URL
- **Key:** `SUPABASE_URL`
- **Value:** `https://your-project.supabase.co` (utilisez votre URL Supabase)
- **Scopes:** All (Production, Deploy previews, Branch deploys)

#### Variable 2 : SUPABASE_ANON_KEY
- **Key:** `SUPABASE_ANON_KEY`
- **Value:** `your_supabase_anon_key_here` (depuis votre dashboard Supabase → Settings → API)
- **Scopes:** All (Production, Deploy previews, Branch deploys)

### 2. Redéployer le Site

Après avoir ajouté les variables :

1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** → **Deploy site**

OU simplement faites un nouveau commit sur GitHub, Netlify redéploiera automatiquement.

### 3. Vérifier le Déploiement

Une fois le déploiement terminé :

1. Ouvrez votre site
2. Ouvrez la console du navigateur (F12)
3. Vous devriez voir :
   ```
   🔧 Variables d'environnement chargées: {url: "https://your-project.supabase.co", hasKey: true}
   🚀 Initialisation de Supabase...
   ✅ Supabase initialisé avec succès
   ```

## ✅ Sécurité

- ✅ Les clés ne sont PLUS dans le code sur GitHub
- ✅ Les clés sont uniquement dans Netlify (variables d'environnement)
- ✅ Le fichier `env.js` local contient les vraies clés (pour dev local) mais est ignoré par Git
- ✅ Le fichier `env.js.template` sur GitHub contient uniquement des placeholders

## 🔄 Workflow

### Production (Netlify)
```
Push sur GitHub → Netlify détecte le changement
                 → Exécute build.sh
                 → Injecte les variables d'environnement dans env.js
                 → Déploie le site
```

### Développement Local
```
1. Le fichier env.js existe déjà avec vos clés (ignoré par Git)
2. Lancez un serveur local (ex: python -m http.server 8000)
3. Le site fonctionne avec vos clés locales
```

## 📝 Notes Importantes

- Ne JAMAIS committer le fichier `env.js` avec de vraies clés
- Si vous devez régénérer `env.js` localement, utilisez le script `build.ps1`
- Les clés Supabase ANON sont publiques par design, mais gardez-les quand même hors du code source
