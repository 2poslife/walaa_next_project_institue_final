# مركز تَمَيَّز - نظام إدارة المعهد
# Tamayyoz Center - Institute Management System

## نظرة عامة / Overview

نظام إدارة متكامل لمعهد تعليمي خاص (مركز تميز - الرينة) مبني باستخدام Next.js 14، يوفر إدارة شاملة للطلاب، المعلمين، الدروس، المدفوعات، والتسعير. النظام مصمم ليكون سهل الاستخدام وآمن وفعّال.

An integrated management system for a private educational institute (Tamayyoz Center - Al-Rayina) built with Next.js 14, providing comprehensive management for students, teachers, lessons, payments, and pricing. The system is designed to be user-friendly, secure, and efficient.

---

## المميزات الرئيسية / Key Features

### 🔐 نظام المصادقة والأمان / Authentication & Security
- **JWT Authentication**: نظام مصادقة باستخدام JWT مع access tokens و refresh tokens
- **دور المستخدمين**: ثلاثة أدوار رئيسية (مدير، مدير فرعي، معلم)
- **إدارة كلمات المرور**: تغيير كلمات المرور، استعادة الحسابات
- **حماية المسارات**: middleware لحماية الصفحات والـ API routes

### 👨‍🏫 إدارة المعلمين / Teacher Management
- إضافة وتعديل وحذف المعلمين (للمدير فقط)
- عرض إحصائيات لكل معلم:
  - إجمالي ساعات الدروس الفردية والجماعية لكل مستوى تعليمي
  - إجمالي الأرباح (محسوبة من التسعير × الدروس المعتمدة)
  - عدد الدروس المعلقة (غير المعتمدة)
- عرض معلومات المعلم (الاسم، الهاتف)
- تفعيل/تعطيل حسابات المعلمين

### 👩‍🎓 إدارة الطلاب / Student Management
- إضافة وتعديل وحذف الطلاب
- تصنيف الطلاب حسب المستوى التعليمي (ابتدائي، إعدادي، ثانوي، جامعي)
- إضافة معلومات الصف/الفصل للطالب
- **Soft Delete**: حذف الطلاب بشكل منطقي (مع إمكانية الاستعادة)
- فلترة الطلاب حسب:
  - المستوى التعليمي
  - الحالة (نشط/محذوف)
  - البحث بالاسم
- **إعدادات النظام**: التحكم في إمكانية إضافة المعلمين لطلاب جدد (يمكن للمدير إيقاف هذه الميزة)

### 📘 إدارة الدروس / Lesson Management

#### أنواع الدروس / Lesson Types:
1. **دروس فردية / Individual Lessons**
   - دروس خاصة بين معلم وطالب واحد
   - حساب التكلفة حسب المستوى التعليمي وساعات الدرس
   
2. **دروس جماعية / Group Lessons**
   - دروس جماعية بين معلم ومجموعة طلاب
   - حساب التكلفة حسب عدد الطلاب في المجموعة
   - دعم نظام التسعير المتدرج (tiers) أو العادي (default)
   
3. **دروس علاجية / Remedial Lessons**
   - دروس علاجية خاصة
   - حساب التكلفة التلقائي (135 أو 120 حسب عدد دروس الطالب)

#### وظائف الدروس / Lesson Functions:
- **إنشاء الدروس**: المعلمون يمكنهم إنشاء دروس جديدة (فردية، جماعية، علاجية)
- **الاعتماد / Approval**: المدير يمكنه اعتماد الدروس (مفرد أو جماعي - bulk approve)
- **إلغاء الاعتماد / Unapprove**: المدير يمكنه إلغاء اعتماد الدروس المعتمدة لإتاحة التعديل
- **التعديل**: تعديل الدروس (فقط الدروس غير المعتمدة)
- **الحذف / Soft Delete**: حذف الدروس بشكل منطقي (مع إمكانية الاستعادة)
- **الاستعادة / Restore**: استعادة الدروس المحذوفة
- **فلترة الدروس** حسب:
  - التاريخ (من - إلى)
  - المعلم
  - الطالب
  - المستوى التعليمي
  - حالة الاعتماد (معتمد/غير معتمد/محذوف)
- **تأمين السعر / Price Locking**: عند اعتماد الدرس، يتم تأمين السعر لمنع إعادة الحساب عند تغيير التسعير

