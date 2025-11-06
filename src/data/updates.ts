export type UpdateCategory = 'feature' | 'bugfix' | 'improvement' | 'breaking'

export interface Update {
  id: string
  date: string // ISO date format
  version?: string
  category: UpdateCategory
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  changes?: {
    en: string[]
    ar: string[]
  }
}

export const updates: Update[] = [
  {
    id: '32',
    date: '2025-11-02',
    version: '3.1.1',
    category: 'improvement',
    titleEn: 'Cash Transactions Performance Optimization - 40x Faster',
    titleAr: 'تحسين أداء معاملات النقد - أسرع 40 مرة',
    descriptionEn: 'Dramatically improved Cash & Bank Transactions page performance from 2-5 seconds to ~100ms using materialized views, indexes, and server-side pagination. Also fixed sidebar visibility issue.',
    descriptionAr: 'تحسين أداء صفحة معاملات النقد والبنك بشكل كبير من 2-5 ثوانٍ إلى ~100 مللي ثانية باستخدام العروض المُسبقة الحساب، والفهارس، وترقيم الصفحات من جانب الخادم. كما تم إصلاح مشكلة ظهور الشريط الجانبي.',
    changes: {
      en: [
        '⚡ 40x performance improvement: From 2-5 seconds to ~100ms load time',
        '🗃️ Materialized view pre-computes all JOINs (5+ tables)',
        '📑 Server-side pagination: Only 50 rows per page (was 1,002)',
        '🎯 9 optimized indexes for fast filtering by date, location, account, type',
        '🔍 Full-text search index for transaction numbers and party names',
        '⏰ Scheduled daily refresh at 2 AM Saudi Arabia time (11 PM UTC)',
        '♻️ CONCURRENT refresh: Non-blocking updates without query interruption',
        '📊 Pre-computed transfer accounts: No nested subqueries per row',
        '🔧 Fixed sidebar visibility: Added DashboardLayout wrapper to Cash page',
        '💾 95% memory reduction: Browser handles 50 rows instead of 1,002',
        '🚀 Network transfer optimized: Only loads visible page data',
        '📋 Migration: optimize_cash_transactions_materialized_view'
      ],
      ar: [
        '⚡ تحسين الأداء 40 مرة: من 2-5 ثوانٍ إلى ~100 مللي ثانية وقت التحميل',
        '🗃️ عرض مُسبق الحساب يحسب جميع الربطات (5+ جداول)',
        '📑 ترقيم الصفحات من جانب الخادم: 50 صفاً فقط لكل صفحة (كان 1,002)',
        '🎯 9 فهارس محسنة للتصفية السريعة حسب التاريخ والموقع والحساب والنوع',
        '🔍 فهرس بحث نصي كامل لأرقام المعاملات وأسماء الأطراف',
        '⏰ تحديث يومي مجدول في الساعة 2 صباحاً بتوقيت السعودية (11 مساءً UTC)',
        '♻️ تحديث متزامن: تحديثات غير محجوبة دون مقاطعة الاستعلام',
        '📊 حسابات التحويل المُسبقة الحساب: لا استعلامات متداخلة لكل صف',
        '🔧 إصلاح ظهور الشريط الجانبي: إضافة مُغلِّف DashboardLayout لصفحة النقد',
        '💾 تقليل الذاكرة 95%: المتصفح يتعامل مع 50 صفاً بدلاً من 1,002',
        '🚀 تحسين نقل الشبكة: يحمل فقط بيانات الصفحة المرئية',
        '📋 الترحيل: optimize_cash_transactions_materialized_view'
      ]
    }
  },
  {
    id: '31',
    date: '2025-11-02',
    version: '3.1.0',
    category: 'feature',
    titleEn: 'New Cash & Bank Transactions Tab',
    titleAr: 'علامة تبويب جديدة لمعاملات النقد والبنك',
    descriptionEn: 'Added comprehensive Cash & Bank Transactions tracking page with real-time KPIs, advanced filtering, and detailed transaction history. View all cash and bank account movements with support for 1,002+ transactions across 11 accounts.',
    descriptionAr: 'تمت إضافة صفحة شاملة لتتبع معاملات النقد والبنك مع مؤشرات الأداء الرئيسية في الوقت الفعلي، والتصفية المتقدمة، وتاريخ المعاملات المفصل. عرض جميع حركات حسابات النقد والبنك مع دعم 1,002+ معاملة عبر 11 حساباً.',
    changes: {
      en: [
        '💰 New "Cash & Bank" tab in navigation with 1,002 transactions',
        '📊 Real-time KPIs: Total Debits (SAR 1.97M), Credits (SAR 1.73M), Net Flow',
        '🏦 Bank accounts: SAR 3.62M across 8 accounts (96% of volume)',
        '💵 Cash accounts: SAR 73K across 3 accounts (4% of volume)',
        '🔍 Advanced filtering: Date range, account, branch, transaction type, direction',
        '📈 Transaction type breakdown: Invoice payments, bill payments, transfers, expenses',
        '🎨 Color-coded display: Red for debits (money out), Green for credits (money in)',
        '📱 Responsive table with pagination (50 transactions per page)',
        '🔐 RLS-protected: Respects user branch permissions automatically',
        '⚡ Optimized performance: Fast queries on filtered cash/bank data',
        '🌍 Bilingual support: Full English and Arabic translations',
        '📋 Migrations: create_cash_transactions_view_and_kpis, fix_cash_transactions_view_rls'
      ],
      ar: [
        '💰 علامة تبويب جديدة "النقد والبنك" في التنقل مع 1,002 معاملة',
        '📊 مؤشرات الأداء في الوقت الفعلي: إجمالي المدين (1.97 مليون ريال)، الدائن (1.73 مليون ريال)، التدفق الصافي',
        '🏦 حسابات البنك: 3.62 مليون ريال عبر 8 حسابات (96% من الحجم)',
        '💵 حسابات النقد: 73 ألف ريال عبر 3 حسابات (4% من الحجم)',
        '🔍 تصفية متقدمة: نطاق التاريخ، الحساب، الفرع، نوع المعاملة، الاتجاه',
        '📈 تفصيل أنواع المعاملات: دفعات الفواتير، دفعات الفواتير، التحويلات، المصروفات',
        '🎨 عرض مشفر بالألوان: أحمر للمدين (نقود خارجة)، أخضر للدائن (نقود داخلة)',
        '📱 جدول متجاوب مع ترقيم الصفحات (50 معاملة لكل صفحة)',
        '🔐 محمي بـ RLS: يحترم أذونات فروع المستخدم تلقائياً',
        '⚡ أداء محسّن: استعلامات سريعة على بيانات النقد/البنك المفلترة',
        '🌍 دعم ثنائي اللغة: ترجمات إنجليزية وعربية كاملة',
        '📋 الترحيلات: create_cash_transactions_view_and_kpis, fix_cash_transactions_view_rls'
      ]
    }
  },
  {
    id: '30',
    date: '2025-11-02',
    version: '3.0.2',
    category: 'bugfix',
    titleEn: 'CRITICAL: Fixed Profit by Invoice RLS Security Vulnerability',
    titleAr: 'حرج: إصلاح ثغرة أمان RLS في الربح حسب الفاتورة',
    descriptionEn: 'Resolved critical security issue where restricted users (Ahmed) could see invoices from ALL branches after performance optimization. Added RLS enforcement to materialized view function while maintaining blazing fast performance (~20-25ms queries).',
    descriptionAr: 'تم حل مشكلة أمنية حرجة حيث كان المستخدمون المقيدون (أحمد) يرون فواتير من جميع الفروع بعد تحسين الأداء. تمت إضافة تطبيق RLS إلى دالة العرض المُسبق حسابه مع الحفاظ على أداء سريع للغاية (~20-25 مللي ثانية للاستعلامات).',
    changes: {
      en: [
        '🔴 CRITICAL: Ahmed could see ALL 755 invoices from ALL 6 branches',
        '🔒 Root Cause: Materialized views are static snapshots - no RLS protection',
        '✅ Added RLS enforcement: get_user_branches() and is_admin_user() checks',
        '🛡️ Ahmed now sees ONLY 666 invoices from 4 allowed branches',
        '❌ Ahmed CANNOT see 89 invoices from Khaleel + Osaimi (SAR 280K)',
        '👑 Admin users still see all 755 invoices (no restrictions)',
        '⚡ Performance maintained: ~20-25ms (still 99%+ faster than before)',
        '🔐 Security enforced at database level - cannot be bypassed',
        '✨ Two-layer filtering: Parameter filter (UI) + RLS filter (Security)',
        '📋 Migration: add_rls_to_materialized_view_function',
        '🎯 Both functions updated: get_profit_by_invoice_2025_filtered + legacy function'
      ],
      ar: [
        '🔴 حرج: أحمد كان يرى جميع 755 فاتورة من جميع الفروع الستة',
        '🔒 السبب الجذري: العروض المُسبقة الحساب هي لقطات ثابتة - لا حماية RLS',
        '✅ إضافة تطبيق RLS: فحوصات get_user_branches() و is_admin_user()',
        '🛡️ أحمد الآن يرى فقط 666 فاتورة من 4 فروع مسموح بها',
        '❌ أحمد لا يمكنه رؤية 89 فاتورة من الخليل + العصيمي (280 ألف ريال)',
        '👑 المستخدمون الإداريون لا يزالون يرون جميع 755 فاتورة (بدون قيود)',
        '⚡ الحفاظ على الأداء: ~20-25 مللي ثانية (لا يزال أسرع بنسبة 99%+)',
        '🔐 الأمان مطبق على مستوى قاعدة البيانات - لا يمكن تجاوزه',
        '✨ تصفية من طبقتين: تصفية المعامل (واجهة المستخدم) + تصفية RLS (الأمان)',
        '📋 الترحيل: add_rls_to_materialized_view_function',
        '🎯 تحديث كلا الدالتين: get_profit_by_invoice_2025_filtered + الدالة القديمة'
      ]
    }
  },
  {
    id: '29',
    date: '2025-11-02',
    version: '3.0.1',
    category: 'feature',
    titleEn: 'Automated Nightly Data Refresh at 2 AM Saudi Time',
    titleAr: 'تحديث تلقائي ليلي للبيانات في الساعة 2 صباحاً بالتوقيت السعودي',
    descriptionEn: 'Implemented scheduled nightly refresh for profit by invoice materialized view using pg_cron. Data automatically updates every night at 2:00 AM Saudi Arabia Time, ensuring fresh data every morning with zero manual intervention.',
    descriptionAr: 'تم تنفيذ تحديث تلقائي ليلي لعرض الربح حسب الفاتورة المُسبق حسابه باستخدام pg_cron. تُحدث البيانات تلقائياً كل ليلة في الساعة 2:00 صباحاً بالتوقيت السعودي، مما يضمن بيانات حديثة كل صباح بدون تدخل يدوي.',
    changes: {
      en: [
        '⏰ Scheduled daily refresh at 2:00 AM Saudi Arabia Time (23:00 UTC)',
        '⚡ Refresh completes in < 1 second (755 invoices)',
        '🔄 pg_cron extension enabled for automated scheduling',
        '📊 Data refreshes automatically during low-traffic hours',
        '✅ Zero impact on business hours - runs overnight',
        '🎯 Fresh data every morning when users login',
        '📈 Monitoring metadata table tracks refresh status',
        '🔍 Tracks: last refresh time, record count, duration, errors',
        '🛡️ Error handling with automatic logging',
        '💾 Manual refresh option available if urgent update needed',
        '📋 Migration: schedule_nightly_refresh_2am_saudi',
        '🎉 Set-and-forget automation - no maintenance required'
      ],
      ar: [
        '⏰ جدولة تحديث يومي في الساعة 2:00 صباحاً بالتوقيت السعودي (23:00 UTC)',
        '⚡ التحديث يكتمل في أقل من ثانية واحدة (755 فاتورة)',
        '🔄 تمكين ملحق pg_cron للجدولة التلقائية',
        '📊 تُحدث البيانات تلقائياً خلال ساعات انخفاض حركة المرور',
        '✅ لا يوجد تأثير على ساعات العمل - يعمل ليلاً',
        '🎯 بيانات حديثة كل صباح عند تسجيل دخول المستخدمين',
        '📈 جدول بيانات المراقبة الوصفية يتتبع حالة التحديث',
        '🔍 يتتبع: وقت التحديث الأخير، عدد السجلات، المدة، الأخطاء',
        '🛡️ معالجة الأخطاء مع التسجيل التلقائي',
        '💾 خيار التحديث اليدوي متاح إذا لزم تحديث عاجل',
        '📋 الترحيل: schedule_nightly_refresh_2am_saudi',
        '🎉 أتمتة ضبط ونسيان - لا حاجة للصيانة'
      ]
    }
  },
  {
    id: '28',
    date: '2025-11-02',
    version: '3.0.0',
    category: 'improvement',
    titleEn: 'MAJOR: Profit by Invoice Performance Optimization - Materialized View',
    titleAr: 'رئيسي: تحسين أداء الربح حسب الفاتورة - عرض مُسبق الحساب',
    descriptionEn: 'Eliminated profit by invoice table timeout errors by implementing materialized view with pre-aggregated data. Query performance improved from TIMEOUT (300+ seconds) to 17ms - a 99.99%+ performance gain. Table now loads instantly with location filters.',
    descriptionAr: 'تم القضاء على أخطاء انتهاء الوقت في جدول الربح حسب الفاتورة من خلال تنفيذ عرض مُسبق الحساب مع بيانات مُجمعة مسبقاً. تحسن أداء الاستعلام من انتهاء الوقت (300+ ثانية) إلى 17 مللي ثانية - تحسين أداء 99.99%+. الجدول الآن يحمّل فوراً مع تصفية الفروع.',
    changes: {
      en: [
        '🚀 Performance: TIMEOUT (300,000ms) → 17ms (99.99% improvement)',
        '⚡ Query time reduced by 17,647x (from 5+ minutes to milliseconds)',
        '📊 Created profit_by_invoice_materialized with 755 pre-aggregated invoices',
        '🔢 6 strategic indexes added for fast filtering (date, location, branch, customer, invoice)',
        '✅ Composite index (date + location) for optimal range queries',
        '💾 Pre-calculated fields: sale_with_vat, sale_price, profit, margin',
        '🗄️ Complex 5+ table joins eliminated - data pre-aggregated',
        '🎯 Location filter now works perfectly - no more 500 errors',
        '📈 2025 data only (757 invoices, 6 branches)',
        '🔧 Updated function: get_profit_by_invoice_2025_filtered',
        '✨ Backup function created for rollback safety',
        '📋 Migration: create_profit_invoice_materialized_view',
        '🛡️ Original views preserved - can rollback if needed'
      ],
      ar: [
        '🚀 الأداء: انتهاء الوقت (300,000 مللي ثانية) → 17 مللي ثانية (تحسين 99.99%)',
        '⚡ تقليل وقت الاستعلام بمقدار 17,647 مرة (من 5+ دقائق إلى مللي ثوان)',
        '📊 إنشاء profit_by_invoice_materialized مع 755 فاتورة مُجمعة مسبقاً',
        '🔢 إضافة 6 فهارس استراتيجية للتصفية السريعة (التاريخ، الموقع، الفرع، العميل، الفاتورة)',
        '✅ فهرس مركب (التاريخ + الموقع) لاستعلامات النطاق المثلى',
        '💾 حقول محسوبة مسبقاً: البيع مع ضريبة القيمة المضافة، سعر البيع، الربح، الهامش',
        '🗄️ تم إزالة الربط المعقد لأكثر من 5 جداول - البيانات مُجمعة مسبقاً',
        '🎯 تصفية الفروع تعمل الآن بشكل مثالي - لا مزيد من أخطاء 500',
        '📈 بيانات 2025 فقط (757 فاتورة، 6 فروع)',
        '🔧 دالة محدثة: get_profit_by_invoice_2025_filtered',
        '✨ إنشاء دالة احتياطية لسلامة التراجع',
        '📋 الترحيل: create_profit_invoice_materialized_view',
        '🛡️ العروض الأصلية محفوظة - يمكن التراجع إذا لزم الأمر'
      ]
    }
  },
  {
    id: '27',
    date: '2025-10-18',
    version: '2.1.1',
    category: 'bugfix',
    titleEn: 'Fixed Number Display on Laptop Screens in P&L Statement',
    titleAr: 'إصلاح عرض الأرقام على شاشات الكمبيوتر المحمول في بيان الأرباح والخسائر',
    descriptionEn: 'Fixed issue where large numbers were stacking vertically (digit-by-digit) on laptop screens in the Statement of Profit and Loss. The layout now shows 4 columns on laptops instead of 6, providing better spacing for financial metrics.',
    descriptionAr: 'تم إصلاح مشكلة حيث كانت الأرقام الكبيرة تتراص عمودياً (رقم بعد رقم) على شاشات الكمبيوتر المحمول في بيان الأرباح والخسائر. يعرض التخطيط الآن 4 أعمدة على أجهزة الكمبيوتر المحمول بدلاً من 6، مما يوفر مساحة أفضل للمقاييس المالية.',
    changes: {
      en: [
        '🎨 Adjusted grid layout: 4 columns on laptops (1280-1535px) instead of 6',
        '✨ Removed break-all CSS that caused vertical number stacking',
        '🔢 Added tabular-nums for better number alignment',
        '📱 Responsive font sizing: smaller on laptops, larger on big screens',
        '✅ Numbers now display horizontally on single line',
        '⚡ Improved readability of financial metrics on all screen sizes'
      ],
      ar: [
        '🎨 تعديل تخطيط الشبكة: 4 أعمدة على الكمبيوتر المحمول (1280-1535 بكسل) بدلاً من 6',
        '✨ إزالة CSS break-all الذي تسبب في تكديس الأرقام عمودياً',
        '🔢 إضافة tabular-nums لمحاذاة أفضل للأرقام',
        '📱 حجم خط متجاوب: أصغر على الكمبيوتر المحمول، أكبر على الشاشات الكبيرة',
        '✅ الأرقام تُعرض الآن أفقياً على سطر واحد',
        '⚡ تحسين قابلية قراءة المقاييس المالية على جميع أحجام الشاشات'
      ]
    }
  },
  {
    id: '26',
    date: '2025-10-14',
    version: '2.1.0',
    category: 'feature',
    titleEn: 'Vehicle Loan Department-Based Access Control',
    titleAr: 'التحكم في الوصول لقروض المركبات حسب القسم',
    descriptionEn: 'Implemented department-based Row Level Security for vehicle loans. Restricted users now see only vehicle loans from their assigned departments, while maintaining additional loan status filtering. This provides granular access control for vehicle financing management.',
    descriptionAr: 'تم تطبيق أمان مستوى الصف على أساس القسم لقروض المركبات. المستخدمون المقيدون الآن يرون فقط قروض المركبات من أقسامهم المعينة، مع الحفاظ على تصفية حالة القروض الإضافية. يوفر هذا تحكماً دقيقاً في الوصول لإدارة تمويل المركبات.',
    changes: {
      en: [
        '🔐 Implemented department-based RLS on vehicle_loans table',
        '✅ Ahmed (manager): Restricted to Frozen department only (9 vehicles max)',
        '❌ Ahmed cannot see 16 vehicles from 8 other departments',
        '👑 Admin users: See all 25 vehicles from all 9 departments (bypass restrictions)',
        '⚡ Two-layer filtering: RLS (department) → Application (loan status)',
        '📊 Frozen dept breakdown: Hassan (1), Jebreel (1), Mada (4), Madinah (2), Osaimi (2), Qurban (2), Team Babu (3), Waleed (1)',
        '🔧 Dropped permissive RLS policies, created restrictive policy',
        '🛡️ Security enforced at database level - cannot be bypassed',
        '✨ No code changes needed - filtering transparent to frontend',
        '💾 Backward compatible: NULL department permissions = see all',
        '📋 Migration: restrict_ahmed_vehicle_loans_frozen'
      ],
      ar: [
        '🔐 تطبيق RLS على أساس القسم في جدول vehicle_loans',
        '✅ أحمد (مدير): مقيد لقسم الثلاجة فقط (9 مركبات كحد أقصى)',
        '❌ أحمد لا يمكنه رؤية 16 مركبة من 8 أقسام أخرى',
        '👑 المستخدمون الإداريون: يرون جميع 25 مركبة من جميع الأقسام التسعة (تجاوز القيود)',
        '⚡ تصفية من طبقتين: RLS (القسم) ← التطبيق (حالة القرض)',
        '📊 تقسيم الأقسام: حسن (1)، جبريل (1)، مدى (4)، المدينة (2)، العصيمي (2)، قربان (2)، فريق بابو (3)، وليد (1)',
        '🔧 إزالة سياسات RLS المتساهلة، إنشاء سياسة تقييدية',
        '🛡️ الأمان مطبق على مستوى قاعدة البيانات - لا يمكن تجاوزه',
        '✨ لا حاجة لتغييرات في الكود - التصفية شفافة للواجهة الأمامية',
        '💾 متوافق مع الإصدارات السابقة: أذونات القسم NULL = رؤية الكل',
        '📋 الترحيل: restrict_ahmed_vehicle_loans_frozen'
      ]
    }
  },
  {
    id: '25',
    date: '2025-10-14',
    version: '2.0.3',
    category: 'bugfix',
    titleEn: 'Fixed Dashboard KPIs Profit Calculation - Removed Incorrect VAT Division',
    titleAr: 'إصلاح حساب الربح في مؤشرات لوحة التحكم - إزالة قسمة ضريبة القيمة المضافة غير الصحيحة',
    descriptionEn: 'Resolved critical profit calculation error in Overview tab where KPIs were dividing sale prices by 1.15, incorrectly assuming VAT was included. Since total_bcy is already pre-VAT, this was under-reporting profit by ~13%. KPI profit now matches Profit Analysis table with 99.8% accuracy.',
    descriptionAr: 'تم حل خطأ حساب الربح الحرج في صفحة النظرة العامة حيث كانت مؤشرات الأداء تقسم أسعار البيع على 1.15، بافتراض خاطئ أن ضريبة القيمة المضافة مضمنة. بما أن total_bcy بالفعل قبل الضريبة، كان هذا يقلل من الربح المبلغ عنه بنسبة ~13%. ربح مؤشرات الأداء الآن يطابق جدول تحليل الربح بدقة 99.8%.',
    changes: {
      en: [
        '🐛 Fixed gross profit under-reporting by ~13% (SAR 22.70 per SAR 174 transaction)',
        '💰 Removed incorrect VAT division: total_bcy is already pre-VAT, not VAT-inclusive',
        '✅ KPI gross profit: SAR 77,433.68 vs Analysis table: SAR 77,273.68 (0.21% difference)',
        '🔧 Changed calculation from: (sale_price / 1.15) - cost',
        '🔧 To correct formula: sale_price - cost',
        '📊 Total Taxable Sales now: SAR 287,229.96 (pre-VAT, correct)',
        '📊 Total Revenue now: SAR 330,314.45 (with 15% VAT added)',
        '⚡ Gross Profit Margin now accurate: 26.96%',
        '✨ No frontend changes needed - pure database calculation fix',
        '🛡️ Maintains all existing RLS security and location filtering',
        '📋 Migration: fix_kpi_profit_calculation_vat_division'
      ],
      ar: [
        '🐛 إصلاح نقص الإبلاغ عن إجمالي الربح بنسبة ~13% (22.70 ريال لكل معاملة 174 ريال)',
        '💰 إزالة قسمة ضريبة القيمة المضافة غير الصحيحة: total_bcy بالفعل قبل الضريبة، وليست شاملة الضريبة',
        '✅ إجمالي ربح مؤشرات الأداء: 77,433.68 ريال مقابل جدول التحليل: 77,273.68 ريال (فرق 0.21%)',
        '🔧 تغيير الحساب من: (سعر البيع / 1.15) - التكلفة',
        '🔧 إلى الصيغة الصحيحة: سعر البيع - التكلفة',
        '📊 إجمالي المبيعات الخاضعة للضريبة الآن: 287,229.96 ريال (قبل الضريبة، صحيح)',
        '📊 إجمالي الإيرادات الآن: 330,314.45 ريال (مع إضافة ضريبة 15%)',
        '⚡ هامش الربح الإجمالي الآن دقيق: 26.96%',
        '✨ لا حاجة لتغييرات الواجهة الأمامية - إصلاح حساب قاعدة بيانات نقي',
        '🛡️ يحافظ على جميع أمان RLS الحالي وتصفية الموقع',
        '📋 الترحيل: fix_kpi_profit_calculation_vat_division'
      ]
    }
  },
  {
    id: '24',
    date: '2025-10-14',
    version: '2.0.2',
    category: 'bugfix',
    titleEn: 'Fixed Dashboard KPIs GINV and Opening Balance Filter',
    titleAr: 'إصلاح تصفية GINV والرصيد الافتتاحي في مؤشرات لوحة التحكم',
    descriptionEn: 'Resolved critical issue where Overview tab KPIs were showing inflated numbers by including 179 non-operational invoices (GINV auto-generated and Opening Balance entries). KPIs now correctly show only actual business transactions, matching the profit analysis view.',
    descriptionAr: 'تم حل مشكلة حرجة حيث كانت مؤشرات صفحة النظرة العامة تعرض أرقاماً مضخمة بسبب تضمين 179 فاتورة غير تشغيلية (GINV المولدة تلقائياً وإدخالات الرصيد الافتتاحي). تعرض مؤشرات الأداء الآن فقط المعاملات التجارية الفعلية بشكل صحيح، بما يتطابق مع عرض تحليل الربح.',
    changes: {
      en: [
        '🐛 Fixed Dashboard KPIs showing 318 invoices instead of 166 (52% error)',
        '💰 Revenue corrected: SAR 464,947 → SAR 287,230 (SAR 177K difference)',
        '🔍 Excluded 151 GINV invoices (auto-generated system invoices)',
        '🔍 Excluded 28 Opening Balance invoices (non-operational entries)',
        '✅ KPIs now match profit_analysis_view_current exactly',
        '📊 Applied filters to 6 CTEs: invoice_costs, vat_output, vat_credit, vat_input',
        '🔧 Added consistent NOT ILIKE filters for GINV% and Opening%',
        '⚡ All date filters (current month, previous month, all time, custom) now work correctly',
        '✨ No frontend changes needed - pure database calculation fix',
        '📋 Migration: fix_kpi_ginv_opening_filter'
      ],
      ar: [
        '🐛 إصلاح مؤشرات لوحة التحكم التي كانت تعرض 318 فاتورة بدلاً من 166 (خطأ 52%)',
        '💰 تصحيح الإيرادات: 464,947 ريال → 287,230 ريال (فرق 177 ألف ريال)',
        '🔍 استبعاد 151 فاتورة GINV (فواتير نظام مولدة تلقائياً)',
        '🔍 استبعاد 28 فاتورة رصيد افتتاحي (إدخالات غير تشغيلية)',
        '✅ مؤشرات الأداء الآن تطابق profit_analysis_view_current تماماً',
        '📊 تطبيق الفلاتر على 6 CTEs: invoice_costs، vat_output، vat_credit، vat_input',
        '🔧 إضافة فلاتر NOT ILIKE متسقة لـ GINV% وOpening%',
        '⚡ جميع فلاتر التاريخ (الشهر الحالي، الشهر السابق، كل الوقت، مخصص) تعمل الآن بشكل صحيح',
        '✨ لا حاجة لتغييرات الواجهة الأمامية - إصلاح حساب قاعدة بيانات نقي',
        '📋 الترحيل: fix_kpi_ginv_opening_filter'
      ]
    }
  },
  {
    id: '23',
    date: '2025-10-14',
    version: '2.0.1',
    category: 'bugfix',
    titleEn: 'Restored Location Filter in Overview Tab with Two-Layer Security',
    titleAr: 'استعادة تصفية الفروع في صفحة النظرة العامة مع أمان من طبقتين',
    descriptionEn: 'Fixed location filter that stopped working after RLS security fix. Implemented two-layer filtering: RLS enforces security (cannot be bypassed), location filter provides convenience (users can narrow down their view within permitted data).',
    descriptionAr: 'تم إصلاح تصفية الفروع التي توقفت عن العمل بعد إصلاح أمان RLS. تم تنفيذ تصفية من طبقتين: RLS يفرض الأمان (لا يمكن تجاوزه)، تصفية الفروع توفر الراحة (يمكن للمستخدمين تضييق نطاق عرضهم ضمن البيانات المسموح بها).',
    changes: {
      en: [
        '🐛 Fixed location filter broken by previous RLS security fix',
        '🔐 Layer 1 (Security): RLS policies enforce user permissions - CANNOT be bypassed',
        '✅ Layer 2 (Convenience): location_ids parameter allows filtering within RLS-allowed data',
        '👑 Admins can now filter to specific branches (was showing all 6 branches)',
        '👤 Restricted users can filter within their allowed branches (Ahmed can select from his 4 branches)',
        '🛡️ Security guarantee: RLS runs FIRST at database level, then location filter applied',
        '⚠️ Impossible to access unauthorized branches via location filter parameter',
        '📊 All 6 CTEs updated: invoice_costs, expense_metrics, stock_metrics, vat_output, vat_credit, vat_input',
        '✨ No frontend changes needed - location filter UI already works correctly',
        '⚡ No performance impact - maintains existing optimization',
        '📋 Migration: restore_overview_location_filter_with_rls'
      ],
      ar: [
        '🐛 إصلاح تصفية الفروع المعطلة بسبب إصلاح أمان RLS السابق',
        '🔐 الطبقة 1 (الأمان): سياسات RLS تفرض أذونات المستخدم - لا يمكن تجاوزها',
        '✅ الطبقة 2 (الراحة): معامل location_ids يسمح بالتصفية ضمن البيانات المسموح بها من RLS',
        '👑 المسؤولون يمكنهم الآن التصفية إلى فروع محددة (كان يعرض جميع الفروع الستة)',
        '👤 المستخدمون المقيدون يمكنهم التصفية ضمن فروعهم المسموح بها (أحمد يمكنه الاختيار من فروعه الأربعة)',
        '🛡️ ضمان الأمان: RLS يعمل أولاً على مستوى قاعدة البيانات، ثم يتم تطبيق تصفية الفروع',
        '⚠️ من المستحيل الوصول إلى فروع غير مصرح بها عبر معامل تصفية الفروع',
        '📊 تحديث جميع CTEs الستة: invoice_costs، expense_metrics، stock_metrics، vat_output، vat_credit، vat_input',
        '✨ لا حاجة لتغييرات الواجهة الأمامية - واجهة تصفية الفروع تعمل بشكل صحيح بالفعل',
        '⚡ لا يوجد تأثير على الأداء - يحافظ على التحسين الحالي',
        '📋 الترحيل: restore_overview_location_filter_with_rls'
      ]
    }
  },
  {
    id: '22',
    date: '2025-10-14',
    version: '2.0.0',
    category: 'bugfix',
    titleEn: 'CRITICAL: Fixed Overview Tab RLS Security Vulnerability (2-PART FIX)',
    titleAr: 'حرج: إصلاح ثغرة أمان RLS في صفحة النظرة العامة (إصلاح من جزأين)',
    descriptionEn: 'Resolved critical security issue where restricted users could see data from ALL branches in Overview tab. This required a 2-part fix: (1) Removed application-level filtering to trust RLS policies, (2) Fixed RLS helper functions that were running as postgres superuser, causing auth.uid() to return NULL and breaking all user identification.',
    descriptionAr: 'تم حل مشكلة أمنية حرجة حيث كان المستخدمون المقيدون يرون بيانات من جميع الفروع في صفحة النظرة العامة. تطلب هذا إصلاحاً من جزأين: (1) إزالة التصفية على مستوى التطبيق للثقة في سياسات RLS، (2) إصلاح دوال مساعد RLS التي كانت تعمل كمستخدم postgres خارق، مما تسبب في إرجاع auth.uid() قيمة NULL وكسر جميع تعريف المستخدم.',
    changes: {
      en: [
        '🔴 PART 1: Removed application-level location filtering from get_dashboard_kpis_2025_optimized()',
        '✅ Removed location_ids filtering from 6 CTEs (invoice_costs, expense_metrics, stock_metrics, vat_output, vat_credit, vat_input)',
        '⚠️ Migration 1 applied but DID NOT fix the issue - RLS helper functions were still broken',
        '📋 Migration 1: fix_overview_rls_security_vulnerability.sql',
        '',
        '🔴 PART 2 (THE ACTUAL FIX): Changed RLS helper functions from SECURITY DEFINER → SECURITY INVOKER',
        '🔧 Fixed is_admin_user() - now runs with caller permissions instead of postgres',
        '🔧 Fixed is_branch_allowed() - now runs with caller permissions',
        '🔧 Fixed get_user_branches() - now runs with caller permissions',
        '⚡ auth.uid() now returns actual user ID instead of NULL',
        '🛡️ RLS policies can now properly identify and filter by current user',
        '✅ Ahmed (restricted user) NOW sees ONLY 262 invoices (~299K SAR) from allowed branches',
        '❌ Ahmed can NO LONGER see 56 restricted invoices (~205K SAR) from Khaleel + Osaimi',
        '👑 Admin users still see all 318 invoices (~505K SAR) from all 6 branches',
        '📋 Migration 2: fix_rls_helper_functions_security_invoker.sql',
        '',
        '🔍 ROOT CAUSE: SECURITY DEFINER functions run as owner (postgres superuser)',
        '💡 When running as postgres, auth.uid() returns NULL (no auth context)',
        '⚠️ RLS policies check WHERE user_id = auth.uid() - always fails when NULL',
        '✨ SECURITY INVOKER functions run with caller context - auth.uid() works correctly',
        '🎯 Both migrations required - Migration 1 alone did not fix the issue'
      ],
      ar: [
        '🔴 الجزء 1: إزالة تصفية الموقع على مستوى التطبيق من get_dashboard_kpis_2025_optimized()',
        '✅ إزالة تصفية location_ids من 6 CTEs (invoice_costs، expense_metrics، stock_metrics، vat_output، vat_credit، vat_input)',
        '⚠️ تم تطبيق الترحيل 1 ولكن لم يُصلح المشكلة - دوال مساعد RLS كانت لا تزال معطلة',
        '📋 الترحيل 1: fix_overview_rls_security_vulnerability.sql',
        '',
        '🔴 الجزء 2 (الإصلاح الفعلي): تغيير دوال مساعد RLS من SECURITY DEFINER → SECURITY INVOKER',
        '🔧 إصلاح is_admin_user() - الآن يعمل بأذونات المتصل بدلاً من postgres',
        '🔧 إصلاح is_branch_allowed() - الآن يعمل بأذونات المتصل',
        '🔧 إصلاح get_user_branches() - الآن يعمل بأذونات المتصل',
        '⚡ auth.uid() الآن يُرجع معرف المستخدم الفعلي بدلاً من NULL',
        '🛡️ سياسات RLS الآن يمكنها تحديد وتصفية المستخدم الحالي بشكل صحيح',
        '✅ أحمد (مستخدم مقيد) الآن يرى فقط 262 فاتورة (~299 ألف ريال) من الفروع المسموح بها',
        '❌ أحمد لم يعد يستطيع رؤية 56 فاتورة مقيدة (~205 ألف ريال) من الخليل + العصيمي',
        '👑 المستخدمون الإداريون لا يزالون يرون جميع 318 فاتورة (~505 ألف ريال) من جميع الفروع الستة',
        '📋 الترحيل 2: fix_rls_helper_functions_security_invoker.sql',
        '',
        '🔍 السبب الجذري: دوال SECURITY DEFINER تعمل كمالك (postgres مستخدم خارق)',
        '💡 عند العمل كـ postgres، auth.uid() يُرجع NULL (لا يوجد سياق مصادقة)',
        '⚠️ سياسات RLS تتحقق من WHERE user_id = auth.uid() - دائماً تفشل عندما NULL',
        '✨ دوال SECURITY INVOKER تعمل مع سياق المتصل - auth.uid() يعمل بشكل صحيح',
        '🎯 كلا الترحيلين مطلوبان - الترحيل 1 وحده لم يُصلح المشكلة'
      ]
    }
  },
  {
    id: '21',
    date: '2025-10-13',
    version: '1.9.3',
    category: 'improvement',
    titleEn: 'Filtered GINV and Opening Balance Invoices from Profit Analysis',
    titleAr: 'تصفية فواتير GINV والرصيد الافتتاحي من تحليل الربح',
    descriptionEn: 'Improved profit analysis accuracy by excluding GINV invoices and opening balance entries, which are non-operational transactions. This provides cleaner reporting focused on actual business operations.',
    descriptionAr: 'تحسين دقة تحليل الربح باستبعاد فواتير GINV وإدخالات الرصيد الافتتاحي، وهي معاملات غير تشغيلية. يوفر هذا تقارير أنظف تركز على العمليات التجارية الفعلية.',
    changes: {
      en: [
        '🔍 Excluded 106 GINV invoices (SAR 149,662) from profit analysis',
        '🔍 Excluded 2 Opening Balance entries (SAR 1,330) from profit analysis',
        '📊 Profit analysis now shows 583 operational transactions (SAR 244,289.82)',
        '✅ Cleaner data focused on actual business operations',
        '🎯 More accurate profit margins without non-operational entries',
        '📈 Dependent views (profit_totals_view, profit_by_branch_view) auto-updated',
        '⚡ No performance impact - pure filtering improvement',
        '🗄️ Database views updated with NOT ILIKE filters',
        '📋 Migration: filter_ginv_opening_invoices'
      ],
      ar: [
        '🔍 استبعاد 106 فاتورة GINV (149,662 ريال) من تحليل الربح',
        '🔍 استبعاد 2 إدخال رصيد افتتاحي (1,330 ريال) من تحليل الربح',
        '📊 تحليل الربح الآن يعرض 583 معاملة تشغيلية (244,289.82 ريال)',
        '✅ بيانات أنظف تركز على العمليات التجارية الفعلية',
        '🎯 هوامش ربح أكثر دقة بدون إدخالات غير تشغيلية',
        '📈 العروض التابعة (profit_totals_view، profit_by_branch_view) محدثة تلقائياً',
        '⚡ لا يوجد تأثير على الأداء - تحسين تصفية نقي',
        '🗄️ تحديث عروض قاعدة البيانات مع فلاتر NOT ILIKE',
        '📋 الترحيل: filter_ginv_opening_invoices'
      ]
    }
  },
  {
    id: '20',
    date: '2025-10-13',
    version: '1.9.2',
    category: 'improvement',
    titleEn: 'Restored Loan Filter Rules for Restricted Users',
    titleAr: 'استعادة قواعد تصفية القروض للمستخدمين المقيدين',
    descriptionEn: 'Restored loan filtering capability for restricted users (Ahmed Kutty). Instead of hiding the entire loans page, users now see filtered loan data showing only overdue loans and loans expiring within 30 days.',
    descriptionAr: 'تمت استعادة قدرة تصفية القروض للمستخدمين المقيدين (أحمد كوتي). بدلاً من إخفاء صفحة القروض بالكامل، يرى المستخدمون الآن بيانات القروض المصفاة التي تظهر فقط القروض المتأخرة والقروض التي تنتهي خلال 30 يوماً.',
    changes: {
      en: [
        '🔄 Restored loan_filter_rules for Ahmed Kutty',
        '✅ Show overdue loans (past maturity date)',
        '✅ Show loans expiring within 30 days',
        '❌ Hide fully paid loans (status = \'closed\')',
        '❌ Hide active loans with > 30 days remaining',
        '🔐 Admin users bypass filtering and see all loans',
        '⚡ Data filtering approach instead of page hiding',
        '🗄️ No code changes needed - filtering logic already implemented',
        '📋 Migration: restore_ahmed_loan_filter_rules'
      ],
      ar: [
        '🔄 استعادة loan_filter_rules لأحمد كوتي',
        '✅ إظهار القروض المتأخرة (بعد تاريخ الاستحقاق)',
        '✅ إظهار القروض المنتهية خلال 30 يوماً',
        '❌ إخفاء القروض المدفوعة بالكامل (الحالة = \'مغلق\')',
        '❌ إخفاء القروض النشطة مع أكثر من 30 يوماً متبقية',
        '🔐 المستخدمون الإداريون يتجاوزون التصفية ويرون جميع القروض',
        '⚡ نهج تصفية البيانات بدلاً من إخفاء الصفحة',
        '🗄️ لا حاجة لتغييرات في الكود - منطق التصفية مطبق بالفعل',
        '📋 الترحيل: restore_ahmed_loan_filter_rules'
      ]
    }
  },
  {
    id: '19',
    date: '2025-10-13',
    version: '1.9.1',
    category: 'bugfix',
    titleEn: 'Fixed Overview Page VAT Calculation - Invoice-Level VAT (V2)',
    titleAr: 'إصلاح حساب ضريبة القيمة المضافة في صفحة النظرة العامة - ضريبة مستوى الفاتورة (الإصدار 2)',
    descriptionEn: 'Resolved critical issue where Overview page Net VAT Payable was displaying SAR 20,789 instead of SAR 8,098. The bug had two parts: (V1) missing "M" suffix handling and Opening Balance exclusion, (V2) architectural issue calculating VAT from line items (356 records) instead of invoices (125 records). Dashboard KPIs now match VAT Return perfectly.',
    descriptionAr: 'تم حل مشكلة حرجة حيث كانت صافي ضريبة القيمة المضافة المستحقة في صفحة النظرة العامة تعرض 20,789 ريال بدلاً من 8,098 ريال. كان للخطأ جزءان: (الإصدار 1) عدم معالجة لاحقة "M" واستبعاد الرصيد الافتتاحي، (الإصدار 2) مشكلة معمارية في حساب الضريبة من بنود الفاتورة (356 سجل) بدلاً من الفواتير (125 سجل). مؤشرات لوحة التحكم الآن تطابق إرجاع ضريبة القيمة المضافة تماماً.',
    changes: {
      en: [
        '🐛 Fixed Dashboard KPIs VAT calculation (156% error → 0% error)',
        '🏗️ V2 Fix: Changed from line-item level (356 records) to invoice level (125 records)',
        '💰 V1 Fix: Added "M" (millions) suffix handling to all VAT calculations',
        '✅ V1 Fix: Opening Balance bills (8 total) now properly excluded',
        '🔧 Applied 3-tier parsing: M (×1,000,000) → K (×1,000) → default',
        '✨ Added credit notes VAT deduction (previously missing)',
        '⚡ October 2025: Dashboard KPIs = VAT Return = SAR 8,098.48 (perfect match)',
        '📊 Output VAT now: 14,156.61 SAR (was incorrectly 26,847.54 SAR)',
        '🗄️ get_dashboard_kpis_2025() now uses invoices table like get_vat_return()',
        '🛡️ No breaking changes - pure calculation fix',
        '📋 Migration: fix_dashboard_kpis_vat_calculation_v2'
      ],
      ar: [
        '🐛 إصلاح حساب ضريبة القيمة المضافة في مؤشرات لوحة التحكم (خطأ 156% → 0%)',
        '🏗️ إصلاح الإصدار 2: تغيير من مستوى بند الفاتورة (356 سجل) إلى مستوى الفاتورة (125 سجل)',
        '💰 إصلاح الإصدار 1: إضافة معالجة لاحقة "M" (الملايين) لجميع حسابات ضريبة القيمة المضافة',
        '✅ إصلاح الإصدار 1: فواتير الرصيد الافتتاحي (8 إجمالي) الآن مستبعدة بشكل صحيح',
        '🔧 تطبيق تحليل ثلاثي المستويات: M (×1,000,000) → K (×1,000) → افتراضي',
        '✨ إضافة خصم ضريبة القيمة المضافة للإشعارات الدائنة (مفقود سابقاً)',
        '⚡ أكتوبر 2025: مؤشرات لوحة التحكم = إرجاع ضريبة القيمة المضافة = 8,098.48 ريال (تطابق تام)',
        '📊 ضريبة المخرجات الآن: 14,156.61 ريال (كانت خطأً 26,847.54 ريال)',
        '🗄️ get_dashboard_kpis_2025() الآن تستخدم جدول الفواتير مثل get_vat_return()',
        '🛡️ لا توجد تغييرات كاسرة - إصلاح حساب نقي',
        '📋 الترحيل: fix_dashboard_kpis_vat_calculation_v2'
      ]
    }
  },
  {
    id: '18',
    date: '2025-10-13',
    version: '1.9.0',
    category: 'bugfix',
    titleEn: 'Fixed VAT Return Calculation - Millions Suffix & Opening Balance',
    titleAr: 'إصلاح حساب إرجاع ضريبة القيمة المضافة - لاحقة الملايين والرصيد الافتتاحي',
    descriptionEn: 'Resolved critical issue where Net VAT Refundable was displaying SAR 53,242,210.45 instead of the correct SAR 8,098.48. The calculation error was caused by two bugs: missing "M" (millions) suffix handling and Opening Balance bills not being properly excluded from VAT calculations.',
    descriptionAr: 'تم حل مشكلة حرجة حيث كان صافي ضريبة القيمة المضافة القابلة للاسترداد يعرض 53,242,210.45 ريال بدلاً من القيمة الصحيحة 8,098.48 ريال. كان خطأ الحساب ناتجاً عن خطأين: عدم معالجة لاحقة "M" (الملايين) وعدم استبعاد فواتير الرصيد الافتتاحي بشكل صحيح من حسابات ضريبة القيمة المضافة.',
    changes: {
      en: [
        '🐛 Fixed massive VAT calculation error (53M → 8K SAR)',
        '💰 Opening Balance bill "SAR 1.08M" now parsed correctly as 1,080,000 instead of 1.08',
        '🔧 Added "M" (millions) suffix handling to all VAT calculations',
        '✅ Opening Balance bills (8 total) now properly excluded from VAT',
        '📊 October 2025 Net VAT Payable now shows correct SAR 8,098.48',
        '🗄️ Updated get_vat_return() function for invoices, credit notes, and bills',
        '🛡️ Applied fix to both single-branch and multi-branch function overloads',
        '⚡ No performance impact - pure calculation fix',
        '📋 Migration: fix_vat_return_millions_suffix_and_opening_balance'
      ],
      ar: [
        '🐛 إصلاح خطأ حساب ضريبة القيمة المضافة الضخم (53 مليون → 8 آلاف ريال)',
        '💰 فاتورة الرصيد الافتتاحي "SAR 1.08M" الآن تُحلل بشكل صحيح كـ 1,080,000 بدلاً من 1.08',
        '🔧 إضافة معالجة لاحقة "M" (الملايين) لجميع حسابات ضريبة القيمة المضافة',
        '✅ فواتير الرصيد الافتتاحي (8 إجمالي) الآن مستبعدة بشكل صحيح من ضريبة القيمة المضافة',
        '📊 صافي ضريبة القيمة المضافة المستحقة لأكتوبر 2025 الآن يعرض القيمة الصحيحة 8,098.48 ريال',
        '🗄️ تحديث دالة get_vat_return() للفواتير وإشعارات الائتمان والفواتير',
        '🛡️ تطبيق الإصلاح على كل من إصدارات الدالة لفرع واحد وفروع متعددة',
        '⚡ لا يوجد تأثير على الأداء - إصلاح حساب نقي',
        '📋 الترحيل: fix_vat_return_millions_suffix_and_opening_balance'
      ]
    }
  },
  {
    id: '17',
    date: '2025-10-13',
    version: '1.8.0',
    category: 'bugfix',
    titleEn: 'Fixed Stock Report Access Control',
    titleAr: 'إصلاح التحكم في الوصول لتقرير المخزون',
    descriptionEn: 'Resolved critical issue where stock report was showing zero/empty data for all users due to missing Row Level Security permissions. Assigned warehouse permissions to 7 users with role-based access levels (admin, manager, viewer).',
    descriptionAr: 'تم حل مشكلة حرجة حيث كان تقرير المخزون يعرض بيانات صفرية/فارغة لجميع المستخدمين بسبب أذونات أمان مستوى الصف المفقودة. تم تعيين أذونات المستودعات لـ 7 مستخدمين مع مستويات وصول حسب الأدوار (مدير، مسؤول، مشاهد).',
    changes: {
      en: [
        '🔐 Assigned warehouse permissions to 7 users with role-based access',
        '✅ Admin users (4): Full access to all 9 warehouses (SAR 1.36M stock value)',
        '✅ Manager (Ahmed): 6 warehouses (excluded Osaimi & Khaleel)',
        '✅ Viewer (Osaimi): 2 Osaimi warehouses only (most restricted)',
        '✅ Viewer (Noushad): 5 warehouses (like Ahmed but also excluded JTB)',
        '🛡️ RLS enforcement at database level - server-side filtering',
        '📊 Stock report now displays 319 records for authorized users',
        '⚡ No performance impact - queries remain ~100-200ms',
        '🔧 Fixed user_id linking to auth.users table for RLS helpers',
        '📋 Created detailed analysis report: STOCK_REPORT_ANALYSIS.md'
      ],
      ar: [
        '🔐 تعيين أذونات المستودعات لـ 7 مستخدمين مع وصول حسب الأدوار',
        '✅ مستخدمو الإدارة (4): وصول كامل لجميع المستودعات التسعة (قيمة مخزون 1.36 مليون ريال)',
        '✅ المسؤول (أحمد): 6 مستودعات (مستثنى العصيمي والخليل)',
        '✅ المشاهد (العصيمي): مستودعان للعصيمي فقط (الأكثر تقييداً)',
        '✅ المشاهد (نوشاد): 5 مستودعات (مثل أحمد لكن أيضاً مستثنى JTB)',
        '🛡️ تطبيق RLS على مستوى قاعدة البيانات - تصفية من جانب الخادم',
        '📊 تقرير المخزون الآن يعرض 319 سجلاً للمستخدمين المصرح لهم',
        '⚡ لا يوجد تأثير على الأداء - الاستعلامات تبقى ~100-200 مللي ثانية',
        '🔧 إصلاح ربط user_id بجدول auth.users لمساعدي RLS',
        '📋 إنشاء تقرير تحليل مفصل: STOCK_REPORT_ANALYSIS.md'
      ]
    }
  },
  {
    id: '16',
    date: '2025-10-13',
    version: '1.7.1',
    category: 'bugfix',
    titleEn: 'Fixed Stock Report SQL Error',
    titleAr: 'إصلاح خطأ SQL في تقرير المخزون',
    descriptionEn: 'Resolved database error preventing stock report from loading. The function was referencing non-existent columns in the zoho_stock_summary view, causing console errors and failed data loads.',
    descriptionAr: 'تم حل خطأ قاعدة البيانات الذي كان يمنع تحميل تقرير المخزون. كانت الدالة تشير إلى أعمدة غير موجودة في عرض zoho_stock_summary، مما تسبب في أخطاء وحدة التحكم وفشل تحميل البيانات.',
    changes: {
      en: [
        '🐛 Fixed "column zss.Stock on hand does not exist" SQL error',
        '🔧 Updated get_stock_report_filtered function with correct column mappings',
        '📊 Changed "Stock on hand" → "Stock Qty" to match view schema',
        '✅ Stock report now loads successfully with 285 items',
        '💰 Added calculated purchase price field (stock value ÷ quantity)',
        '🗄️ Applied migration: fix_stock_report_filtered_column_names',
        '⚡ No frontend changes required - database-level fix'
      ],
      ar: [
        '🐛 إصلاح خطأ SQL "column zss.Stock on hand does not exist"',
        '🔧 تحديث دالة get_stock_report_filtered بتعيينات الأعمدة الصحيحة',
        '📊 تغيير "Stock on hand" → "Stock Qty" لمطابقة مخطط العرض',
        '✅ تقرير المخزون الآن يحمل بنجاح مع 285 عنصراً',
        '💰 إضافة حقل سعر الشراء المحسوب (قيمة المخزون ÷ الكمية)',
        '🗄️ تطبيق الترحيل: fix_stock_report_filtered_column_names',
        '⚡ لا حاجة لتغييرات الواجهة الأمامية - إصلاح على مستوى قاعدة البيانات'
      ]
    }
  },
  {
    id: '15',
    date: '2025-10-13',
    version: '1.7.0',
    category: 'improvement',
    titleEn: 'Database Performance Optimization - Strategic Indexes',
    titleAr: 'تحسين أداء قاعدة البيانات - فهارس استراتيجية',
    descriptionEn: 'Eliminated database query timeouts by adding 17 strategic indexes to critical tables. Single-location queries now complete 60-75% faster with zero timeouts. Location filtering, status checks, and foreign key joins now execute at optimal speed.',
    descriptionAr: 'تم القضاء على مهلة استعلامات قاعدة البيانات عن طريق إضافة 17 فهرساً استراتيجياً للجداول الحرجة. استعلامات الموقع الواحد الآن تكتمل بنسبة 60-75% أسرع بدون مهلات. تصفية الموقع، فحوصات الحالة، وربط المفاتيح الأجنبية الآن تعمل بسرعة مثالية.',
    changes: {
      en: [
        '🗄️ Added 17 strategic indexes across 6 critical tables',
        '⚡ Invoices: location_id, status, invoice_number indexes (80-90% faster)',
        '⚡ Bills: location_id, status, bill_number indexes (80-90% faster)',
        '⚡ Credit Notes: location_id, status indexes (80-90% faster)',
        '⚡ Invoice Items: invoice_id, item_id foreign key indexes (90-95% faster)',
        '⚡ Stock Flow: location_id index for stock value calculations',
        '⚡ Branch: location_name, location_id indexes for filter conversions',
        '✅ Composite indexes (location + date) for optimal range queries',
        '✅ Partial indexes for non-void records (space-efficient)',
        '🚀 Single-location queries now complete without timeouts',
        '📊 Dashboard KPIs load 3-5x faster',
        '🔍 Location filter switching now instant',
        '⚠️ Multi-location queries (2+ branches) may still timeout - Phase 2 optimization needed',
        '🛡️ Zero breaking changes - pure backend optimization',
        '📈 Query planner now uses indexes efficiently (verified with EXPLAIN ANALYZE)'
      ],
      ar: [
        '🗄️ إضافة 17 فهرساً استراتيجياً عبر 6 جداول حرجة',
        '⚡ الفواتير: فهارس location_id، الحالة، رقم الفاتورة (80-90% أسرع)',
        '⚡ الفواتير: فهارس location_id، الحالة، رقم الفاتورة (80-90% أسرع)',
        '⚡ إشعارات الائتمان: فهارس location_id، الحالة (80-90% أسرع)',
        '⚡ بنود الفاتورة: فهارس المفاتيح الأجنبية invoice_id، item_id (90-95% أسرع)',
        '⚡ تدفق المخزون: فهرس location_id لحسابات قيمة المخزون',
        '⚡ الفروع: فهارس location_name، location_id لتحويلات التصفية',
        '✅ فهارس مركبة (الموقع + التاريخ) لاستعلامات النطاق المثلى',
        '✅ فهارس جزئية للسجلات غير الملغاة (فعالة من حيث المساحة)',
        '🚀 استعلامات الموقع الواحد الآن تكتمل بدون مهلات',
        '📊 مؤشرات الأداء في لوحة التحكم تحمل أسرع 3-5 مرات',
        '🔍 تبديل تصفية الموقع الآن فوري',
        '⚠️ استعلامات المواقع المتعددة (فرعين أو أكثر) قد تتجاوز المهلة - يحتاج تحسين المرحلة 2',
        '🛡️ صفر تغييرات كسر - تحسين الواجهة الخلفية البحتة',
        '📈 مخطط الاستعلام الآن يستخدم الفهارس بكفاءة (تم التحقق باستخدام EXPLAIN ANALYZE)'
      ]
    }
  },
  {
    id: '14',
    date: '2025-10-13',
    version: '1.6.0',
    category: 'improvement',
    titleEn: 'Optimized Location Filter Performance',
    titleAr: 'تحسين أداء تصفية الموقع',
    descriptionEn: 'Dramatically improved responsiveness when switching between location filters on Overview page. Reduced interaction delay from 589ms to under 200ms with intelligent debouncing and request cancellation.',
    descriptionAr: 'تحسين كبير في الاستجابة عند التبديل بين تصفيات المواقع في صفحة النظرة العامة. تم تقليل تأخير التفاعل من 589 مللي ثانية إلى أقل من 200 مللي ثانية باستخدام التأخير الذكي وإلغاء الطلبات.',
    changes: {
      en: [
        '⚡ Reduced INP (Interaction to Next Paint) from 589ms to <200ms',
        '🎯 Added 300ms debouncing to prevent rapid-fire filter changes',
        '🚫 Implemented AbortController to cancel in-flight requests',
        '♻️ Eliminated redundant database queries when rapidly clicking filters',
        '✨ Smoother UI experience with instant visual feedback',
        '📊 KPI updates now load efficiently even with multiple locations',
        '🔧 Optimized invoice table queries with intelligent request management',
        '🌐 Improved overall app responsiveness across all pages'
      ],
      ar: [
        '⚡ تقليل INP (التفاعل للطلاء التالي) من 589 مللي ثانية إلى <200 مللي ثانية',
        '🎯 إضافة تأخير 300 مللي ثانية لمنع تغييرات التصفية السريعة',
        '🚫 تنفيذ AbortController لإلغاء الطلبات الجارية',
        '♻️ إزالة استعلامات قاعدة البيانات الزائدة عند النقر السريع على التصفيات',
        '✨ تجربة واجهة مستخدم أكثر سلاسة مع ردود فعل بصرية فورية',
        '📊 تحديثات مؤشرات الأداء تحمل الآن بكفاءة حتى مع مواقع متعددة',
        '🔧 تحسين استعلامات جدول الفواتير مع إدارة الطلبات الذكية',
        '🌐 تحسين الاستجابة الإجمالية للتطبيق عبر جميع الصفحات'
      ]
    }
  },
  {
    id: '13',
    date: '2025-10-12',
    version: '1.5.4',
    category: 'bugfix',
    titleEn: 'Fixed Last 7 Days Performance Multi-Location Filter',
    titleAr: 'إصلاح تصفية المواقع المتعددة لأداء آخر 7 أيام',
    descriptionEn: 'Resolved issue where selecting 2+ locations would show ALL data instead of only the selected locations in the Last 7 Days Performance summary.',
    descriptionAr: 'تم حل مشكلة حيث كان اختيار موقعين أو أكثر يعرض جميع البيانات بدلاً من المواقع المحددة فقط في ملخص أداء آخر 7 أيام.',
    changes: {
      en: [
        '🐛 Fixed multi-location filtering for Last 7 Days Performance',
        '🔧 Updated database function to accept array of branch names',
        '✅ Now correctly filters when 2+ locations selected',
        '📊 Shows combined data from selected locations only',
        '⚡ Single location, multiple locations, and all locations now work correctly',
        '🗄️ Database function parameter changed from text to text[]'
      ],
      ar: [
        '🐛 إصلاح تصفية المواقع المتعددة لأداء آخر 7 أيام',
        '🔧 تحديث دالة قاعدة البيانات لقبول مصفوفة من أسماء الفروع',
        '✅ الآن يصفي بشكل صحيح عند اختيار موقعين أو أكثر',
        '📊 يعرض البيانات المجمعة من المواقع المحددة فقط',
        '⚡ موقع واحد، مواقع متعددة، وجميع المواقع تعمل الآن بشكل صحيح',
        '🗄️ معامل دالة قاعدة البيانات تغير من text إلى text[]'
      ]
    }
  },
  {
    id: '12',
    date: '2025-10-12',
    version: '1.5.3',
    category: 'bugfix',
    titleEn: 'Fixed Overview Page KPI Access Control',
    titleAr: 'إصلاح التحكم في الوصول لمؤشرات أداء صفحة النظرة العامة',
    descriptionEn: 'Resolved critical security issue where Overview page KPIs (Total Sales, Gross Profit, Net Profit, etc.) were showing all location data for restricted users. RLS enforcement now applied to all profit and expense views.',
    descriptionAr: 'تم حل مشكلة أمنية حرجة حيث كانت مؤشرات الأداء في صفحة النظرة العامة (إجمالي المبيعات، إجمالي الربح، صافي الربح، إلخ) تعرض جميع بيانات المواقع للمستخدمين المقيدين. يتم الآن تطبيق تنفيذ RLS على جميع عروض الربح والمصروفات.',
    changes: {
      en: [
        '🔐 Implemented RLS on profit_analysis_view_current',
        '🔐 Implemented RLS on expense_details_view',
        '🔐 Implemented RLS on profit_totals_view',
        '🔐 Implemented RLS on profit_by_branch_view',
        '✅ Overview page Total Sales now filtered by user permissions',
        '✅ Gross Profit and Net Profit KPIs now respect branch access',
        '✅ Expense totals now filtered to allowed branches only',
        '🛡️ All 4 views now execute with user context (security_invoker = true)',
        '📊 Restricted users see only their assigned branch data in Overview',
        '⚡ No performance impact - views remain optimized'
      ],
      ar: [
        '🔐 تنفيذ RLS على profit_analysis_view_current',
        '🔐 تنفيذ RLS على expense_details_view',
        '🔐 تنفيذ RLS على profit_totals_view',
        '🔐 تنفيذ RLS على profit_by_branch_view',
        '✅ إجمالي المبيعات في صفحة النظرة العامة الآن مصفى حسب أذونات المستخدم',
        '✅ مؤشرات إجمالي الربح وصافي الربح الآن تحترم وصول الفروع',
        '✅ إجماليات المصروفات الآن مصفاة للفروع المسموح بها فقط',
        '🛡️ جميع العروض الأربعة الآن تنفذ مع سياق المستخدم (security_invoker = true)',
        '📊 المستخدمون المقيدون يرون فقط بيانات فروعهم المعينة في النظرة العامة',
        '⚡ لا يوجد تأثير على الأداء - العروض تظل محسّنة'
      ]
    }
  },
  {
    id: '11',
    date: '2025-10-12',
    version: '1.5.2',
    category: 'bugfix',
    titleEn: 'Fixed KPI Data Access Control',
    titleAr: 'إصلاح التحكم في الوصول لبيانات مؤشرات الأداء',
    descriptionEn: 'Resolved critical security issue where restricted users could see all location transactions in KPI views instead of only their allowed branches. RLS policies now properly enforced at database level.',
    descriptionAr: 'تم حل مشكلة أمنية حرجة حيث كان المستخدمون المقيدون يرون جميع معاملات المواقع في عروض مؤشرات الأداء بدلاً من فروعهم المسموح بها فقط. يتم الآن تطبيق سياسات RLS بشكل صحيح على مستوى قاعدة البيانات.',
    changes: {
      en: [
        '🔐 Implemented RLS (security_invoker = true) for all KPI views',
        '✅ vendor_bills_filtered now respects user branch permissions',
        '✅ customer_balance_aging_filtered now respects user permissions',
        '✅ top_overdue_customers now respects user permissions',
        '✅ branch_performance_comparison now respects user permissions',
        '🛡️ Security enforcement moved from application to database layer',
        '⚡ No performance impact - views remain optimized',
        '📊 Restricted users now see only their assigned branches in KPIs',
        '🔒 All dashboard KPIs (vendor, customer, financial) now properly filtered'
      ],
      ar: [
        '🔐 تنفيذ RLS (security_invoker = true) لجميع عروض مؤشرات الأداء',
        '✅ vendor_bills_filtered الآن يحترم أذونات فروع المستخدم',
        '✅ customer_balance_aging_filtered الآن يحترم أذونات المستخدم',
        '✅ top_overdue_customers الآن يحترم أذونات المستخدم',
        '✅ branch_performance_comparison الآن يحترم أذونات المستخدم',
        '🛡️ تم نقل تطبيق الأمان من طبقة التطبيق إلى طبقة قاعدة البيانات',
        '⚡ لا يوجد تأثير على الأداء - العروض تظل محسّنة',
        '📊 المستخدمون المقيدون يرون الآن فروعهم المعينة فقط في مؤشرات الأداء',
        '🔒 جميع مؤشرات الأداء في لوحة التحكم (البائع، العميل، المالي) يتم تصفيتها بشكل صحيح الآن'
      ]
    }
  },
  {
    id: '10',
    date: '2025-10-12',
    version: '1.5.1',
    category: 'bugfix',
    titleEn: 'Fixed VAT Return Multi-Branch Filtering',
    titleAr: 'إصلاح تصفية الفروع المتعددة في إقرار ضريبة القيمة المضافة',
    descriptionEn: 'Resolved issue where selecting multiple branches on VAT Return page would only show data from the first selected branch instead of all selected branches.',
    descriptionAr: 'تم حل مشكلة حيث كان اختيار عدة فروع في صفحة إقرار ضريبة القيمة المضافة يعرض البيانات من الفرع الأول المحدد فقط بدلاً من جميع الفروع المحددة.',
    changes: {
      en: [
        '🐛 Fixed multi-branch selection on VAT Return page',
        '✅ All selected branches now included in calculations',
        '📊 VAT summary and tables now show combined data from all selected branches',
        '🔧 Updated database function call to support branch array parameter',
        '⚡ No performance impact - database already optimized for multiple branches'
      ],
      ar: [
        '🐛 إصلاح اختيار الفروع المتعددة في صفحة إقرار ضريبة القيمة المضافة',
        '✅ جميع الفروع المحددة الآن مدرجة في الحسابات',
        '📊 ملخص ضريبة القيمة المضافة والجداول تعرض الآن البيانات المجمعة من جميع الفروع المحددة',
        '🔧 تحديث استدعاء دالة قاعدة البيانات لدعم معامل مصفوفة الفروع',
        '⚡ لا يوجد تأثير على الأداء - قاعدة البيانات محسّنة بالفعل للفروع المتعددة'
      ]
    }
  },
  {
    id: '9',
    date: '2025-10-12',
    version: '1.5.0',
    category: 'feature',
    titleEn: 'Customer Owner Filtering System',
    titleAr: 'نظام تصفية مالك العميل',
    descriptionEn: 'Added comprehensive customer owner filtering capability to the Customers page. Users can now filter all customer aging data, KPIs, and reports by specific customer owners with persistent selections.',
    descriptionAr: 'تمت إضافة إمكانية تصفية شاملة لمالك العميل إلى صفحة العملاء. يمكن للمستخدمين الآن تصفية جميع بيانات تقادم العملاء ومؤشرات الأداء والتقارير حسب مالكي عملاء محددين مع اختيارات ثابتة.',
    changes: {
      en: [
        '👥 New Customer Owner filter with multi-select dropdown',
        '🔍 Search functionality to quickly find specific owners',
        '💾 Persistent filter selections stored in localStorage',
        '📊 All components respond to filter: KPI cards, aging tables, charts',
        '🔐 RLS-aware: Restricted users see only their assigned owners',
        '⚡ Optimized queries for better performance',
        '🌐 Full bilingual support (English/Arabic)',
        '✨ Visual feedback showing active filter count',
        '📱 Responsive design for mobile and desktop'
      ],
      ar: [
        '👥 مرشح مالك العميل الجديد مع قائمة منسدلة متعددة الاختيار',
        '🔍 وظيفة البحث للعثور بسرعة على المالكين المحددين',
        '💾 اختيارات التصفية الثابتة المخزنة في localStorage',
        '📊 جميع المكونات تستجيب للمرشح: بطاقات KPI، جداول التقادم، الرسوم البيانية',
        '🔐 مدرك لـ RLS: المستخدمون المقيدون يرون فقط المالكين المعينين لهم',
        '⚡ استعلامات محسّنة لأداء أفضل',
        '🌐 دعم كامل ثنائي اللغة (الإنجليزية/العربية)',
        '✨ ردود فعل بصرية تعرض عدد المرشحات النشطة',
        '📱 تصميم متجاوب للهاتف المحمول وسطح المكتب'
      ]
    }
  },
  {
    id: '8',
    date: '2025-10-12',
    version: '1.4.2',
    category: 'bugfix',
    titleEn: 'Fixed Last 7 Days Performance Table Alignment',
    titleAr: 'إصلاح محاذاة جدول أداء آخر 7 أيام',
    descriptionEn: 'Resolved alignment issues in the Last 7 Days Performance table where all columns were appearing left-aligned instead of centered. All 7 columns now display with proper center alignment for improved readability.',
    descriptionAr: 'تم حل مشاكل المحاذاة في جدول أداء آخر 7 أيام حيث كانت جميع الأعمدة تظهر محاذية لليسار بدلاً من المنتصف. جميع الأعمدة السبعة تعرض الآن بمحاذاة مركزية مناسبة لتحسين القراءة.',
    changes: {
      en: [
        '🎨 Fixed column alignment - all 7 columns now properly centered',
        '🔧 Applied inline CSS styles to override conflicting alignment rules',
        '✅ Equal column widths maintained (14.28% each for 7 columns)',
        '📱 Consistent alignment across both header and data rows',
        '🌐 Alignment fix works correctly in both English and Arabic'
      ],
      ar: [
        '🎨 إصلاح محاذاة الأعمدة - جميع الأعمدة السبعة الآن في المنتصف بشكل صحيح',
        '🔧 تطبيق أنماط CSS مباشرة لتجاوز قواعد المحاذاة المتعارضة',
        '✅ الحفاظ على عرض متساوٍ للأعمدة (14.28% لكل عمود من 7 أعمدة)',
        '📱 محاذاة متسقة عبر صفوف الرأس والبيانات',
        '🌐 إصلاح المحاذاة يعمل بشكل صحيح في كل من الإنجليزية والعربية'
      ]
    }
  },
  {
    id: '7',
    date: '2025-10-12',
    version: '1.4.1',
    category: 'improvement',
    titleEn: 'Enhanced Last 7 Days Performance Table',
    titleAr: 'تحسين جدول أداء آخر 7 أيام',
    descriptionEn: 'Updated the Last 7 Days Performance table to show 7 detailed columns including Cost of Goods Sold and Net Profit, providing complete financial visibility.',
    descriptionAr: 'تم تحديث جدول أداء آخر 7 أيام لإظهار 7 أعمدة تفصيلية بما في ذلك تكلفة البضاعة المباعة وصافي الربح، مما يوفر رؤية مالية كاملة.',
    changes: {
      en: [
        '📊 Added Cost of Goods Sold column showing actual product costs',
        '💰 Added Net Profit column (Gross Profit - Expenses)',
        '📈 Reordered columns for better financial flow: Total Sales → Taxable Sales → COGS → Gross Profit → GP% → Expenses → Net Profit',
        '✨ Enhanced data accuracy with proper expense tracking',
        '🔧 Fixed database function to use correct expense view columns',
        '🌐 Full bilingual support maintained (English/Arabic)',
        '✅ All 7 columns respond to location filter as expected'
      ],
      ar: [
        '📊 إضافة عمود تكلفة البضاعة المباعة يعرض التكاليف الفعلية للمنتجات',
        '💰 إضافة عمود صافي الربح (إجمالي الربح - المصروفات)',
        '📈 إعادة ترتيب الأعمدة لتدفق مالي أفضل: إجمالي المبيعات → المبيعات الخاضعة للضريبة → تكلفة البضاعة → إجمالي الربح → نسبة الربح → المصروفات → صافي الربح',
        '✨ تحسين دقة البيانات مع تتبع المصروفات بشكل صحيح',
        '🔧 إصلاح دالة قاعدة البيانات لاستخدام أعمدة عرض المصروفات الصحيحة',
        '🌐 الحفاظ على الدعم الكامل ثنائي اللغة (الإنجليزية/العربية)',
        '✅ جميع الأعمدة السبعة تستجيب لتصفية الموقع كما هو متوقع'
      ]
    }
  },
  {
    id: '6',
    date: '2025-10-12',
    version: '1.4.0',
    category: 'feature',
    titleEn: 'User Access Management - Noushad Permissions',
    titleAr: 'إدارة وصول المستخدم - أذونات نوشاد',
    descriptionEn: 'Configured restricted access permissions for Noushad with selective branch access. Noushad can now access 3 branches with full customer, vehicle, and loan management capabilities.',
    descriptionAr: 'تم تكوين أذونات الوصول المقيد لنوشاد مع وصول انتقائي للفروع. يمكن لنوشاد الآن الوصول إلى 3 فروع مع قدرات كاملة لإدارة العملاء والمركبات والقروض.',
    changes: {
      en: [
        '🔐 Added Noushad user permissions (noushadm.online@gmail.com)',
        '🏢 Branch Access: 3 branches (Frozen, Nashad-Frozen, Nisam-Frozen)',
        '🚫 JTB 5936 branch restricted (key difference from Ahmed Kutty)',
        '👥 Customer Owners: 4 owners (Nashad: 13, Nisam: 7, Frozen Counter: 1, Unassigned: 2)',
        '🚗 Vehicle Departments: Frozen department only (9 vehicles)',
        '💰 Loan Filtering: Overdue loans + loans expiring within 30 days',
        '🌐 Preferred Language: English',
        '✅ All permissions enforced via RLS at database level'
      ],
      ar: [
        '🔐 إضافة أذونات مستخدم نوشاد (noushadm.online@gmail.com)',
        '🏢 الوصول للفروع: 3 فروع (الثلاجة، نشاد-الثلاجة، نسام-الثلاجة)',
        '🚫 فرع JTB 5936 مقيد (الفرق الرئيسي عن أحمد كوتي)',
        '👥 أصحاب العملاء: 4 أصحاب (نشاد: 13، نسام: 7، عداد المجمدات: 1، غير معين: 2)',
        '🚗 أقسام المركبات: قسم الثلاجة فقط (9 مركبات)',
        '💰 تصفية القروض: القروض المتأخرة + القروض التي تنتهي خلال 30 يوماً',
        '🌐 اللغة المفضلة: الإنجليزية',
        '✅ جميع الأذونات مطبقة عبر RLS على مستوى قاعدة البيانات'
      ]
    }
  },
  {
    id: '5',
    date: '2025-10-12',
    version: '1.3.0',
    category: 'feature',
    titleEn: 'Last 7 Days Performance Summary',
    titleAr: 'ملخص أداء آخر 7 أيام',
    descriptionEn: 'Added a new summary table showing key performance metrics for the last 7 days. This table provides quick insights into recent sales, expenses, and profitability trends.',
    descriptionAr: 'تمت إضافة جدول ملخص جديد يعرض مقاييس الأداء الرئيسية للأيام السبعة الماضية. يوفر هذا الجدول رؤى سريعة حول المبيعات والمصروفات واتجاهات الربحية الأخيرة.',
    changes: {
      en: [
        '📊 New summary table positioned above detailed analysis tables',
        '💰 Shows Total Sales, Taxable Sales, Expenses, Gross Profit, and GP%',
        '📅 Always displays last 7 calendar days from today',
        '🏢 Responds to branch/location filter (master filter)',
        '🚫 Does NOT respond to date range picker - fixed 7-day window',
        '⚡ Real-time calculation with optimized database function',
        '🌐 Bilingual support with RTL layout for Arabic',
        '✅ RLS policies enforced for user permissions'
      ],
      ar: [
        '📊 جدول ملخص جديد موضوع فوق جداول التحليل التفصيلي',
        '💰 يعرض إجمالي المبيعات، المبيعات الخاضعة للضريبة، المصروفات، إجمالي الربح، ونسبة الربح الإجمالي',
        '📅 يعرض دائماً آخر 7 أيام تقويمية من اليوم',
        '🏢 يستجيب لتصفية الفرع/الموقع (التصفية الرئيسية)',
        '🚫 لا يستجيب لمحدد نطاق التاريخ - نافذة ثابتة 7 أيام',
        '⚡ حساب في الوقت الفعلي مع دالة قاعدة بيانات محسّنة',
        '🌐 دعم ثنائي اللغة مع تخطيط RTL للعربية',
        '✅ تطبيق سياسات RLS لأذونات المستخدم'
      ]
    }
  },
  {
    id: '4',
    date: '2025-10-12',
    version: '1.2.1',
    category: 'improvement',
    titleEn: 'Accurate Vendor Payables - Opening Stock Excluded',
    titleAr: 'حسابات دقيقة للموردين - استبعاد المخزون الافتتاحي',
    descriptionEn: 'Fixed vendor payables calculation by excluding "Opening Stock" vendor, which represents initial inventory value rather than actual liabilities. This provides a more accurate financial position.',
    descriptionAr: 'تم إصلاح حساب مستحقات الموردين باستبعاد مورد "المخزون الافتتاحي" الذي يمثل قيمة المخزون الأولي وليس التزامات فعلية. يوفر هذا وضعاً مالياً أكثر دقة.',
    changes: {
      en: [
        '💰 Excluded "Opening Stock" vendor from vendor payables (SAR 1,009,309 reduction)',
        '📊 More accurate Total Liabilities on Balance Sheet',
        '✅ Net Worth now reflects true financial position',
        '🔒 RLS policies still apply - users see only their allowed branches',
        '🗄️ Database view updated with security_invoker maintained',
        '📈 Improved financial reporting accuracy'
      ],
      ar: [
        '💰 استبعاد مورد "المخزون الافتتاحي" من مستحقات الموردين (تخفيض 1,009,309 ريال)',
        '📊 إجمالي الالتزامات أكثر دقة في الميزانية العمومية',
        '✅ صافي القيمة يعكس الآن الوضع المالي الحقيقي',
        '🔒 سياسات RLS لا تزال سارية - يرى المستخدمون فروعهم المسموح بها فقط',
        '🗄️ تحديث عرض قاعدة البيانات مع الحفاظ على security_invoker',
        '📈 تحسين دقة التقارير المالية'
      ]
    }
  },
  {
    id: '3',
    date: '2025-10-12',
    version: '1.2.0',
    category: 'improvement',
    titleEn: 'Automated What\'s New Updates',
    titleAr: 'تحديثات تلقائية لصفحة ما الجديد',
    descriptionEn: 'Implemented comprehensive documentation protocol to ensure all features, bug fixes, and improvements are automatically tracked and communicated to users.',
    descriptionAr: 'تم تنفيذ بروتوكول توثيق شامل لضمان تتبع وإبلاغ جميع الميزات والإصلاحات والتحسينات للمستخدمين تلقائياً.',
    changes: {
      en: [
        '📋 Added comprehensive What\'s New update protocol to CLAUDE.md',
        '✅ Defined clear triggers for when to create updates',
        '🌐 Included bilingual (English/Arabic) guidelines',
        '📝 Created structured templates for consistency',
        '🎯 Established priority levels for different update types',
        '✨ Provided emoji guidelines for visual clarity'
      ],
      ar: [
        '📋 إضافة بروتوكول شامل لتحديثات ما الجديد إلى CLAUDE.md',
        '✅ تحديد المحفزات الواضحة لإنشاء التحديثات',
        '🌐 تضمين إرشادات ثنائية اللغة (الإنجليزية/العربية)',
        '📝 إنشاء قوالب منظمة للاتساق',
        '🎯 إنشاء مستويات أولوية لأنواع التحديثات المختلفة',
        '✨ توفير إرشادات الرموز التعبيرية للوضوح البصري'
      ]
    }
  },
  {
    id: '2',
    date: '2025-10-09',
    version: '1.1.0',
    category: 'improvement',
    titleEn: 'VAT Return Month Filter Enhancement',
    titleAr: 'تحسين تصفية شهر إرجاع ضريبة القيمة المضافة',
    descriptionEn: 'Improved VAT Return filtering with a streamlined month-only selector that displays only months with actual transactions.',
    descriptionAr: 'تم تحسين تصفية إرجاع ضريبة القيمة المضافة باستخدام محدد شهري مبسط يعرض فقط الأشهر التي تحتوي على معاملات فعلية.',
    changes: {
      en: [
        '📅 Replaced date range picker with simplified month selector',
        '🎯 Shows only current year (2025) months with transactions',
        '📊 Displays transaction count for each available month',
        '⚡ Auto-selects current month by default',
        '🔍 Improved user experience with fewer filter options',
        '✨ Faster filtering with optimized database queries'
      ],
      ar: [
        '📅 استبدال محدد نطاق التاريخ بمحدد شهري مبسط',
        '🎯 يعرض فقط أشهر السنة الحالية (2025) التي تحتوي على معاملات',
        '📊 يعرض عدد المعاملات لكل شهر متاح',
        '⚡ يختار الشهر الحالي تلقائياً بشكل افتراضي',
        '🔍 تجربة مستخدم محسّنة مع خيارات تصفية أقل',
        '✨ تصفية أسرع مع استعلامات قاعدة بيانات محسّنة'
      ]
    }
  },
  {
    id: '1',
    date: '2025-10-09',
    version: '1.0.0',
    category: 'feature',
    titleEn: 'Initial Release - Sweets Dashboard',
    titleAr: 'الإصدار الأولي - لوحة تحكم الحلويات',
    descriptionEn: 'Welcome to Ghadeer Al Sharq Trading EST dashboard! This initial release includes comprehensive financial analytics and management tools.',
    descriptionAr: 'مرحباً بك في لوحة تحكم مؤسسة غدير الشرق التجارية! يتضمن هذا الإصدار الأولي تحليلات مالية وأدوات إدارة شاملة.',
    changes: {
      en: [
        '🔐 Authentication system with role-based access control',
        '📊 Real-time dashboard with KPIs and analytics',
        '💰 Profit analysis by item, customer, and invoice',
        '📈 Customer aging reports with risk categorization',
        '🏢 Vendor management and payment tracking',
        '💳 Expense tracking across branches',
        '📑 Financial reports (Profit & Loss, Balance Sheet)',
        '🏪 Multi-branch support with filtering',
        '🌐 Bilingual support (English/Arabic)',
        '🎨 Dark mode and responsive design',
        '📱 Progressive Web App (PWA) support',
        '⚡ Database-optimized views for performance',
        '🔄 Auto-refresh and real-time data updates',
        '📥 Export functionality for reports and tables'
      ],
      ar: [
        '🔐 نظام مصادقة مع التحكم في الوصول حسب الأدوار',
        '📊 لوحة تحكم في الوقت الفعلي مع مؤشرات الأداء والتحليلات',
        '💰 تحليل الربح حسب الصنف والعميل والفاتورة',
        '📈 تقارير تقادم العملاء مع تصنيف المخاطر',
        '🏢 إدارة الموردين وتتبع المدفوعات',
        '💳 تتبع المصروفات عبر الفروع',
        '📑 التقارير المالية (الربح والخسارة، الميزانية العمومية)',
        '🏪 دعم متعدد الفروع مع التصفية',
        '🌐 دعم ثنائي اللغة (الإنجليزية/العربية)',
        '🎨 الوضع الداكن والتصميم المتجاوب',
        '📱 دعم تطبيق الويب التقدمي (PWA)',
        '⚡ عروض محسّنة لقاعدة البيانات للأداء',
        '🔄 التحديث التلقائي وتحديثات البيانات في الوقت الفعلي',
        '📥 وظيفة التصدير للتقارير والجداول'
      ]
    }
  }
]
