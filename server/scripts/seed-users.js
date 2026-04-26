const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPwd = await bcrypt.hash('admin123', 10);
  const userPwd  = await bcrypt.hash('user123',  10);
  const users = [
    { email: 'admin@epm.com',      password: adminPwd, firstName: 'Admin',   lastName: 'User',    role: 'ADMIN',  status: 'ACTIVE' },
    { email: 'pm@epm.com',         password: userPwd,  firstName: 'Project', lastName: 'Manager', role: 'PM',     status: 'ACTIVE' },
    { email: 'developer1@epm.com', password: userPwd,  firstName: 'Ahmed',   lastName: 'Ali',     role: 'MEMBER', status: 'ACTIVE' },
    { email: 'developer2@epm.com', password: userPwd,  firstName: 'Sara',    lastName: 'Hassan',  role: 'MEMBER', status: 'ACTIVE' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
    console.log('Created:', u.email);
  }
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
