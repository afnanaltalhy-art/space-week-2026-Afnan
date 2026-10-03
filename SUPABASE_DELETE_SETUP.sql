-- تشغيله مرة واحدة في Supabase SQL Editor
-- يسمح للموقع بحذف سجلات المعرض والصور. ملاحظة: anon delete ليس حماية إدارية قوية.
-- للحماية الحقيقية يلزم Supabase Auth للمشرفة.

drop policy if exists "gallery_delete" on public.space_gallery;
create policy "gallery_delete"
on public.space_gallery
for delete
to anon
using (true);

grant delete on public.space_gallery to anon;

drop policy if exists "space_images_delete" on storage.objects;
create policy "space_images_delete"
on storage.objects
for delete
to anon
using (bucket_id = 'space-participations');
