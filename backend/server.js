import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Initialize APIs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

const EXCEL_FILE = path.join(__dirname, 'users.xlsx');

// Initialize Excel file
async function initExcel() {
  if (!fs.existsSync(EXCEL_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    
    worksheet.columns = [
      { header: 'userId', key: 'userId', width: 40 },
      { header: 'name', key: 'name', width: 25 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'headline', key: 'headline', width: 40 },
      { header: 'about', key: 'about', width: 50 },
      { header: 'skills', key: 'skills', width: 50 },
      { header: 'certifications', key: 'certifications', width: 50 },
      { header: 'targetRole', key: 'targetRole', width: 30 },
      { header: 'initialConnections', key: 'initialConnections', width: 20 },
      { header: 'aiHeadline1', key: 'aiHeadline1', width: 50 },
      { header: 'aiHeadline2', key: 'aiHeadline2', width: 50 },
      { header: 'aiHeadline3', key: 'aiHeadline3', width: 50 },
      { header: 'aiAbout', key: 'aiAbout', width: 70 },
      { header: 'aiSkills', key: 'aiSkills', width: 50 },
      { header: 'aiCertificates', key: 'aiCertificates', width: 50 },
      { header: 'aiPostIdeas', key: 'aiPostIdeas', width: 70 },
      { header: 'aiFullPost', key: 'aiFullPost', width: 70 },
      { header: 'suggestionEmailSentAt', key: 'suggestionEmailSentAt', width: 25 },
      { header: 'reminderEmailScheduledAt', key: 'reminderEmailScheduledAt', width: 25 },
      { header: 'userStatus', key: 'userStatus', width: 20 },
      { header: 'newConnections', key: 'newConnections', width: 20 },
      { header: 'postedContent', key: 'postedContent', width: 15 },
      { header: 'updatedAt', key: 'updatedAt', width: 25 }
    ];
    
    await workbook.xlsx.writeFile(EXCEL_FILE);
    console.log('✓ Excel file created');
  }
}

// Save user data to Excel
async function saveToExcel(userData) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  worksheet.addRow(userData);
  await workbook.xlsx.writeFile(EXCEL_FILE);
}

// Update user status in Excel
async function updateUserStatus(userId, status) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  worksheet.eachRow((row, rowNumber) => {
    if (row.getCell('userId').value === userId) {
      row.getCell('userStatus').value = status;
      row.getCell('updatedAt').value = new Date().toISOString();
    }
  });
  
  await workbook.xlsx.writeFile(EXCEL_FILE);
}

// Get users pending reminder emails
async function getUsersPendingReminder() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  const users = [];
  const now = new Date();
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    
    const scheduledAt = row.getCell('reminderEmailScheduledAt').value;
    const emailSent = row.getCell('userStatus').value;
    
    if (scheduledAt && emailSent !== 'reminded') {
      const scheduledDate = new Date(scheduledAt);
      if (now >= scheduledDate) {
        users.push({
          userId: row.getCell('userId').value,
          name: row.getCell('name').value,
          email: row.getCell('email').value
        });
      }
    }
  });
  
  return users;
}

