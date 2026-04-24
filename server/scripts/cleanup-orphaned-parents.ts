import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function cleanupOrphanedParents() {
  console.log('🔍 Checking for tasks with orphaned parent references...\n');

  try {
    // Get all tasks
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    // Create a Set of all valid task IDs
    const validTaskIds = new Set(allTasks.map(t => t.id));

    // Find tasks with invalid parentId
    const orphanedTasks = allTasks.filter(
      task => task.parentId && !validTaskIds.has(task.parentId)
    );

    if (orphanedTasks.length === 0) {
      console.log('✅ No orphaned parent references found. Database is clean!');
      return;
    }

    console.log(`⚠️  Found ${orphanedTasks.length} tasks with orphaned parent references:\n`);
    
    orphanedTasks.forEach(task => {
      console.log(`  - "${task.name}" (ID: ${task.id})`);
      console.log(`    Points to non-existent parent: ${task.parentId}\n`);
    });

    console.log('🔧 Cleaning up orphaned references...\n');

    // Update all orphaned tasks to have null parentId
    const result = await prisma.task.updateMany({
      where: {
        id: {
          in: orphanedTasks.map(t => t.id),
        },
      },
      data: {
        parentId: null,
      },
    });

    console.log(`✅ Successfully cleaned up ${result.count} orphaned parent references!`);
    console.log('\n📊 Summary:');
    console.log(`   Total tasks checked: ${allTasks.length}`);
    console.log(`   Orphaned references fixed: ${result.count}`);
    console.log(`   Valid parent relationships: ${allTasks.filter(t => t.parentId && validTaskIds.has(t.parentId)).length}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedParents()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