#### معلومات الدروس / Lesson Information:
- التاريخ والوقت (بداية الدرس من 10:00 إلى 23:00 بفواصل 15 دقيقة)
- عدد الساعات
- التكلفة الإجمالية (محسوبة تلقائياً)
- حالة الاعتماد
- معلومات المعلم والطالب/الطلاب
- المستوى التعليمي

### 💰 إدارة المدفوعات / Payment Management
- إضافة مدفوعات جديدة للطلاب
- عرض تاريخ المدفوعات لكل طالب
- تعديل وحذف المدفوعات
- **حساب الرصيد التلقائي**: 
  - إجمالي المدفوعات
  - إجمالي التكلفة (من الدروس المعتمدة)
  - الرصيد المتبقي (المدفوع - التكلفة)
- **فلترة المدفوعات**:
  - حسب المستوى التعليمي
  - حسب حالة الدفع (مدفوع/غير مدفوع)
  - البحث بالاسم
- **ترتيب حسب المبلغ المتبقي**: الطلاب الذين لديهم أكبر مبلغ متبقٍ يظهرون أولاً

### 💵 إدارة التسعير / Pricing Management
- **التسعير الأساسي / Base Pricing**:
  - تحديد سعر الساعة لكل مستوى تعليمي
  - فردي / Individual: سعر لكل ساعة
  - جماعي / Group: سعر لكل ساعة (في وضع default)
  
- **التسعير المتدرج / Tiered Pricing** (اختياري):
  - تحديد أسعار مختلفة حسب عدد الطلاب في الدرس الجماعي
  - مثال: 2 طلاب = 100، 3 طلاب = 135، 4 طلاب = 160
  - يمكن تفعيله عبر متغير البيئة `NEXT_PUBLIC_GROUP_PRICING_MODE=tiers`

- **حماية الأسعار / Price Locking**:
  - عند اعتماد الدرس، يتم تأمين السعر
  - منع إعادة حساب التكلفة عند تغيير التسعير لاحقاً
  - حماية الطلاب من زيادة التكاليف بعد الدفع

### 📊 الإحصائيات والتقارير / Statistics & Reports

#### إحصائيات المعلمين / Teacher Statistics:
- إجمالي ساعات الدروس (فردية/جماعية) لكل مستوى تعليمي
- إجمالي الأرباح (الشهر/الإجمالي)
- عدد الدروس المعلقة
- **تصدير CSV**: تصدير جميع دروس المعلم (معتمدة/غير معتمدة/محذوفة) لشهر محدد

#### إحصائيات الطلاب / Student Statistics:
- إجمالي ساعات الدروس الفردية والجماعية
- إجمالي المدفوعات
- الرصيد المتبقي
- تاريخ المدفوعات

#### إحصائيات المستويات التعليمية / Education Level Statistics:
- إجمالي الساعات لكل مستوى
- إجمالي الإيرادات

#### الإحصائيات العامة / Global Statistics:
- إجمالي عدد الدروس
- إجمالي عدد المعلمين
- إجمالي عدد الطلاب
- الدخل الشهري

### ⚙️ إعدادات النظام / System Settings
- **التحكم في صلاحيات المعلمين**:
  - السماح/منع المعلمين من إضافة طلاب جدد
  - إذا كان الإعداد مغلق: المعلمون يمكنهم فقط اختيار طلاب موجودين
  - إذا كان الإعداد مفتوح: المعلمون يمكنهم إضافة طلاب جدد

### 🏠 الموقع العام / Public Website
- **الصفحة الرئيسية**: صفحة ترحيبية مع معلومات المركز
- **صفحة من نحن / About**: معلومات عن المركز
- **صفحة الاتصال / Contact**: معلومات الاتصال
- **صفحة القواعد / Rules**: قواعد المركز

---

## الأدوار والصلاحيات / Roles & Permissions

### 👑 المدير / Admin
- الوصول الكامل لجميع الميزات
- إدارة المعلمين (إضافة، تعديل، حذف)
- إدارة الطلاب (إضافة، تعديل، حذف)
- اعتماد/إلغاء اعتماد الدروس
- إدارة المدفوعات
- إدارة التسعير
- عرض جميع الإحصائيات
- إعدادات النظام
- استعادة الدروس/الطلاب المحذوفة