// Generate AI suggestions using Gemini
async function generateAISuggestions(formData) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
  
  const prompt = `You are a LinkedIn growth expert. Analyze this profile and provide improvement suggestions.

Current Profile:
- Headline: ${formData.headline}
- About: ${formData.about}
- Skills: ${formData.skills}
- Certifications: ${formData.certifications}
- Target Role: ${formData.targetRole}
- Current Connections: ${formData.connections}

Provide the following in a structured format:

1. THREE HEADLINES: Provide 3 optimized LinkedIn headlines (each max 220 characters)
2. IMPROVED ABOUT SECTION: Rewrite the about section to be compelling and professional (max 2600 characters)
3. RECOMMENDED SKILLS: List 10-15 key skills they should add
4. CERTIFICATIONS TO ADD: Suggest 5 relevant certifications
5. POST IDEAS: Give 5 LinkedIn post topic ideas
6. READY-TO-POST CONTENT: Write 1 complete LinkedIn post (engaging, professional, 150-200 words)
7. DAILY GROWTH TASKS: List specific daily actions

Format your response as JSON with these exact keys:
{
  "headlines": ["headline1", "headline2", "headline3"],
  "about": "improved about section",
  "skills": "skill1, skill2, skill3...",
  "certifications": "cert1, cert2, cert3...",
  "postIdeas": "1. idea1\\n2. idea2\\n3. idea3\\n4. idea4\\n5. idea5",
  "fullPost": "complete ready-to-post content",
  "growthTasks": "• Task 1\\n• Task 2\\n• Task 3"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse AI response');
}

// Send email using Resend
async function sendEmail(to, subject, html) {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: [to],
    subject: subject,
    html: html
  });
  
  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
  
  return data;
}

// Generate first email HTML
function generateFirstEmail(name, aiSuggestions) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #002FA7; border-bottom: 3px solid #002FA7; padding-bottom: 10px; }
        h2 { color: #0A0E17; margin-top: 30px; }
        .headline-box { background: #F3F4F6; padding: 15px; margin: 10px 0; border-left: 4px solid #002FA7; }
        .section { margin: 25px 0; }
        .post-box { background: #FFFFFF; border: 2px solid #E5E7EB; padding: 20px; margin: 15px 0; }
        .task-list { background: #F3F4F6; padding: 20px; margin: 15px 0; }
        ul { padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <h1>🚀 Your LinkedIn Growth Plan is Ready, ${name}!</h1>
      
      <p>Great news! We've analyzed your profile and created a personalized growth plan to help you land your dream role.</p>
      
      <div class="section">
        <h2>📌 Optimized Headlines</h2>
        <p>Choose one of these for maximum impact:</p>
        <div class="headline-box"><strong>Option 1:</strong> ${aiSuggestions.headlines[0]}</div>
        <div class="headline-box"><strong>Option 2:</strong> ${aiSuggestions.headlines[1]}</div>
        <div class="headline-box"><strong>Option 3:</strong> ${aiSuggestions.headlines[2]}</div>
      </div>
      
      <div class="section">
        <h2>✍️ Improved About Section</h2>
        <p>${aiSuggestions.about.replace(/\n/g, '<br>')}</p>
      </div>
      
      <div class="section">
        <h2>🎯 Skills to Add</h2>
        <p>${aiSuggestions.skills}</p>
      </div>
      
      <div class="section">
        <h2>🏆 Recommended Certifications</h2>
        <p>${aiSuggestions.certifications}</p>
      </div>
      
      <div class="section">
        <h2>💡 LinkedIn Post Ideas</h2>
        <p>${aiSuggestions.postIdeas.replace(/\n/g, '<br>')}</p>
      </div>
      
      <div class="section">
        <h2>📝 Ready-to-Post Content</h2>
        <div class="post-box">
          <p><em>Copy and paste this directly to LinkedIn:</em></p>
          <p>${aiSuggestions.fullPost.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      
      <div class="section">
        <h2>📈 Daily Growth Tasks</h2>
        <div class="task-list">
          <p>${aiSuggestions.growthTasks.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Pro Tip:</strong> Implement these changes within 24-48 hours for best results!</p>
        <p>We'll check in with you in 2 days to see your progress. 💪</p>
      </div>
    </body>
    </html>
  `;
}

