import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkParentTask() {
  const parentId = '917a0b95-2df9-4198-aad2-a9c9cda7e781';
  
  console.log(`\n🔍 Looking for parent task: ${parentId}\n`);

  try {
    const task = await prisma.task.findUnique({
      where: { id: parentId },
      include: {
        subtasks: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      console.log('❌ Task not found!');
      return;
    }

    console.log('✅ Task found:');
    console.log(`   ID: ${task.id}`);
    console.log(`   Name: "${task.name}"`);
    console.log(`   Parent ID: ${task.parentId || 'None (top-level task)'}`);
    console.log(`   Subtasks: ${task.subtasks.length}`);
    
    if (task.subtasks.length > 0) {
      console.log('\n   Subtask list:');
      task.subtasks.forEach((subtask, i) => {
        console.log(`     ${i + 1}. ${subtask.name} (${subtask.id})`);
      });
    }

    // Find all tasks that reference this task as parent
    const childrenCount = await prisma.task.count({
      where: { parentId: task.id },
    });

    console.log(`\n   Tasks referencing this as parent: ${childrenCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParentTask();