### 👨‍🏫 المعلم / Teacher
- عرض وتعديل ملفه الشخصي
- تغيير كلمة المرور
- إضافة الدروس (فردية، جماعية، علاجية) - فقط لنفسه
- تعديل الدروس الخاصة به (فقط غير المعتمدة)
- حذف الدروس الخاصة به (فقط غير المعتمدة)
- عرض الإحصائيات الشخصية
- إضافة طلاب (حسب إعدادات النظام)

### 👨‍💼 المدير الفرعي / Sub Admin
- (يتم التعامل معه كمدير في معظم الحالات)

---

## الهيكل التقني / Technical Stack

### Frontend
- **Next.js 14**: React framework مع App Router
- **TypeScript**: للسلامة النوعية
- **Tailwind CSS**: للتصميم والـ styling
- **React Hooks**: useState, useEffect, useMemo, useCallback
- **Context API**: لإدارة حالة المصادقة

### Backend
- **Next.js API Routes**: للـ backend logic
- **Supabase (PostgreSQL)**: قاعدة البيانات
- **JWT (jose)**: للمصادقة والأمان
- **bcryptjs**: لتشفير كلمات المرور

### Database
- **PostgreSQL**: قاعدة البيانات الرئيسية
- **Supabase**: كخدمة قاعدة البيانات
- **Triggers**: لحساب التكلفة التلقائي
- **Indexes**: لتحسين الأداء

### Security
- **JWT Tokens**: Access tokens و Refresh tokens
- **Middleware**: حماية المسارات
- **Role-based Access Control**: التحكم في الصلاحيات حسب الدور
- **Password Hashing**: تشفير كلمات المرور باستخدام bcrypt

---

## هيكل قاعدة البيانات / Database Schema

### الجداول الرئيسية / Main Tables:

#### 1. `users`
- إدارة المستخدمين والمصادقة
- الحقول: id, username, password_hash, role, is_active, created_at

#### 2. `teachers`
- معلومات المعلمين
- الحقول: id, user_id, full_name, phone, created_at

#### 3. `students`
- معلومات الطلاب
- الحقول: id, full_name, parent_contact, education_level_id, class, created_by_teacher_id, deleted_at, deletion_note, created_at

#### 4. `education_levels`
- المستويات التعليمية
- الحقول: id, name_ar, name_en, created_at
- القيم: ابتدائي، إعدادي، ثانوي، جامعي

#### 5. `pricing`
- التسعير الأساسي
- الحقول: id, education_level_id, lesson_type, price_per_hour, created_at

#### 6. `group_pricing_tiers`
- التسعير المتدرج للدروس الجماعية
- الحقول: id, education_level_id, student_count, total_price, price_per_student, created_at

#### 7. `individual_lessons`
- الدروس الفردية
- الحقول: id, teacher_id, student_id, education_level_id, date, start_time, hours, approved, total_cost, price_locked, deleted_at, deletion_note, created_at

#### 8. `group_lessons`
- الدروس الجماعية
- الحقول: id, teacher_id, education_level_id, date, start_time, hours, approved, total_cost, price_locked, deleted_at, deletion_note, created_at

#### 9. `group_lesson_students`
- ربط الطلاب بالدروس الجماعية (many-to-many)
- الحقول: group_lesson_id, student_id

#### 10. `remedial_lessons`
- الدروس العلاجية
- الحقول: id, teacher_id, student_id, date, start_time, hours, approved, total_cost, price_locked, deleted_at, deletion_note, created_at

#### 11. `payments`
- المدفوعات
- الحقول: id, student_id, amount, payment_date, note, created_at

#### 12. `app_settings`
- إعدادات النظام
- الحقول: id, key, value, description, updated_at, updated_by

---

## API Routes

### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/refresh` - تحديث الـ token
- `POST /api/auth/change-password` - تغيير كلمة المرور

### Teachers
- `GET /api/teachers` - الحصول على جميع المعلمين
- `POST /api/teachers` - إضافة معلم جديد
- `GET /api/teachers/[id]` - الحصول على معلم محدد
- `PUT /api/teachers/[id]` - تحديث معلم
- `DELETE /api/teachers/[id]` - حذف معلم

### Students
- `GET /api/students` - الحصول على جميع الطلاب
- `POST /api/students` - إضافة طالب جديد
- `GET /api/students/[id]` - الحصول على طالب محدد
- `PUT /api/students/[id]` - تحديث طالب
- `DELETE /api/students/[id]` - حذف طالب

### Lessons

