# دليل إدارة الحسابات وتقارير ما بعد البيع (Post-Sales / Account Management)

## 📍 نظرة عامة

تم إضافة **نظام إدارة الحسابات** لمتابعة العملاء بعد البيع وإعداد **تقارير المراجعة السنوية** لتخطيط السنة القادمة وتوقع فرص التجديد والتوسع.

---

## 🎯 الهدف

كمدير ما بعد البيع (Account Manager)، تحتاج إلى:
1. **متابعة المبيعات السنوية** لكل عميل
2. **إعداد تقرير سنوي** يُرسل للعميل
3. **توقع احتمالية** طلب نفس الكمية أو أكثر في السنة القادمة
4. **تحديد فرص Upsell** (البيع التكميلي)
5. **تتبع صحة الحساب** (Health Score) لتجنب فقدان العملاء

---

## 📊 هيكل البيانات الجديد

### 1. Account (الحساب)
كل عميل له حساب يحتوي على:

#### معلومات أساسية:
- **Account Name**: اسم العميل/الشركة
- **Account Code**: رمز فريد (مثل: ACC-2026-001)
- **Industry**: الصناعة (تقنية، تعليم، صحة...)
- **Size**: حجم الشركة (Small, Medium, Large, Enterprise)

#### معلومات الاتصال:
- **Primary Contact**: جهة الاتصال الرئيسية
- **Contact Email**: البريد الإلكتروني
- **Contact Phone**: رقم الهاتف

#### مؤشرات الحساب:
- **Status**: حالة الحساب
  - `Active`: نشط
  - `At Risk`: معرض للخطر (احتمال فقدان العميل)
  - `Churned`: مفقود (توقف التعامل)
  - `Dormant`: خامل (لا نشاط حديث)
  
- **Health Score**: مؤشر صحة الحساب (0-100)
  - يعتمد على: التفاعل، الرضا، استخدام الخدمات
  
- **Renewal Probability**: احتمالية التجديد (0-100%)

#### البيانات المالية:
- **Annual Value**: القيمة السنوية المتكررة (ARR)
- **Lifetime Value**: إجمالي القيمة منذ البداية
- **Contract Start/End Date**: تواريخ العقد
- **Next Review Date**: موعد المراجعة القادمة

### 2. Account Review (المراجعة السنوية)
لكل حساب، يتم إنشاء مراجعة سنوية تحتوي على:

#### فترة المراجعة:
- **Review Year**: السنة (2026)
- **Review Quarter** (اختياري): ربع سنوي (Q1-Q4)

#### ملخص المبيعات:
- **Total Projects**: عدد المشاريع المباعة
- **Total Revenue**: إجمالي الإيرادات
- **Projects Summary**: قائمة المشاريع (اسم، قيمة، تاريخ، حالة)

#### المقارنة السنوية:
- **Previous Year Revenue**: إيرادات السنة الماضية
- **Growth Percentage**: نسبة النمو (%)
  - مثال: إذا كانت 2025 = $100K و 2026 = $150K → النمو = 50%

#### الفرص المستقبلية:
- **Renewal Likelihood**: احتمالية التجديد (%)
- **Recommended Action**: الإجراء الموصى به
  - "Maintain" (الحفاظ)
  - "Retention Effort" (جهد الاحتفاظ)

#### محتوى التقرير:
- **Executive Summary**: ملخص تنفيذي
- **Key Achievements**: الإنجازات الرئيسية
  - [{achievement: "نجاح إطلاق المنتج X", date: "2026-03-15"}, ...]
- **Challenges**: التحديات والحلول
  - [{challenge: "تأخير التسليم", resolution: "تم تعيين فريق إضافي"}, ...]
- **Next Year Plan**: خطة السنة القادمة

---

## 🔗 ربط المشاريع بالحسابات

تم إضافة حقل `accountId` في جدول Projects:

```typescript
model Project {
  // ... existing fields
  accountId   String?
  account     Account?
}
```

**كيف يعمل:**
1. كل مشروع يمكن ربطه بحساب (عميل)
2. عند إنشاء **Annual Review**، النظام يجمع تلقائياً:
   - جميع المشاريع المرتبطة بهذا الحساب
   - حساب الإيرادات الإجمالية
   - عدد المشاريع

---

## 📋 كيفية الاستخدام

### 1. إنشاء حساب جديد (Account)

