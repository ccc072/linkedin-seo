const { Resend } = require('resend');

async function sendEmail(to, subject, html) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
  return data;
}

function generateFirstEmail(name, ai) {
  return `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
h1{color:#002FA7;border-bottom:3px solid #002FA7;padding-bottom:10px}
h2{color:#0A0E17;margin-top:30px}
.hbox{background:#F3F4F6;padding:15px;margin:10px 0;border-left:4px solid #002FA7}
.sec{margin:25px 0}
.pbox{background:#FFF;border:2px solid #E5E7EB;padding:20px;margin:15px 0}
.tl{background:#F3F4F6;padding:20px;margin:15px 0}
.ft{margin-top:40px;padding-top:20px;border-top:2px solid #E5E7EB;font-size:14px;color:#666}
</style></head><body>
<h1>Your LinkedIn Growth Plan is Ready, ${name}!</h1>
<p>We've analyzed your profile and created a personalized growth plan.</p>
<div class="sec"><h2>Optimized Headlines</h2><p>Choose one:</p>
<div class="hbox"><strong>1.</strong> ${ai.headlines[0]}</div>
<div class="hbox"><strong>2.</strong> ${ai.headlines[1]}</div>
<div class="hbox"><strong>3.</strong> ${ai.headlines[2]}</div></div>
<div class="sec"><h2>Improved About Section</h2><p>${(ai.about || '').replace(/\n/g,'<br>')}</p></div>
<div class="sec"><h2>Skills to Add</h2><p>${ai.skills}</p></div>
<div class="sec"><h2>Recommended Certifications</h2><p>${ai.certifications}</p></div>
<div class="sec"><h2>LinkedIn Post Ideas</h2><p>${(ai.postIdeas || '').replace(/\n/g,'<br>')}</p></div>
<div class="sec"><h2>Ready-to-Post Content</h2><div class="pbox"><em>Copy and paste to LinkedIn:</em><br><br>${(ai.fullPost || '').replace(/\n/g,'<br>')}</div></div>
<div class="sec"><h2>Daily Growth Tasks</h2><div class="tl">${(ai.growthTasks || '').replace(/\n/g,'<br>')}</div></div>
<div class="ft"><strong>Pro Tip:</strong> Implement these changes within 24-48 hours for best results! We'll check in with you in 2 days.</div>
</body></html>`;
}

function generateReminderEmail(name, userId) {
  const baseUrl = process.env.BASE_APP_URL;
  return `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
h1{color:#002FA7}
.btn{display:inline-block;padding:15px 30px;margin:10px 10px 10px 0;text-decoration:none;border-radius:5px;font-weight:bold}
.done{background:#002FA7;color:white}
.pend{background:#E5E7EB;color:#0A0E17}
.cta{margin:30px 0;text-align:center}
</style></head><body>
<h1>Quick LinkedIn Progress Check</h1>
<p>Hi ${name},</p>
<p>It's been 48 hours since we sent your LinkedIn growth plan. How's your progress?</p>
<ul><li>Did you update your headline and about section?</li><li>How many new connections did you make?</li><li>Did you post the suggested content?</li></ul>
<div class="cta"><p><strong>Let us know:</strong></p>
<a href="${baseUrl}/api/update?status=completed&userId=${userId}" class="btn done">I Completed the Tasks</a>
<a href="${baseUrl}/api/update?status=pending&userId=${userId}" class="btn pend">Still Working on It</a></div>
<p>Consistency is key to LinkedIn growth. Keep going!</p>
<p>Best regards,<br>LinkedIn Growth Assistant Team</p>
</body></html>`;
}

module.exports = { sendEmail, generateFirstEmail, generateReminderEmail };
