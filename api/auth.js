/**
 * AUTH API — Server-side admin authentication endpoint.
 * Validates admin credentials and returns the ADMIN_API_SECRET token
 * so the admin dashboard can make authenticated write requests.
 *
 * The secret is never exposed in frontend source code — it is only
 * returned after successful server-side credential validation.
 */

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON' });
      }
    }

    const email = (body && body.email || '').trim().toLowerCase();
    const passwordHash = (body && body.passwordHash || '').trim();

    if (!email || !passwordHash) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Server-side credential validation: admin@akku.com / akku@121
    const VALID_EMAIL = 'admin@akku.com';
    const VALID_PASS_HASH = '50cf58d2a2363ed8b4b6a27075e5667816a36811f6f2e1be012b396c15567746'; // sha256 of 'akku@121'

    if (email !== VALID_EMAIL || passwordHash.toLowerCase() !== VALID_PASS_HASH) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Return the admin API secret for authenticated write operations
    const adminSecret = process.env.ADMIN_API_SECRET || '';

    return res.status(200).json({
      success: true,
      token: adminSecret,
      message: 'Authentication successful'
    });

  } catch (err) {
    console.error('[API Auth] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
