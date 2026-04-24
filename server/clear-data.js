const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️ بدء حذف البيانات...');

    // Delete in correct order due to foreign key constraints
    console.log('- حذف ProjectProduct...');
    const deletedProjectProducts = await prisma.projectProduct.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedProjectProducts.count} سجل من ProjectProduct`);

    console.log('- حذف Product...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedProducts.count} سجل من Product`);

    console.log('- حذف Comment...');
    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedComments.count} سجل من Comment`);

    console.log('- حذف Worklog...');
    const deletedWorklogs = await prisma.worklog.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedWorklogs.count} سجل من Worklog`);

    console.log('- حذف RAIDItem...');
    const deletedRAIDItems = await prisma.rAIDItem.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedRAIDItems.count} سجل من RAIDItem`);

    console.log('- حذف Report...');
    const deletedReports = await prisma.report.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedReports.count} سجل من Report`);

    console.log('- حذف Task...');
    const deletedTasks = await prisma.task.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedTasks.count} سجل من Task`);

    console.log('- حذف Phase...');
    const deletedPhases = await prisma.phase.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedPhases.count} سجل من Phase`);

    console.log('- حذف ProjectMember...');
    const deletedProjectMembers = await prisma.projectMember.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedProjectMembers.count} سجل من ProjectMember`);

    console.log('- حذف Project...');
    const deletedProjects = await prisma.project.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedProjects.count} سجل من Project`);

    console.log('- حذف AccountReview...');
    const deletedAccountReviews = await prisma.accountReview.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedAccountReviews.count} سجل من AccountReview`);

    console.log('- حذف Account...');
    const deletedAccounts = await prisma.account.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedAccounts.count} سجل من Account`);

    console.log('- حذف RateCard...');
    const deletedRateCards = await prisma.rateCard.deleteMany({});
    console.log(`  ✅ تم حذف ${deletedRateCards.count} سجل من RateCard`);

    console.log('\n✅ تم حذف جميع البيانات بنجاح!');
    console.log('\n📊 ملخص الحذف:');
    console.log(`   - المشاريع: ${deletedProjects.count}`);
    console.log(`   - المنتجات: ${deletedProducts.count}`);
    console.log(`   - منتجات المشاريع: ${deletedProjectProducts.count}`);
    console.log(`   - المهام: ${deletedTasks.count}`);
    console.log(`   - الحسابات: ${deletedAccounts.count}`);
    console.log(`   - العملاء: ${deletedAccounts.count}`);

  } catch (error) {
    console.error('❌ خطأ في حذف البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
