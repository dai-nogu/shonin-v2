import { supabase } from './supabase'

export interface UploadedPhoto {
  id: string
  url: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

/**
 * 写真をSupabaseストレージにアップロードする
 * @param file - アップロードするファイル
 * @param sessionId - セッションID
 * @returns アップロード結果
 */
export async function uploadPhoto(file: File, sessionId: string): Promise<UploadedPhoto> {
  try {
    // ファイル名を一意にする
    const fileExt = file.name.split('.').pop()
    const fileName = `${sessionId}_${Date.now()}.${fileExt}`
    const filePath = `session-photos/${fileName}`

    // Supabaseストレージにアップロード
    const { data, error } = await supabase.storage
      .from('session-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`写真のアップロードに失敗しました: ${error.message}`)
    }

    // パブリックURLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('session-photos')
      .getPublicUrl(filePath)

    // データベースに写真情報を保存
    const photoData = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      public_url: publicUrl,
      uploaded_at: new Date().toISOString()
    }

    const { data: dbData, error: dbError } = await supabase
      .from('session_photos')
      .insert(photoData)
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // ストレージからファイルを削除
      await supabase.storage
        .from('session-photos')
        .remove([filePath])
      throw new Error(`写真情報の保存に失敗しました: ${dbError.message}`)
    }

    return {
      id: photoData.id,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: photoData.uploaded_at
    }
  } catch (error) {
    console.error('Photo upload error:', error)
    throw error
  }
}

/**
 * 複数の写真を一括でアップロードする
 * @param files - アップロードするファイルの配列
 * @param sessionId - セッションID
 * @returns アップロード結果の配列
 */
export async function uploadPhotos(files: File[], sessionId: string): Promise<UploadedPhoto[]> {
  const uploadPromises = files.map(file => uploadPhoto(file, sessionId))
  return Promise.all(uploadPromises)
}

/**
 * セッションの写真を取得する
 * @param sessionId - セッションID
 * @returns 写真の配列
 */
export async function getSessionPhotos(sessionId: string): Promise<UploadedPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('session_photos')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: true })

    if (error) {
      console.error('Get session photos error:', error)
      throw new Error(`写真の取得に失敗しました: ${error.message}`)
    }

    return data.map(photo => ({
      id: photo.id,
      url: photo.public_url,
      fileName: photo.file_name,
      fileSize: photo.file_size,
      uploadedAt: photo.uploaded_at
    }))
  } catch (error) {
    console.error('Get session photos error:', error)
    throw error
  }
} 