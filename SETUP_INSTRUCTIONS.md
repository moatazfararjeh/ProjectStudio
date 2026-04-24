# EPM System - Setup Requirements

## المشكلة الحالية
النظام يحتاج قاعدة بيانات PostgreSQL لكنها غير متوفرة على الجهاز.

## الحلول المتاحة

### ✅ الحل الأفضل: تثبيت PostgreSQL

**Windows:**
1. حمل من: https://www.postgresql.org/download/windows/
2. شغل الملف المحمل
3. أثناء التثبيت:
   - Username: `postgres`
   - Password: `postgres`
   - Port: `5432`
4. بعد التثبيت ارجع وشغل:
```powershell
cd c:\Mutaz\EPM\server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 🐳 البديل: Docker Desktop

1. حمل Docker Desktop: https://www.docker.com/products/docker-desktop/
2. ثبته وشغله
3. ارجع للمشروع وشغل:
```powershell
cd c:\Mutaz\EPM
docker-compose up -d
cd server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 🚀 الحل الأسرع: استخدم Supabase (مجاني)

1. سجل حساب على: https://supabase.com (مجاني)
2. أنشئ مشروع جديد
3. من Settings → Database، انسخ Connection String
4. افتح `c:\Mutaz\EPM\server\.env` وبدل السطر الأول:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```
5. شغل:
```powershell
cd c:\Mutaz\EPM\server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

---

## بعد حل مشكلة القاعدة

```powershell
# Terminal 1 - Backend
cd c:\Mutaz\EPM\server
npm run dev

# Terminal 2 - Frontend  
cd c:\Mutaz\EPM\client
npm install
npm run dev
```

**افتح المتصفح:** http://localhost:5173
**تسجيل الدخول:** admin@epm.com / admin123
