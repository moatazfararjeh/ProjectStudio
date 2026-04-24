const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['error'],
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n📝 To create users, run one of these commands:');
      console.log('   npm run seed       # Seed all sample data');
      console.log('   OR register via the UI at: http://localhost:5173/register');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    console.error('\nMake sure:');
    console.error('1. Database is running (docker compose up -d)');
    console.error('2. Migrations have been applied (npx prisma migrate deploy)');
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
