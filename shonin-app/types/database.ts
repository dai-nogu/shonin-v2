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