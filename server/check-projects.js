const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        manager: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    console.log('\n========================================');
    console.log('📊 المشاريع المحفوظة في قاعدة البيانات');
    console.log('========================================\n');
    console.log(`إجمالي المشاريع: ${projects.length}\n`);

    if (projects.length === 0) {
      console.log('⚠️  لا توجد مشاريع محفوظة في قاعدة البيانات!\n');
    } else {
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name}`);
        console.log(`   - الكود: ${project.code}`);
        console.log(`   - الحالة: ${project.status}`);
        console.log(`   - المدير: ${project.manager?.firstName} ${project.manager?.lastName}`);
        console.log(`   - تاريخ الإنشاء: ${new Date(project.createdAt).toLocaleString('ar-EG')}`);
        console.log('');
      });
    }

    console.log('========================================\n');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
