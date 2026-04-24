import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@epm.com' },
    update: {},
    create: {
      email: 'admin@epm.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@epm.com' },
    update: {},
    create: {
      email: 'pm@epm.com',
      password: userPassword,
      firstName: 'Project',
      lastName: 'Manager',
      role: 'PM',
      status: 'ACTIVE',
    },
  });

  const dev1 = await prisma.user.upsert({
    where: { email: 'developer1@epm.com' },
    update: {},
    create: {
      email: 'developer1@epm.com',
      password: userPassword,
      firstName: 'Ahmed',
      lastName: 'Ali',
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const dev2 = await prisma.user.upsert({
    where: { email: 'developer2@epm.com' },
    update: {},
    create: {
      email: 'developer2@epm.com',
      password: userPassword,
      firstName: 'Sara',
      lastName: 'Mohammed',
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created');

  // Create rate cards
  await prisma.rateCard.createMany({
    data: [
      {
        userId: dev1.id,
        costRate: 50,
        billRate: 80,
        currency: 'USD',
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        userId: dev2.id,
        costRate: 45,
        billRate: 75,
        currency: 'USD',
        effectiveFrom: new Date('2024-01-01'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Rate cards created');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'EPM System Development',
      code: 'EPM-001',
      description: 'Enterprise Project Management System - Full Stack Development',
      client: 'Internal',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 100000,
      price: 120000,
      currency: 'USD',
      progress: 35,
      managerId: pm.id,
      settings: {
        hoursPerDay: 8,
        workDays: [0, 1, 2, 3, 4], // Sun-Thu
        costCalculation: 'assignee',
      },
    },
  });

  console.log('✅ Project created');

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        userId: dev1.id,
        role: 'Senior Developer',
        allocation: 100,
      },
      {
        projectId: project.id,
        userId: dev2.id,
        role: 'Frontend Developer',
        allocation: 80,
      },
    ],
  });

  console.log('✅ Project members added');

  // Create phases
  const phase1 = await prisma.phase.create({
    data: {
      projectId: project.id,
      name: 'Phase 1: Setup & Design',
      description: 'Initial setup and system design',
      order: 1,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'COMPLETED',
    },
  });

  const phase2 = await prisma.phase.create({
    data: {
      projectId: project.id,
      name: 'Phase 2: Backend Development',
      description: 'API and database implementation',
      order: 2,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-30'),
      status: 'IN_PROGRESS',
    },
  });

  const phase3 = await prisma.phase.create({
    data: {
      projectId: project.id,
      name: 'Phase 3: Frontend Development',
      description: 'UI/UX implementation',
      order: 3,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-09-30'),
      status: 'NOT_STARTED',
    },
  });

  console.log('✅ Phases created');

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      phaseId: phase2.id,
      name: 'Design Database Schema',
      description: 'Create complete Prisma schema with all entities',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-04-07'),
      duration: 5,
      plannedHours: 40,
      actualHours: 38,
      priority: 'HIGH',
      status: 'COMPLETED',
      progress: 100,
      createdById: pm.id,
      assignedToId: dev1.id,
      order: 1,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      phaseId: phase2.id,
      name: 'Implement Authentication API',
      description: 'JWT-based auth with login/register endpoints',
      startDate: new Date('2024-04-08'),
      endDate: new Date('2024-04-14'),
      duration: 5,
      plannedHours: 40,
      actualHours: 25,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 60,
      createdById: pm.id,
      assignedToId: dev1.id,
      order: 2,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project.id,
      phaseId: phase2.id,
      name: 'Build Project Management API',
      description: 'CRUD operations for projects and members',
      startDate: new Date('2024-04-15'),
      endDate: new Date('2024-04-28'),
      duration: 10,
      plannedHours: 80,
      actualHours: 0,
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      progress: 0,
      createdById: pm.id,
      assignedToId: dev1.id,
      order: 3,
    },
  });

  console.log('✅ Tasks created');

  // Create task dependencies
  await prisma.taskDependency.create({
    data: {
      taskId: task2.id,
      dependsOnId: task1.id,
      type: 'FS',
      lag: 0,
    },
  });

  await prisma.taskDependency.create({
    data: {
      taskId: task3.id,
      dependsOnId: task2.id,
      type: 'FS',
      lag: 1,
    },
  });

  console.log('✅ Task dependencies created');

  // Create sample worklogs
  await prisma.worklog.createMany({
    data: [
      {
        projectId: project.id,
        taskId: task1.id,
        userId: dev1.id,
        date: new Date('2024-04-05'),
        hours: 8,
        description: 'Completed database schema design',
        whatDone: 'Created all tables and relationships in Prisma',
        whatNext: 'Start auth implementation',
        blockers: null,
      },
      {
        projectId: project.id,
        taskId: task2.id,
        userId: dev1.id,
        date: new Date('2024-04-10'),
        hours: 7,
        description: 'Working on JWT authentication',
        whatDone: 'Implemented login and register endpoints',
        whatNext: 'Add token refresh and role-based access',
        blockers: 'Need to clarify permission requirements',
      },
    ],
  });

  console.log('✅ Worklogs created');

  // Create RAID items
  await prisma.rAIDItem.createMany({
    data: [
      {
        projectId: project.id,
        type: 'RISK',
        title: 'Database Performance Issues',
        description: 'Large datasets may cause query performance degradation',
        impact: 'HIGH',
        probability: 'MEDIUM',
        riskScore: 9,
        status: 'OPEN',
        priority: 'HIGH',
        ownerId: pm.id,
        mitigation: 'Implement indexing and query optimization',
        targetDate: new Date('2024-05-01'),
      },
      {
        projectId: project.id,
        type: 'ISSUE',
        title: 'Missing UX Design Mockups',
        description: 'Design team has not delivered final mockups',
        impact: null,
        probability: null,
        riskScore: null,
        status: 'OPEN',
        priority: 'HIGH',
        ownerId: pm.id,
        mitigation: 'Follow up with design team daily',
        targetDate: new Date('2024-04-20'),
      },
      {
        projectId: project.id,
        type: 'ASSUMPTION',
        title: 'User Base Size',
        description: 'Assuming max 1000 concurrent users',
        impact: null,
        probability: null,
        riskScore: null,
        status: 'OPEN',
        priority: 'MEDIUM',
        ownerId: pm.id,
        mitigation: null,
        targetDate: null,
      },
    ],
  });

  console.log('✅ RAID items created');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin: admin@epm.com / admin123');
  console.log('  PM: pm@epm.com / user123');
  console.log('  Dev1: developer1@epm.com / user123');
  console.log('  Dev2: developer2@epm.com / user123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
