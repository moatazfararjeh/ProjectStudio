const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();
p.task.updateMany({
  data: { assignedToId: null, assigneeName: 'Tawah Hussain Alsindi' }
}).then(result => {
  console.log(`Updated ${result.count} tasks to assignee: Tawah Hussain Alsindi`);
  return p.$disconnect();
});
