export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
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
          goal_id: string | null  // 目標との紐付け（NULLの場合は目標なし）
          deleted_at: string | null  // 論理削除用（NULLなら有効、値ありなら削除済み）
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string
          goal_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string
          goal_id?: string | null
          deleted_at?: string | null
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
          location: string | null
          
          // 詳細振り返り情報
          mood_score: number | null
          mood_notes: string | null
          reflection_notes_encrypted: Uint8Array | null  // 暗号化された振り返り
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
          location?: string | null
          
          // 詳細振り返り情報
          mood_score?: number | null
          mood_notes?: string | null
          reflection_notes_encrypted?: Uint8Array | null  // 暗号化された振り返り
          
          // AI分析結果
          ai_sentiment_score?: number | null
          ai_positive_keywords?: string[] | null
          ai_negative_keywords?: string[] | null
          ai_improvement_keywords?: string[] | null
          ai_effort_level?: number | null
          ai_focus_level?: number | null
          ai_satisfaction_level?: number | null
          ai_analyzed_at?: string | null
          
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
          location?: string | null
          
          // 詳細振り返り情報
          mood_score?: number | null
          mood_notes?: string | null
          reflection_notes_encrypted?: Uint8Array | null  // 暗号化された振り返り
          
          // AI分析結果
          ai_sentiment_score?: number | null
          ai_positive_keywords?: string[] | null
          ai_negative_keywords?: string[] | null
          ai_improvement_keywords?: string[] | null
          ai_effort_level?: number | null
          ai_focus_level?: number | null
          ai_satisfaction_level?: number | null
          ai_analyzed_at?: string | null
          
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          dont_list: string | null
          deadline: string | null
          target_duration: number | null
          weekday_hours: number | null
          weekend_hours: number | null
          current_value: number | null
          unit: string | null
          status: string | null
          constellation_nodes: ConstellationNode[] | null
          constellation_edges: ConstellationEdge[] | null
          constellation_symbol: string | null
          constellation_message: string | null
          constellation_position_x: number | null
          constellation_position_y: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          dont_list?: string | null
          deadline?: string | null
          target_duration?: number | null
          weekday_hours?: number | null
          weekend_hours?: number | null
          current_value?: number | null
          unit?: string | null
          status?: string | null
          constellation_nodes?: ConstellationNode[] | null
          constellation_edges?: ConstellationEdge[] | null
          constellation_symbol?: string | null
          constellation_message?: string | null
          constellation_position_x?: number | null
          constellation_position_y?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          dont_list?: string | null
          deadline?: string | null
          target_duration?: number | null
          weekday_hours?: number | null
          weekend_hours?: number | null
          current_value?: number | null
          unit?: string | null
          status?: string | null
          constellation_nodes?: ConstellationNode[] | null
          constellation_edges?: ConstellationEdge[] | null
          constellation_symbol?: string | null
          constellation_message?: string | null
          constellation_position_x?: number | null
          constellation_position_y?: number | null
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
          mood_score: number | null
          mood_notes: string | null
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
          created_at: string
          updated_at: string
        }
      }
      decrypted_session: {
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
          location: string | null
          
          // 詳細振り返り情報（復号化済み）
          mood_score: number | null
          mood_notes: string | null
          reflection_notes: string | null  // 復号化された振り返り
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
  goal_id?: string | null;  // 目標との紐付け（NULLの場合は目標なし）
  deleted_at?: string | null;  // 論理削除用（NULLなら有効、値ありなら削除済み）
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
  location?: string;
  
  // 詳細振り返り情報（統合済み）
  mood_score?: number;
  mood_notes?: string;
  reflection_notes?: string;
  
  // AI分析結果（統合済み）
  ai_sentiment_score?: number;
  ai_positive_keywords?: string[];
  ai_negative_keywords?: string[];
  ai_improvement_keywords?: string[];
  ai_effort_level?: number;
  ai_focus_level?: number;
  ai_satisfaction_level?: number;
  ai_analyzed_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface AiFeedbackDatabase {
  id: string;
  user_id: string;
  feedback_type: 'weekly' | 'monthly';
  content_encrypted: Uint8Array; // pgcryptoで暗号化されたコンテンツ
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface AiFeedbackDecrypted {
  id: string;
  user_id: string;
  feedback_type: 'weekly' | 'monthly';
  content: string; // 復号化されたコンテンツ
  period_start: string;
  period_end: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
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
  additionalNotes?: string;
}

// 星座データの型定義
export interface ConstellationNode {
  id: number;
  x: number;
  y: number;
  label?: string;
}

export interface ConstellationEdge {
  from: number;
  to: number;
}

export interface ConstellationData {
  symbolName: string;
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  message: string;
} 