export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "documents_new"
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
      documents_new: {
        Row: {
          chunk_order: number | null
          content: string | null
          date_created: string | null
          embedding: string | null
          file_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_order?: number | null
          content?: string | null
          date_created?: string | null
          embedding?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_order?: number | null
          content?: string | null
          date_created?: string | null
          embedding?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
          description: string | null
          embedding: string | null
          google_drive_id: string | null
          google_drive_url: string | null
          id: string
          name: string | null
          pages: number | null
          status: Database["public"]["Enums"]["file_status"] | null
        }
        Insert: {
          date_created?: string
          description?: string | null
          embedding?: string | null
          google_drive_id?: string | null
          google_drive_url?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
        }
        Update: {
          date_created?: string
          description?: string | null
          embedding?: string | null
          google_drive_id?: string | null
          google_drive_url?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
        }
        Relationships: []
      }
      investment_preferences: {
        Row: {
          created_at: string
          decision_timeline_days: number
          id: string
          max_ticket_size: number
          min_ticket_size: number
          name: string
          requires_co_investment: boolean
          risk_tolerance: string
          stage_preferences: string[]
          subnet_types: string[]
          technical_focus: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          decision_timeline_days?: number
          id?: string
          max_ticket_size: number
          min_ticket_size: number
          name: string
          requires_co_investment?: boolean
          risk_tolerance: string
          stage_preferences: string[]
          subnet_types: string[]
          technical_focus: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          decision_timeline_days?: number
          id?: string
          max_ticket_size?: number
          min_ticket_size?: number
          name?: string
          requires_co_investment?: boolean
          risk_tolerance?: string
          stage_preferences?: string[]
          subnet_types?: string[]
          technical_focus?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          project_id: string
          returns: Json | null
          status: Database["public"]["Enums"]["investment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          project_id: string
          returns?: Json | null
          status?: Database["public"]["Enums"]["investment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          project_id?: string
          returns?: Json | null
          status?: Database["public"]["Enums"]["investment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "subnet_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_alerts: {
        Row: {
          date: string
          id: string
          message: string
          project_id: string | null
          read: boolean
          type: string
          user_id: string | null
        }
        Insert: {
          date?: string
          id?: string
          message: string
          project_id?: string | null
          read?: boolean
          type: string
          user_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "subnet_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_meetings: {
        Row: {
          attendees: string[]
          created_at: string
          id: string
          notes: string | null
          project_id: string
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          attendees: string[]
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          scheduled_date: string
          status: string
          updated_at?: string
        }
        Update: {
          attendees?: string[]
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "subnet_projects"
            referencedColumns: ["id"]
          },
        ]
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
          attachments: string[] | null
          category: string | null
          content: string | null
          created_at: string | null
          has_conclusion: boolean | null
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
          attachments?: string[] | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          has_conclusion?: boolean | null
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
          attachments?: string[] | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          has_conclusion?: boolean | null
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
      receipt_companies: {
        Row: {
          address: string | null
          city: string | null
          company_number: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          beneficiary_name: string | null
          company_id: string | null
          created_at: string
          formatted_content: string
          id: string
          payment_amount: string | null
          payment_date: string | null
          payment_reference: string | null
          raw_content: string
          receipt_number: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          beneficiary_name?: string | null
          company_id?: string | null
          created_at?: string
          formatted_content: string
          id?: string
          payment_amount?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          raw_content: string
          receipt_number: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          beneficiary_name?: string | null
          company_id?: string | null
          created_at?: string
          formatted_content?: string
          id?: string
          payment_amount?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          raw_content?: string
          receipt_number?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "receipt_companies"
            referencedColumns: ["id"]
          },
        ]
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
      subnet_projects: {
        Row: {
          created_at: string
          current_funding: number
          description: string | null
          funding_target: number
          id: string
          launch_date: string | null
          name: string
          risk_assessment: Json | null
          roi: Json | null
          stage: string
          subnet_id: number | null
          technical_areas: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_funding?: number
          description?: string | null
          funding_target: number
          id?: string
          launch_date?: string | null
          name: string
          risk_assessment?: Json | null
          roi?: Json | null
          stage: string
          subnet_id?: number | null
          technical_areas: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_funding?: number
          description?: string | null
          funding_target?: number
          id?: string
          launch_date?: string | null
          name?: string
          risk_assessment?: Json | null
          roi?: Json | null
          stage?: string
          subnet_id?: number | null
          technical_areas?: string[]
          updated_at?: string
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
      tao_contact_logs: {
        Row: {
          attachment_url: string | null
          attachments: string[] | null
          contact_date: string
          created_at: string
          id: string
          linked_note_id: string | null
          method: string | null
          next_steps: string | null
          subnet_id: number | null
          summary: string | null
          updated_at: string
          validator_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          attachments?: string[] | null
          contact_date?: string
          created_at?: string
          id?: string
          linked_note_id?: string | null
          method?: string | null
          next_steps?: string | null
          subnet_id?: number | null
          summary?: string | null
          updated_at?: string
          validator_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          attachments?: string[] | null
          contact_date?: string
          created_at?: string
          id?: string
          linked_note_id?: string | null
          method?: string | null
          next_steps?: string | null
          subnet_id?: number | null
          summary?: string | null
          updated_at?: string
          validator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_linked_note"
            columns: ["linked_note_id"]
            isOneToOne: false
            referencedRelation: "tao_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tao_contact_logs_subnet_id_fkey"
            columns: ["subnet_id"]
            isOneToOne: false
            referencedRelation: "tao_subnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tao_contact_logs_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "tao_validators"
            referencedColumns: ["id"]
          },
        ]
      }
      tao_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          subnet_id: number | null
          title: string
          updated_at: string
          validator_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subnet_id?: number | null
          title: string
          updated_at?: string
          validator_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subnet_id?: number | null
          title?: string
          updated_at?: string
          validator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tao_notes_subnet_id_fkey"
            columns: ["subnet_id"]
            isOneToOne: false
            referencedRelation: "tao_subnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tao_notes_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "tao_validators"
            referencedColumns: ["id"]
          },
        ]
      }
      tao_subnets: {
        Row: {
          api_docs_url: string | null
          api_endpoint: string | null
          api_status: string | null
          api_version: string | null
          created_at: string
          description: string | null
          emission: string
          id: number
          incentive: string
          last_api_check: string | null
          name: string
          neurons: number
          tier: number
          updated_at: string
        }
        Insert: {
          api_docs_url?: string | null
          api_endpoint?: string | null
          api_status?: string | null
          api_version?: string | null
          created_at?: string
          description?: string | null
          emission: string
          id?: number
          incentive: string
          last_api_check?: string | null
          name: string
          neurons: number
          tier: number
          updated_at?: string
        }
        Update: {
          api_docs_url?: string | null
          api_endpoint?: string | null
          api_status?: string | null
          api_version?: string | null
          created_at?: string
          description?: string | null
          emission?: string
          id?: number
          incentive?: string
          last_api_check?: string | null
          name?: string
          neurons?: number
          tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      tao_validator_subnets: {
        Row: {
          created_at: string
          id: string
          subnet_id: number | null
          validator_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          subnet_id?: number | null
          validator_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          subnet_id?: number | null
          validator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tao_validator_subnets_subnet_id_fkey"
            columns: ["subnet_id"]
            isOneToOne: false
            referencedRelation: "tao_subnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tao_validator_subnets_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "tao_validators"
            referencedColumns: ["id"]
          },
        ]
      }
      tao_validators: {
        Row: {
          created_at: string
          crm_stage: string | null
          email: string | null
          id: string
          linkedin: string | null
          name: string
          organization_type: string
          priority: string | null
          telegram: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          crm_stage?: string | null
          email?: string | null
          id?: string
          linkedin?: string | null
          name: string
          organization_type?: string
          priority?: string | null
          telegram?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          crm_stage?: string | null
          email?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          organization_type?: string
          priority?: string | null
          telegram?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author: string
          created_at: string
          id: string
          task_id: string
          text: string
          user_id: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          task_id: string
          text: string
          user_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          task_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category_id: string | null
          checklist_items: Json | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          pictures: string[] | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          pictures?: string[] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          pictures?: string[] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_diana: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_diana_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_new: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          file_id: string
          file_name: string
          file_url: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_files: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          description: string
          id: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      expense_status: "pending" | "approved" | "rejected"
      file_status: "parsed" | "summarized" | "processed"
      investment_status: "pending" | "committed" | "deployed" | "exited"
      report_status: "draft" | "submitted" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      expense_status: ["pending", "approved", "rejected"],
      file_status: ["parsed", "summarized", "processed"],
      investment_status: ["pending", "committed", "deployed", "exited"],
      report_status: ["draft", "submitted", "approved", "rejected"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
