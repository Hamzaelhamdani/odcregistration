# Configuration des Variables d'Environnement

## 🔐 Sécurité

Les clés Supabase ne doivent **JAMAIS** être committées sur GitHub. Elles sont gérées via des variables d'environnement.

## 📝 Configuration Netlify

1. Allez dans votre projet Netlify
2. Allez dans **Site settings > Environment variables**
3. Ajoutez les variables suivantes :

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Où trouver ces valeurs?**
- Allez sur [supabase.com](https://supabase.com)
- Ouvrez votre projet
- Allez dans Settings → API
- Copiez l'URL du projet et la clé "anon public"

## 💻 Développement Local

### Option 1 : Utiliser le script de build (Recommandé)

1. Assurez-vous que le fichier `.env` existe avec vos clés :
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

2. Exécutez le script de build :

**Windows (PowerShell) :**
```powershell
# Charger les variables depuis .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Exécuter le build
./build.ps1
```

**Linux/Mac (Bash) :**
```bash
# Charger les variables depuis .env et exécuter le build
export $(cat .env | xargs) && ./build.sh
```

### Option 2 : Créer un fichier env.js local (Pour tests rapides)

⚠️ **Attention** : Ce fichier ne doit JAMAIS être commité (il est dans .gitignore)

Créez un fichier `env.js` avec vos vraies clés :
```javascript
(function() {
    "use strict";
    window.ENV = {
        SUPABASE_URL: 'https://your-project.supabase.co',
        SUPABASE_ANON_KEY: 'your_supabase_anon_key_here'
    };
})();
```

## 🚀 Déploiement

Le déploiement sur Netlify se fait automatiquement :
1. Push sur GitHub
2. Netlify détecte le changement
3. Netlify exécute `build.sh` qui injecte les variables d'environnement
4. Le site est déployé avec les bonnes clés

## ✅ Vérification

- Le fichier `env.js` dans le repo GitHub doit contenir uniquement des placeholders (`__SUPABASE_URL__`)
- Les vraies clés sont uniquement dans :
  - `.env` (local, gitignoré)
  - Variables d'environnement Netlify (production)
- Ne jamais commiter de fichier contenant les vraies clés
