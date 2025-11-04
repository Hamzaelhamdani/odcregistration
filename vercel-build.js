/**
 * Script de build pour Vercel
 * Génère le fichier env.js à partir des variables d'environnement Vercel
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

// Écrire env.js dans le répertoire racine
const outputPath = path.join(__dirname, 'env.js');
fs.writeFileSync(outputPath, envContent, 'utf8');

console.log('✅ env.js généré avec succès pour Vercel');
console.log('📁 Fichier créé:', outputPath);
