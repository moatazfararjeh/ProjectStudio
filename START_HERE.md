# 🎯 ابدأ هنا - START HERE

## مرحباً بك في نظام EPM! 👋

هذا دليلك السريع للبدء في 5 دقائق.

---

## ⚡ البدء السريع (5 دقائق)

### 1️⃣ تثبيت PostgreSQL
```powershell
# تحميل من: https://www.postgresql.org/download/windows/
# أو استخدم Docker:
docker run --name epm-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
```

### 2️⃣ إنشاء قاعدة البيانات
```powershell
psql -U postgres
CREATE DATABASE epm_db;
\q
```

### 3️⃣ تشغيل Backend
```powershell
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```
✅ Server running on http://localhost:5000

### 4️⃣ تشغيل Frontend (terminal جديد)
```powershell
cd client
npm install
npm run dev
```
✅ App running on http://localhost:5173

### 5️⃣ تسجيل الدخول
```
افتح: http://localhost:5173/login
الحساب: admin@epm.com
الباسورد: admin123
```

---

## 📚 الوثائق الكاملة

| الملف | الاستخدام | الأولوية |
|-------|-----------|----------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | مرجع سريع للأوامر | ⭐⭐⭐ |
| [STATUS.md](STATUS.md) | ما تم إنجازه | ⭐⭐⭐ |
| [QUICKSTART.md](QUICKSTART.md) | دليل بدء مفصل | ⭐⭐ |
| [README.md](README.md) | توثيق شامل | ⭐⭐ |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | دليل التطوير Phase 6-12 | ⭐ |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | ملخص المشروع | ⭐ |

---

## 🎯 ماذا بعد؟

### للمطورين الجدد:
1. ✅ شغل النظام (الخطوات أعلاه)
2. 📖 اقرأ [STATUS.md](STATUS.md) - اعرف ما تم إنجازه
3. 📖 اقرأ [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - ابدأ التطوير
4. 🚀 ابدأ بـ **Projects Module** (Phase 6)

### للمستخدمين:
1. ✅ شغل النظام
2. 🔐 سجل دخول
3. 📊 استكشف Dashboard
4. 📝 جرب الميزات الموجودة

---

## 🆘 مشاكل شائعة؟

### Backend لا يعمل؟
```powershell
cd server
npm run prisma:generate
npm run prisma:migrate
```

### Frontend لا يتصل؟
تحقق من `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### قاعدة البيانات؟
```powershell
# تحقق أن PostgreSQL يعمل
# DATABASE_URL في server/.env صحيح
```

---

## 💡 أدوات مفيدة

```powershell
# Prisma Studio (GUI للقاعدة)
cd server
npm run prisma:studio
# http://localhost:5555

# React Query DevTools
# موجودة تلقائياً في التطبيق (زر صغير أسفل الشاشة)
```

---

## 📞 تحتاج مساعدة؟

1. راجع [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - أوامر ومعلومات سريعة
2. راجع [STATUS.md](STATUS.md) - الحالة الحالية والمشاكل
3. راجع [QUICKSTART.md](QUICKSTART.md) - دليل مفصل
4. افتح Issue على GitHub

---

## ✨ النظام جاهز!

✅ Backend API (40+ endpoints)  
✅ Frontend App (React 19)  
✅ Database (13 tables)  
✅ Auth System (JWT)  
✅ i18n (AR/EN)  
✅ Documentation (6 files)  

**ابدأ الآن!** 🚀

---

*EPM System © 2026*
