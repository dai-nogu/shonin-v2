'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  SessionReflection, 
  SessionMedia, 
  SessionMediaDatabase
} from '@/types/database';

export function useReflectionsDb() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 振り返り情報をsessionsテーブルに保存（統合版）
  const saveReflection = async (sessionId: string, reflection: SessionReflection): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // sessionsテーブルの振り返りカラムを更新
      const { data, error } = await supabase
        .from('sessions')
        .update({
          mood_score: reflection.moodScore,
          mood_notes: reflection.moodNotes || null,
          detailed_achievements: reflection.achievements,
          achievement_satisfaction: reflection.achievementsRating || null,
          detailed_challenges: reflection.challenges,
          challenge_severity: reflection.challengesSeverity || null,
          reflection_notes: reflection.additionalNotes || null,
          reflection_duration: reflection.reflectionDuration || null,
        })
        .eq('id', sessionId)
        .select('id')
        .single();

      if (error) {
        console.error('振り返り保存エラー:', error);
        setError(`振り返りの保存に失敗しました: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('振り返り保存エラー:', err);
      setError('振り返りの保存中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 振り返り情報をsessionsテーブルから取得（統合版）
  const getReflection = async (sessionId: string): Promise<SessionReflection | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          mood_score,
          mood_notes,
          detailed_achievements,
          achievement_satisfaction,
          detailed_challenges,
          challenge_severity,
          reflection_notes,
          reflection_duration
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        console.error('振り返り取得エラー:', error);
        setError(`振り返りの取得に失敗しました: ${error.message}`);
        return null;
      }

      // データを変換
      const reflection: SessionReflection = {
        moodScore: data.mood_score || 3,
        moodNotes: data.mood_notes || undefined,
        achievements: data.detailed_achievements || '',
        achievementsRating: data.achievement_satisfaction || undefined,
        challenges: data.detailed_challenges || '',
        challengesSeverity: data.challenge_severity || undefined,
        additionalNotes: data.reflection_notes || undefined,
        reflectionDuration: data.reflection_duration || undefined,
      };

      return reflection;
    } catch (err) {
      console.error('振り返り取得エラー:', err);
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
          console.error('ファイルアップロードエラー:', uploadError);
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
          caption: caption || null,
          is_main_image: i === 0, // 最初の画像をメイン画像に設定
        };

        const { data: dbData, error: dbError } = await supabase
          .from('session_media')
          .insert(mediaData)
          .select('*')
          .single();

        if (dbError) {
          console.error('メディア情報保存エラー:', dbError);
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
      console.error('メディアアップロードエラー:', err);
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
        console.error('メディア取得エラー:', error);
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
      console.error('メディア取得エラー:', err);
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
        console.error('AI分析保存エラー:', error);
        setError(`AI分析の保存に失敗しました: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('AI分析保存エラー:', err);
      setError('AI分析の保存中にエラーが発生しました');
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
        console.error('AI分析取得エラー:', error);
        setError(`AI分析の取得に失敗しました: ${error.message}`);
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
      console.error('AI分析取得エラー:', err);
      setError('AI分析の取得中にエラーが発生しました');
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