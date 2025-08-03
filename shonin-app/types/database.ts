export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          timezone: string | null
          goal_reminders: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          timezone?: string | null
          goal_reminders?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          timezone?: string | null
          goal_reminders?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          goal_id: string | null
          start_time: string
          end_time: string | null
          duration: number
          session_date: string | null
          notes: string | null
          mood: number | null
          achievements: string | null
          challenges: string | null
          location: string | null
          
          // 詳細振り返り情報
          mood_score: number | null
          mood_notes: string | null
          detailed_achievements: string | null
          achievement_satisfaction: number | null
          detailed_challenges: string | null
          challenge_severity: number | null
          reflection_notes: string | null
          reflection_duration: number | null
          
          // AI分析結果
          ai_sentiment_score: number | null
          ai_positive_keywords: string[] | null
          ai_negative_keywords: string[] | null
          ai_improvement_keywords: string[] | null
          ai_effort_level: number | null
          ai_focus_level: number | null
          ai_satisfaction_level: number | null
          ai_analyzed_at: string | null
          ai_feedback_generated: boolean | null
          
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          goal_id?: string | null
          start_time: string
          end_time?: string | null
          duration?: number
          session_date?: string | null
          notes?: string | null
          mood?: number | null
          achievements?: string | null
          challenges?: string | null
          location?: string | null
          
          // 詳細振り返り情報
          mood_score?: number | null
          mood_notes?: string | null
          detailed_achievements?: string | null
          achievement_satisfaction?: number | null
          detailed_challenges?: string | null
          challenge_severity?: number | null
          reflection_notes?: string | null
          reflection_duration?: number | null
          
          // AI分析結果
          ai_sentiment_score?: number | null
          ai_positive_keywords?: string[] | null
          ai_negative_keywords?: string[] | null
          ai_improvement_keywords?: string[] | null
          ai_effort_level?: number | null
          ai_focus_level?: number | null
          ai_satisfaction_level?: number | null
          ai_analyzed_at?: string | null
          ai_feedback_generated?: boolean | null
          
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          goal_id?: string | null
          start_time?: string
          end_time?: string | null
          duration?: number
          session_date?: string | null
          notes?: string | null
          mood?: number | null
          achievements?: string | null
          challenges?: string | null
          location?: string | null
          
          // 詳細振り返り情報
          mood_score?: number | null
          mood_notes?: string | null
          detailed_achievements?: string | null
          achievement_satisfaction?: number | null
          detailed_challenges?: string | null
          challenge_severity?: number | null
          reflection_notes?: string | null
          reflection_duration?: number | null
          
          // AI分析結果
          ai_sentiment_score?: number | null
          ai_positive_keywords?: string[] | null
          ai_negative_keywords?: string[] | null
          ai_improvement_keywords?: string[] | null
          ai_effort_level?: number | null
          ai_focus_level?: number | null
          ai_satisfaction_level?: number | null
          ai_analyzed_at?: string | null
          ai_feedback_generated?: boolean | null
          
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_duration: number | null
          deadline: string | null
          is_completed: boolean | null
          weekday_hours: number | null
          weekend_hours: number | null
          current_value: number | null
          unit: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_duration?: number | null
          deadline?: string | null
          is_completed?: boolean | null
          weekday_hours?: number | null
          weekend_hours?: number | null
          current_value?: number | null
          unit?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_duration?: number | null
          deadline?: string | null
          is_completed?: boolean | null
          weekday_hours?: number | null
          weekend_hours?: number | null
          current_value?: number | null
          unit?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_feedback: {
        Row: {
          id: string
          user_id: string
          feedback_type: string
          content: string
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feedback_type: string
          content: string
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feedback_type?: string
          content?: string
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
      session_media: {
        Row: {
          id: string
          session_id: string
          media_type: string
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          caption: string | null
          is_main_image: boolean
          public_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          media_type: string
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          caption?: string | null
          is_main_image?: boolean
          public_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          media_type?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          caption?: string | null
          is_main_image?: boolean
          public_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      sessions_for_ai_analysis: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          goal_id: string | null
          start_time: string
          end_time: string | null
          duration: number
          session_date: string | null
          location: string | null
          notes: string | null
          mood: number | null
          achievements: string | null
          challenges: string | null
          mood_score: number | null
          mood_notes: string | null
          detailed_achievements: string | null
          achievement_satisfaction: number | null
          detailed_challenges: string | null
          challenge_severity: number | null
          reflection_notes: string | null
          reflection_duration: number | null
          ai_sentiment_score: number | null
          ai_positive_keywords: string[] | null
          ai_negative_keywords: string[] | null
          ai_improvement_keywords: string[] | null
          ai_effort_level: number | null
          ai_focus_level: number | null
          ai_satisfaction_level: number | null
          ai_analyzed_at: string | null
          ai_feedback_generated: boolean | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

// 以下は現在のアプリケーションで使用されている型定義

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  activity_id: string;
  goal_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration: number;
  session_date?: string | null;
  notes?: string;
  mood?: number;
  achievements?: string;
  challenges?: string;
  location?: string;
  
  // 詳細振り返り情報（統合済み）
  mood_score?: number;
  mood_notes?: string;
  detailed_achievements?: string;
  achievement_satisfaction?: number;
  detailed_challenges?: string;
  challenge_severity?: number;
  reflection_notes?: string;
  reflection_duration?: number;
  
  // AI分析結果（統合済み）
  ai_sentiment_score?: number;
  ai_positive_keywords?: string[];
  ai_negative_keywords?: string[];
  ai_improvement_keywords?: string[];
  ai_effort_level?: number;
  ai_focus_level?: number;
  ai_satisfaction_level?: number;
  ai_analyzed_at?: string;
  ai_feedback_generated?: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface AiFeedbackDatabase {
  id: string;
  user_id: string;
  feedback_type: 'weekly' | 'monthly';
  content: string;
  sentiment_score?: number;
  generated_at: string;
}

export interface SessionMediaDatabase {
  id: string;
  session_id: string;
  media_type: 'image' | 'video' | 'audio';
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
  is_main_image: boolean;
  public_url?: string | null; // 写真機能統合のため追加
  created_at: string;
}

export interface SessionMedia {
  id: string;
  sessionId: string;
  mediaType: 'image' | 'video' | 'audio';
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string;
  isMainImage: boolean;
  publicUrl?: string; // 写真機能統合のため追加
  createdAt: string;
}

export interface SessionReflection {
  moodScore: number;
  moodNotes?: string;
  achievements: string;
  achievementsRating?: number;
  challenges: string;
  challengesSeverity?: number;
  additionalNotes?: string;
  reflectionDuration?: number;
} 