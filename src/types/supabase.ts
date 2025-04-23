export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          address: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          address: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["id"]
            referencedRelation: "appointments"
            referencedColumns: ["client_id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          client_id: string
          date: string
          time: string
          status: string
          notes: string | null
          scheduled_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          date: string
          time: string
          status?: string
          notes?: string | null
          scheduled_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: string
          date?: string
          time?: string
          status?: string
          notes?: string | null
          scheduled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
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