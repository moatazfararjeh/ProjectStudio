# ⚡ EPM System - مرجع سريع

## 🚀 أوامر التشغيل

### Backend
```powershell
cd server
npm run dev              # Development mode
npm run build            # Build for production
npm run start            # Run production
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed test data
```

### Frontend
```powershell
cd client
npm run dev      # Development mode
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code
```

---

## 🔗 URLs

| الخدمة | URL | ملاحظة |
|--------|-----|--------|
| Frontend | http://localhost:5173 | React App |
| Backend API | http://localhost:5000/api | API Base |
| Health Check | http://localhost:5000/health | Server Status |
| Prisma Studio | http://localhost:5555 | Database GUI |

---

## 👤 حسابات تجريبية

```
Admin:  admin@epm.com / admin123
PM:     pm@epm.com / user123
Dev 1:  developer1@epm.com / user123
Dev 2:  developer2@epm.com / user123
```

---

## 📂 ملفات مهمة

### Configuration
```
server/.env          # Backend config
client/.env          # Frontend config
```

### Database
```
server/prisma/schema.prisma    # Database schema
server/prisma/seed.ts          # Test data
```

### API
```
server/src/server.ts           # Express app
server/src/routes/             # API routes
server/src/controllers/        # Business logic
```

### Frontend
```
client/src/App.tsx             # Main app
client/src/main.tsx            # Entry point
client/src/lib/api.ts          # API client
client/src/lib/i18n.ts         # Translations
```

---

## 🔧 إعدادات البيئة

### server/.env
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/epm_db"
PORT=5000
NODE_ENV=development
JWT_SECRET=epm-super-secret-jwt-key-2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### client/.env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
PUT    /api/projects/:id/members/:memberId
DELETE /api/projects/:id/members/:memberId
```

### Tasks
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/dependencies
DELETE /api/tasks/:id/dependencies/:depId
```

### Worklogs
```
GET    /api/worklogs
POST   /api/worklogs
PUT    /api/worklogs/:id
DELETE /api/worklogs/:id
```

### RAID
```
GET    /api/raid
POST   /api/raid
GET    /api/raid/:id
PUT    /api/raid/:id
DELETE /api/raid/:id
```

### Reports
```
GET    /api/reports
POST   /api/reports/weekly
POST   /api/reports/monthly
GET    /api/reports/:id
```

### Rate Cards
```
GET    /api/rate-cards
POST   /api/rate-cards
PUT    /api/rate-cards/:id
DELETE /api/rate-cards/:id
```

---

## 🐛 حل المشاكل

### Backend لا يعمل
```powershell
# 1. تحقق من PostgreSQL
# 2. تحقق من DATABASE_URL في .env
# 3. Generate Prisma Client
cd server
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate
```

### Frontend لا يتصل بـ Backend
```powershell
# تحقق من VITE_API_URL في client/.env
# تأكد أن Backend يعمل على port 5000
```

### خطأ Prisma Client
```powershell
cd server
npm run prisma:generate
```

### Port مشغول
```powershell
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 💡 نصائح سريعة

1. **Prisma Studio** أفضل طريقة لفحص البيانات
2. **React Query DevTools** في أسفل الشاشة
3. **تبديل اللغة** من الزر في Header
4. **جميع APIs جاهزة** - فقط اربطها بـ UI
5. **Ant Design Docs** مرجع ممتاز للـ Components

---

## 📚 الملفات المرجعية

| الملف | المحتوى |
|-------|---------|
| `README.md` | توثيق كامل |
| `QUICKSTART.md` | دليل بدء سريع |
| `STATUS.md` | الحالة الحالية |
| `DEVELOPMENT_GUIDE.md` | دليل التطوير |
| `PROJECT_SUMMARY.md` | ملخص شامل |
| `QUICK_REFERENCE.md` | هذا الملف |

---

## 🎯 الخطوة التالية

**ابدأ بتطوير Projects Module:**
1. افتح `DEVELOPMENT_GUIDE.md`
2. ابدأ بـ ProjectList Page
3. أنشئ ProjectForm Modal
4. اختبر مع Prisma Studio

---

## 📞 الدعم

- راجع التوثيق
- افتح Prisma Studio للبيانات
- تحقق من Console للأخطاء
- افتح Issue على GitHub

---

**Happy Coding! 🚀**
