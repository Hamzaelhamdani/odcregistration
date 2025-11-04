// Ce fichier est généré automatiquement par Vercel Serverless Function
module.exports = function handler(request, response) {
  response.setHeader('Content-Type', 'application/javascript');
  response.status(200).send(`window.ENV = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
};`);
}