```
POST /api/accounts
{
  "name": "شركة النجاح التقني",
  "code": "ACC-2026-001",
  "industry": "Technology",
  "size": "Large",
  "primaryContact": "أحمد محمد",
  "primaryContactEmail": "ahmad@success-tech.com",
  "primaryContactPhone": "+966501234567",
  "status": "ACTIVE",
  "healthScore": 85,
  "renewalProbability": 80,
  "contractStartDate": "2025-01-01",
  "contractEndDate": "2026-12-31",
  "nextReviewDate": "2026-12-01"
}
```

### 2. ربط مشروع بحساب

عند إنشاء أو تعديل مشروع:
```
POST /api/projects
{
  "name": "نظام إدارة الموارد البشرية",
  "accountId": "uuid-of-account",  // ← ربط بالحساب
  "price": 120000,
  // ... rest of project data
}
```

### 3. إنشاء Annual Review

```
POST /api/accounts/:accountId/reviews
{
  "reviewYear": 2026,
  "executiveSummary": "حقق الحساب نمواً ملحوظاً بنسبة 50% مقارنة بالعام الماضي...",
  "keyAchievements": [
    {
      "achievement": "إطلاق نظام HR بنجاح",
      "date": "2026-03-15"
    },
    {
      "achievement": "توسيع الخدمات لتشمل 3 أقسام جديدة",
      "date": "2026-06-20"
    }
  ],
  "challenges": [
    {
      "challenge": "تأخير في التسليم بسبب تغيير المتطلبات",
      "resolution": "تم تعيين فريق إضافي وإعادة جدولة الخطة"
    }
  ],
  "renewalLikelihood": 85,
  "recommendedAction": "Maintain - الاستمرار في تقديم خدمات ممتازة",
  "nextYearPlan": "التركيز على توسيع الخدمات وتقديم التدريب للموظفين",
  "reviewedBy": "مدير الحسابات - محمد علي"
}
```

**ملاحظة:** النظام يحسب تلقائياً:
- `totalProjects` (من Projects المرتبطة)
- `totalRevenue` (من مجموع price للمشاريع)
- `previousYearRevenue` (من مراجعة السنة الماضية)
- `growthPercentage` (نسبة النمو)

### 4. عرض التقرير

استخدم مكون `AnnualReviewReport`:

```tsx
import AnnualReviewReport from '@/components/AnnualReviewReport';

// في الصفحة
<AnnualReviewReport data={reviewData} />
```

**الميزات:**
- ✅ عرض جميع المؤشرات الرئيسية
- ✅ جداول المشاريع والإنجازات
- ✅ مقارنة سنة بسنة (YoY)
- ✅ فرص البيع التكميلي
- ✅ زر طباعة PDF
- ✅ دعم عربي/إنجليزي (RTL)

---

## 📊 مثال تقرير كامل

### عميل: شركة النجاح التقني (ACC-2026-001)
### سنة المراجعة: 2026

#### المؤشرات الرئيسية:
- **عدد المشاريع**: 5 مشاريع
- **الإيرادات 2026**: $500,000
- **النمو السنوي**: +50% (كانت $333,000 في 2025)
- **احتمالية التجديد**: 85%

#### ملخص المشاريع:
| المشروع | التاريخ | الحالة | القيمة |
|---------|---------|--------|--------|
| نظام HR | 2026-03-15 | مكتمل | $120,000 |
| نظام CRM | 2026-06-20 | مكتمل | $150,000 |
| تطبيق Mobile | 2026-09-10 | جاري | $100,000 |
| موقع إلكتروني | 2026-11-01 | تخطيط | $80,000 |
| استشارات | 2026-12-15 | جاري | $50,000 |

#### الإنجازات الرئيسية:
✅ إطلاق نظام HR بنجاح (2026-03-15)  
✅ توسيع الخدمات لـ 3 أقسام جديدة (2026-06-20)  
✅ تحقيق رضا العميل 95% (2026-10-01)

#### التحديات والحلول:
- **التحدي**: تأخير بسبب تغيير المتطلبات  
  **الحل**: تعيين فريق إضافي وإعادة الجدولة

#### الفرص المستقبلية:
| الفرصة | القيمة المقدرة |
|--------|----------------|
| نظام إدارة الرواتب | $50,000 |
| نظام تقييم الأداء | $30,000 |
| **الإجمالي** | **$80,000** |

#### الإجراء الموصى به:
**Upsell** - قدم عرض لنظام الرواتب في Q1 2027

#### خطة السنة القادمة:
- التركيز على توسيع الخدمات
- تقديم التدريب للموظفين
- استكشاف فرص الذكاء الاصطناعي

---

## 🔧 API Endpoints

### Accounts:
```
GET    /api/accounts              # قائمة جميع الحسابات
GET    /api/accounts/:id          # تفاصيل حساب
POST   /api/accounts              # إنشاء حساب
PUT    /api/accounts/:id          # تحديث حساب
DELETE /api/accounts/:id          # حذف حساب
```

