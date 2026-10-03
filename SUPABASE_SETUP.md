# Supabase — مركز صخيبرة للفضاء 2026

إذا سبق لك تنفيذ كود Supabase الذي أرسلناه للموقع، فلا تعيدي إنشاء الجداول.

الموقع يستخدم:
- جدول `space_participants`
- جدول `space_gallery`
- Storage bucket باسم `space-participations`

## ملاحظة مهمة
النسخة الجديدة تقرأ جميع المشاركات من `space_participants` لعرضها في:
- Dashboard
- معرض رواد صخيبرة للفضاء

وتستخدم `space_gallery` + `space-participations` لمعرض الصور.

إذا كان رفع الصور لا يعمل، تأكدي أن الـBucket عام Public وأن سياسة INSERT للـanon موجودة.
