-- ユーザーが作成したStorageオブジェクトを削除する関数
-- この関数をSupabaseのSQL Editorで実行してください

create or replace function public.handle_delete_user_created_objects()
returns boolean as $$
begin
    delete from storage.objects where owner = auth.uid();
    return true;
end;
$$ language plpgsql security definer;

-- 関数の実行権限を認証ユーザーに付与
grant execute on function public.handle_delete_user_created_objects() to authenticated; 