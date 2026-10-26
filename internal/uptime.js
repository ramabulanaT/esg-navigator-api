export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'esgnavigator-ai',
    ts: new Date().toISOString()
  });
}
