// Health endpoint for Vercel / local testing
export default function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || null;
  const SUPABASE_KEY = process.env.SUPABASE_KEY || null;
  
  // Decode JWT to check role (if present)
  let keyRole = 'unknown';
  if (SUPABASE_KEY) {
    try {
      const payload = SUPABASE_KEY.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      keyRole = decoded.role || 'unknown';
    } catch (e) {
      keyRole = 'invalid';
    }
  }
  
  res.status(200).json({
    status: 'ok',
    supabase: {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_KEY,
      key_role: keyRole
    },
    env_keys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
}
