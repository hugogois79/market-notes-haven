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
      crypto_assets: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_portfolios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_transactions: {
        Row: {
          asset_id: string
          created_at: string | null
          fee: number | null
          id: string
          notes: string | null
          portfolio_id: string
          price_per_coin: number
          quantity: number
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          portfolio_id: string
          price_per_coin: number
          quantity: number
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          portfolio_id?: string
          price_per_coin?: number
          quantity?: number
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "crypto_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crypto_transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "crypto_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_documents: {
        Row: {
          chunk_order: number | null
          date_created: string | null
          embedding: string | null
          file_id: string | null
          id: string
          metadata: Json | null
          text: string | null
        }
        Insert: {
          chunk_order?: number | null
          date_created?: string | null
          embedding?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
          text?: string | null
        }
        Update: {
          chunk_order?: number | null
          date_created?: string | null
          embedding?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_documents_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      diana: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      document_summaries: {
        Row: {
          date_created: string | null
          document_id: string | null
          embedding: string | null
          id: string
          text: string | null
          valid: boolean | null
        }
        Insert: {
          date_created?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          text?: string | null
          valid?: boolean | null
        }
        Update: {
          date_created?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          text?: string | null
          valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "demo_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          date_created: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          date_created?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          date_created?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_reports: {
        Row: {
          created_at: string
          date_info: Json | null
          description: string | null
          full_amount: number
          id: string
          payment_method_id: string | null
          project_id: string | null
          report_number: number | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_date: string | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_info?: Json | null
          description?: string | null
          full_amount?: number
          id?: string
          payment_method_id?: string | null
          project_id?: string | null
          report_number?: number | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_date?: string | null
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_info?: Json | null
          description?: string | null
          full_amount?: number
          id?: string
          payment_method_id?: string | null
          project_id?: string | null
          report_number?: number | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_date?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_reports_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          id: string
          image_url: string | null
          merchant: string | null
          notes: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["expense_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          id?: string
          image_url?: string | null
          merchant?: string | null
          notes?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          merchant?: string | null
          notes?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          date_created: string
          embedding: string | null
          google_drive_id: string | null
          id: string
          name: string | null
          pages: number | null
          summary: string | null
        }
        Insert: {
          date_created?: string
          embedding?: string | null
          google_drive_id?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          summary?: string | null
        }
        Update: {
          date_created?: string
          embedding?: string | null
          google_drive_id?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          summary?: string | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          narrative: string
          news_date: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          narrative: string
          news_date: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          narrative?: string
          news_date?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          attachment_url: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          summary: string | null
          tags: string[] | null
          title: string
          trade_info: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          trade_info?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          trade_info?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notes_tags: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_tokens: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          token_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          token_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_tokens_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_tokens_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolios_tokens: {
        Row: {
          created_at: string | null
          id: string
          portfolio_id: string | null
          token_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          token_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_tokens_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "crypto_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_tokens_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_info: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          photo_url: string | null
          profile_image_url: string | null
          role: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          photo_url?: string | null
          profile_image_url?: string | null
          role?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          photo_url?: string | null
          profile_image_url?: string | null
          role?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          pending_expenses: number
          start_date: string
          total_expenses: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          pending_expenses?: number
          start_date: string
          total_expenses?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          pending_expenses?: number
          start_date?: string
          total_expenses?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      report_expenses: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          report_id: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          report_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_expenses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_expenses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          editor_settings: Json | null
          id: string
          layout_settings: Json | null
          notification_settings: Json | null
          privacy_settings: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          editor_settings?: Json | null
          id?: string
          layout_settings?: Json | null
          notification_settings?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          editor_settings?: Json | null
          id?: string
          layout_settings?: Json | null
          notification_settings?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tag_categories: {
        Row: {
          category: string
          created_at: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_categories_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_complete: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_complete?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_complete?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tokens: {
        Row: {
          created_at: string | null
          current_price: number | null
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          symbol: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          symbol: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          symbol?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      traders: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      traders_tokens: {
        Row: {
          created_at: string | null
          id: string
          token_id: string | null
          trader_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          trader_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          trader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traders_tokens_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traders_tokens_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "traders"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai: boolean
          note_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai?: boolean
          note_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai?: boolean
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_chat_messages_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_settlement_notes: {
        Row: {
          asset_symbol: string
          created_at: string
          fees: number | null
          id: string
          note_id: string
          notes: string | null
          pnl: number | null
          price: number
          quantity: number
          settlement_date: string | null
          trade_date: string
          trade_type: string
          updated_at: string
        }
        Insert: {
          asset_symbol: string
          created_at?: string
          fees?: number | null
          id?: string
          note_id: string
          notes?: string | null
          pnl?: number | null
          price: number
          quantity: number
          settlement_date?: string | null
          trade_date?: string
          trade_type: string
          updated_at?: string
        }
        Update: {
          asset_symbol?: string
          created_at?: string
          fees?: number | null
          id?: string
          note_id?: string
          notes?: string | null
          pnl?: number | null
          price?: number
          quantity?: number
          settlement_date?: string | null
          trade_date?: string
          trade_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_settlement_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          created_at: string | null
          id: string
          token_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_diana: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_diana_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      expense_status: "pending" | "approved" | "rejected"
      report_status: "draft" | "submitted" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
