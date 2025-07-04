export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          timezone: string
          goal_reminders: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          timezone?: string
          goal_reminders?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          timezone?: string
          goal_reminders?: boolean
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
          color: string
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
          start_time: string
          end_time: string | null
          duration: number
          notes: string | null
          mood: number | null
          achievements: string | null
          challenges: string | null
          location: string | null
          
          // 詳細振り返り情報（統合）
          mood_score: number | null
          mood_notes: string | null
          detailed_achievements: string | null
          achievement_satisfaction: number | null
          detailed_challenges: string | null
          challenge_severity: number | null
          reflection_notes: string | null
          reflection_duration: number | null
          
          // AI分析結果（統合）
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
          start_time: string
          end_time?: string | null
          duration?: number
          notes?: string | null
          mood?: number | null
          achievements?: string | null
          challenges?: string | null
          location?: string | null
          
          // 詳細振り返り情報（統合）
          mood_score?: number | null
          mood_notes?: string | null
          detailed_achievements?: string | null
          achievement_satisfaction?: number | null
          detailed_challenges?: string | null
          challenge_severity?: number | null
          reflection_notes?: string | null
          reflection_duration?: number | null
          
          // AI分析結果（統合）
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
          start_time?: string
          end_time?: string | null
          duration?: number
          notes?: string | null
          mood?: number | null
          achievements?: string | null
          challenges?: string | null
          location?: string | null
          
          // 詳細振り返り情報（統合）
          mood_score?: number | null
          mood_notes?: string | null
          detailed_achievements?: string | null
          achievement_satisfaction?: number | null
          detailed_challenges?: string | null
          challenge_severity?: number | null
          reflection_notes?: string | null
          reflection_duration?: number | null
          
          // AI分析結果（統合）
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
      session_tags: {
        Row: {
          id: string
          session_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          tag_name?: string
          created_at?: string
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
          is_completed: boolean
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
          is_completed?: boolean
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
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_feedback: {
        Row: {
          id: string
          user_id: string
          feedback_type: 'weekly' | 'monthly'
          content: string
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feedback_type: 'weekly' | 'monthly'
          content: string
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feedback_type?: 'weekly' | 'monthly'
          content?: string
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface GoalDatabase {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AiFeedbackDatabase {
  id: string;
  user_id: string;
  feedback_type: 'weekly' | 'monthly' | 'achievement' | 'encouragement';
  content: string;
  sentiment_score?: number;
  generated_at: string;
}

export interface SessionReflectionDatabase {
  id: string;
  session_id: string;
  mood_score: number;
  mood_notes?: string;
  achievements: string;
  achievements_rating?: number;
  challenges: string;
  challenges_severity?: number;
  additional_notes?: string;
  reflection_duration?: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface SessionSentimentAnalysisDatabase {
  id: string;
  session_id: string;
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
  analyzed_at: string;
  ai_model_version?: string;
  processing_time_ms?: number;
}

export interface ReflectionTemplateDatabase {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  questions: ReflectionQuestion[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReflectionQuestion {
  id: string;
  type: 'rating' | 'text' | 'textarea' | 'select' | 'multiselect';
  question: string;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
  required: boolean;
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

export interface SessionMedia {
  id?: string;
  mediaType: 'image' | 'video' | 'audio';
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  isMainImage: boolean;
}

export interface SessionWithReflection extends CompletedSession {
  reflection?: SessionReflection;
  media?: SessionMedia[];
  sentimentAnalysis?: SessionSentimentAnalysisDatabase;
} 