// Generate reminder email HTML
function generateReminderEmail(name, userId) {
  const baseUrl = process.env.BASE_APP_URL;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #002FA7; }
        .button { display: inline-block; padding: 15px 30px; margin: 10px 10px 10px 0; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .completed { background: #002FA7; color: white; }
        .pending { background: #E5E7EB; color: #0A0E17; }
        .cta-section { margin: 30px 0; text-align: center; }
      </style>
    </head>
    <body>
      <h1>👋 Quick LinkedIn Progress Check</h1>
      
      <p>Hi ${name},</p>
      
      <p>It's been 48 hours since we sent your personalized LinkedIn growth plan. We're excited to hear about your progress!</p>
      
      <p><strong>Quick questions:</strong></p>
      <ul>
        <li>Did you update your profile with the new headline and about section?</li>
        <li>How many new connections did you make?</li>
        <li>Did you post the suggested content?</li>
      </ul>
      
      <div class="cta-section">
        <p><strong>Let us know your status:</strong></p>
        <a href="${baseUrl}/api/update?status=completed&userId=${userId}" class="button completed">✅ I Completed the Tasks</a>
        <a href="${baseUrl}/api/update?status=pending&userId=${userId}" class="button pending">⏳ Still Working on It</a>
      </div>
      
      <p>Remember, consistency is key to LinkedIn growth. Keep going! 💪</p>
      
      <p>Best regards,<br>LinkedIn Growth Assistant Team</p>
    </body>
    </html>
  `;
}

// Mark reminder as sent
async function markReminderSent(userId) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  worksheet.eachRow((row, rowNumber) => {
    if (row.getCell('userId').value === userId) {
      row.getCell('userStatus').value = 'reminded';
      row.getCell('updatedAt').value = new Date().toISOString();
    }
  });
  
  await workbook.xlsx.writeFile(EXCEL_FILE);
}

// API Routes
app.post('/api/submit', async (req, res) => {
  try {
    const { name, email, headline, about, skills, certifications, targetRole, connections } = req.body;
    
    // Validate required fields
    if (!name || !email || !headline || !about || !targetRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate unique user ID
    const userId = uuidv4();
    
    // Generate AI suggestions
    console.log('Generating AI suggestions...');
    const aiSuggestions = await generateAISuggestions({
      headline,
      about,
      skills,
      certifications,
      targetRole,
      connections
    });
    
    // Prepare user data for Excel
    const now = new Date().toISOString();
    const reminderTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours from now
    
    const userData = {
      userId,
      name,
      email,
      headline,
      about,
      skills,
      certifications,
      targetRole,
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
      updatedAt: now
    };
    
    // Save to Excel
    console.log('Saving to Excel...');
    await saveToExcel(userData);
    
    // Send first email
    console.log('Sending first email...');
    const emailHtml = generateFirstEmail(name, aiSuggestions);
    await sendEmail(email, 'Your LinkedIn Growth Plan', emailHtml);
    
    console.log(`✓ User ${userId} processed successfully`);
    
    res.json({
      success: true,
      message: 'Your LinkedIn growth plan has been sent to your email!',
      userId,
      suggestions: aiSuggestions
    });
    
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ 
      error: 'Failed to process your request', 
      details: error.message 
    });
  }
});

app.get('/api/update', async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }
    
    await updateUserStatus(userId, status);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #F3F4F6; }
          .message { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #002FA7; }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>✅ Thank You!</h1>
          <p>Your status has been updated successfully.</p>
          <p>${status === 'completed' ? 'Congratulations on completing the tasks! Keep up the great work! 🎉' : 'No worries! Take your time and keep making progress. You\'ve got this! 💪'}</p>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Cron job to send reminder emails (runs every minute)
cron.schedule('* * * * *', async () => {
  try {
    const users = await getUsersPendingReminder();
    
    for (const user of users) {
      console.log(`Sending reminder email to ${user.email}...`);
      const emailHtml = generateReminderEmail(user.name, user.userId);
      await sendEmail(user.email, 'Quick LinkedIn Progress Check', emailHtml);
      await markReminderSent(user.userId);
      console.log(`✓ Reminder sent to ${user.email}`);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LinkedIn Growth Assistant API is running' });
});

// Initialize and start server
async function startServer() {
  await initExcel();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Cron job active - checking for reminder emails every minute`);
  });
}

startServer();
