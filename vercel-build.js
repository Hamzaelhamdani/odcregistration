/**
 * Script de build pour Vercel
 * Génère le fichier env.js à partir des variables d'environnement Vercel
 */

const fs = require('fs');
const path = require('path');

// Récupérer les variables d'environnement depuis Vercel
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Créer le contenu du fichier env.js
const envContent = `window.ENV = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'
};
`;

// Écrire le fichier env.js
const outputPath = path.join(__dirname, 'env.js');
fs.writeFileSync(outputPath, envContent, 'utf8');

console.log('✅ env.js généré avec succès pour Vercel');
