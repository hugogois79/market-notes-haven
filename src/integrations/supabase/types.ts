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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string | null
          company_id: string
          created_at: string
          currency: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string
          bank_name?: string | null
          company_id: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          is_shared: boolean
          name: string
          shared_with_users: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          name: string
          shared_with_users?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          shared_with_users?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_day_status: {
        Row: {
          beatriz_status: string | null
          created_at: string
          date: string
          diana_status: string | null
          id: string
          is_holiday: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beatriz_status?: string | null
          created_at?: string
          date: string
          diana_status?: string | null
          id?: string
          is_holiday?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beatriz_status?: string | null
          created_at?: string
          date?: string
          diana_status?: string | null
          id?: string
          is_holiday?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_event_templates: {
        Row: {
          category: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          period: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          period?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          period?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      companies: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          jurisdiction: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          risk_rating: string | null
          status: string | null
          tax_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jurisdiction?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          risk_rating?: string | null
          status?: string | null
          tax_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jurisdiction?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          risk_rating?: string | null
          status?: string | null
          tax_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string
          document_type: string | null
          file_hash: string | null
          file_size: number | null
          file_url: string
          financial_value: number | null
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          notes: string | null
          property_id: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document_type?: string | null
          file_hash?: string | null
          file_size?: number | null
          file_url: string
          financial_value?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          property_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document_type?: string | null
          file_hash?: string | null
          file_size?: number | null
          file_url?: string
          financial_value?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          property_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "company_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      company_folders: {
        Row: {
          category: string | null
          category_options: Json | null
          company_id: string
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          property_id: string | null
          status: string | null
          status_options: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_options?: Json | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          property_id?: string | null
          status?: string | null
          status_options?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_options?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          property_id?: string | null
          status?: string | null
          status_options?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "company_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_folders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      company_loans: {
        Row: {
          amount: number
          attachment_url: string | null
          borrowing_company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          interest_rate: number | null
          lending_company_id: string
          monthly_payment: number | null
          source_file_id: string | null
          source_transaction_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          borrowing_company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lending_company_id: string
          monthly_payment?: number | null
          source_file_id?: string | null
          source_transaction_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          borrowing_company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lending_company_id?: string
          monthly_payment?: number | null
          source_file_id?: string | null
          source_transaction_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_loans_borrowing_company_id_fkey"
            columns: ["borrowing_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_loans_lending_company_id_fkey"
            columns: ["lending_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_loans_source_transaction_id_fkey"
            columns: ["source_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      document_ai_analyses: {
        Row: {
          created_at: string
          explanation: string
          file_name: string
          file_url: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation: string
          file_name: string
          file_url: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string
          file_name?: string
          file_url?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_summaries: {
        Row: {
          date_created: string | null
          document_id: string | null
          id: string
          text: string | null
          valid: boolean | null
        }
        Insert: {
          date_created?: string | null
          document_id?: string | null
          id?: string
          text?: string | null
          valid?: boolean | null
        }
        Update: {
          date_created?: string | null
          document_id?: string | null
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
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          date_created?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          date_created?: string | null
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
          file_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_order?: number | null
          content?: string | null
          date_created?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_order?: number | null
          content?: string | null
          date_created?: string | null
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
          assigned_project_ids: string[] | null
          category_type: string | null
          color: string | null
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_project_ids?: string[] | null
          category_type?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_project_ids?: string[] | null
          category_type?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expense_claims: {
        Row: {
          claim_date: string
          claim_number: number
          claim_type: string
          created_at: string
          description: string | null
          employee_id: string
          id: string
          requester_id: string | null
          status: string
          submission_date: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          claim_date?: string
          claim_number?: number
          claim_type: string
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          requester_id?: string | null
          status?: string
          submission_date?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          claim_date?: string
          claim_number?: number
          claim_type?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          requester_id?: string | null
          status?: string
          submission_date?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "expense_users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_projects: {
        Row: {
          associated_companies: string[] | null
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          has_investment: boolean | null
          has_revenue: boolean | null
          id: string
          is_active: boolean
          monthly_budget: number | null
          name: string
          start_date: string | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          associated_companies?: string[] | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          has_investment?: boolean | null
          has_revenue?: boolean | null
          id?: string
          is_active?: boolean
          monthly_budget?: number | null
          name: string
          start_date?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          associated_companies?: string[] | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          has_investment?: boolean | null
          has_revenue?: boolean | null
          id?: string
          is_active?: boolean
          monthly_budget?: number | null
          name?: string
          start_date?: string | null
          total_cost?: number | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      expense_requesters: {
        Row: {
          assigned_project_ids: string[] | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          assigned_project_ids?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          assigned_project_ids?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_users: {
        Row: {
          assigned_project_ids: string[] | null
          created_at: string
          email: string | null
          feature_permissions: Json | null
          id: string
          is_active: boolean
          is_requester: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_project_ids?: string[] | null
          created_at?: string
          email?: string | null
          feature_permissions?: Json | null
          id?: string
          is_active?: boolean
          is_requester?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_project_ids?: string[] | null
          created_at?: string
          email?: string | null
          feature_permissions?: Json | null
          id?: string
          is_active?: boolean
          is_requester?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          expense_claim_id: string
          expense_date: string
          id: string
          project_id: string | null
          receipt_image_url: string | null
          supplier: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          expense_claim_id: string
          expense_date: string
          id?: string
          project_id?: string | null
          receipt_image_url?: string | null
          supplier: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_claim_id?: string
          expense_date?: string
          id?: string
          project_id?: string | null
          receipt_image_url?: string | null
          supplier?: string
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
            foreignKeyName: "fk_expenses_claim"
            columns: ["expense_claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expenses_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          date_created: string
          description: string | null
          google_drive_id: string | null
          google_drive_url: string | null
          id: string
          name: string | null
          pages: number | null
          status: Database["public"]["Enums"]["file_status"] | null
          user_id: string
        }
        Insert: {
          date_created?: string
          description?: string | null
          google_drive_id?: string | null
          google_drive_url?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
          user_id: string
        }
        Update: {
          date_created?: string
          description?: string | null
          google_drive_id?: string | null
          google_drive_url?: string | null
          id?: string
          name?: string | null
          pages?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      financial_projects: {
        Row: {
          associated_companies: string[] | null
          budget: number | null
          client_name: string | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["financial_project_status"]
          updated_at: string
        }
        Insert: {
          associated_companies?: string[] | null
          budget?: number | null
          client_name?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["financial_project_status"]
          updated_at?: string
        }
        Update: {
          associated_companies?: string[] | null
          budget?: number | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["financial_project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount_net: number
          bank_account_id: string | null
          category: Database["public"]["Enums"]["transaction_category"]
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string
          date: string
          description: string
          document_file_id: string | null
          entity_name: string
          id: string
          invoice_file_url: string | null
          invoice_number: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["financial_payment_method"]
          project_id: string | null
          subcategory: string | null
          total_amount: number
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount_net: number
          bank_account_id?: string | null
          category: Database["public"]["Enums"]["transaction_category"]
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          date: string
          description: string
          document_file_id?: string | null
          entity_name: string
          id?: string
          invoice_file_url?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_method: Database["public"]["Enums"]["financial_payment_method"]
          project_id?: string | null
          subcategory?: string | null
          total_amount: number
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount_net?: number
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transaction_category"]
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          document_file_id?: string | null
          entity_name?: string
          id?: string
          invoice_file_url?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["financial_payment_method"]
          project_id?: string | null
          subcategory?: string | null
          total_amount?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_insights: {
        Row: {
          created_at: string
          feedback: string | null
          folder_id: string
          id: string
          insight_text: string
          last_reviewed_at: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          folder_id: string
          id?: string
          insight_text: string
          last_reviewed_at?: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          folder_id?: string
          id?: string
          insight_text?: string
          last_reviewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_insights_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: true
            referencedRelation: "company_folders"
            referencedColumns: ["id"]
          },
        ]
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
      kanban_attachments: {
        Row: {
          card_id: string | null
          created_at: string | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_attachments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          space_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          space_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          space_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "kanban_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_card_labels: {
        Row: {
          card_id: string
          label_id: string
        }
        Insert: {
          card_id: string
          label_id: string
        }
        Update: {
          card_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_card_labels_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_card_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "kanban_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          archived: boolean | null
          attachment_count: number | null
          completed: boolean | null
          completed_at: string | null
          concluded: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          list_id: string | null
          position: number
          priority: string | null
          tags: string[] | null
          tasks: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          attachment_count?: number | null
          completed?: boolean | null
          completed_at?: string | null
          concluded?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          list_id?: string | null
          position: number
          priority?: string | null
          tags?: string[] | null
          tasks?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          attachment_count?: number | null
          completed?: boolean | null
          completed_at?: string | null
          concluded?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          list_id?: string | null
          position?: number
          priority?: string | null
          tags?: string[] | null
          tasks?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "ai_board_structure"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "kanban_cards_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "kanban_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_checklist_items: {
        Row: {
          checklist_id: string | null
          content: string
          id: string
          is_completed: boolean | null
          position: number
        }
        Insert: {
          checklist_id?: string | null
          content: string
          id?: string
          is_completed?: boolean | null
          position: number
        }
        Update: {
          checklist_id?: string | null
          content?: string
          id?: string
          is_completed?: boolean | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "kanban_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "kanban_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_checklists: {
        Row: {
          card_id: string | null
          id: string
          position: number
          title: string
        }
        Insert: {
          card_id?: string | null
          id?: string
          position: number
          title: string
        }
        Update: {
          card_id?: string | null
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_checklists_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_comments: {
        Row: {
          card_id: string | null
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          card_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          card_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_labels: {
        Row: {
          board_id: string | null
          color: string
          id: string
          name: string
        }
        Insert: {
          board_id?: string | null
          color: string
          id?: string
          name: string
        }
        Update: {
          board_id?: string | null
          color?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_labels_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "ai_board_structure"
            referencedColumns: ["board_id"]
          },
          {
            foreignKeyName: "kanban_labels_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_lists: {
        Row: {
          archived: boolean | null
          board_id: string | null
          color: string | null
          created_at: string | null
          id: string
          position: number
          title: string
        }
        Insert: {
          archived?: boolean | null
          board_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          position: number
          title: string
        }
        Update: {
          archived?: boolean | null
          board_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_lists_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "ai_board_structure"
            referencedColumns: ["board_id"]
          },
          {
            foreignKeyName: "kanban_lists_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_spaces: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      legal_billable_items: {
        Row: {
          amount: number
          attachment_url: string | null
          case_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          invoice_number: string | null
          is_paid: boolean
          notes: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          attachment_url?: string | null
          case_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          case_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_billable_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_cases: {
        Row: {
          case_number: string | null
          case_type: string | null
          created_at: string | null
          date_opened: string | null
          description: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          case_number?: string | null
          case_type?: string | null
          created_at?: string | null
          date_opened?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          case_number?: string | null
          case_type?: string | null
          created_at?: string | null
          date_opened?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      legal_contact_cases: {
        Row: {
          case_id: string
          contact_id: string
          created_at: string
          id: string
        }
        Insert: {
          case_id: string
          contact_id: string
          created_at?: string
          id?: string
        }
        Update: {
          case_id?: string
          contact_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_contact_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_contact_cases_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "legal_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_contacts: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      legal_document_contacts: {
        Row: {
          contact_id: string
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_document_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "legal_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_document_contacts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          attachment_url: string | null
          attachments: string[] | null
          case_id: string | null
          contact_id: string | null
          created_at: string | null
          created_date: string
          description: string | null
          document_type: string
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          attachments?: string[] | null
          case_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_date?: string
          description?: string | null
          document_type: string
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          attachments?: string[] | null
          case_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_date?: string
          description?: string | null
          document_type?: string
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "legal_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          notes: string | null
          paying_company_id: string
          payment_date: string
          receiving_company_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          notes?: string | null
          paying_company_id: string
          payment_date: string
          receiving_company_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          notes?: string | null
          paying_company_id?: string
          payment_date?: string
          receiving_company_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "company_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_paying_company_id_fkey"
            columns: ["paying_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_receiving_company_id_fkey"
            columns: ["receiving_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      market_holdings: {
        Row: {
          asset_id: string
          cost_basis: number | null
          created_at: string
          currency: string | null
          current_value: number | null
          id: string
          isin: string | null
          name: string
          notes: string | null
          quantity: number | null
          security_id: string | null
          ticker: string | null
          updated_at: string
          user_id: string
          weight_current: number | null
          weight_target: number | null
        }
        Insert: {
          asset_id: string
          cost_basis?: number | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          id?: string
          isin?: string | null
          name: string
          notes?: string | null
          quantity?: number | null
          security_id?: string | null
          ticker?: string | null
          updated_at?: string
          user_id: string
          weight_current?: number | null
          weight_target?: number | null
        }
        Update: {
          asset_id?: string
          cost_basis?: number | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          id?: string
          isin?: string | null
          name?: string
          notes?: string | null
          quantity?: number | null
          security_id?: string | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
          weight_current?: number | null
          weight_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_holdings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_holdings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_movements: {
        Row: {
          created_at: string
          currency: string
          holding_id: string
          id: string
          movement_date: string
          movement_type: string
          notes: string | null
          price_per_unit: number | null
          quantity: number | null
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          holding_id: string
          id?: string
          movement_date?: string
          movement_type: string
          notes?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          total_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          holding_id?: string
          id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_movements_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "market_holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_objectives: {
        Row: {
          category: string | null
          column_index: number | null
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          is_completed: boolean | null
          month: number | null
          user_id: string
          year: number
        }
        Insert: {
          category?: string | null
          column_index?: number | null
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          month?: number | null
          user_id: string
          year: number
        }
        Update: {
          category?: string | null
          column_index?: number | null
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          month?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          content: string
          created_at: string | null
          id: number
          metadata: Json | null
          narrative: string
          news_date: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          narrative: string
          news_date: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          narrative?: string
          news_date?: string
        }
        Relationships: []
      }
      note_relations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          relation_type: string | null
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          relation_type?: string | null
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          relation_type?: string | null
          source_note_id?: string
          target_note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_relations_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_relations_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          created_at: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_usage_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          attachment_url: string | null
          attachments: string[] | null
          category: string | null
          cluster_index: number | null
          content: string | null
          created_at: string | null
          embedding: string | null
          has_conclusion: boolean | null
          id: string
          project_id: string | null
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
          cluster_index?: number | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          has_conclusion?: boolean | null
          id?: string
          project_id?: string | null
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
          cluster_index?: number | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          has_conclusion?: boolean | null
          id?: string
          project_id?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          trade_info?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "tag_usage_counts"
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
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          allocation_by_category: Json | null
          asset_count: number
          average_yield: number | null
          created_at: string | null
          id: string
          snapshot_date: string
          total_pl: number
          total_value: number
          user_id: string
        }
        Insert: {
          allocation_by_category?: Json | null
          asset_count: number
          average_yield?: number | null
          created_at?: string | null
          id?: string
          snapshot_date: string
          total_pl: number
          total_value: number
          user_id: string
        }
        Update: {
          allocation_by_category?: Json | null
          asset_count?: number
          average_yield?: number | null
          created_at?: string | null
          id?: string
          snapshot_date?: string
          total_pl?: number
          total_value?: number
          user_id?: string
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
      project_monthly_budgets: {
        Row: {
          budgeted_amount: number
          category_id: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          project_id: string
          updated_at: string
          year: number
        }
        Insert: {
          budgeted_amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          project_id: string
          updated_at?: string
          year: number
        }
        Update: {
          budgeted_amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          project_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_monthly_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_monthly_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_monthly_investments: {
        Row: {
          budgeted_amount: number | null
          category_id: string | null
          created_at: string | null
          id: string
          month: number
          notes: string | null
          project_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          budgeted_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          project_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          budgeted_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          project_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_monthly_investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_monthly_investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_monthly_revenues: {
        Row: {
          budgeted_amount: number | null
          category_id: string | null
          created_at: string | null
          id: string
          month: number
          notes: string | null
          project_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          budgeted_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          project_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          budgeted_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          project_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_monthly_revenues_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_monthly_revenues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
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
      real_estate_documents: {
        Row: {
          ai_summary: string | null
          created_at: string
          document_type: string
          file_url: string
          id: string
          name: string
          property_id: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          name: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          name?: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_estate_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "real_estate_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_leases: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          monthly_rent: number
          property_id: string
          start_date: string
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          monthly_rent: number
          property_id: string
          start_date: string
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          monthly_rent?: number
          property_id?: string
          start_date?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_estate_leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "real_estate_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_estate_leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "real_estate_units"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_ledger: {
        Row: {
          amount: number
          attachment_url: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          property_id: string | null
          status: string | null
          tenant_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_ledger_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_estate_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "real_estate_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_properties: {
        Row: {
          address: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string
          current_value: number | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          postal_code: string | null
          property_type: string
          purchase_date: string | null
          purchase_price: number | null
          status: string
          total_maintenance_cost: number | null
          total_rents_collected: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          postal_code?: string | null
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string
          total_maintenance_cost?: number | null
          total_rents_collected?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          postal_code?: string | null
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string
          total_maintenance_cost?: number | null
          total_rents_collected?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_tenants: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      real_estate_units: {
        Row: {
          area_sqm: number | null
          created_at: string
          id: string
          is_occupied: boolean | null
          property_id: string
          rent_amount: number | null
          unit_name: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          property_id: string
          rent_amount?: number | null
          unit_name: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          property_id?: string
          rent_amount?: number | null
          unit_name?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_companies: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          capital_social: string | null
          company_number: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          nipc: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          capital_social?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          nipc?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          capital_social?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          nipc?: string | null
          phone?: string | null
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
      reminders: {
        Row: {
          chat_id: number
          created_at: string | null
          id: number
          message: string
          remind_at: string | null
          status: string | null
          user_name: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          id?: number
          message: string
          remind_at?: string | null
          status?: string | null
          user_name?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          id?: number
          message?: string
          remind_at?: string | null
          status?: string | null
          user_name?: string | null
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
            foreignKeyName: "report_expenses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      securities: {
        Row: {
          analyst_count: number | null
          analyst_last_month_avg: number | null
          analyst_last_month_count: number | null
          analyst_last_quarter_avg: number | null
          analyst_last_quarter_count: number | null
          analyst_publishers: string[] | null
          analyst_target_high: number | null
          analyst_target_low: number | null
          analyst_target_price: number | null
          aum: number | null
          avg_daily_volume: number | null
          base_credit_rating: string | null
          base_currency: string | null
          base_current_account: number | null
          base_inflation_rate: number | null
          base_interest_rate: number | null
          bid_ask_spread: number | null
          blockchain: string | null
          change_1d: number | null
          change_1w: number | null
          change_ytd: number | null
          circulating_supply: number | null
          commodity_type: string | null
          contract_size: number | null
          coupon_rate: number | null
          created_at: string
          credit_rating: string | null
          currency: string | null
          current_price: number | null
          debt_to_equity: number | null
          delivery_month: string | null
          distribution_policy: string | null
          dividend_yield: number | null
          domicile: string | null
          eps: number | null
          exchange: string | null
          expense_ratio: number | null
          fcf: number | null
          fcf_yield: number | null
          forward_rate_12m: number | null
          forward_rate_3m: number | null
          fx_atr: number | null
          fx_volatility_30d: number | null
          id: string
          industry: string | null
          interest_coverage: number | null
          isin: string | null
          market_cap: number | null
          maturity_date: string | null
          max_supply: number | null
          name: string
          nav: number | null
          nav_premium_discount: number | null
          operating_margin: number | null
          payout_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          price_updated_at: string | null
          quote_credit_rating: string | null
          quote_currency: string | null
          quote_current_account: number | null
          quote_inflation_rate: number | null
          quote_interest_rate: number | null
          recent_analyses: Json | null
          resistance_level: number | null
          return_1y: number | null
          return_3y: number | null
          return_5y: number | null
          revenue_growth: number | null
          roe: number | null
          sector: string | null
          security_type: string | null
          spot_rate: number | null
          support_level: number | null
          ticker: string | null
          top_10_holdings_weight: number | null
          tracking_error: number | null
          tracking_index: string | null
          updated_at: string
          user_id: string
          volatility: number | null
          yield_to_maturity: number | null
        }
        Insert: {
          analyst_count?: number | null
          analyst_last_month_avg?: number | null
          analyst_last_month_count?: number | null
          analyst_last_quarter_avg?: number | null
          analyst_last_quarter_count?: number | null
          analyst_publishers?: string[] | null
          analyst_target_high?: number | null
          analyst_target_low?: number | null
          analyst_target_price?: number | null
          aum?: number | null
          avg_daily_volume?: number | null
          base_credit_rating?: string | null
          base_currency?: string | null
          base_current_account?: number | null
          base_inflation_rate?: number | null
          base_interest_rate?: number | null
          bid_ask_spread?: number | null
          blockchain?: string | null
          change_1d?: number | null
          change_1w?: number | null
          change_ytd?: number | null
          circulating_supply?: number | null
          commodity_type?: string | null
          contract_size?: number | null
          coupon_rate?: number | null
          created_at?: string
          credit_rating?: string | null
          currency?: string | null
          current_price?: number | null
          debt_to_equity?: number | null
          delivery_month?: string | null
          distribution_policy?: string | null
          dividend_yield?: number | null
          domicile?: string | null
          eps?: number | null
          exchange?: string | null
          expense_ratio?: number | null
          fcf?: number | null
          fcf_yield?: number | null
          forward_rate_12m?: number | null
          forward_rate_3m?: number | null
          fx_atr?: number | null
          fx_volatility_30d?: number | null
          id?: string
          industry?: string | null
          interest_coverage?: number | null
          isin?: string | null
          market_cap?: number | null
          maturity_date?: string | null
          max_supply?: number | null
          name: string
          nav?: number | null
          nav_premium_discount?: number | null
          operating_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          price_updated_at?: string | null
          quote_credit_rating?: string | null
          quote_currency?: string | null
          quote_current_account?: number | null
          quote_inflation_rate?: number | null
          quote_interest_rate?: number | null
          recent_analyses?: Json | null
          resistance_level?: number | null
          return_1y?: number | null
          return_3y?: number | null
          return_5y?: number | null
          revenue_growth?: number | null
          roe?: number | null
          sector?: string | null
          security_type?: string | null
          spot_rate?: number | null
          support_level?: number | null
          ticker?: string | null
          top_10_holdings_weight?: number | null
          tracking_error?: number | null
          tracking_index?: string | null
          updated_at?: string
          user_id: string
          volatility?: number | null
          yield_to_maturity?: number | null
        }
        Update: {
          analyst_count?: number | null
          analyst_last_month_avg?: number | null
          analyst_last_month_count?: number | null
          analyst_last_quarter_avg?: number | null
          analyst_last_quarter_count?: number | null
          analyst_publishers?: string[] | null
          analyst_target_high?: number | null
          analyst_target_low?: number | null
          analyst_target_price?: number | null
          aum?: number | null
          avg_daily_volume?: number | null
          base_credit_rating?: string | null
          base_currency?: string | null
          base_current_account?: number | null
          base_inflation_rate?: number | null
          base_interest_rate?: number | null
          bid_ask_spread?: number | null
          blockchain?: string | null
          change_1d?: number | null
          change_1w?: number | null
          change_ytd?: number | null
          circulating_supply?: number | null
          commodity_type?: string | null
          contract_size?: number | null
          coupon_rate?: number | null
          created_at?: string
          credit_rating?: string | null
          currency?: string | null
          current_price?: number | null
          debt_to_equity?: number | null
          delivery_month?: string | null
          distribution_policy?: string | null
          dividend_yield?: number | null
          domicile?: string | null
          eps?: number | null
          exchange?: string | null
          expense_ratio?: number | null
          fcf?: number | null
          fcf_yield?: number | null
          forward_rate_12m?: number | null
          forward_rate_3m?: number | null
          fx_atr?: number | null
          fx_volatility_30d?: number | null
          id?: string
          industry?: string | null
          interest_coverage?: number | null
          isin?: string | null
          market_cap?: number | null
          maturity_date?: string | null
          max_supply?: number | null
          name?: string
          nav?: number | null
          nav_premium_discount?: number | null
          operating_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          price_updated_at?: string | null
          quote_credit_rating?: string | null
          quote_currency?: string | null
          quote_current_account?: number | null
          quote_inflation_rate?: number | null
          quote_interest_rate?: number | null
          recent_analyses?: Json | null
          resistance_level?: number | null
          return_1y?: number | null
          return_3y?: number | null
          return_5y?: number | null
          revenue_growth?: number | null
          roe?: number | null
          sector?: string | null
          security_type?: string | null
          spot_rate?: number | null
          support_level?: number | null
          ticker?: string | null
          top_10_holdings_weight?: number | null
          tracking_error?: number | null
          tracking_index?: string | null
          updated_at?: string
          user_id?: string
          volatility?: number | null
          yield_to_maturity?: number | null
        }
        Relationships: []
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
      stock_prices: {
        Row: {
          change: number | null
          change_percent: string | null
          current_price: number | null
          date: string
          fetched_at: string | null
          high_price: number | null
          id: number
          low_price: number | null
          market_cap: number | null
          open_price: number | null
          pe_ratio: number | null
          previous_close: number | null
          symbol: string
          volume: number | null
          year_high: number | null
          year_low: number | null
        }
        Insert: {
          change?: number | null
          change_percent?: string | null
          current_price?: number | null
          date: string
          fetched_at?: string | null
          high_price?: number | null
          id?: number
          low_price?: number | null
          market_cap?: number | null
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          symbol: string
          volume?: number | null
          year_high?: number | null
          year_low?: number | null
        }
        Update: {
          change?: number | null
          change_percent?: string | null
          current_price?: number | null
          date?: string
          fetched_at?: string | null
          high_price?: number | null
          id?: number
          low_price?: number | null
          market_cap?: number | null
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          symbol?: string
          volume?: number | null
          year_high?: number | null
          year_low?: number | null
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
      suppliers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
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
            referencedRelation: "tag_usage_counts"
            referencedColumns: ["id"]
          },
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
          category_id: string | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          user_id: string
          validator_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subnet_id?: number | null
          title: string
          updated_at?: string
          user_id: string
          validator_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subnet_id?: number | null
          title?: string
          updated_at?: string
          user_id?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      user_saved_filters: {
        Row: {
          conditions: Json
          created_at: string
          filter_type: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          filter_type?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          filter_type?: string
          id?: string
          name?: string
          updated_at?: string
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
      user_ui_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wealth_asset_note_links: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_asset_note_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wealth_asset_note_links_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_asset_notes: {
        Row: {
          asset_id: string
          content: string
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          content: string
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          content?: string
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_asset_notes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_asset_valuations: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          notes: string | null
          valuation_date: string
          value: number
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          notes?: string | null
          valuation_date?: string
          value: number
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          valuation_date?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "wealth_asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_assets: {
        Row: {
          allocation_weight: number | null
          annual_rate_percent: number | null
          appreciation_type: string | null
          category: string
          consider_appreciation: boolean | null
          created_at: string
          currency: string | null
          current_value: number | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          notes: string | null
          previous_valuation: number | null
          profit_loss_value: number | null
          purchase_date: string | null
          purchase_price: number | null
          recovery_value: number | null
          status: string | null
          subcategory: string | null
          target_value_6m: number | null
          target_weight: number | null
          updated_at: string
          user_id: string | null
          vintage_year: number | null
          yield_expected: number | null
          yield_percent: number | null
        }
        Insert: {
          allocation_weight?: number | null
          annual_rate_percent?: number | null
          appreciation_type?: string | null
          category: string
          consider_appreciation?: boolean | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          previous_valuation?: number | null
          profit_loss_value?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          recovery_value?: number | null
          status?: string | null
          subcategory?: string | null
          target_value_6m?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string | null
          vintage_year?: number | null
          yield_expected?: number | null
          yield_percent?: number | null
        }
        Update: {
          allocation_weight?: number | null
          annual_rate_percent?: number | null
          appreciation_type?: string | null
          category?: string
          consider_appreciation?: boolean | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          previous_valuation?: number | null
          profit_loss_value?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          recovery_value?: number | null
          status?: string | null
          subcategory?: string | null
          target_value_6m?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string | null
          vintage_year?: number | null
          yield_expected?: number | null
          yield_percent?: number | null
        }
        Relationships: []
      }
      wealth_market_data: {
        Row: {
          currency: string | null
          fetched_at: string
          id: string
          price: number
          source: string | null
          symbol: string
        }
        Insert: {
          currency?: string | null
          fetched_at?: string
          id?: string
          price: number
          source?: string | null
          symbol: string
        }
        Update: {
          currency?: string | null
          fetched_at?: string
          id?: string
          price?: number
          source?: string | null
          symbol?: string
        }
        Relationships: []
      }
      wealth_milestones: {
        Row: {
          achieved_date: string | null
          asset_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          milestone_type: string | null
          name: string
          proceeds_destination_asset_id: string | null
          proceeds_destination_type: string | null
          status: string | null
          target_date: string | null
          target_value: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achieved_date?: string | null
          asset_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: string | null
          name: string
          proceeds_destination_asset_id?: string | null
          proceeds_destination_type?: string | null
          status?: string | null
          target_date?: string | null
          target_value: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achieved_date?: string | null
          asset_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: string | null
          name?: string
          proceeds_destination_asset_id?: string | null
          proceeds_destination_type?: string | null
          status?: string | null
          target_date?: string | null
          target_value?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wealth_milestones_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wealth_milestones_proceeds_destination_asset_id_fkey"
            columns: ["proceeds_destination_asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_portfolio_snapshots: {
        Row: {
          breakdown: Json | null
          created_at: string
          id: string
          net_worth: number | null
          snapshot_date: string
          total_assets: number | null
          total_liabilities: number | null
          user_id: string | null
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string
          id?: string
          net_worth?: number | null
          snapshot_date?: string
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Update: {
          breakdown?: Json | null
          created_at?: string
          id?: string
          net_worth?: number | null
          snapshot_date?: string
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      wealth_subcategories: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      wealth_transactions: {
        Row: {
          affects_asset_value: boolean | null
          amount: number
          asset_id: string | null
          category: string | null
          category_weight: number | null
          counterparty: string | null
          created_at: string
          currency: string | null
          date: string
          description: string
          id: string
          notes: string | null
          project_id: string | null
          running_balance: number | null
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affects_asset_value?: boolean | null
          amount: number
          asset_id?: string | null
          category?: string | null
          category_weight?: number | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description: string
          id?: string
          notes?: string | null
          project_id?: string | null
          running_balance?: number | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affects_asset_value?: boolean | null
          amount?: number
          asset_id?: string | null
          category?: string | null
          category_weight?: number | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          running_balance?: number | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wealth_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "wealth_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wealth_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "expense_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_size: number | null
          file_url: string
          financial_value: number | null
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          notes: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url: string
          financial_value?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url?: string
          financial_value?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "work_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_folders: {
        Row: {
          category: string | null
          category_options: Json | null
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          status: string | null
          status_options: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          category_options?: Json | null
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          status?: string | null
          status_options?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          category_options?: Json | null
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          status?: string | null
          status_options?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "work_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_column_config: {
        Row: {
          column_id: string
          created_at: string
          id: string
          options: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          options?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          options?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_file_index: {
        Row: {
          file_id: string
          id: string
          indexed_at: string
          search_text: string
          tokens: unknown
        }
        Insert: {
          file_id: string
          id?: string
          indexed_at?: string
          search_text: string
          tokens?: unknown
        }
        Update: {
          file_id?: string
          id?: string
          indexed_at?: string
          search_text?: string
          tokens?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "workflow_file_index_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "workflow_files"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_files: {
        Row: {
          category: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          currency: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          line_items_summary: string | null
          mime_type: string | null
          notes: string | null
          payment_method: string | null
          priority: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vendor_name: string | null
          vendor_vat: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items_summary?: string | null
          mime_type?: string | null
          notes?: string | null
          payment_method?: string | null
          priority?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
          vendor_vat?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items_summary?: string | null
          mime_type?: string | null
          notes?: string | null
          payment_method?: string | null
          priority?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
          vendor_vat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_storage_locations: {
        Row: {
          company_id: string
          created_at: string
          folder_id: string | null
          folder_path: string | null
          id: string
          month: number
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          folder_id?: string | null
          folder_path?: string | null
          id?: string
          month: number
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          folder_id?: string | null
          folder_path?: string | null
          id?: string
          month?: number
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_storage_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_storage_locations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "company_folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_board_structure: {
        Row: {
          board_id: string | null
          board_name: string | null
          list_id: string | null
          list_name: string | null
        }
        Relationships: []
      }
      tag_usage_counts: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          id: string | null
          name: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_account_balance: {
        Args: { p_account_id: string; p_company_id: string }
        Returns: number
      }
      calculate_account_balance_v2: {
        Args: { p_account_id: string }
        Returns: number
      }
      exec_sql: { Args: { sql_query: string }; Returns: Json }
      get_schema_info: { Args: never; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_workflow_index_stats: {
        Args: never
        Returns: {
          last_indexed_at: string
          pending_files: number
          total_indexed: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_notes:
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              category: string
              content: string
              created_at: string
              id: string
              similarity: number
              summary: string
              title: string
              updated_at: string
            }[]
          }
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              p_user_id?: string
              query_embedding: string
            }
            Returns: {
              category: string
              content: string
              created_at: string
              id: string
              similarity: number
              summary: string
              title: string
              updated_at: string
            }[]
          }
      recalculate_note_clusters: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      reorder_cards: {
        Args: { card_id: string; new_list_id: string; new_position: number }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_can_access_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "worker"
      expense_status: "pending" | "approved" | "rejected"
      file_status: "parsed" | "summarized" | "processed"
      financial_payment_method:
        | "cash"
        | "bank_transfer"
        | "check"
        | "credit_card"
        | "debit_card"
        | "mbway"
        | "multibanco"
      financial_project_status: "active" | "completed" | "cancelled" | "on_hold"
      investment_status: "pending" | "committed" | "deployed" | "exited"
      loan_status: "active" | "paid" | "overdue" | "cancelled"
      report_status: "draft" | "submitted" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      transaction_category:
        | "sales"
        | "materials"
        | "salaries"
        | "services"
        | "taxes"
        | "utilities"
        | "other"
      transaction_type: "income" | "expense" | "notification" | "receipt"
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
      app_role: ["admin", "moderator", "user", "worker"],
      expense_status: ["pending", "approved", "rejected"],
      file_status: ["parsed", "summarized", "processed"],
      financial_payment_method: [
        "cash",
        "bank_transfer",
        "check",
        "credit_card",
        "debit_card",
        "mbway",
        "multibanco",
      ],
      financial_project_status: ["active", "completed", "cancelled", "on_hold"],
      investment_status: ["pending", "committed", "deployed", "exited"],
      loan_status: ["active", "paid", "overdue", "cancelled"],
      report_status: ["draft", "submitted", "approved", "rejected"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      transaction_category: [
        "sales",
        "materials",
        "salaries",
        "services",
        "taxes",
        "utilities",
        "other",
      ],
      transaction_type: ["income", "expense", "notification", "receipt"],
    },
  },
} as const
