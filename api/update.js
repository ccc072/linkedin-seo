const { updateUserStatus } = require('./_lib/excel');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId, status } = req.query;

    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }

    await updateUserStatus(userId, status);

    const message = status === 'completed'
      ? 'Congratulations on completing the tasks! Keep up the great work!'
      : 'No worries! Take your time and keep making progress. You\'ve got this!';

    return res.status(200).send(`<!DOCTYPE html><html><head>
<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#F3F4F6}
.msg{background:white;padding:40px;border-radius:10px;max-width:500px;margin:0 auto;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
h1{color:#002FA7}</style></head><body>
<div class="msg"><h1>Thank You!</h1><p>Your status has been updated successfully.</p><p>${message}</p></div>
</body></html>`);
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
};
