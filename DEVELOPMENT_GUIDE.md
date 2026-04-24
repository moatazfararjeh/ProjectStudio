# 🚀 Next Steps - خطوات التطوير القادمة

## المرحلة 6: Projects Module (الأولوية الأولى)

### 1. ProjectList Page
**الملف:** `client/src/pages/projects/ProjectList.tsx`

**المطلوب:**
- [ ] Table من Ant Design مع columns:
  - اسم المشروع
  - الرمز
  - المدير
  - الحالة (Status Badge)
  - التقدم (Progress Bar)
  - الأعضاء
  - Actions (View/Edit/Delete)
- [ ] Search & Filter
- [ ] Pagination
- [ ] Create Button → Modal
- [ ] استخدام React Query لـ `useQuery` و `useMutation`

**مثال كود:**
```tsx
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Tag, Progress } from 'antd';
import api from '../../lib/api';

export default function ProjectList() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { 
      title: 'Progress', 
      dataIndex: 'progress', 
      render: (val: number) => <Progress percent={val} /> 
    },
    // ...
  ];

  return <Table columns={columns} dataSource={data} loading={isLoading} />;
}
```

---

### 2. Create/Edit Project Modal
**الملف:** `client/src/components/projects/ProjectForm.tsx`

**المطلوب:**
- [ ] Modal من Ant Design
- [ ] Form مع React Hook Form + Zod
- [ ] Fields: Name, Code, Description, Client, Dates, Budget, Price
- [ ] Manager Select (من Users API)
- [ ] useMutation للإنشاء/التحديث
- [ ] Success/Error Messages

**مثال كود:**
```tsx
import { Modal, Form, Input, DatePicker } from 'antd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  // ...
});

export function ProjectForm({ open, onClose, project }) {
  const { handleSubmit, register } = useForm({
    resolver: zodResolver(schema),
    defaultValues: project,
  });

  const mutation = useMutation({
    mutationFn: (data) => project?.id 
      ? api.updateProject(project.id, data)
      : api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      onClose();
    },
  });

  return (
    <Modal open={open} onCancel={onClose}>
      <Form onFinish={handleSubmit(mutation.mutate)}>
        {/* Form fields */}
      </Form>
    </Modal>
  );
}
```

---

### 3. Project Detail Page
**الملف:** `client/src/pages/projects/ProjectDetail.tsx`

**المطلوب:**
- [ ] Tabs: Overview, Work Plan, Team, RAID, Reports
- [ ] Overview Tab:
  - Project Info Card
  - Progress Chart
  - Cost Summary
  - Recent Activities
- [ ] useQuery للـ project details
- [ ] Breadcrumb للـ navigation

**مثال كود:**
```tsx
import { Tabs, Card, Descriptions } from 'antd';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
  });

  const tabs = [
    { key: 'overview', label: 'Overview', children: <OverviewTab project={project} /> },
    { key: 'workplan', label: 'Work Plan', children: <WorkPlanTab /> },
    { key: 'team', label: 'Team', children: <TeamTab /> },
    // ...
  ];

  return <Tabs items={tabs} />;
}
```

---

## المرحلة 7: Tasks Module

### 1. Tasks Table + Kanban
**الملف:** `client/src/pages/tasks/TaskList.tsx`

**المطلوب:**
- [ ] Toggle بين Table View و Kanban View
- [ ] Table مع columns:
  - Task Name
  - Assignee (Avatar)
  - Priority (Tag)
  - Status
  - Progress
  - Due Date
- [ ] Kanban Board باستخدام `@dnd-kit` (موجود في dependencies)
- [ ] Filters: Project, Assignee, Status, Priority

### 2. Task Form Modal
**المطلوب:**
- [ ] All task fields
- [ ] Date Range Picker
- [ ] Assignee Select
- [ ] Priority & Status Selects
- [ ] Dependencies Select (multi)

### 3. Gantt Chart (Advanced)
**المكتبة المقترحة:** `@ant-design/charts` (موجودة بالفعل)

---

## المرحلة 8: Cost Engine

### 1. Rate Cards Management
**الملف:** `client/src/pages/settings/RateCards.tsx`

**المطلوب:**
- [ ] Table لعرض Rate Cards
- [ ] Create/Edit Modal
- [ ] Fields: User/Role, Cost Rate, Bill Rate, Effective Dates

### 2. Cost Calculation Service
**الملف:** `server/src/services/costCalculation.service.ts`

**المطلوب:**
- [ ] calculateProjectCost(projectId)
- [ ] calculateTaskCost(taskId)
- [ ] calculateActualCost(worklogs)
- [ ] getCostReport(projectId)

