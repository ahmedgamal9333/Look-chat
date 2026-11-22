# LookChat

تطبيق Android للدردشة واكتشاف الأشخاص القريبين بموافقتهم. المشروع مبني باستخدام Expo SDK 58 وReact Native، ويستخدم Supabase للمصادقة والبيانات.

## إعداد التشغيل

1. انسخ `.env.example` إلى `.env`.
2. ضع مفتاح Supabase Publishable/anon في `EXPO_PUBLIC_SUPABASE_ANON_KEY` (لا تستخدم service_role مطلقًا).
3. نفّذ `npm install` ثم `npx expo install --fix`.
4. نفّذ `npx expo start`.

## بناء APK

عند رفع التغييرات إلى `main`، يبدأ GitHub Actions ببناء APK تجريبي، ويمكن تنزيله من صفحة Actions بعد نجاح التشغيل.

## الخصوصية

الموقع اختياري، ولا يعرض التطبيق إحداثيات المستخدمين لبعضهم. يعرض فقط المسافة التقريبية للمستخدمين الذين فعّلوا الظهور.

> لا تضع أي مفاتيح سرية أو ملف `.env` في المستودع العام.
