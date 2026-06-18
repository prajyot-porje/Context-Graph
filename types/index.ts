export interface User {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
  onboarding_done: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ContextNode {
  id: string
  user_id: string
  scope: string
  title: string
  content: string
  relevance: number
  tags: string[]
  parent_scope: string | null
  last_updated: string
  created_at: string
}

export interface ContextEdge {
  id: string
  user_id: string
  source_node_id: string
  target_node_id: string
  edge_type: string
  created_at: string
}

export interface ContextEntry {
  id: string
  node_id: string
  user_id: string
  entry_text: string
  score: number
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  created_at: string
  last_used: string | null
}

export interface OnboardingAnswers {
  name: string
  roles?: string[]
  role?: string[]
  location: string
  description: string
  skills: string[]
  stack: string[]
  projects: {
    name: string
    type: string
    description: string
    status: string
    tech: string
  }[]
  goals: string
  constraints: string
}


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user: {
        Row: {
          id: string
          email: string
          name: string
          image: string | null
          emailVerified: boolean
          onboarding_done: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          email: string
          name: string
          image?: string | null
          emailVerified?: boolean
          onboarding_done?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          image?: string | null
          emailVerified?: boolean
          onboarding_done?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      context_nodes: {
        Row: {
          id: string
          user_id: string
          scope: string
          title: string
          content: string
          relevance: number
          tags: string[]
          parent_scope: string | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scope: string
          title: string
          content: string
          relevance?: number
          tags?: string[]
          parent_scope?: string | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          scope?: string
          title?: string
          content?: string
          relevance?: number
          tags?: string[]
          parent_scope?: string | null
          last_updated?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_nodes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      context_edges: {
        Row: {
          id: string
          user_id: string
          source_node_id: string
          target_node_id: string
          edge_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_node_id: string
          target_node_id: string
          edge_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_node_id?: string
          target_node_id?: string
          edge_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_edges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "context_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "context_nodes"
            referencedColumns: ["id"]
          }
        ]
      }
      context_entries: {
        Row: {
          id: string
          node_id: string
          user_id: string
          entry_text: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          node_id: string
          user_id: string
          entry_text: string
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          user_id?: string
          entry_text?: string
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_entries_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "context_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          key_prefix: string
          created_at: string
          last_used: string | null
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          key_prefix: string
          created_at?: string
          last_used?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          key_hash?: string
          key_prefix?: string
          created_at?: string
          last_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
