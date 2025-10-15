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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attachment_translations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          attachment_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          target_language: string
          translated_file_path: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachment_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          target_language: string
          translated_file_path?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachment_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          target_language?: string
          translated_file_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachment_translations_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "job_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_attachments: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          default_terms: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          default_terms?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          default_terms?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string
          client_signature_data: string | null
          client_signature_date: string | null
          content: string
          contract_number: string
          created_at: string
          deadline: string | null
          file_url: string | null
          freelancer_id: string | null
          freelancer_signature_data: string | null
          freelancer_signature_date: string | null
          id: string
          job_id: string
          metadata: Json | null
          payment_terms: string | null
          status: string
          template_id: string | null
          terms: string | null
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          client_signature_data?: string | null
          client_signature_date?: string | null
          content: string
          contract_number: string
          created_at?: string
          deadline?: string | null
          file_url?: string | null
          freelancer_id?: string | null
          freelancer_signature_data?: string | null
          freelancer_signature_date?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          payment_terms?: string | null
          status?: string
          template_id?: string | null
          terms?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_signature_data?: string | null
          client_signature_date?: string | null
          content?: string
          contract_number?: string
          created_at?: string
          deadline?: string | null
          file_url?: string | null
          freelancer_id?: string | null
          freelancer_signature_data?: string | null
          freelancer_signature_date?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          payment_terms?: string | null
          status?: string
          template_id?: string | null
          terms?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          freelancer_id: string
          id: string
          invitation_id: string | null
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          freelancer_id: string
          id?: string
          invitation_id?: string | null
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          freelancer_id?: string
          id?: string
          invitation_id?: string | null
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      danish_universities: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          job_id: string | null
          mollie_payment_id: string | null
          payment_period_end: string
          payment_period_start: string
          payout_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          job_id?: string | null
          mollie_payment_id?: string | null
          payment_period_end: string
          payment_period_start: string
          payout_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          job_id?: string | null
          mollie_payment_id?: string | null
          payment_period_end?: string
          payment_period_start?: string
          payout_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_change_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          new_email: string
          status: string
          user_id: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          new_email: string
          status?: string
          user_id: string
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          new_email?: string
          status?: string
          user_id?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          post_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          post_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          post_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          last_reply_by: string | null
          reply_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_by?: string | null
          reply_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_by?: string | null
          reply_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_reply_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          client_id: string
          created_at: string
          freelancer_id: string
          id: string
          job_id: string
          message: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          freelancer_id: string
          id?: string
          job_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          freelancer_id?: string
          id?: string
          job_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          availability: string | null
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          proposed_rate: number | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          availability?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          availability?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_guideline: boolean | null
          job_id: string
          mime_type: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_guideline?: boolean | null
          job_id: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_guideline?: boolean | null
          job_id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          allowed_continents: string[] | null
          allowed_countries: string[] | null
          budget_max: number | null
          budget_min: number | null
          client_id: string
          completed_at: string | null
          contract_duration_weeks: number | null
          created_at: string
          currency: string | null
          deadline: string | null
          description: string
          final_amount: number | null
          freelancer_id: string | null
          hours_per_week: number | null
          id: string
          is_permanent_consultant: boolean | null
          is_remote: boolean | null
          location: string | null
          payment_type: string | null
          positions_available: number | null
          project_type: string
          remote_restriction_type: string | null
          requires_approval: boolean | null
          skills_required: string[] | null
          software_required: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allowed_continents?: string[] | null
          allowed_countries?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          client_id: string
          completed_at?: string | null
          contract_duration_weeks?: number | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description: string
          final_amount?: number | null
          freelancer_id?: string | null
          hours_per_week?: number | null
          id?: string
          is_permanent_consultant?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          payment_type?: string | null
          positions_available?: number | null
          project_type?: string
          remote_restriction_type?: string | null
          requires_approval?: boolean | null
          skills_required?: string[] | null
          software_required?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allowed_continents?: string[] | null
          allowed_countries?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string
          completed_at?: string | null
          contract_duration_weeks?: number | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string
          final_amount?: number | null
          freelancer_id?: string | null
          hours_per_week?: number | null
          id?: string
          is_permanent_consultant?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          payment_type?: string | null
          positions_available?: number | null
          project_type?: string
          remote_restriction_type?: string | null
          requires_approval?: boolean | null
          skills_required?: string[] | null
          software_required?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      language_skills: {
        Row: {
          created_at: string | null
          id: string
          language_code: string
          language_name: string
          proficiency_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_code: string
          language_name: string
          proficiency_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language_code?: string
          language_name?: string
          proficiency_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          filtered_content: string | null
          id: string
          is_filtered: boolean | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          filtered_content?: string | null
          id?: string
          is_filtered?: boolean | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          filtered_content?: string | null
          id?: string
          is_filtered?: boolean | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          verification_code: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          verification_code: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          verification_code?: string
        }
        Relationships: []
      }
      profile_access_audit: {
        Row: {
          access_type: string
          accessed_user_id: string
          accessor_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type?: string
          accessed_user_id: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_user_id?: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_user_id: string
          accessor_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_user_id: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_user_id?: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profile_images: {
        Row: {
          admin_notes: string | null
          approved_by: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          image_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_by?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          image_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_by?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          image_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_reports: {
        Row: {
          admin_notes: string | null
          conversation_data: Json | null
          created_at: string
          description: string | null
          id: string
          report_category: string
          report_reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          conversation_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          report_category?: string
          report_reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          conversation_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          report_category?: string
          report_reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          active_status: boolean | null
          address: string | null
          availability: string | null
          avatar_url: string | null
          bank_name: string | null
          bio: string | null
          birthday: string | null
          city: string | null
          company: string | null
          created_at: string
          full_name: string
          gender: string | null
          hourly_rate: number | null
          iban: string | null
          id: string
          is_admin: boolean | null
          location: string | null
          mitid_verification_date: string | null
          mitid_verified: boolean | null
          mollie_customer_id: string | null
          payment_method: string | null
          payment_method_verified: boolean | null
          payment_verification_date: string | null
          payment_verified: boolean | null
          paypal_email: string | null
          phone: string | null
          phone_verification_code: string | null
          phone_verified: boolean | null
          postal_code: string | null
          rating: number | null
          rating_count: number | null
          referral_limit: number | null
          referrals_used: number | null
          registration_number: string | null
          role: string | null
          skills: string[] | null
          software_skills: string[] | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          active_status?: boolean | null
          address?: string | null
          availability?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          full_name: string
          gender?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          is_admin?: boolean | null
          location?: string | null
          mitid_verification_date?: string | null
          mitid_verified?: boolean | null
          mollie_customer_id?: string | null
          payment_method?: string | null
          payment_method_verified?: boolean | null
          payment_verification_date?: string | null
          payment_verified?: boolean | null
          paypal_email?: string | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_limit?: number | null
          referrals_used?: number | null
          registration_number?: string | null
          role?: string | null
          skills?: string[] | null
          software_skills?: string[] | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          active_status?: boolean | null
          address?: string | null
          availability?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          is_admin?: boolean | null
          location?: string | null
          mitid_verification_date?: string | null
          mitid_verified?: boolean | null
          mollie_customer_id?: string | null
          payment_method?: string | null
          payment_method_verified?: boolean | null
          payment_verification_date?: string | null
          payment_verified?: boolean | null
          paypal_email?: string | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_limit?: number | null
          referrals_used?: number | null
          registration_number?: string | null
          role?: string | null
          skills?: string[] | null
          software_skills?: string[] | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          project_type: string
          project_url: string | null
          start_date: string | null
          still_working_here: boolean | null
          technologies: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          project_type?: string
          project_url?: string | null
          start_date?: string | null
          still_working_here?: boolean | null
          technologies?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          project_type?: string
          project_url?: string | null
          start_date?: string | null
          still_working_here?: boolean | null
          technologies?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_bonuses: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          referral_id: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          referral_id: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          referral_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_bonuses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          bonus_paid: boolean | null
          bonus_paid_at: string | null
          created_at: string
          id: string
          referred_earnings: number | null
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referred_earnings?: number | null
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referred_earnings?: number | null
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_change_requests: {
        Row: {
          admin_notes: string | null
          approved_by: string | null
          created_at: string
          current_user_role: string
          id: string
          reason: string | null
          requested_role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_by?: string | null
          created_at?: string
          current_user_role: string
          id?: string
          reason?: string | null
          requested_role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_by?: string | null
          created_at?: string
          current_user_role?: string
          id?: string
          reason?: string | null
          requested_role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      under_18_applications: {
        Row: {
          birthday: string
          code_languages: string[] | null
          created_at: string | null
          cv_file_name: string | null
          cv_file_path: string | null
          education_institution: string | null
          email: string
          id: string
          language_skills: string[] | null
          software_skills: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          birthday: string
          code_languages?: string[] | null
          created_at?: string | null
          cv_file_name?: string | null
          cv_file_path?: string | null
          education_institution?: string | null
          email: string
          id?: string
          language_skills?: string[] | null
          software_skills?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          birthday?: string
          code_languages?: string[] | null
          created_at?: string | null
          cv_file_name?: string | null
          cv_file_path?: string | null
          education_institution?: string | null
          email?: string
          id?: string
          language_skills?: string[] | null
          software_skills?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_access_profile_with_audit: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: {
          access_logged_at: string
          created_at: string
          full_name: string
          id: string
          location: string
          phone: string
          user_id: string
        }[]
      }
      admin_change_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          full_name: string
          is_admin: boolean
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_get_profile_by_id: {
        Args: { _reason?: string; _user_id: string }
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          phone: string
          role: string
          skills: string[]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      admin_get_users_with_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          is_admin: boolean
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_view_profile_audit: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          location: string
          phone: string
          user_id: string
        }[]
      }
      calculate_user_total_earnings: {
        Args: { user_id_param: string }
        Returns: number
      }
      check_email_role_conflict: {
        Args: { desired_role: string; user_email: string }
        Returns: boolean
      }
      check_phone_availability: {
        Args: { phone_number: string }
        Returns: boolean
      }
      cleanup_expired_phone_verifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_admin_user: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
      generate_contract_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_public_profiles_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          role: string
          skills: string[]
          user_id: string
          username: string
        }[]
      }
      get_own_profile_basic: {
        Args: { _user_id: string }
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          is_admin: boolean
          location: string
          role: string
          skills: string[]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_own_profile_complete: {
        Args: { _user_id: string }
        Returns: {
          active_status: boolean
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          mitid_verified: boolean
          payment_verified: boolean
          phone_verified: boolean
          rating: number
          rating_count: number
          role: string
          skills: string[]
          software_skills: string[]
          total_earnings: number
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_own_profile_financial: {
        Args: { _user_id: string }
        Returns: {
          account_holder_name: string
          bank_name: string
          iban: string
        }[]
      }
      get_own_profile_personal: {
        Args: { _user_id: string }
        Returns: {
          address: string
          city: string
          mitid_verification_date: string
          mitid_verified: boolean
          phone: string
          postal_code: string
        }[]
      }
      get_public_freelancer_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          location: string
          role: string
          skills: string[]
          user_id: string
          username: string
        }[]
      }
      get_public_profile_by_id: {
        Args: { _user_id: string }
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          role: string
          skills: string[]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_public_profile_secure: {
        Args: { _user_id: string }
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          role: string
          skills: string[]
          user_id: string
          username: string
        }[]
      }
      get_secure_freelancer_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: string
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          hourly_rate: number
          location: string
          role: string
          skills: string[]
          user_id: string
          username: string
        }[]
      }
      is_client_profile_complete: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_freelancer_profile_complete: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_profile_access: {
        Args: { _access_type?: string; _accessed_user_id: string }
        Returns: undefined
      }
      mask_sensitive_profile_data: {
        Args: { _user_id: string }
        Returns: {
          full_name: string
          has_financial_data: boolean
          id: string
          location: string
          masked_iban: string
          masked_phone: string
          user_id: string
        }[]
      }
      update_own_profile_safe: {
        Args: { _updates: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
