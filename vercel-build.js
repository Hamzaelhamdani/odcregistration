/**
 * Script de build pour Vercel
 * Génère le fichier env.js à partir des variables d'environnement Vercel
 * et crée la structure Build Output API v3
 */

const fs = require('fs');
const path = require('path');

// Récupérer les variables d'environnement depuis Vercel
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Debug: Afficher les variables (masquer la clé pour la sécurité)
console.log('🔍 SUPABASE_URL:', SUPABASE_URL ? '✅ Définie' : '❌ Vide');
console.log('🔍 SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? `✅ Définie (${SUPABASE_ANON_KEY.substring(0, 20)}...)` : '❌ Vide');

// Créer le contenu du fichier env.js
const envContent = `window.ENV = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'
};
`;

// 1. Écrire env.js dans le répertoire racine (pour le déploiement)
const outputPath = path.join(__dirname, 'env.js');
fs.writeFileSync(outputPath, envContent, 'utf8');
console.log('✅ env.js généré avec succès pour Vercel');
console.log('📁 Fichier créé:', outputPath);

// 2. Créer la structure Build Output API v3 pour Vercel
const outputDir = path.join(__dirname, '.vercel', 'output');
const staticDir = path.join(outputDir, 'static');

// Créer les dossiers
fs.mkdirSync(staticDir, { recursive: true });

// Copier tous les fichiers HTML, CSS, JS vers static
const filesToCopy = [
  'index.html',
  'styles.css',
  'script-dynamic.js',
  'script-calendar-fix.js',
  'env.js'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(staticDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`📋 Copié: ${file}`);
  }
});

// Copier le dossier admin
const adminSrc = path.join(__dirname, 'admin');
const adminDest = path.join(staticDir, 'admin');
if (fs.existsSync(adminSrc)) {
  fs.cpSync(adminSrc, adminDest, { recursive: true });
  console.log('📋 Copié: admin/');
}

// Copier le dossier config
const configSrc = path.join(__dirname, 'config');
const configDest = path.join(staticDir, 'config');
if (fs.existsSync(configSrc)) {
  fs.cpSync(configSrc, configDest, { recursive: true });
  console.log('� Copié: config/');
}

// Créer config.json pour Build Output API
const buildConfig = {
  version: 3
};
fs.writeFileSync(
  path.join(outputDir, 'config.json'),
  JSON.stringify(buildConfig, null, 2)
);

console.log('✅ Build Output API v3 créé avec succès');
