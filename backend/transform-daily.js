const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'app', '(dashboard)', 'chicken-receiving', 'daily', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace standard names
content = content.replace(/Weekly/g, 'Daily');
content = content.replace(/weekly/g, 'daily');

// Replace Week with Day where appropriate (e.g., currentWeek -> currentDay)
content = content.replace(/currentWeek/g, 'currentDay');
content = content.replace(/setCurrentWeek/g, 'setCurrentDay');
content = content.replace(/startOfWeek/g, 'startOfDay');
content = content.replace(/endOfWeek/g, 'endOfDay');
content = content.replace(/subWeeks/g, 'subDays');
content = content.replace(/addWeeks/g, 'addDays');
content = content.replace(/nextWeek/g, 'nextDay');
content = content.replace(/prevWeek/g, 'prevDay');

// Replace fields
content = content.replace(/healthStatus/g, 'receiveTime');
content = content.replace(/batch/g, 'sublot');
content = content.replace(/สุขภาพ/g, 'เวลาที่รับ');
content = content.replace(/เลขที่ชุด/g, 'Sublot');
content = content.replace(/ปกติ/g, '00:00');

fs.writeFileSync(filePath, content);
console.log('Successfully transformed daily/page.tsx');
