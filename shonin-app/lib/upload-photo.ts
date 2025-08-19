import { createClient } from '@/lib/supabase'

export interface UploadedPhoto {
  id: string
  url: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

/**
 * 写真をSupabaseストレージにアップロードしてsession_mediaテーブルに保存する
 * @param file - アップロードするファイル
 * @param sessionId - セッションID
 * @param userId - ユーザーID（セキュリティのため）
 * @returns アップロード結果
 */
export async function uploadPhoto(file: File, sessionId: string, userId: string): Promise<UploadedPhoto> {
  const supabase = createClient()
  
  try {
    // 認証状態を確認
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('認証エラー:', authError)
      throw new Error('認証に失敗しました。ログインし直してください。')
    }

    if (!authData?.user) {
      throw new Error('ユーザーが認証されていません。ログインしてください。')
    }

    if (authData.user.id !== userId) {
      console.error('ユーザーID不一致:', { 
        authUserId: authData.user.id, 
        providedUserId: userId 
      })
      throw new Error('認証されたユーザーIDと提供されたユーザーIDが一致しません。')
    }

    // セッションの所有者確認
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, id')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      console.error('セッション確認エラー:', sessionError)
      throw new Error('セッション情報の確認に失敗しました。')
    }

    if (!sessionData || sessionData.user_id !== userId) {
      console.error('セッション所有者不一致:', { 
        sessionUserId: sessionData?.user_id, 
        providedUserId: userId 
      })
      throw new Error('指定されたセッションにアクセスする権限がありません。')
    }

    // 入力値の検証
    if (!file || !sessionId || !userId) {
      throw new Error('必要なパラメータが不足しています')
    }

    // ファイルサイズの検証（10MB制限）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズが大きすぎます（10MB以下にしてください）')
    }

    // ファイル形式の検証
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('サポートされていないファイル形式です（JPEG、PNG、WebPのみ対応）')
    }

    // ファイル名を一意にする
    const fileExt = file.name.split('.').pop()
    const fileName = `${sessionId}_${Date.now()}.${fileExt}`
    const filePath = `${userId}/session-media/${fileName}`

    // Supabaseストレージにアップロード
    const { data, error } = await supabase.storage
      .from('session-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`ストレージへのアップロードに失敗しました: ${error.message}`)
    }

    // パブリックURLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('session-media')
      .getPublicUrl(filePath)

    // session_mediaテーブルに写真情報を保存
    const mediaData = {
      session_id: sessionId,
      media_type: 'image' as const,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      public_url: publicUrl,
      is_main_image: false,
      caption: null
    }

    const { data: dbData, error: dbError } = await supabase
      .from('session_media')
      .insert(mediaData)
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      console.error('Insert data was:', mediaData)
      console.error('Error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // ストレージからファイルを削除（クリーンアップ）
      try {
        await supabase.storage
          .from('session-media')
          .remove([filePath])
      } catch (cleanupError) {
        console.error('クリーンアップエラー:', cleanupError)
      }
      
      // より詳細なエラーメッセージ
      if (dbError.code === '42501') {
        throw new Error('権限エラー: データベースへの保存権限がありません。ログイン直してください。')
      } else if (dbError.code === '23503') {
        throw new Error('セッションが見つかりません。有効なセッションを選択してください。')
      } else {
        throw new Error(`写真情報の保存に失敗しました: ${dbError.message}`)
      }
    }

    return {
      id: dbData.id,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: dbData.created_at
    }
  } catch (error) {
    console.error('Photo upload error:', error)
    
    // エラーの種類に応じてユーザーフレンドリーなメッセージを返す
    if (error instanceof Error) {
      throw error // 既に適切なメッセージが設定されている
    } else {
      throw new Error('写真のアップロードに失敗しました。しばらく時間をおいて再試行してください。')
    }
  }
}

/**
 * 複数の写真を一括でアップロードする
 * @param files - アップロードするファイルの配列
 * @param sessionId - セッションID
 * @param userId - ユーザーID（セキュリティのため）
 * @returns アップロード結果の配列
 */
export async function uploadPhotos(files: File[], sessionId: string, userId: string): Promise<UploadedPhoto[]> {
  const uploadPromises = files.map(file => uploadPhoto(file, sessionId, userId))
  return Promise.all(uploadPromises)
}

/**
 * セッションの写真をsession_mediaテーブルから取得する
 * @param sessionId - セッションID
 * @returns 写真の配列
 */
export async function getSessionPhotos(sessionId: string): Promise<UploadedPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('session_media')
      .select('*')
      .eq('session_id', sessionId)
      .eq('media_type', 'image')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Get session photos error:', error)
      throw new Error(`写真の取得に失敗しました: ${error.message}`)
    }

    return data.map(media => ({
      id: media.id,
      url: media.public_url || '', // public_urlがnullの場合は空文字列
      fileName: media.file_name,
      fileSize: media.file_size || 0,
      uploadedAt: media.created_at
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
      .from('session_media')
      .select('id')
      .eq('session_id', sessionId)
      .eq('media_type', 'image')
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
export async function hasSessionPhotosMultiple(sessionIds: string[]): Promise<Record<string, boolean>> {
  if (sessionIds.length === 0) {
    return {}
  }

  try {
    const { data, error } = await supabase
      .from('session_media')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('media_type', 'image')

    if (error) {
      console.error('Check multiple session photos error:', error)
      return sessionIds.reduce((acc, id) => ({ ...acc, [id]: false }), {})
    }

    // セッションIDごとに写真の有無をマッピング
    const sessionsWithPhotos = new Set(data.map(item => item.session_id))
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
 * 画像のプリロード用ヘルパー関数
 * @param urls - プリロードする画像URLの配列
 * @returns プリロード完了のPromise
 */
export function preloadImages(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    return Promise.resolve()
  }

  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`)
        resolve() // エラーでも続行
      }
      img.src = url
    })
  })

  return Promise.all(promises).then(() => {})
}

/**
 * プリロード済み画像の状態をチェックする
 * @param urls - チェックする画像URLの配列
 * @returns URLごとのプリロード状態のマップ
 */
export function checkPreloadedImages(urls: string[]): Record<string, boolean> {
  return urls.reduce((acc, url) => {
    // ブラウザのキャッシュから確認（完全ではないが参考程度）
    acc[url] = document.querySelector(`img[src="${url}"]`) !== null
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
      .from('session_media')
      .select('*')
      .eq('session_id', sessionId)
      .eq('media_type', 'image')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Get session photos error:', error)
      throw new Error(`写真の取得に失敗しました: ${error.message}`)
    }

    const photos = data.map(media => ({
      id: media.id,
      url: media.public_url || '',
      fileName: media.file_name,
      fileSize: media.file_size || 0,
      uploadedAt: media.created_at
    }))

    // 画像URLを抽出
    const imageUrls = photos.map(photo => photo.url).filter(url => url !== '')
    
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