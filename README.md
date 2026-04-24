# EPM - Enterprise Project Management System

نظام إدارة مشاريع احترافي متكامل مبني على React + Node.js + PostgreSQL

## المميزات الرئيسية

### ✅ المكتمل حالياً (Phase 1-3)

- **🔐 نظام المصادقة والمستخدمين**
  - تسجيل دخول/إنشاء حساب
  - JWT authentication
  - إدارة المستخدمين والصلاحيات (RBAC)
  - ملف شخصي

- **📦 Backend API متكامل**
  - Express + TypeScript
  - Prisma ORM
  - PostgreSQL Database
  - RESTful API design
  - Error handling & validation

- **🎨 Frontend Foundation**
  - React 19 + TypeScript
  - Ant Design UI
  - React Query (TanStack Query)
  - Zustand state management
  - i18n (عربي/English) مع RTL
  - Routing (React Router v7)

- **📊 قاعدة بيانات شاملة**
  - 13 جدول رئيسي
  - Users, Projects, Tasks, Phases
  - Worklogs, RAID Items
  - Rate Cards, Reports
  - Comments & Dependencies

### 🚧 قادم قريباً (Phase 4-12)

- إدارة المشاريع الكاملة
- خطة العمل (WBS) مع Gantt Chart
- Kanban Board
- محرك حساب التكاليف
- المراقبة اليومية والـ Worklogs
- RAID Log مع Risk Heatmap
- التقارير (أسبوعية/شهرية) + PDF/Excel
- لوحات المعلومات التفاعلية

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

### 1️⃣ إعداد قاعدة البيانات

```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb epm_db

# أو من psql:
psql -U postgres
CREATE DATABASE epm_db;
\q
```

### 2️⃣ Backend Setup

```bash
cd server

# تثبيت الحزم
npm install

# إعداد ملف البيئة
# تعديل .env مع بيانات قاعدة البيانات الخاصة بك
DATABASE_URL="postgresql://postgres:password@localhost:5432/epm_db"

# تشغيل migrations
npm run prisma:generate
npm run prisma:migrate

# إضافة بيانات تجريبية (اختياري)
npm run prisma:seed

# تشغيل السيرفر
npm run dev
```

السيرفر سيعمل على: `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd client

# تثبيت الحزم
npm install

# تشغيل التطبيق
npm run dev
```

التطبيق سيعمل على: `http://localhost:5173`

---

## 📝 حسابات تجريبية (بعد Seed)

```
Admin: admin@epm.com / admin123
PM: pm@epm.com / user123
Dev1: developer1@epm.com / user123
Dev2: developer2@epm.com / user123
```

---

## 🗂️ بنية المشروع

```
EPM/
├── server/                    # Backend (Node.js)
│   ├── src/
│   │   ├── server.ts         # Express app
│   │   ├── config/           # Prisma client
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, error handling
│   │   └── generated/        # Prisma client output
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   └── package.json
│
├── client/                    # Frontend (React)
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   ├── layouts/          # Auth & Main layouts
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # API client, i18n
│   │   └── types/            # TypeScript types
│   └── package.json
│
└── README.md
```

---

## 🛠️ تقنيات مستخدمة

### Backend
- **Node.js** + **Express** - Server framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Zod** - Validation
- **bcryptjs** - Password hashing

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - UI components
- **React Router v7** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **i18next** - Internationalization
- **Axios** - HTTP client

---

## 📚 API Documentation

### Auth Endpoints
```
POST /api/auth/register    - إنشاء حساب
POST /api/auth/login       - تسجيل دخول
GET  /api/auth/me          - معلومات المستخدم الحالي
PUT  /api/auth/profile     - تحديث الملف الشخصي
```

### Projects Endpoints
```
GET    /api/projects           - قائمة المشاريع
POST   /api/projects           - إنشاء مشروع
GET    /api/projects/:id       - تفاصيل مشروع
PUT    /api/projects/:id       - تحديث مشروع
DELETE /api/projects/:id       - حذف مشروع
POST   /api/projects/:id/members      - إضافة عضو
PUT    /api/projects/:id/members/:id  - تحديث عضو
DELETE /api/projects/:id/members/:id  - إزالة عضو
```

### Tasks Endpoints
```
GET    /api/tasks              - قائمة المهام
POST   /api/tasks              - إنشاء مهمة
GET    /api/tasks/:id          - تفاصيل مهمة
PUT    /api/tasks/:id          - تحديث مهمة
DELETE /api/tasks/:id          - حذف مهمة
POST   /api/tasks/:id/dependencies  - إضافة اعتمادية
```

### Worklogs Endpoints
```
GET    /api/worklogs           - قائمة سجلات العمل
POST   /api/worklogs           - تسجيل عمل
PUT    /api/worklogs/:id       - تحديث سجل
DELETE /api/worklogs/:id       - حذف سجل
```

### RAID Endpoints
```
GET    /api/raid               - قائمة RAID items
POST   /api/raid               - إضافة item
GET    /api/raid/:id           - تفاصيل item
PUT    /api/raid/:id           - تحديث item
DELETE /api/raid/:id           - حذف item
```

### Reports Endpoints
```
GET    /api/reports            - قائمة التقارير
POST   /api/reports/weekly     - إنشاء تقرير أسبوعي
POST   /api/reports/monthly    - إنشاء تقرير شهري
GET    /api/reports/:id        - تفاصيل تقرير
```

---

## 🎯 خارطة الطريق

### ✅ المرحلة 1-3 (مكتملة)
- [x] Database Schema
- [x] Backend API
- [x] Auth System
- [x] Frontend Foundation
- [x] Layouts & Navigation
- [x] i18n + RTL

### 🚧 المرحلة 4-6 (قيد العمل)
- [ ] Projects Module (CRUD + UI)
- [ ] Tasks Module (CRUD + UI)
- [ ] Team Management

### 📋 المرحلة 7-9 (قادم)
- [ ] WBS + Gantt Chart
- [ ] Kanban Board
- [ ] Cost Engine
- [ ] Daily Tracking

### 📊 المرحلة 10-12 (مستقبلي)
- [ ] RAID Log Module
- [ ] Reports + PDF/Excel
- [ ] Dashboards
- [ ] Notifications

---

## 📄 License

MIT License

---

## 🤝 المساهمة

المشروع مفتوح المصدر - المساهمات مرحب بها!

---

## 📞 الدعم

لأي استفسارات أو مشاكل، يرجى فتح Issue على GitHub.

---

**Built with ❤️ using React + Node.js + PostgreSQL**
