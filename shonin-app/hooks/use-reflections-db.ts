'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  SessionReflection, 
  SessionReflectionDatabase, 
  SessionMedia, 
  SessionMediaDatabase,
  SessionSentimentAnalysisDatabase 
} from '@/types/database';

const DUMMY_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export function useReflectionsDb() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 振り返り情報を保存
  const saveReflection = async (sessionId: string, reflection: SessionReflection): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const reflectionData: Omit<SessionReflectionDatabase, 'id' | 'created_at' | 'updated_at'> = {
        session_id: sessionId,
        mood_score: reflection.moodScore,
        mood_notes: reflection.moodNotes || undefined,
        achievements: reflection.achievements,
        achievements_rating: reflection.achievementsRating || undefined,
        challenges: reflection.challenges,
        challenges_severity: reflection.challengesSeverity || undefined,
        additional_notes: reflection.additionalNotes || undefined,
        reflection_duration: reflection.reflectionDuration || undefined,
      };

      const { data, error } = await supabase
        .from('session_reflections')
        .insert(reflectionData)
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

  // 振り返り情報を取得
  const getReflection = async (sessionId: string): Promise<SessionReflection | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('session_reflections')
        .select('*')
        .eq('session_id', sessionId)
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

      const reflection: SessionReflection = {
        moodScore: data.mood_score,
        moodNotes: data.mood_notes,
        achievements: data.achievements,
        achievementsRating: data.achievements_rating,
        challenges: data.challenges,
        challengesSeverity: data.challenges_severity,
        additionalNotes: data.additional_notes,
        reflectionDuration: data.reflection_duration,
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

  // 振り返り情報を更新
  const updateReflection = async (sessionId: string, reflection: SessionReflection): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const reflectionData = {
        mood_score: reflection.moodScore,
        mood_notes: reflection.moodNotes || null,
        achievements: reflection.achievements,
        achievements_rating: reflection.achievementsRating || null,
        challenges: reflection.challenges,
        challenges_severity: reflection.challengesSeverity || null,
        additional_notes: reflection.additionalNotes || null,
        reflection_duration: reflection.reflectionDuration || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('session_reflections')
        .update(reflectionData)
        .eq('session_id', sessionId);

      if (error) {
        console.error('振り返り更新エラー:', error);
        setError(`振り返りの更新に失敗しました: ${error.message}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('振り返り更新エラー:', err);
      setError('振り返りの更新中にエラーが発生しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // メディアファイルを保存
  const saveMedia = async (sessionId: string, media: SessionMedia): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const mediaData: Omit<SessionMediaDatabase, 'id' | 'created_at'> = {
        session_id: sessionId,
        media_type: media.mediaType,
        file_path: media.filePath,
        file_name: media.fileName,
        file_size: media.fileSize || undefined,
        mime_type: media.mimeType || undefined,
        caption: media.caption || undefined,
        is_main_image: media.isMainImage,
      };

      const { data, error } = await supabase
        .from('session_media')
        .insert(mediaData)
        .select('id')
        .single();

      if (error) {
        console.error('メディア保存エラー:', error);
        setError(`メディアの保存に失敗しました: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('メディア保存エラー:', err);
      setError('メディアの保存中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // セッションのメディアファイルを取得
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

      const media: SessionMedia[] = data.map(item => ({
        id: item.id,
        mediaType: item.media_type,
        filePath: item.file_path,
        fileName: item.file_name,
        fileSize: item.file_size,
        mimeType: item.mime_type,
        caption: item.caption,
        isMainImage: item.is_main_image,
      }));

      return media;
    } catch (err) {
      console.error('メディア取得エラー:', err);
      setError('メディアの取得中にエラーが発生しました');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // AI感情分析結果を保存
  const saveSentimentAnalysis = async (
    sessionId: string, 
    analysis: Omit<SessionSentimentAnalysisDatabase, 'id' | 'session_id' | 'analyzed_at'>
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const analysisData = {
        session_id: sessionId,
        ...analysis,
      };

      const { data, error } = await supabase
        .from('session_sentiment_analysis')
        .insert(analysisData)
        .select('id')
        .single();

      if (error) {
        console.error('感情分析保存エラー:', error);
        setError(`感情分析の保存に失敗しました: ${error.message}`);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('感情分析保存エラー:', err);
      setError('感情分析の保存中にエラーが発生しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // セッションの感情分析結果を取得
  const getSentimentAnalysis = async (sessionId: string): Promise<SessionSentimentAnalysisDatabase | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('session_sentiment_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        console.error('感情分析取得エラー:', error);
        setError(`感情分析の取得に失敗しました: ${error.message}`);
        return null;
      }

      return data;
    } catch (err) {
      console.error('感情分析取得エラー:', err);
      setError('感情分析の取得中にエラーが発生しました');
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
    updateReflection,
    saveMedia,
    getSessionMedia,
    saveSentimentAnalysis,
    getSentimentAnalysis,
  };
} 