### Account Reviews:
```
GET    /api/accounts/:id/reviews                    # جميع مراجعات الحساب
GET    /api/accounts/:id/reviews/:year              # مراجعة سنة محددة
POST   /api/accounts/:id/reviews                    # إنشاء مراجعة
PUT    /api/accounts/:id/reviews/:reviewId          # تحديث مراجعة
DELETE /api/accounts/:id/reviews/:reviewId          # حذف مراجعة
GET    /api/accounts/:id/reviews/:year/generate     # إنشاء تلقائي (يجمع البيانات)
```

### Projects (مع Account):
```
GET    /api/accounts/:id/projects                   # جميع مشاريع الحساب
GET    /api/projects?accountId=xxx                  # فلتر حسب حساب
```

---

## 📈 حساب المؤشرات تلقائياً

### Health Score (0-100):
```typescript
healthScore = (
  (recentActivityScore * 0.3) +        // نشاط حديث
  (satisfactionScore * 0.3) +          // رضا العميل
  (usageScore * 0.2) +                 // استخدام الخدمات
  (paymentHistoryScore * 0.2)          // سجل المدفوعات
)
```

### Renewal Probability:
```typescript
renewalProbability = (
  (healthScore * 0.4) +                // صحة الحساب
  (contractComplianceScore * 0.3) +    // التزام العقد
  (growthTrend * 0.3)                  // اتجاه النمو
)
```

### Growth Percentage:
```typescript
growthPercentage = (
  (currentYearRevenue - previousYearRevenue) / 
  previousYearRevenue * 100
)
```

---

## 🎨 UI Components

### 1. AccountList (قائمة الحسابات)
- عرض جميع الحسابات
- فلترة حسب Status, Industry, Size
- مؤشرات Health Score بالألوان
- Renewal Probability

### 2. AccountDetail (تفاصيل الحساب)
- معلومات الحساب
- قائمة المشاريع المرتبطة
- تاريخ المراجعات السنوية
- Health Score Chart (رسم بياني)

### 3. AnnualReviewReport (التقرير السنوي)
- ✅ **موجود بالفعل** في `client/src/components/AnnualReviewReport.tsx`
- عرض كامل للتقرير
- طباعة PDF
- دعم RTL

### 4. CreateAccountModal (إنشاء حساب)
- نموذج إدخال الحساب
- حقول: Name, Code, Industry, Contact...

---

## 🚀 الخطوات التالية للتطوير

### الأولوية العالية:
1. ✅ إنشاء Account API Controller
2. ✅ إنشاء Account Review API
3. ⏳ إنشاء AccountList Page
4. ⏳ إنشاء AccountDetail Page
5. ⏳ ربط Projects بـ Accounts (إضافة Account Selector)

### الأولوية المتوسطة:
6. ⏳ Dashboard للـ Accounts (overview)
7. ⏳ Health Score Calculator (خوارزمية حساب)
8. ⏳ Renewal Probability Calculator
9. ⏳ تنبيهات Contract Expiry
10. ⏳ Export to Excel

### الأولوية المنخفضة:
11. ⏳ تقارير تحليلية (Churn Rate, ARR, MRR)
12. ⏳ Account Health Chart (رسم بياني زمني)
13. ⏳ Upsell Opportunities Dashboard
14. ⏳ Email Integration (إرسال التقرير تلقائياً)

---

## 💡 حالات الاستخدام

### Scenario 1: عميل نشط (Active)
- Health Score: 85
- Renewal Probability: 90%
- **Action**: Maintain + Explore Upsell

### Scenario 2: عميل معرض للخطر (At Risk)
- Health Score: 45
- Renewal Probability: 30%
- **Action**: Retention Effort (اتصال عاجل، تحسين الخدمة)

### Scenario 3: عميل خامل (Dormant)
- Last Activity: 6 months ago
- **Action**: Re-engagement Campaign

### Scenario 4: عميل مفقود (Churned)
- Contract Ended: No renewal
- **Action**: Win-back Campaign (محاولة استعادة)

---

## 📖 للمزيد

- راجع `server/prisma/schema.prisma` للبنية الكاملة
- راجع `client/src/components/AnnualReviewReport.tsx` لمكون التقرير

---

**الخلاصة:**  
النظام الآن يدعم **دورة حياة كاملة** للعميل:
1. **إدارة المشاريع** → مشاريع قيد التنفيذ
2. **إدارة الحسابات** → متابعة ما بعد البيع + مراجعات سنوية

🎉 **Engagement Management System** شامل!