#### Individual Lessons
- `GET /api/lessons/individual` - الحصول على الدروس الفردية
- `POST /api/lessons/individual` - إضافة درس فردي
- `GET /api/lessons/individual/[id]` - الحصول على درس فردي
- `PUT /api/lessons/individual/[id]` - تحديث درس فردي
- `DELETE /api/lessons/individual/[id]` - حذف درس فردي
- `POST /api/lessons/individual/[id]/approve` - اعتماد درس فردي
- `POST /api/lessons/individual/[id]/unapprove` - إلغاء اعتماد درس فردي
- `POST /api/lessons/individual/[id]/restore` - استعادة درس فردي محذوف
- `POST /api/lessons/individual/bulk-approve` - اعتماد جماعي للدروس الفردية

#### Group Lessons
- `GET /api/lessons/group` - الحصول على الدروس الجماعية
- `POST /api/lessons/group` - إضافة درس جماعي
- `GET /api/lessons/group/[id]` - الحصول على درس جماعي
- `PUT /api/lessons/group/[id]` - تحديث درس جماعي
- `DELETE /api/lessons/group/[id]` - حذف درس جماعي
- `POST /api/lessons/group/[id]/approve` - اعتماد درس جماعي
- `POST /api/lessons/group/[id]/unapprove` - إلغاء اعتماد درس جماعي
- `POST /api/lessons/group/[id]/restore` - استعادة درس جماعي محذوف
- `POST /api/lessons/group/bulk-approve` - اعتماد جماعي للدروس الجماعية

#### Remedial Lessons
- `GET /api/lessons/remedial` - الحصول على الدروس العلاجية
- `POST /api/lessons/remedial` - إضافة درس علاجي
- `GET /api/lessons/remedial/[id]` - الحصول على درس علاجي
- `PUT /api/lessons/remedial/[id]` - تحديث درس علاجي
- `DELETE /api/lessons/remedial/[id]` - حذف درس علاجي
- `POST /api/lessons/remedial/[id]/approve` - اعتماد درس علاجي
- `POST /api/lessons/remedial/[id]/unapprove` - إلغاء اعتماد درس علاجي
- `POST /api/lessons/remedial/[id]/restore` - استعادة درس علاجي محذوف

### Payments
- `GET /api/payments` - الحصول على جميع المدفوعات
- `POST /api/payments` - إضافة دفعة جديدة
- `GET /api/payments/[id]` - الحصول على دفعة محددة
- `PUT /api/payments/[id]` - تحديث دفعة
- `DELETE /api/payments/[id]` - حذف دفعة

### Pricing
- `GET /api/pricing` - الحصول على التسعير
- `POST /api/pricing` - حفظ التسعير

### Group Pricing Tiers
- `GET /api/group-pricing-tiers` - الحصول على التسعير المتدرج
- `POST /api/group-pricing-tiers` - إضافة طبقة تسعير
- `GET /api/group-pricing-tiers/[id]` - الحصول على طبقة محددة
- `PUT /api/group-pricing-tiers/[id]` - تحديث طبقة
- `DELETE /api/group-pricing-tiers/[id]` - حذف طبقة

### Statistics
- `GET /api/statistics` - الإحصائيات العامة
- `GET /api/statistics/teacher` - إحصائيات المعلمين
- `GET /api/statistics/student` - إحصائيات الطلاب
- `GET /api/statistics/level` - إحصائيات المستويات
- `GET /api/statistics/global` - الإحصائيات الشاملة

### Settings
- `GET /api/settings` - الحصول على الإعدادات
- `PUT /api/settings` - تحديث الإعدادات (للمدير فقط)

### Profile
- `GET /api/profile` - الحصول على الملف الشخصي
- `PUT /api/profile` - تحديث الملف الشخصي

---

## الميزات الخاصة / Special Features

### 1. Price Locking (تأمين السعر)
- عند اعتماد الدرس، يتم تأمين السعر تلقائياً
- منع إعادة حساب التكلفة عند تغيير التسعير لاحقاً
- حماية الطلاب من زيادة التكاليف بعد الدفع

### 2. Soft Delete (الحذف المنطقي)
- الحذف المنطقي للطلاب والدروس
- إمكانية الاستعادة
- حفظ ملاحظات الحذف

### 3. Bulk Operations (العمليات الجماعية)
- اعتماد جماعي للدروس
- فلترة متقدمة للبحث

### 4. CSV Export (تصدير CSV)
- تصدير دروس المعلم لشهر محدد
- يتضمن جميع حالات الدروس (معتمدة/غير معتمدة/محذوفة)

