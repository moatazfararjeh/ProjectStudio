const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...\n');

    // 1. Create Users (Team Members + Manager)
    console.log('👥 إنشاء المستخدمين...');
    const manager = await prisma.user.upsert({
      where: { email: 'manager@epm.com' },
      update: {},
      create: {
        email: 'manager@epm.com',
        password: '$2b$10$rH8c9p0Z7QX5aP3vJ1mYPeK8zL4wN6tY9xR2sV5dQ1aB7cE9fG3h', // password: manager123
        firstName: 'أحمد',
        lastName: 'المدير',
        role: 'PM',
        status: 'ACTIVE',
      },
    });

    const users = [];
    const userNames = [
      { firstName: 'محمد', lastName: 'السعيد', email: 'mohamed@epm.com' },
      { firstName: 'فاطمة', lastName: 'أحمد', email: 'fatima@epm.com' },
      { firstName: 'خالد', lastName: 'عبدالله', email: 'khaled@epm.com' },
      { firstName: 'نورة', lastName: 'محمد', email: 'noura@epm.com' },
      { firstName: 'عمر', lastName: 'الحسن', email: 'omar@epm.com' },
      { firstName: 'سارة', lastName: 'علي', email: 'sara@epm.com' },
      { firstName: 'يوسف', lastName: 'خالد', email: 'youssef@epm.com' },
      { firstName: 'مريم', lastName: 'سعد', email: 'maryam@epm.com' },
    ];

    for (const userData of userNames) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: '$2b$10$rH8c9p0Z7QX5aP3vJ1mYPeK8zL4wN6tY9xR2sV5dQ1aB7cE9fG3h',
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
      users.push(user);
    }
    console.log(`  ✅ تم إنشاء ${users.length + 1} مستخدم\n`);

    // 2. Create Accounts (Clients)
    console.log('🏢 إنشاء العملاء...');
    const accounts = [];
    const accountsData = [
      {
        code: 'ACC-2026-001',
        name: 'شركة النجاح التقني',
        industry: 'Technology',
        size: 'Large',
        status: 'ACTIVE',
        healthScore: 85,
        renewalProbability: 90,
        annualValue: 500000,
        lifetimeValue: 1200000,
        primaryContact: 'أحمد محمد',
        primaryContactEmail: 'ahmad@success-tech.com',
        primaryContactPhone: '+966501234567',
        contractEndDate: new Date('2026-12-31'),
        nextReviewDate: new Date('2026-12-01'),
      },
      {
        code: 'ACC-2026-002',
        name: 'مؤسسة التميز للتجارة',
        industry: 'Retail',
        size: 'Medium',
        status: 'ACTIVE',
        healthScore: 72,
        renewalProbability: 75,
        annualValue: 200000,
        lifetimeValue: 450000,
        primaryContact: 'فاطمة أحمد',
        primaryContactEmail: 'fatima@excellence.com',
        primaryContactPhone: '+966509876543',
        contractEndDate: new Date('2027-03-31'),
        nextReviewDate: new Date('2026-11-15'),
      },
      {
        code: 'ACC-2026-003',
        name: 'شركة الأمل الطبية',
        industry: 'Healthcare',
        size: 'Enterprise',
        status: 'ACTIVE',
        healthScore: 78,
        renewalProbability: 80,
        annualValue: 800000,
        lifetimeValue: 2500000,
        primaryContact: 'د. خالد عبدالله',
        primaryContactEmail: 'khalid@amal-medical.com',
        primaryContactPhone: '+966501111222',
        contractEndDate: new Date('2026-06-30'),
        nextReviewDate: new Date('2026-04-01'),
      },
    ];

    for (const accountData of accountsData) {
      const account = await prisma.account.create({
        data: accountData,
      });
      accounts.push(account);
    }
    console.log(`  ✅ تم إنشاء ${accounts.length} عميل\n`);

    // 3. Create Products
    console.log('📦 إنشاء المنتجات...');
    const products = [];
    const productsData = [
      {
        code: 'SW-001',
        name: 'Enterprise Software License',
        nameAr: 'رخصة برنامج مؤسسي',
        description: 'Annual software license for enterprise applications',
        category: 'Software',
        unit: 'License',
        unitPrice: 5000,
        cost: 2000,
        isActive: true,
      },
      {
        code: 'HW-002',
        name: 'Server - Dell PowerEdge R740',
        nameAr: 'خادم - Dell PowerEdge R740',
        description: 'High-performance server for enterprise workloads',
        category: 'Hardware',
        unit: 'Unit',
        unitPrice: 8000,
        cost: 6000,
        isActive: true,
      },
      {
        code: 'SRV-003',
        name: 'Professional Services - Development',
        nameAr: 'خدمات احترافية - تطوير',
        description: 'Software development services per hour',
        category: 'Service',
        unit: 'Hour',
        unitPrice: 150,
        cost: 80,
        isActive: true,
      },
      {
        code: 'SRV-004',
        name: 'Technical Support - Annual',
        nameAr: 'الدعم الفني - سنوي',
        description: 'Annual technical support contract',
        category: 'Service',
        unit: 'Year',
        unitPrice: 12000,
        cost: 5000,
        isActive: true,
      },
      {
        code: 'SW-005',
        name: 'Mobile App Development',
        nameAr: 'تطوير تطبيق موبايل',
        description: 'Custom mobile application development',
        category: 'Software',
        unit: 'Project',
        unitPrice: 50000,
        cost: 30000,
        isActive: true,
      },
      {
        code: 'SW-006',
        name: 'Database Management System',
        nameAr: 'نظام إدارة قواعد البيانات',
        category: 'Software',
        unit: 'License',
        unitPrice: 3000,
        cost: 1500,
        isActive: true,
      },
      {
        code: 'SRV-007',
        name: 'Training Services',
        nameAr: 'خدمات التدريب',
        category: 'Training',
        unit: 'Day',
        unitPrice: 2000,
        cost: 800,
        isActive: true,
      },
    ];

    for (const productData of productsData) {
      const product = await prisma.product.create({
        data: productData,
      });
      products.push(product);
    }
    console.log(`  ✅ تم إنشاء ${products.length} منتج\n`);

    // 4. Create Projects
    console.log('🚀 إنشاء المشاريع...');
    const projects = [];
    const projectsData = [
      {
        code: 'PRJ-2026-001',
        name: 'نظام إدارة الموارد البشرية',
        description: 'تطوير نظام شامل لإدارة الموارد البشرية يشمل الحضور والانصراف والرواتب',
        client: 'شركة النجاح التقني',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-06-30'),
        budget: 120000,
        price: 150000,
        progress: 65,
        accountId: accounts[0].id,
      },
      {
        code: 'PRJ-2026-002',
        name: 'نظام إدارة علاقات العملاء (CRM)',
        description: 'نظام CRM متكامل لإدارة العملاء والمبيعات',
        client: 'مؤسسة التميز للتجارة',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-07-31'),
        budget: 100000,
        price: 130000,
        progress: 45,
        accountId: accounts[1].id,
      },
      {
        code: 'PRJ-2026-003',
        name: 'تطبيق Mobile للموظفين',
        description: 'تطبيق موبايل للموظفين (iOS & Android)',
        client: 'شركة النجاح التقني',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-08-31'),
        budget: 80000,
        price: 100000,
        progress: 30,
        accountId: accounts[0].id,
      },
      {
        code: 'PRJ-2026-004',
        name: 'نظام السجلات الطبية الإلكترونية',
        description: 'نظام شامل للسجلات الطبية الإلكترونية',
        client: 'شركة الأمل الطبية',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-12-31'),
        budget: 400000,
        price: 500000,
        progress: 55,
        accountId: accounts[2].id,
      },
      {
        code: 'PRJ-2026-005',
        name: 'موقع التجارة الإلكترونية',
        description: 'منصة تجارة إلكترونية متكاملة',
        client: 'مؤسسة التميز للتجارة',
        status: 'PLANNING',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-09-30'),
        budget: 90000,
        price: 120000,
        progress: 10,
        accountId: accounts[1].id,
      },
      {
        code: 'PRJ-2026-006',
        name: 'نظام إدارة المخزون',
        description: 'نظام متقدم لإدارة المخزون والمشتريات',
        client: 'مؤسسة التميز للتجارة',
        status: 'COMPLETED',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-02-28'),
        budget: 70000,
        price: 90000,
        progress: 100,
        accountId: accounts[1].id,
      },
      {
        code: 'PRJ-2026-007',
        name: 'نظام حجز المواعيد الطبية',
        description: 'نظام حجز المواعيد والإدارة الطبية',
        client: 'شركة الأمل الطبية',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-06-30'),
        budget: 150000,
        price: 200000,
        progress: 40,
        accountId: accounts[2].id,
      },
      {
        code: 'PRJ-2026-008',
        name: 'نظام إدارة المحتوى (CMS)',
        description: 'نظام إدارة محتوى مخصص للمواقع الإلكترونية',
        client: 'شركة النجاح التقني',
        status: 'PLANNING',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-10-31'),
        budget: 60000,
        price: 80000,
        progress: 5,
        accountId: accounts[0].id,
      },
    ];

    for (const projectData of projectsData) {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          managerId: manager.id,
        },
      });
      projects.push(project);
    }
    console.log(`  ✅ تم إنشاء ${projects.length} مشروع\n`);

    // 5. Add Project Members
    console.log('👥 إضافة أعضاء الفريق للمشاريع...');
    let memberCount = 0;
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const teamSize = Math.floor(Math.random() * 4) + 2; // 2-5 members
      
      for (let j = 0; j < teamSize && j < users.length; j++) {
        const userIndex = (i * 2 + j) % users.length;
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: users[userIndex].id,
            role: j === 0 ? 'Team Lead' : j === 1 ? 'Developer' : j === 2 ? 'Designer' : 'QA',
            allocation: Math.floor(Math.random() * 50) + 50, // 50-100%
          },
        });
        memberCount++;
      }
    }
    console.log(`  ✅ تم إضافة ${memberCount} عضو فريق\n`);

    // 6. Add Project Products
    console.log('🛒 ربط المنتجات بالمشاريع...');
    let productLinkCount = 0;
    
    // Project 1: نظام HR
    await prisma.projectProduct.createMany({
      data: [
        {
          projectId: projects[0].id,
          productId: products[0].id, // Software License
          quantity: 20,
          unitPrice: 5000,
          discount: 10,
          total: 90000,
          notes: 'خصم 10% للكمية',
        },
        {
          projectId: projects[0].id,
          productId: products[2].id, // Development Services
          quantity: 400,
          unitPrice: 150,
          discount: 0,
          total: 60000,
          notes: '400 ساعة تطوير',
        },
      ],
    });
    productLinkCount += 2;

    // Project 2: CRM
    await prisma.projectProduct.createMany({
      data: [
        {
          projectId: projects[1].id,
          productId: products[0].id,
          quantity: 15,
          unitPrice: 5000,
          discount: 5,
          total: 71250,
        },
        {
          projectId: projects[1].id,
          productId: products[2].id,
          quantity: 350,
          unitPrice: 150,
          discount: 0,
          total: 52500,
        },
        {
          projectId: projects[1].id,
          productId: products[6].id, // Training
          quantity: 5,
          unitPrice: 2000,
          discount: 0,
          total: 10000,
        },
      ],
    });
    productLinkCount += 3;

    // Project 3: Mobile App
    await prisma.projectProduct.createMany({
      data: [
        {
          projectId: projects[2].id,
          productId: products[4].id, // Mobile App Development
          quantity: 2,
          unitPrice: 50000,
          discount: 0,
          total: 100000,
          notes: 'iOS + Android',
        },
      ],
    });
    productLinkCount += 1;

    // Project 4: Medical Records
    await prisma.projectProduct.createMany({
      data: [
        {
          projectId: projects[3].id,
          productId: products[1].id, // Server
          quantity: 3,
          unitPrice: 8000,
          discount: 0,
          total: 24000,
        },
        {
          projectId: projects[3].id,
          productId: products[0].id,
          quantity: 50,
          unitPrice: 5000,
          discount: 15,
          total: 212500,
        },
        {
          projectId: projects[3].id,
          productId: products[2].id,
          quantity: 1600,
          unitPrice: 150,
          discount: 0,
          total: 240000,
        },
      ],
    });
    productLinkCount += 3;

    // Project 6: Inventory (Completed)
    await prisma.projectProduct.createMany({
      data: [
        {
          projectId: projects[5].id,
          productId: products[0].id,
          quantity: 10,
          unitPrice: 5000,
          discount: 0,
          total: 50000,
        },
        {
          projectId: projects[5].id,
          productId: products[2].id,
          quantity: 250,
          unitPrice: 150,
          discount: 0,
          total: 37500,
        },
      ],
    });
    productLinkCount += 2;

    console.log(`  ✅ تم ربط ${productLinkCount} منتج بالمشاريع\n`);

    // 7. Add Tasks (تم التعطيل مؤقتاً)
    console.log('📋 تخطي المهام مؤقتاً...');
    const taskCount = 0;
    /*
    for (let i = 0; i < 5; i++) { // First 5 projects
      const project = projects[i];
      const tasksPerProject = Math.floor(Math.random() * 8) + 5; // 5-12 tasks
      
      const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
      
      for (let j = 0; j < tasksPerProject; j++) {
        const userIndex = (i + j) % users.length;
        const status = j < 3 ? 'DONE' : j < 6 ? 'IN_PROGRESS' : 'TODO';
        
        const dueDate = new Date(project.endDate.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000);
        const estimatedHours = Math.floor(Math.random() * 30) + 10;
        
        await prisma.task.create({
          data: {
            name: `Task-${project.code}-${j + 1}`,
            title: `مهمة ${j + 1} - ${project.name}`,
            description: `وصف المهمة ${j + 1}`,
            status: status,
            priority: j % 3 === 0 ? 'HIGH' : j % 3 === 1 ? 'MEDIUM' : 'LOW',
            estimatedHours: estimatedHours,
            actualHours: status === 'DONE' ? Math.floor(Math.random() * 35) + 10 : 0,
            duration: estimatedHours,
            progress: status === 'DONE' ? 100 : status === 'IN_PROGRESS' ? Math.floor(Math.random() * 60) + 20 : 0,
            startDate: new Date(project.startDate),
            dueDate: dueDate,
            endDate: status === 'DONE' ? dueDate : null,
            projectId: project.id,
            creatorId: manager.id,
            assigneeId: users[userIndex].id,
          },
        });
        taskCount++;
      }
    }
    */
    console.log(`  ✅ تم تخطي المهام\n`);

    // 8. Add Phases (تم التعطيل مؤقتاً)
    console.log('📅 تخطي المراحل مؤقتاً...');
    const phaseCount = 0;
    /*
    for (let i = 0; i < 3; i++) { // First 3 projects
      const project = projects[i];
      const phases = ['التخطيط', 'التصميم', 'التطوير', 'الاختبار', 'النشر'];
      
      for (let j = 0; j < phases.length; j++) {
        const startDate = new Date(project.startDate.getTime() + j * 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await prisma.phase.create({
          data: {
            name: phases[j],
            description: `مرحلة ${phases[j]} - ${project.name}`,
            status: j < project.progress / 20 ? 'COMPLETED' : j === Math.floor(project.progress / 20) ? 'ACTIVE' : 'PENDING',
            order: j + 1,
            startDate: startDate,
            endDate: endDate,
            projectId: project.id,
          },
        });
        phaseCount++;
      }
    }
    */
    console.log(`  ✅ تم تخطي المراحل\n`);

    // 9. Add Worklogs (تم التعطيل مؤقتاً)
    console.log('⌚ تخطي سجلات الوقت مؤقتاً...');
    const worklogCount = 0;
    console.log(`  ✅ تم تخطي سجلات الوقت\n`);

    // 10. Add RAID Items
    console.log('⚠️ إضافة عناصر RAID...');
    let raidCount = 0;
    
    for (let i = 0; i < 5; i++) { // First 5 projects
      const project = projects[i];
      
      // Risks
      await prisma.rAIDItem.create({
        data: {
          type: 'RISK',
          title: 'خطر تأخير التسليم',
          description: 'احتمالية تأخير في موعد التسليم بسبب تعقيد المتطلبات وقلة الموارد',
          status: 'OPEN',
          priority: 'HIGH',
          impact: 'HIGH',
          probability: 'MEDIUM',
          riskScore: 9.0, // HIGH (3) * MEDIUM (3)
          mitigation: 'إضافة موارد إضافية، إعادة جدولة المهام، وتقليل نطاق العمل في المرحلة الأولى',
          projectId: project.id,
          ownerId: manager.id,
          targetDate: new Date(project.endDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks before
        },
      });
      raidCount++;

      await prisma.rAIDItem.create({
        data: {
          type: 'RISK',
          title: 'خطر تغيير المتطلبات',
          description: 'احتمالية تغيير متطلبات المشروع من قبل العميل أثناء التنفيذ',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          impact: 'MEDIUM',
          probability: 'HIGH',
          riskScore: 8.0, // MEDIUM (2) * HIGH (4)
          mitigation: 'توثيق المتطلبات بشكل واضح، اعتماد منهجية Agile للتعامل مع التغييرات',
          projectId: project.id,
          ownerId: users[i % users.length].id,
        },
      });
      raidCount++;

      // Issues
      await prisma.rAIDItem.create({
        data: {
          type: 'ISSUE',
          title: 'مشكلة في البيئة التطويرية',
          description: 'بعض الأدوات لا تعمل بشكل صحيح في بيئة التطوير',
          status: i < 2 ? 'CLOSED' : 'IN_PROGRESS',
          priority: 'MEDIUM',
          mitigation: 'تم تحديث الأدوات وإصلاح المشكلة، إعداد بيئة بديلة',
          projectId: project.id,
          ownerId: manager.id,
          closedDate: i < 2 ? new Date() : null,
        },
      });
      raidCount++;

      await prisma.rAIDItem.create({
        data: {
          type: 'ISSUE',
          title: 'نقص في الموارد البشرية',
          description: 'نقص في عدد المطورين المتخصصين المطلوبين للمشروع',
          status: 'OPEN',
          priority: 'HIGH',
          mitigation: 'جاري البحث عن مطورين إضافيين، إعادة توزيع المهام على الفريق الحالي',
          projectId: project.id,
          ownerId: users[(i + 1) % users.length].id,
          identifiedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        },
      });
      raidCount++;

      // Assumptions
      await prisma.rAIDItem.create({
        data: {
          type: 'ASSUMPTION',
          title: 'توفر البيانات من النظام القديم',
          description: 'افتراض أن العميل سيوفر البيانات من النظام القديم بتنسيق متوافق',
          status: 'OPEN',
          priority: 'HIGH',
          mitigation: 'التواصل مع العميل للتأكد من توفر البيانات، إعداد خطة بديلة لإدخال البيانات يدوياً',
          projectId: project.id,
          ownerId: manager.id,
        },
      });
      raidCount++;

      // Dependencies
      await prisma.rAIDItem.create({
        data: {
          type: 'DEPENDENCY',
          title: 'اعتماد على فريق البنية التحتية',
          description: 'يعتمد المشروع على إعداد السيرفرات من قبل فريق البنية التحتية',
          status: i < 3 ? 'CLOSED' : 'IN_PROGRESS',
          priority: 'HIGH',
          mitigation: 'التنسيق مع فريق البنية التحتية، تحديد مواعيد واضحة للتسليم',
          projectId: project.id,
          ownerId: manager.id,
          targetDate: new Date(project.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month after start
          closedDate: i < 3 ? new Date() : null,
        },
      });
      raidCount++;

      await prisma.rAIDItem.create({
        data: {
          type: 'DEPENDENCY',
          title: 'اعتماد على API من فريق خارجي',
          description: 'يعتمد المشروع على تسليم API من فريق تطوير خارجي',
          status: 'OPEN',
          priority: 'CRITICAL',
          mitigation: 'متابعة مستمرة مع الفريق الخارجي، إعداد Mock API للاختبار',
          projectId: project.id,
          ownerId: users[(i + 2) % users.length].id,
          targetDate: new Date(project.startDate.getTime() + 45 * 24 * 60 * 60 * 1000), // 1.5 months
        },
      });
      raidCount++;
    }
    console.log(`  ✅ تم إضافة ${raidCount} عنصر RAID\n`);

    console.log('✅ تم إكمال إضافة البيانات التجريبية بنجاح!\n');
    console.log('📊 ملخص البيانات:');
    console.log(`   - المستخدمين: ${users.length + 1}`);
    console.log(`   - العملاء: ${accounts.length}`);
    console.log(`   - المنتجات: ${products.length}`);
    console.log(`   - المشاريع: ${projects.length}`);
    console.log(`   - أعضاء الفريق: ${memberCount}`);
    console.log(`   - ربط المنتجات: ${productLinkCount}`);
    console.log(`   - المهام: ${taskCount}`);
    console.log(`   - المراحل: ${phaseCount}`);
    console.log(`   - سجلات الوقت: ${worklogCount}`);
    console.log(`   - عناصر RAID: ${raidCount}`);

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
