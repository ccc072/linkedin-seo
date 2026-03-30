const { v4: uuidv4 } = require('uuid');
const { generateAISuggestions } = require('./_lib/gemini');
const { saveToExcel } = require('./_lib/excel');
const { sendEmail, generateFirstEmail } = require('./_lib/email');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, headline, about, skills, certifications, targetRole, connections } = req.body;

    if (!name || !email || !headline || !about || !targetRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = uuidv4();

    const aiSuggestions = await generateAISuggestions({
      headline, about, skills, certifications, targetRole, connections,
    });

    const now = new Date().toISOString();
    const reminderTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const userData = {
      userId, name, email, headline, about, skills, certifications, targetRole,
      initialConnections: connections,
      aiHeadline1: aiSuggestions.headlines[0],
      aiHeadline2: aiSuggestions.headlines[1],
      aiHeadline3: aiSuggestions.headlines[2],
      aiAbout: aiSuggestions.about,
      aiSkills: aiSuggestions.skills,
      aiCertificates: aiSuggestions.certifications,
      aiPostIdeas: aiSuggestions.postIdeas,
      aiFullPost: aiSuggestions.fullPost,
      suggestionEmailSentAt: now,
      reminderEmailScheduledAt: reminderTime,
      userStatus: 'pending',
      newConnections: '',
      postedContent: 'no',
      updatedAt: now,
    };

    await saveToExcel(userData);

    const emailHtml = generateFirstEmail(name, aiSuggestions);
    await sendEmail(email, 'Your LinkedIn Growth Plan', emailHtml);

    return res.status(200).json({
      success: true,
      message: 'Your LinkedIn growth plan has been sent to your email!',
      userId,
      suggestions: aiSuggestions,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Failed to process your request', details: error.message });
  }
};
