// Configuration des variables d'environnement pour le développement local
// Copiez ce fichier en "env-config.js" et remplacez les valeurs par vos vraies clés

window.ENV = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};
console.log('✅ Variables d\'environnement chargées depuis env-config.js');
