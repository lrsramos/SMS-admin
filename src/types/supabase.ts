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
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          active?: boolean
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
      cleaners: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cleaner_id_fkey"
            columns: ["id"]
            referencedRelation: "appointments"
            referencedColumns: ["cleaner_id"]
          }
        ]
      }
      service_locations: {
        Row: {
          id: string
          client_id: string
          street: string
          street_number: string
          neighborhood: string
          city: string
          state: string
          zip_code: string
          latitude: number
          longitude: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          street: string
          street_number: string
          neighborhood: string
          city: string
          state: string
          zip_code: string
          latitude: number
          longitude: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          street?: string
          street_number?: string
          neighborhood?: string
          city?: string
          state?: string
          zip_code?: string
          latitude?: number
          longitude?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_locations_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          cleaner_id: string
          service_location_id: string
          scheduled_at: string
          status: string
          description: string
          service_type_id: string | null
          service_tasks: string[]
          additional_notes: string | null
          frequency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          cleaner_id: string
          service_location_id: string
          scheduled_at: string
          status?: string
          description: string
          service_type_id?: string | null
          service_tasks?: string[]
          additional_notes?: string | null
          frequency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          cleaner_id?: string
          service_location_id?: string
          scheduled_at?: string
          status?: string
          description?: string
          service_type_id?: string | null
          service_tasks?: string[]
          additional_notes?: string | null
          frequency?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_cleaner_id_fkey"
            columns: ["cleaner_id"]
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_location_id_fkey"
            columns: ["service_location_id"]
            referencedRelation: "service_locations"
            referencedColumns: ["id"]
          }
        ]
      }
      service_types: {
        Row: {
          id: string
          name: string
          description: string
          duration_minutes: number
          price: number
          frequency: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          duration_minutes: number
          price: number
          frequency: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          duration_minutes?: number
          price?: number
          frequency?: string
          created_at?: string
        }
        Relationships: []
      }
      service_tasks: {
        Row: {
          id: string
          name: string
          description: string
          duration_minutes: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          duration_minutes: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          duration_minutes?: number
          price?: number
          created_at?: string
        }
        Relationships: []
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