# 🚀 Quick Start Guide - EPM System

## الخطوات السريعة للبدء

### 1. تثبيت PostgreSQL (إذا لم يكن مثبتاً)

**Windows:**
```powershell
# تحميل من الموقع الرسمي
# https://www.postgresql.org/download/windows/
```

**أو استخدم Docker:**
```bash
docker run --name epm-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
```

### 2. إعداد قاعدة البيانات

```powershell
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE epm_db;

# الخروج
\q
```

### 3. تشغيل Backend

```powershell
# الانتقال لمجلد السيرفر
cd server

# تثبيت الحزم
npm install

# إنشاء Prisma Client
npm run prisma:generate

# تطبيق Migrations
npm run prisma:migrate

# إضافة بيانات تجريبية
npm run prisma:seed

# تشغيل السيرفر
npm run dev
```

✅ السيرفر يعمل الآن على: http://localhost:5000

### 4. تشغيل Frontend (في terminal جديد)

```powershell
# الانتقال لمجلد العميل
cd client

# تثبيت الحزم
npm install

# تشغيل التطبيق
npm run dev
```

✅ التطبيق يعمل الآن على: http://localhost:5173

### 5. تسجيل الدخول

افتح المتصفح على: http://localhost:5173/login

**حسابات تجريبية:**
- **Admin:** `admin@epm.com` / `admin123`
- **PM:** `pm@epm.com` / `user123`
- **Developer:** `developer1@epm.com` / `user123`

---

## 🔧 الأوامر المفيدة

### Backend
```powershell
npm run dev              # تشغيل السيرفر في وضع التطوير
npm run build            # بناء للإنتاج
npm run start            # تشغيل الإنتاج
npm run prisma:studio    # فتح Prisma Studio (GUI للقاعدة)
npm run prisma:generate  # إنشاء Prisma Client
npm run prisma:migrate   # تطبيق تغييرات القاعدة
npm run prisma:seed      # إضافة بيانات تجريبية
```

### Frontend
```powershell
npm run dev       # تشغيل في وضع التطوير
npm run build     # بناء للإنتاج
npm run preview   # معاينة بناء الإنتاج
npm run lint      # فحص الكود
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: خطأ في الاتصال بقاعدة البيانات

**الحل:**
1. تأكد من تشغيل PostgreSQL
2. راجع `DATABASE_URL` في `server/.env`
3. تأكد من صحة اسم المستخدم وكلمة المرور

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/epm_db?schema=public"
```

### مشكلة: Prisma Client غير موجود

**الحل:**
```powershell
cd server
npm run prisma:generate
```

### مشكلة: Port 5000 أو 5173 مستخدم

**الحل:**
- أوقف التطبيق المستخدم للـ port
- أو غيّر PORT في `.env`

### مشكلة: CORS errors

**الحل:**
تأكد من:
1. السيرفر يعمل على port 5000
2. CLIENT_URL في `server/.env` = http://localhost:5173
3. VITE_API_URL في `client/.env` = http://localhost:5000/api

---

## 📊 Prisma Studio (إدارة القاعدة بصرياً)

```powershell
cd server
npm run prisma:studio
```

سيفتح على: http://localhost:5555

---

## 🎯 الخطوات التالية

بعد تشغيل النظام بنجاح:

1. ✅ استكشف Dashboard
2. ✅ جرب تسجيل الدخول بحسابات مختلفة
3. ✅ تصفح Projects (قريباً)
4. ✅ إنشاء مهام (قريباً)
5. ✅ استخدم My Day (قريباً)

---

## 📞 تحتاج مساعدة؟

- راجع [README.md](../README.md) للتفاصيل الكاملة
- افتح Issue على GitHub
- تواصل مع الفريق

---

**Happy Coding! 🚀**
