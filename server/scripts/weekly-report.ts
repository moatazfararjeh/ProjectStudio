import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function generateWeeklyReport() {
  console.log('📊 Generating Weekly Project Report...\n');

  try {
    // Get date range for this week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const nextMonday = new Date(sunday);
    nextMonday.setDate(sunday.getDate() + 1);
    nextMonday.setHours(0, 0, 0, 0);
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    console.log(`📅 Current Week: ${monday.toLocaleDateString('ar-SA')} - ${sunday.toLocaleDateString('ar-SA')}`);
    console.log(`📅 Next Week: ${nextMonday.toLocaleDateString('ar-SA')} - ${nextSunday.toLocaleDateString('ar-SA')}\n`);

    // Get all projects
    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ['PLANNING', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    let reportContent = '';
    reportContent += '═══════════════════════════════════════════════════════════════\n';
    reportContent += '               WEEKLY PROJECT STATUS REPORT\n';
    reportContent += `               ${monday.toLocaleDateString('ar-SA')} - ${sunday.toLocaleDateString('ar-SA')}\n`;
    reportContent += '═══════════════════════════════════════════════════════════════\n\n';

    for (const project of projects) {
      reportContent += `\n${'='.repeat(60)}\n`;
      reportContent += `PROJECT: ${project.name} (${project.code})\n`;
      reportContent += `${'='.repeat(60)}\n\n`;

      // ==================== COMPLETED THIS WEEK ====================
      reportContent += '✅ COMPLETED THIS WEEK:\n';
      reportContent += '─'.repeat(60) + '\n';
      
      const completedTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          status: 'COMPLETED',
          updatedAt: {
            gte: monday,
            lte: sunday,
          },
        },
        include: {
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
          phase: {
            select: { name: true },
          },
        },
        orderBy: { endDate: 'asc' },
      });

      if (completedTasks.length === 0) {
        reportContent += '   • No tasks completed this week\n';
      } else {
        completedTasks.forEach((task, index) => {
          const assignee = task.assignedTo 
            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` 
            : 'Unassigned';
          const phase = task.phase?.name || 'N/A';
          
          reportContent += `   ${index + 1}. ${task.name}\n`;
          reportContent += `      Phase: ${phase}\n`;
          reportContent += `      Assignee: ${assignee}\n`;
          reportContent += `      Completion Date: ${task.endDate.toLocaleDateString('ar-SA')}\n`;
          reportContent += `      Progress: ${task.progress}%\n\n`;
        });
      }

      // ==================== PLANNED FOR NEXT WEEK ====================
      reportContent += '\n📋 PLANNED FOR NEXT WEEK:\n';
      reportContent += '─'.repeat(60) + '\n';
      
      const plannedTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          status: {
            in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
          startDate: {
            gte: nextMonday,
            lte: nextSunday,
          },
        },
        include: {
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
          phase: {
            select: { name: true },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      if (plannedTasks.length === 0) {
        reportContent += '   • No tasks planned for next week\n';
      } else {
        plannedTasks.forEach((task, index) => {
          const assignee = task.assignedTo 
            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` 
            : 'Unassigned';
          const phase = task.phase?.name || 'N/A';
          
          reportContent += `   ${index + 1}. ${task.name}\n`;
          reportContent += `      Phase: ${phase}\n`;
          reportContent += `      Assignee: ${assignee}\n`;
          reportContent += `      Start Date: ${task.startDate.toLocaleDateString('ar-SA')}\n`;
          reportContent += `      Due Date: ${task.endDate.toLocaleDateString('ar-SA')}\n`;
          reportContent += `      Status: ${task.status}\n\n`;
        });
      }

      // ==================== RAID LOG ====================
      reportContent += '\n🚨 RAID LOG (Risks, Assumptions, Issues, Dependencies):\n';
      reportContent += '─'.repeat(60) + '\n';
      
      const raidItems = await prisma.rAIDItem.findMany({
        where: {
          projectId: project.id,
          status: {
            not: 'CLOSED',
          },
        },
        include: {
          owner: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: [
          { type: 'asc' },
          { priority: 'desc' },
        ],
      });

      if (raidItems.length === 0) {
        reportContent += '   • No active RAID items\n';
      } else {
        // Group by type
        const grouped = {
          RISK: raidItems.filter(item => item.type === 'RISK'),
          ASSUMPTION: raidItems.filter(item => item.type === 'ASSUMPTION'),
          ISSUE: raidItems.filter(item => item.type === 'ISSUE'),
          DEPENDENCY: raidItems.filter(item => item.type === 'DEPENDENCY'),
        };

        for (const [type, items] of Object.entries(grouped)) {
          if (items.length > 0) {
            const emoji = type === 'RISK' ? '⚠️' : type === 'ISSUE' ? '🔴' : type === 'ASSUMPTION' ? '💡' : '🔗';
            reportContent += `\n   ${emoji} ${type}S (${items.length}):\n`;
            
            items.forEach((item, index) => {
              const owner = item.owner 
                ? `${item.owner.firstName} ${item.owner.lastName}` 
                : 'Unassigned';
              
              reportContent += `   ${index + 1}. ${item.title}\n`;
              reportContent += `      Description: ${item.description || 'N/A'}\n`;
              reportContent += `      Priority: ${item.priority || 'N/A'}\n`;
              if (item.impact) {
                reportContent += `      Impact: ${item.impact}\n`;
              }
              if (item.probability) {
                reportContent += `      Probability: ${item.probability}\n`;
              }
              if (item.riskScore) {
                reportContent += `      Risk Score: ${item.riskScore}\n`;
              }
              reportContent += `      Status: ${item.status}\n`;
              reportContent += `      Owner: ${owner}\n`;
              if (item.mitigation) {
                reportContent += `      Mitigation: ${item.mitigation}\n`;
              }
              reportContent += `      Identified: ${item.identifiedDate.toLocaleDateString('ar-SA')}\n\n`;
            });
          }
        }
      }

      // ==================== SUMMARY STATISTICS ====================
      reportContent += '\n📈 SUMMARY STATISTICS:\n';
      reportContent += '─'.repeat(60) + '\n';
      
      const totalTasks = await prisma.task.count({
        where: { projectId: project.id },
      });
      
      const completedCount = await prisma.task.count({
        where: { projectId: project.id, status: 'COMPLETED' },
      });
      
      const inProgressCount = await prisma.task.count({
        where: { projectId: project.id, status: 'IN_PROGRESS' },
      });
      
      const blockedCount = await prisma.task.count({
        where: { projectId: project.id, status: 'BLOCKED' },
      });

      const completionRate = totalTasks > 0 ? ((completedCount / totalTasks) * 100).toFixed(1) : '0.0';
      
      reportContent += `   Total Tasks: ${totalTasks}\n`;
      reportContent += `   Completed: ${completedCount} (${completionRate}%)\n`;
      reportContent += `   In Progress: ${inProgressCount}\n`;
      reportContent += `   Blocked: ${blockedCount}\n`;
      reportContent += `   Completed This Week: ${completedTasks.length}\n`;
      reportContent += `   Planned Next Week: ${plannedTasks.length}\n`;
      reportContent += `   Active RAID Items: ${raidItems.length}\n`;
      reportContent += '\n';
    }

    reportContent += '\n═══════════════════════════════════════════════════════════════\n';
    reportContent += '                    END OF REPORT\n';
    reportContent += '═══════════════════════════════════════════════════════════════\n';

    // Save to file
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const fileName = `Weekly_Report_${today.toISOString().split('T')[0]}.txt`;
    const filePath = path.join(reportDir, fileName);
    
    fs.writeFileSync(filePath, reportContent, 'utf8');
    
    console.log(reportContent);
    console.log(`\n✅ Report saved to: ${filePath}`);

  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateWeeklyReport();
