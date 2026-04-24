# 🤝 CONTRIBUTING - دليل المساهمة

## كيف تساهم في تطوير EPM System؟

---

## 🎯 مراحل التطوير المطلوبة

### ✅ مكتمل (Phase 0-6)
- [x] Database Schema
- [x] Backend API
- [x] Auth System
- [x] Frontend Foundation
- [x] Layouts & Navigation

### 🚧 قيد التطوير (Phase 6-9)

#### Phase 6: Projects Module [HIGH PRIORITY]
**المطلوب:**
- [ ] ProjectList Page مع Table
- [ ] Create/Edit Project Modal
- [ ] Project Detail Page
- [ ] Team Management UI

**الملفات:**
- `client/src/pages/projects/ProjectList.tsx`
- `client/src/components/projects/ProjectForm.tsx`
- `client/src/pages/projects/ProjectDetail.tsx`

#### Phase 7: Tasks Module
**المطلوب:**
- [ ] Tasks Table + Filters
- [ ] Kanban Board (@dnd-kit)
- [ ] Task Form Modal
- [ ] Gantt Chart (@ant-design/charts)

#### Phase 8: Cost Engine
**المطلوب:**
- [ ] Rate Cards UI
- [ ] Cost Calculation Service
- [ ] Budget Tracking Dashboard

#### Phase 9: Daily Tracking
**المطلوب:**
- [ ] My Day Dashboard
- [ ] Worklog Entry Form
- [ ] Daily Summary

---

## 💻 Setup للمطورين

### 1. Clone & Install
```powershell
git clone <repo-url>
cd EPM

# Backend
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Frontend
cd client
npm install
```

### 2. Development Workflow
```powershell
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev

# Terminal 3: Prisma Studio (optional)
cd server
npm run prisma:studio
```

---

## 📋 Guidelines

### Code Style
- ✅ استخدم TypeScript
- ✅ استخدم Prettier للـ formatting
- ✅ اتبع ESLint rules
- ✅ أضف comments للكود المعقد

### Naming Conventions
```typescript
// Components: PascalCase
ProjectList.tsx
ProjectForm.tsx

// Files: camelCase
projectService.ts
costCalculation.ts

// Variables: camelCase
const projectData = ...
const userId = ...

// Constants: UPPER_CASE
const API_URL = ...
const MAX_ITEMS = ...
```

### Git Commits
```
feat: Add project list page
fix: Fix auth token expiry
docs: Update README
style: Format code
refactor: Improve API client
```

---

## 🔧 التقنيات المستخدمة

### يجب استخدامها
- ✅ **React Query** للـ API calls (لا useState)
- ✅ **Ant Design** للـ Components
- ✅ **React Hook Form + Zod** للـ Forms
- ✅ **Zustand** للـ Global State فقط
- ✅ **i18next** للترجمات

### مثال: React Query
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.getProjects(),
});

// Create/Update/Delete
const mutation = useMutation({
  mutationFn: (data) => api.createProject(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['projects']);
  },
});
```

---

## 📁 بنية الملفات

### Backend
```
server/src/
├── controllers/        # Business logic
├── routes/            # API routes
├── middleware/        # Auth, errors
├── services/          # Reusable services
└── utils/             # Helper functions
```

### Frontend
```
client/src/
├── pages/             # Page components
├── components/        # Reusable components
├── layouts/           # Layouts
├── stores/            # Zustand stores
├── lib/               # API, i18n
├── types/             # TypeScript types
└── utils/             # Helpers
```

---

## 🧪 Testing

### Manual Testing
```powershell
# 1. Test APIs in Postman/Thunder Client
# 2. Use Prisma Studio for database
# 3. Test UI in browser
# 4. Test i18n (AR/EN)
```

### Automated Testing (Future)
```powershell
# Backend
cd server
npm test

# Frontend
cd client
npm test
```

---

## 📝 Documentation

### يجب توثيقه
- ✅ جميع API endpoints
- ✅ Components المعقدة
- ✅ Business logic
- ✅ Configuration changes

### مثال
```typescript
/**
 * Calculate project total cost based on worklogs and rate cards
 * @param projectId - The project ID
 * @returns Total cost in project currency
 */
export async function calculateProjectCost(projectId: string): Promise<number> {
  // Implementation
}
```

---

## 🚀 Deployment

### Backend (Production)
```powershell
cd server
npm run build
npm run start
```

### Frontend (Production)
```powershell
cd client
npm run build
# Deploy dist/ folder
```

---

## 🐛 Reporting Issues

عند فتح Issue:
1. ✅ وصف واضح للمشكلة
2. ✅ خطوات إعادة المشكلة
3. ✅ Screenshots إن أمكن
4. ✅ Environment (OS, Node version, etc.)

---

## 💡 نصائح للمطورين الجدد

### 1. ابدأ بالـ API
قبل بناء UI، اختبر API في Prisma Studio أو Postman

### 2. استخدم التوثيق
- [Ant Design Docs](https://ant.design/)
- [React Query Docs](https://tanstack.com/query)
- [Prisma Docs](https://www.prisma.io/docs)

### 3. استخدم الأدوات
- Prisma Studio للبيانات
- React Query DevTools للـ cache
- React DevTools للـ components

### 4. اسأل
لا تتردد في فتح Issue أو السؤال

---

## 🎯 Priority Tasks

### أولوية عالية جداً
1. **ProjectList Page** - أهم صفحة
2. **ProjectForm Modal** - CRUD أساسي
3. **TaskList Page** - وظيفة رئيسية

### أولوية عالية
4. **Kanban Board** - UI مهم
5. **My Day Dashboard** - Daily tracking
6. **RAID Log UI** - Risk management

### أولوية متوسطة
7. **Gantt Chart** - Advanced visualization
8. **Reports Generator** - PDF/Excel
9. **Dashboards** - Analytics

---

## 📞 الاتصال

- GitHub Issues للمشاكل
- Pull Requests للمساهمات
- Discussions للأسئلة

---

## 🙏 شكراً للمساهمة!

كل مساهمة تُقدّر - صغيرة كانت أم كبيرة!

---

**Happy Contributing! 🚀**

*EPM System © 2026*
