const { getUsersPendingReminder, markReminderSent } = require('../_lib/excel');
const { sendEmail, generateReminderEmail } = require('../_lib/email');

module.exports = async function handler(req, res) {
  try {
    const users = await getUsersPendingReminder();
    let sent = 0;

    for (const user of users) {
      const emailHtml = generateReminderEmail(user.name, user.userId);
      await sendEmail(user.email, 'Quick LinkedIn Progress Check', emailHtml);
      await markReminderSent(user.userId);
      sent++;
    }

    return res.status(200).json({ success: true, remindersSent: sent });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return res.status(500).json({ error: 'Failed to process reminders', details: error.message });
  }
};
