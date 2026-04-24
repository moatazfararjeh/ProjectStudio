const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkMembers() {
  try {
    const memberCount = await prisma.projectMember.count();
    console.log(`عدد أعضاء الفريق: ${memberCount}`);
    
    if (memberCount > 0) {
      const members = await prisma.projectMember.findMany({
        take: 5,
        include: {
          user: true,
          project: true,
        },
      });
      console.log('\nعينة من الأعضاء:');
      members.forEach(m => {
        console.log(`- ${m.user.firstName} ${m.user.lastName} في مشروع ${m.project.name}`);
      });
    }
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembers();
