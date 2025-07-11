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

/**
 * セッションに写真があるかどうかを確認する
 * @param sessionId - セッションID
 * @returns 写真の有無
 */
export async function hasSessionPhotos(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('session_photos')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1)

    if (error) {
      console.error('Check session photos error:', error)
      return false
    }

    return data.length > 0
  } catch (error) {
    console.error('Check session photos error:', error)
    return false
  }
}

/**
 * 複数セッションの写真有無を一括確認する
 * @param sessionIds - セッションIDの配列
 * @returns セッションIDと写真有無のマップ
 */
export async function checkMultipleSessionPhotos(sessionIds: string[]): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('session_photos')
      .select('session_id')
      .in('session_id', sessionIds)

    if (error) {
      console.error('Check multiple session photos error:', error)
      return sessionIds.reduce((acc, id) => ({ ...acc, [id]: false }), {})
    }

    // 写真があるセッションIDのセットを作成
    const sessionsWithPhotos = new Set(data.map(photo => photo.session_id))
    
    // 結果マップを作成
    return sessionIds.reduce((acc, id) => ({
      ...acc,
      [id]: sessionsWithPhotos.has(id)
    }), {})
  } catch (error) {
    console.error('Check multiple session photos error:', error)
    return sessionIds.reduce((acc, id) => ({ ...acc, [id]: false }), {})
  }
}

/**
 * 画像をプリロードする
 * @param url - 画像URL
 * @returns プリロード完了のPromise
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`))
    img.src = url
  })
}

/**
 * 複数の画像を並列でプリロードする
 * @param urls - 画像URLの配列
 * @returns 全画像のプリロード完了のPromise
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(url => preloadImage(url)))
  } catch (error) {
    console.error('Failed to preload some images:', error)
    // 一部の画像が失敗してもエラーを投げない
  }
}

/**
 * 画像がプリロード済みかどうかを確認する
 * @param url - 画像URL
 * @returns プリロード済みかどうか
 */
export function isImagePreloaded(url: string): boolean {
  try {
    const img = new Image()
    img.src = url
    return img.complete && img.naturalWidth > 0
  } catch {
    return false
  }
}

/**
 * 複数の画像がプリロード済みかどうかを確認する
 * @param urls - 画像URLの配列
 * @returns プリロード済み状態のマップ
 */
export function checkPreloadedImages(urls: string[]): Record<string, boolean> {
  return urls.reduce((acc, url) => {
    acc[url] = isImagePreloaded(url)
    return acc
  }, {} as Record<string, boolean>)
}

/**
 * セッションの写真を取得してプリロードする（改良版）
 * @param sessionId - セッションID
 * @returns 写真の配列、プリロード完了のPromise、プリロード済み状態
 */
export async function getSessionPhotosWithPreload(sessionId: string): Promise<{
  photos: UploadedPhoto[]
  preloadPromise: Promise<void>
  preloadedStates: Record<string, boolean>
}> {
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

    const photos = data.map(photo => ({
      id: photo.id,
      url: photo.public_url,
      fileName: photo.file_name,
      fileSize: photo.file_size,
      uploadedAt: photo.uploaded_at
    }))

    // 画像URLを抽出
    const imageUrls = photos.map(photo => photo.url)
    
    // プリロード済み状態を確認
    const preloadedStates = checkPreloadedImages(imageUrls)
    
    // まだプリロードされていない画像のみプリロード
    const unpreloadedUrls = imageUrls.filter(url => !preloadedStates[url])
    const preloadPromise = unpreloadedUrls.length > 0 ? preloadImages(unpreloadedUrls) : Promise.resolve()

    return { photos, preloadPromise, preloadedStates }
  } catch (error) {
    console.error('Get session photos error:', error)
    throw error
  }
} 