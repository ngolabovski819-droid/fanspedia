// Health endpoint for Vercel / local testing
export default function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || null;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;
  res.status(200).json({
    status: 'ok',
    supabase: {
      url: !!SUPABASE_URL,
      anon_key: !!SUPABASE_ANON_KEY
    },
    env_keys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
}