### 5. Advanced Filtering (فلترة متقدمة)
- فلترة حسب التاريخ، المعلم، الطالب، المستوى، الحالة
- بحث نصي
- ترتيب حسب المبلغ المتبقي

### 6. Real-time Calculations (حسابات فورية)
- حساب التكلفة التلقائي باستخدام Database Triggers
- حساب الرصيد المتبقي للطلاب
- تحديث تلقائي عند تغيير البيانات

---

## الصفحات الرئيسية / Main Pages

### Public Pages
- `/` - الصفحة الرئيسية
- `/about` - من نحن
- `/contact` - اتصل بنا
- `/rules` - القواعد
- `/login` - تسجيل الدخول

### Dashboard Pages (Protected)
- `/dashboard` - لوحة التحكم الرئيسية
- `/dashboard/students` - إدارة الطلاب
- `/dashboard/teachers` - إدارة المعلمين (للمدير فقط)
- `/dashboard/lessons` - إدارة الدروس
- `/dashboard/payments` - إدارة المدفوعات (للمدير فقط)
- `/dashboard/pricing` - إدارة التسعير (للمدير فقط)
- `/dashboard/pricing/tiers` - إدارة التسعير المتدرج (للمدير فقط)
- `/dashboard/statistics` - الإحصائيات
- `/dashboard/profile` - الملف الشخصي
- `/dashboard/settings` - إعدادات النظام (للمدير فقط)

---

## التثبيت والتشغيل / Installation & Setup

### المتطلبات / Requirements
- Node.js 18+ 
- npm أو yarn
- حساب Supabase
- PostgreSQL database (عبر Supabase)

### الخطوات / Steps

1. **تثبيت المكتبات / Install Dependencies**
```bash
npm install
```

2. **إعداد متغيرات البيئة / Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret (32+ characters)
JWT_REFRESH_SECRET=your_refresh_secret (32+ characters)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GROUP_PRICING_MODE=default # or 'tiers'
```

3. **إعداد قاعدة البيانات / Database Setup**
- تشغيل `database/schema.sql` في Supabase SQL Editor
- تشغيل ملفات الـ migration (إن وجدت)

4. **إنشاء مستخدم مدير / Create Admin User**
```bash
npm run create-admin
```

5. **تشغيل الخادم / Run Development Server**
```bash
npm run dev
```

6. **البناء للإنتاج / Build for Production**
```bash
npm run build
npm start
```

---

## Scripts المتاحة / Available Scripts

- `npm run dev` - تشغيل خادم التطوير
- `npm run dev:default` - تشغيل مع وضع التسعير الافتراضي
- `npm run dev:tiers` - تشغيل مع وضع التسعير المتدرج
- `npm run build` - بناء التطبيق للإنتاج
- `npm run start` - تشغيل خادم الإنتاج
- `npm run lint` - فحص الكود
- `npm run create-admin` - إنشاء مستخدم مدير
- `npm run seed-lessons` - إضافة بيانات تجريبية للدروس
- `npm run cleanup-lessons` - تنظيف الدروس التجريبية

---

## الأمان / Security Features

1. **JWT Authentication**: نظام مصادقة آمن
2. **Password Hashing**: تشفير كلمات المرور
3. **Role-based Access Control**: التحكم في الصلاحيات
4. **Middleware Protection**: حماية المسارات
5. **Input Validation**: التحقق من المدخلات
6. **SQL Injection Protection**: استخدام Supabase parameterized queries

---

## التوثيق الإضافي / Additional Documentation

- `README.md` - دليل سريع للتثبيت
- `database/schema.sql` - هيكل قاعدة البيانات
- `database/PRICE_LOCKED_FEATURE.md` - توثيق ميزة تأمين السعر
- `database/migration_*.sql` - ملفات الـ migration

---

## الترخيص / License

مشروع خاص لمعهد مركز تميز - الرينة

Private project for Tamayyoz Center - Al-Rayina Institute

---

## التطوير المستقبلي / Future Development

- إضافة نظام الإشعارات
- تطوير تطبيق موبايل
- تحسينات في واجهة المستخدم
- تقارير PDF متقدمة
- نظام الرسائل بين المعلمين والطلاب
- جدولة الدروس التلقائية

---

**آخر تحديث / Last Updated**: 2024

**الإصدار / Version**: 1.0.0









