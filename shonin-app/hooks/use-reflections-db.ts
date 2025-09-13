'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  SessionReflection, 
  SessionMedia, 
  SessionMediaDatabase
} from '@/types/database';

export function useReflectionsDb() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  // 振り返り情報を暗号化して保存（統合版）
  const saveReflection = async (sessionId: string, reflection: SessionReflection): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 暗号化関数を使用して振り返りデータを保存（基本データも含む）
      const { data, error } = await supabase.rpc('update_session_reflections_encrypted', {
        p_session_id: sessionId,
        p_mood: reflection.moodScore || null,
        p_achievements: reflection.achievements || null,
        p_challenges: reflection.challenges || null,
        p_mood_score: reflection.moodScore || null,
        p_detailed_achievements: reflection.achievements || null,
        p_detailed_challenges: reflection.challenges || null,
        p_reflection_notes: reflection.additionalNotes || null,
      });

      if (error) {
        setError(`振り返りの保存に失敗しました: ${error.message}`);
        return null;
      }

      return sessionId;
    } catch (err) {
      setError('振り返りの保存中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 振り返り情報を復号化して取得（統合版）
  const getReflection = async (sessionId: string): Promise<SessionReflection | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 復号化ビューから振り返りデータを取得
      const { data, error } = await supabase
        .from('sessions_reflections_decrypted')
        .select(`
          mood_score,
          detailed_achievements,
          detailed_challenges,
          reflection_notes
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        setError('振り返りの取得に失敗しました');
        return null;
      }

      // データを変換
      const reflection: SessionReflection = {
        moodScore: data.mood_score || 3,
        achievements: data.detailed_achievements || '',
        achievementsRating: undefined, // UI未実装のため削除
        challenges: data.detailed_challenges || '',
        challengesSeverity: undefined, // UI未実装のため削除
        additionalNotes: data.reflection_notes || undefined,
      };

      return reflection;
    } catch (err) {
      setError('振り返りの取得中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // セッションメディアのアップロード
  const uploadSessionMedia = async (
    sessionId: string, 
    files: File[], 
    captions: string[] = []
  ): Promise<SessionMedia[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const uploadedMedia: SessionMedia[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = captions[i] || '';

        // ファイル名の生成（セッションID + タイムスタンプ + ファイル名）
        const timestamp = Date.now();
        const fileName = `${sessionId}_${timestamp}_${file.name}`;
        const filePath = `session_media/${fileName}`;

        // Storageにアップロード
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('session-media')
          .upload(filePath, file);

        if (uploadError) {
          setError(`ファイルのアップロードに失敗しました: ${uploadError.message}`);
          continue;
        }

        // メディア情報をデータベースに保存
        const mediaData: Omit<SessionMediaDatabase, 'id' | 'created_at'> = {
          session_id: sessionId,
          media_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'audio',
          file_path: uploadData.path,
          file_name: fileName,
          file_size: file.size,
          mime_type: file.type,
          caption: caption || undefined,
          is_main_image: i === 0, // 最初の画像をメイン画像に設定
        };

        const { data: dbData, error: dbError } = await supabase
          .from('session_media')
          .insert(mediaData)
          .select('*')
          .single();

        if (dbError) {
          setError(`メディア情報の保存に失敗しました: ${dbError.message}`);
          continue;
        }

        uploadedMedia.push({
          id: dbData.id,
          sessionId: dbData.session_id,
          mediaType: dbData.media_type as 'image' | 'video' | 'audio',
          filePath: dbData.file_path,
          fileName: dbData.file_name,
          fileSize: dbData.file_size || 0,
          mimeType: dbData.mime_type || '',
          caption: dbData.caption || undefined,
          isMainImage: dbData.is_main_image,
          createdAt: dbData.created_at,
        });
      }

      return uploadedMedia;
    } catch (err) {
      setError('メディアのアップロード中にエラーが発生しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // セッションメディアの取得
  const getSessionMedia = async (sessionId: string): Promise<SessionMedia[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('session_media')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        setError(`メディアの取得に失敗しました: ${error.message}`);
        return [];
      }

      return data.map(media => ({
        id: media.id,
        sessionId: media.session_id,
        mediaType: media.media_type as 'image' | 'video' | 'audio',
        filePath: media.file_path,
        fileName: media.file_name,
        fileSize: media.file_size || 0,
        mimeType: media.mime_type || '',
        caption: media.caption || undefined,
        isMainImage: media.is_main_image,
        createdAt: media.created_at,
      }));
    } catch (err) {
      setError('メディアの取得中にエラーが発生しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // AI分析結果をsessionsテーブルに保存（統合版）
  const saveSentimentAnalysis = async (
    sessionId: string, 
    analysis: {
      overall_sentiment?: number;
      achievements_sentiment?: number;
      challenges_sentiment?: number;
      notes_sentiment?: number;
      positive_keywords?: string[];
      negative_keywords?: string[];
      improvement_keywords?: string[];
      effort_level?: number;
      focus_level?: number;
      satisfaction_level?: number;
      ai_model_version?: string;
    }
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // sessionsテーブルのAI分析カラムを更新
      const { data, error } = await supabase
        .from('sessions')
        .update({
          ai_sentiment_score: analysis.overall_sentiment || null,
          ai_positive_keywords: analysis.positive_keywords || null,
          ai_negative_keywords: analysis.negative_keywords || null,
          ai_improvement_keywords: analysis.improvement_keywords || null,
          ai_effort_level: analysis.effort_level || null,
          ai_focus_level: analysis.focus_level || null,
          ai_satisfaction_level: analysis.satisfaction_level || null,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select('id')
        .single();

      if (error) {
        setError(`AI分析の保存に失敗しました: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      setError('保存中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // セッションのAI分析結果を取得（統合版）
  const getSentimentAnalysis = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          ai_sentiment_score,
          ai_positive_keywords,
          ai_negative_keywords,
          ai_improvement_keywords,
          ai_effort_level,
          ai_focus_level,
          ai_satisfaction_level,
          ai_analyzed_at
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        setError(`分析の取得に失敗しました: ${error.message}`);
        return null;
      }

      return {
        overall_sentiment: data.ai_sentiment_score,
        positive_keywords: data.ai_positive_keywords,
        negative_keywords: data.ai_negative_keywords,
        improvement_keywords: data.ai_improvement_keywords,
        effort_level: data.ai_effort_level,
        focus_level: data.ai_focus_level,
        satisfaction_level: data.ai_satisfaction_level,
        analyzed_at: data.ai_analyzed_at,
      };
    } catch (err) {
      setError('分析の取得中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    saveReflection,
    getReflection,
    uploadSessionMedia,
    getSessionMedia,
    saveSentimentAnalysis,
    getSentimentAnalysis,
  };
} 