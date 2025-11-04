const fs = require('fs');
const path = require('path');

const envContent = `window.ENV = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
};
`;

const outputPath = path.join(__dirname, 'env.js');
fs.writeFileSync(outputPath, envContent, 'utf8');

console.log('✅ env.js généré avec succès pour Netlify');
