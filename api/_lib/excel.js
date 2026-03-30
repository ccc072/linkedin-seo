const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const EXCEL_FILE = path.join('/tmp', 'users.xlsx');

const COLUMNS = [
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
  { header: 'updatedAt', key: 'updatedAt', width: 25 },
];

async function ensureExcel() {
  if (!fs.existsSync(EXCEL_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    worksheet.columns = COLUMNS;
    await workbook.xlsx.writeFile(EXCEL_FILE);
  }
}

async function saveToExcel(userData) {
  await ensureExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');
  worksheet.addRow(userData);
  await workbook.xlsx.writeFile(EXCEL_FILE);
}

async function updateUserStatus(userId, status) {
  await ensureExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');

  worksheet.eachRow((row) => {
    if (row.getCell(1).value === userId) { // userId is column 1
      row.getCell(20).value = status; // userStatus is column 20
      row.getCell(23).value = new Date().toISOString(); // updatedAt is column 23
    }
  });

  await workbook.xlsx.writeFile(EXCEL_FILE);
}

async function getUsersPendingReminder() {
  await ensureExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');

  const users = [];
  const now = new Date();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const scheduledAt = row.getCell(19).value; // reminderEmailScheduledAt is column 19
    const userStatus = row.getCell(20).value; // userStatus is column 20

    if (scheduledAt && userStatus !== 'reminded') {
      const scheduledDate = new Date(scheduledAt);
      if (now >= scheduledDate) {
        users.push({
          userId: row.getCell(1).value, // userId is column 1
          name: row.getCell(2).value, // name is column 2
          email: row.getCell(3).value, // email is column 3
        });
      }
    }
  });

  return users;
}

async function markReminderSent(userId) {
  await ensureExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.getWorksheet('Users');

  worksheet.eachRow((row) => {
    if (row.getCell(1).value === userId) { // userId is column 1
      row.getCell(20).value = 'reminded'; // userStatus is column 20
      row.getCell(23).value = new Date().toISOString(); // updatedAt is column 23
    }
  });

  await workbook.xlsx.writeFile(EXCEL_FILE);
}

module.exports = { saveToExcel, updateUserStatus, getUsersPendingReminder, markReminderSent, ensureExcel };
