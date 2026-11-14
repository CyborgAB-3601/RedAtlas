let inMemoryConfig = { index: 1, name: 'Logi C270 HD WebCam' };

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      inMemoryConfig = { ...inMemoryConfig, ...(data || {}) };
      return res.status(200).json({ success: true, saved: inMemoryConfig });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(200).json(inMemoryConfig);
}