---

## المرحلة 9: Daily Tracking

### 1. My Day Dashboard
**الملف:** `client/src/pages/MyDay.tsx`

**المطلوب:**
- [ ] Today's Tasks Card
- [ ] Quick Worklog Entry
- [ ] Daily Summary
- [ ] Blockers List

### 2. Worklog Entry Form
**المطلوب:**
- [ ] Task Select
- [ ] Date Picker (default: today)
- [ ] Hours Input
- [ ] What Done, What Next, Blockers TextAreas

---

## المرحلة 10: RAID Log

### 1. RAID Table
**الملف:** `client/src/pages/raid/RAIDList.tsx`

**المطلوب:**
- [ ] Tabs: All, Risks, Assumptions, Issues, Dependencies
- [ ] Table with columns
- [ ] Risk Score Badge (color-coded)
- [ ] Status Filter

### 2. Risk Heatmap
**المطلوب:**
- [ ] 5x5 Matrix (Impact vs Probability)
- [ ] Bubble Chart باستخدام `@ant-design/charts`
- [ ] Click على bubble → Risk details

---

## المرحلة 11: Reports

### 1. Weekly Report Generator
**المطلوب:**
- [ ] Form: Project Select, Week Select
- [ ] Generate Button
- [ ] Report Preview
- [ ] Export to PDF (jspdf + jspdf-autotable موجودة)
- [ ] Report Template

### 2. Monthly Report
**المطلوب:**
- [ ] Similar to Weekly
- [ ] More comprehensive metrics
- [ ] Charts & Graphs

### 3. PDF Export Service
**الملف:** `client/src/services/pdfExport.ts`

**المطلوب:**
- [ ] generateWeeklyPDF(reportData)
- [ ] generateMonthlyPDF(reportData)
- [ ] استخدام jsPDF + autoTable

---

## المرحلة 12: Dashboards

### 1. Portfolio Dashboard
**المطلوب:**
- [ ] All Projects Summary
- [ ] Charts: Status Distribution, Budget vs Actual
- [ ] Top Risks
- [ ] Recent Activities

### 2. Team Dashboard
**المطلوب:**
- [ ] Team Members Cards
- [ ] Workload Distribution
- [ ] Utilization Rate
- [ ] Performance Metrics

### 3. Risks Dashboard
**المطلوب:**
- [ ] Risk Heatmap
- [ ] Top 10 Risks Table
- [ ] Risk Trend Chart
- [ ] Mitigation Status

---

## 🛠️ أدوات مفيدة للتطوير

### React Query DevTools
```tsx
// موجودة بالفعل في main.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

### Prisma Studio
```powershell
cd server
npm run prisma:studio
```

### Ant Design Components
- Table: https://ant.design/components/table
- Form: https://ant.design/components/form
- Modal: https://ant.design/components/modal
- Charts: https://charts.ant.design/

### React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

---

## 📝 نصائح للتطوير

1. **ابدأ بـ Projects Module** - هو الأساس لكل شيء
2. **استخدم React Query** لكل API calls
3. **أنشئ Components قابلة لإعادة الاستخدام** (مثل FormModal, DataTable)
4. **استخدم Ant Design** قدر الإمكان - لا تعيد اختراع العجلة
5. **test في Prisma Studio** قبل كتابة UI
6. **استخدم TypeScript types** من `types/index.ts`
7. **اجعل الـ i18n** جاهز من البداية

---

## 🎯 أولويات التطوير المقترحة

### الأسبوع 1-2:
- ✅ Projects CRUD كامل
- ✅ Team Management

### الأسبوع 3-4:
- ✅ Tasks CRUD
- ✅ Kanban Board
- ✅ Basic Gantt

### الأسبوع 5-6:
- ✅ Worklogs + My Day
- ✅ Cost Engine

### الأسبوع 7-8:
- ✅ RAID Log
- ✅ Risk Heatmap

### الأسبوع 9-10:
- ✅ Reports
- ✅ PDF Export

### الأسبوع 11-12:
- ✅ Dashboards
- ✅ Advanced Features
- ✅ Polish & Testing

---

## 📚 موارد إضافية

- **Ant Design**: https://ant.design/
- **React Query**: https://tanstack.com/query
- **React Hook Form**: https://react-hook-form.com/
- **Prisma**: https://www.prisma.io/docs
- **Zod**: https://zod.dev/

---

**ملاحظة:** هذا دليل شامل - يمكنك البدء بأي مرحلة حسب الأولوية!

Good luck! 🚀
