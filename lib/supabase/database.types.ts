
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "account_events": {
                  Row: {
                    "business_id": string,"drop_account_id": string,"id": string,"metadata": Json | null,"occurred_at": string,"type": Database["public"]['Enums']["account_event_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"drop_account_id": string,"id"?: string,"metadata"?: Json | null,"occurred_at"?: string,"type": Database["public"]['Enums']["account_event_type"]
                  }
                  Update: {
                    "business_id"?: string,"drop_account_id"?: string,"id"?: string,"metadata"?: Json | null,"occurred_at"?: string,"type"?: Database["public"]['Enums']["account_event_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "account_events_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "account_events_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "account_events_drop_account_id_fkey"
      columns: ["drop_account_id"]
isOneToOne: false
      referencedRelation: "drop_accounts"
      referencedColumns: ["id"]
    }
                  ]
                },"app_config": {
                  Row: {
                    "description": string | null,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"business_exclusions": {
                  Row: {
                    "business_id": string,"created_at": string,"domain": string,"id": string,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"domain": string,"id"?: string,"reason"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"domain"?: string,"id"?: string,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_exclusions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_exclusions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    }
                  ]
                },"business_lookalikes": {
                  Row: {
                    "business_id": string,"company_id": string,"fetched_at": string,"icp_id": string,"seed_domain": string | null,"similarity": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"company_id": string,"fetched_at"?: string,"icp_id": string,"seed_domain"?: string | null,"similarity"?: number | null
                  }
                  Update: {
                    "business_id"?: string,"company_id"?: string,"fetched_at"?: string,"icp_id"?: string,"seed_domain"?: string | null,"similarity"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_lookalikes_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_lookalikes_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "business_lookalikes_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_lookalikes_icp_id_fkey"
      columns: ["icp_id"]
isOneToOne: false
      referencedRelation: "icps"
      referencedColumns: ["id"]
    }
                  ]
                },"audience_reviews": {
                  Row: {
                    "business_id": string,"company_name": string | null,"domain": string,"id": string,"lineage_id": string,"reviewed_at": string,"snapshot": Json | null,"verdict": Database["public"]["Enums"]["audience_review_verdict"]
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"company_name"?: string | null,"domain": string,"id"?: string,"lineage_id": string,"reviewed_at"?: string,"snapshot"?: Json | null,"verdict": Database["public"]["Enums"]["audience_review_verdict"]
                  }
                  Update: {
                    "business_id"?: string,"company_name"?: string | null,"domain"?: string,"id"?: string,"lineage_id"?: string,"reviewed_at"?: string,"snapshot"?: Json | null,"verdict"?: Database["public"]["Enums"]["audience_review_verdict"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "audience_reviews_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "attio_record_id": string | null,"attio_synced_at": string | null,"case_study_urls": (string)[],"created_at": string,"deal_size": Database["public"]['Enums']["deal_size"] | null,"description": string | null,"enriched_at": string | null,"enriched_profile": Json | null,"id": string,"linkedin_url": string | null,"name": string | null,"onboarding_completed_at": string | null,"owner_id": string,"prefill": Json | null,"prefilled_at": string | null,"services": (string)[],"stripe_customer_id": string | null,"updated_at": string,"website_domain": string,"x_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attio_record_id"?: string | null,"attio_synced_at"?: string | null,"case_study_urls"?: (string)[],"created_at"?: string,"deal_size"?: Database["public"]['Enums']["deal_size"] | null,"description"?: string | null,"enriched_at"?: string | null,"enriched_profile"?: Json | null,"id"?: string,"linkedin_url"?: string | null,"name"?: string | null,"onboarding_completed_at"?: string | null,"owner_id": string,"prefill"?: Json | null,"prefilled_at"?: string | null,"services"?: (string)[],"stripe_customer_id"?: string | null,"updated_at"?: string,"website_domain": string,"x_url"?: string | null
                  }
                  Update: {
                    "attio_record_id"?: string | null,"attio_synced_at"?: string | null,"case_study_urls"?: (string)[],"created_at"?: string,"deal_size"?: Database["public"]['Enums']["deal_size"] | null,"description"?: string | null,"enriched_at"?: string | null,"enriched_profile"?: Json | null,"id"?: string,"linkedin_url"?: string | null,"name"?: string | null,"onboarding_completed_at"?: string | null,"owner_id"?: string,"prefill"?: Json | null,"prefilled_at"?: string | null,"services"?: (string)[],"stripe_customer_id"?: string | null,"updated_at"?: string,"website_domain"?: string,"x_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "businesses_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "created_at": string,"description": string | null,"domain": string,"employee_count": number | null,"employee_range": Database["public"]['Enums']["employee_range"] | null,"enriched_at": string | null,"founded_year": number | null,"hq_city": string | null,"hq_country_code": string | null,"hq_state": string | null,"id": string,"industry_raw": string | null,"industry_slug": string | null,"is_suppressed": boolean,"linkedin_url": string | null,"logo_url": string | null,"name": string,"raw": Json | null,"region": Database["public"]['Enums']["region_code"] | null,"source": Database["public"]['Enums']["data_source"],"source_id": string | null,"technologies": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"domain": string,"employee_count"?: number | null,"employee_range"?: Database["public"]['Enums']["employee_range"] | null,"enriched_at"?: string | null,"founded_year"?: number | null,"hq_city"?: string | null,"hq_country_code"?: string | null,"hq_state"?: string | null,"id"?: string,"industry_raw"?: string | null,"industry_slug"?: string | null,"is_suppressed"?: boolean,"linkedin_url"?: string | null,"logo_url"?: string | null,"name": string,"raw"?: Json | null,"region"?: Database["public"]['Enums']["region_code"] | null,"source": Database["public"]['Enums']["data_source"],"source_id"?: string | null,"technologies"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"domain"?: string,"employee_count"?: number | null,"employee_range"?: Database["public"]['Enums']["employee_range"] | null,"enriched_at"?: string | null,"founded_year"?: number | null,"hq_city"?: string | null,"hq_country_code"?: string | null,"hq_state"?: string | null,"id"?: string,"industry_raw"?: string | null,"industry_slug"?: string | null,"is_suppressed"?: boolean,"linkedin_url"?: string | null,"logo_url"?: string | null,"name"?: string,"raw"?: Json | null,"region"?: Database["public"]['Enums']["region_code"] | null,"source"?: Database["public"]['Enums']["data_source"],"source_id"?: string | null,"technologies"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "companies_industry_slug_fkey"
      columns: ["industry_slug"]
isOneToOne: false
      referencedRelation: "industries"
      referencedColumns: ["slug"]
    }
                  ]
                },"company_signals": {
                  Row: {
                    "company_id": string,"created_at": string,"detected_at": string,"expires_at": string | null,"id": string,"occurred_at": string | null,"raw": Json | null,"source": Database["public"]['Enums']["data_source"],"source_url": string | null,"summary": string | null,"title": string,"type": Database["public"]['Enums']["signal_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"detected_at"?: string,"expires_at"?: string | null,"id"?: string,"occurred_at"?: string | null,"raw"?: Json | null,"source": Database["public"]['Enums']["data_source"],"source_url"?: string | null,"summary"?: string | null,"title": string,"type": Database["public"]['Enums']["signal_type"]
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"detected_at"?: string,"expires_at"?: string | null,"id"?: string,"occurred_at"?: string | null,"raw"?: Json | null,"source"?: Database["public"]['Enums']["data_source"],"source_url"?: string | null,"summary"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["signal_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_signals_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"contacts": {
                  Row: {
                    "company_id": string,"created_at": string,"department": string | null,"email": string | null,"email_confidence": number | null,"email_status": Database["public"]['Enums']["email_status"],"email_verified_at": string | null,"first_name": string | null,"full_name": string,"id": string,"is_suppressed": boolean,"last_name": string | null,"linkedin_url": string | null,"raw": Json | null,"seniority": string | null,"source": Database["public"]['Enums']["data_source"],"source_id": string | null,"title": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"department"?: string | null,"email"?: string | null,"email_confidence"?: number | null,"email_status"?: Database["public"]['Enums']["email_status"],"email_verified_at"?: string | null,"first_name"?: string | null,"full_name": string,"id"?: string,"is_suppressed"?: boolean,"last_name"?: string | null,"linkedin_url"?: string | null,"raw"?: Json | null,"seniority"?: string | null,"source": Database["public"]['Enums']["data_source"],"source_id"?: string | null,"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"department"?: string | null,"email"?: string | null,"email_confidence"?: number | null,"email_status"?: Database["public"]['Enums']["email_status"],"email_verified_at"?: string | null,"first_name"?: string | null,"full_name"?: string,"id"?: string,"is_suppressed"?: boolean,"last_name"?: string | null,"linkedin_url"?: string | null,"raw"?: Json | null,"seniority"?: string | null,"source"?: Database["public"]['Enums']["data_source"],"source_id"?: string | null,"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"drop_accounts": {
                  Row: {
                    "booked_call_at": string | null,"business_id": string,"company_id": string,"contact_id": string | null,"contacted_at": string | null,"created_at": string,"drop_id": string,"fit_reason": string,"fit_status": Database["public"]['Enums']["fit_status"] | null,"id": string,"linkedin_message": string,"not_fit_reason": Database["public"]['Enums']["not_fit_reason"] | null,"outreach_angle": string,"position": number,"replied_at": string | null,"score": number | null,"score_breakdown": Json | null,"signal_id": string | null,"snapshot": NonNullable<Json>,"updated_at": string,"viewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "booked_call_at"?: string | null,"business_id": string,"company_id": string,"contact_id"?: string | null,"contacted_at"?: string | null,"created_at"?: string,"drop_id": string,"fit_reason": string,"fit_status"?: Database["public"]['Enums']["fit_status"] | null,"id"?: string,"linkedin_message": string,"not_fit_reason"?: Database["public"]['Enums']["not_fit_reason"] | null,"outreach_angle": string,"position": number,"replied_at"?: string | null,"score"?: number | null,"score_breakdown"?: Json | null,"signal_id"?: string | null,"snapshot": NonNullable<Json>,"updated_at"?: string,"viewed_at"?: string | null
                  }
                  Update: {
                    "booked_call_at"?: string | null,"business_id"?: string,"company_id"?: string,"contact_id"?: string | null,"contacted_at"?: string | null,"created_at"?: string,"drop_id"?: string,"fit_reason"?: string,"fit_status"?: Database["public"]['Enums']["fit_status"] | null,"id"?: string,"linkedin_message"?: string,"not_fit_reason"?: Database["public"]['Enums']["not_fit_reason"] | null,"outreach_angle"?: string,"position"?: number,"replied_at"?: string | null,"score"?: number | null,"score_breakdown"?: Json | null,"signal_id"?: string | null,"snapshot"?: NonNullable<Json>,"updated_at"?: string,"viewed_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "drop_accounts_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drop_accounts_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "drop_accounts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drop_accounts_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drop_accounts_drop_id_fkey"
      columns: ["drop_id"]
isOneToOne: false
      referencedRelation: "drops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drop_accounts_signal_id_fkey"
      columns: ["signal_id"]
isOneToOne: false
      referencedRelation: "company_signals"
      referencedColumns: ["id"]
    }
                  ]
                },"drop_content": {
                  Row: {
                    "body": string,"business_id": string,"created_at": string,"drop_id": string,"id": string,"outline": Json | null,"title": string | null,"type": Database["public"]['Enums']["content_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"business_id": string,"created_at"?: string,"drop_id": string,"id"?: string,"outline"?: Json | null,"title"?: string | null,"type": Database["public"]['Enums']["content_type"]
                  }
                  Update: {
                    "body"?: string,"business_id"?: string,"created_at"?: string,"drop_id"?: string,"id"?: string,"outline"?: Json | null,"title"?: string | null,"type"?: Database["public"]['Enums']["content_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "drop_content_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drop_content_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "drop_content_drop_id_fkey"
      columns: ["drop_id"]
isOneToOne: false
      referencedRelation: "drops"
      referencedColumns: ["id"]
    }
                  ]
                },"campaign_assets": {
                  Row: {
                    "body": string,"business_id": string,"campaign_id": string | null,"created_at": string,"edited_at": string | null,"id": string,"input_hash": string,"outline": Json | null,"title": string | null,"type": Database["public"]["Enums"]["content_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"business_id": string,"campaign_id"?: string | null,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"input_hash": string,"outline"?: Json | null,"title"?: string | null,"type": Database["public"]["Enums"]["content_type"],"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"business_id"?: string,"campaign_id"?: string | null,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"input_hash"?: string,"outline"?: Json | null,"title"?: string | null,"type"?: Database["public"]["Enums"]["content_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaign_assets_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaign_assets_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    }
                  ]
                },"campaigns": {
                  Row: {
                    "audience_lineage_id": string,"business_id": string,"created_at": string,"id": string,"interpreted": Json | null,"objective": string,"status": Database["public"]["Enums"]["campaign_status"],"supporting_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience_lineage_id": string,"business_id": string,"created_at"?: string,"id"?: string,"interpreted"?: Json | null,"objective": string,"status"?: Database["public"]["Enums"]["campaign_status"],"supporting_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "audience_lineage_id"?: string,"business_id"?: string,"created_at"?: string,"id"?: string,"interpreted"?: Json | null,"objective"?: string,"status"?: Database["public"]["Enums"]["campaign_status"],"supporting_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaigns_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"drops": {
                  Row: {
                    "audience_snapshot": Json | null,"business_id": string,"campaign_id": string | null,"campaign_snapshot": Json | null,"created_at": string,"delivered_at": string | null,"delivered_count": number,"error": string | null,"icp_id": string,"id": string,"notified_at": string | null,"plan_id": string,"scheduled_for": string,"shortfall": number,"shortfall_note": string | null,"status": Database["public"]['Enums']["drop_status"],"target_count": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience_snapshot"?: Json | null,"business_id": string,"campaign_id"?: string | null,"campaign_snapshot"?: Json | null,"created_at"?: string,"delivered_at"?: string | null,"delivered_count"?: number,"error"?: string | null,"icp_id": string,"id"?: string,"notified_at"?: string | null,"plan_id": string,"scheduled_for": string,"shortfall"?: number,"shortfall_note"?: string | null,"status"?: Database["public"]['Enums']["drop_status"],"target_count": number,"updated_at"?: string
                  }
                  Update: {
                    "audience_snapshot"?: Json | null,"business_id"?: string,"campaign_id"?: string | null,"campaign_snapshot"?: Json | null,"created_at"?: string,"delivered_at"?: string | null,"delivered_count"?: number,"error"?: string | null,"icp_id"?: string,"id"?: string,"notified_at"?: string | null,"plan_id"?: string,"scheduled_for"?: string,"shortfall"?: number,"shortfall_note"?: string | null,"status"?: Database["public"]["Enums"]["drop_status"],"target_count"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "drops_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drops_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "drops_icp_id_fkey"
      columns: ["icp_id"]
isOneToOne: false
      referencedRelation: "icps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drops_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"icp_reference_accounts": {
                  Row: {
                    "created_at": string,"domain": string,"icp_id": string,"id": string,"label": string | null,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"domain": string,"icp_id": string,"id"?: string,"label"?: string | null,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"domain"?: string,"icp_id"?: string,"id"?: string,"label"?: string | null,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "icp_reference_accounts_icp_id_fkey"
      columns: ["icp_id"]
isOneToOne: false
      referencedRelation: "icps"
      referencedColumns: ["id"]
    }
                  ]
                },"icp_seed_accounts": {
                  Row: {
                    "company_id": string | null,"created_at": string,"domain": string,"icp_id": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string | null,"created_at"?: string,"domain": string,"icp_id": string,"id"?: string
                  }
                  Update: {
                    "company_id"?: string | null,"created_at"?: string,"domain"?: string,"icp_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "icp_seed_accounts_company_fk"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "icp_seed_accounts_icp_id_fkey"
      columns: ["icp_id"]
isOneToOne: false
      referencedRelation: "icps"
      referencedColumns: ["id"]
    }
                  ]
                },"icps": {
                  Row: {
                    "business_id": string,"buyer_titles": (string)[],"created_at": string,"custom_industries": (string)[],"description": string | null,"employee_ranges": (Database["public"]['Enums']["employee_range"])[],"id": string,"industry_slugs": (string)[],"is_active": boolean,"is_primary": boolean,"lineage_id": string,"name": string,"regions": (Database["public"]['Enums']["region_code"])[],"signal_types": (Database["public"]['Enums']["signal_type"])[],"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"buyer_titles"?: (string)[],"created_at"?: string,"custom_industries"?: (string)[],"description"?: string | null,"employee_ranges"?: (Database["public"]['Enums']["employee_range"])[],"id"?: string,"industry_slugs"?: (string)[],"is_active"?: boolean,"is_primary"?: boolean,"lineage_id": string,"name"?: string,"regions"?: (Database["public"]['Enums']["region_code"])[],"signal_types"?: (Database["public"]['Enums']["signal_type"])[],"updated_at"?: string,"version": number
                  }
                  Update: {
                    "business_id"?: string,"buyer_titles"?: (string)[],"created_at"?: string,"custom_industries"?: (string)[],"description"?: string | null,"employee_ranges"?: (Database["public"]['Enums']["employee_range"])[],"id"?: string,"industry_slugs"?: (string)[],"is_active"?: boolean,"is_primary"?: boolean,"lineage_id"?: string,"name"?: string,"regions"?: (Database["public"]['Enums']["region_code"])[],"signal_types"?: (Database["public"]['Enums']["signal_type"])[],"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "icps_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "icps_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    }
                  ]
                },"industries": {
                  Row: {
                    "is_active": boolean,"label": string,"ocean_values": (string)[],"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "is_active"?: boolean,"label": string,"ocean_values"?: (string)[],"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "is_active"?: boolean,"label"?: string,"ocean_values"?: (string)[],"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"libraries": {
                  Row: {
                    "created_at": string,"id": string,"industry_slugs": (string)[],"last_refreshed_at": string | null,"name": string,"slug": string,"source_query": Json | null,"status": Database["public"]['Enums']["library_status"],"target_size": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"industry_slugs"?: (string)[],"last_refreshed_at"?: string | null,"name": string,"slug": string,"source_query"?: Json | null,"status"?: Database["public"]['Enums']["library_status"],"target_size"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"industry_slugs"?: (string)[],"last_refreshed_at"?: string | null,"name"?: string,"slug"?: string,"source_query"?: Json | null,"status"?: Database["public"]['Enums']["library_status"],"target_size"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"library_companies": {
                  Row: {
                    "added_at": string,"company_id": string,"is_active": boolean,"library_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"company_id": string,"is_active"?: boolean,"library_id": string,"updated_at"?: string
                  }
                  Update: {
                    "added_at"?: string,"company_id"?: string,"is_active"?: boolean,"library_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "library_companies_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "library_companies_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "libraries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "library_companies_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "library_inventory"
      referencedColumns: ["library_id"]
    }
                  ]
                },"library_imports": {
                  Row: {
                    "column_map": Json | null,"completed_at": string | null,"created_at": string,"created_by": string | null,"errors": Json | null,"file_name": string | null,"id": string,"library_id": string,"rows_inserted": number | null,"rows_skipped": number | null,"rows_total": number | null,"rows_updated": number | null,"source": Database["public"]['Enums']["data_source"],"status": Database["public"]['Enums']["import_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "column_map"?: Json | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"errors"?: Json | null,"file_name"?: string | null,"id"?: string,"library_id": string,"rows_inserted"?: number | null,"rows_skipped"?: number | null,"rows_total"?: number | null,"rows_updated"?: number | null,"source": Database["public"]['Enums']["data_source"],"status"?: Database["public"]['Enums']["import_status"]
                  }
                  Update: {
                    "column_map"?: Json | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"errors"?: Json | null,"file_name"?: string | null,"id"?: string,"library_id"?: string,"rows_inserted"?: number | null,"rows_skipped"?: number | null,"rows_total"?: number | null,"rows_updated"?: number | null,"source"?: Database["public"]['Enums']["data_source"],"status"?: Database["public"]['Enums']["import_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "library_imports_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "library_imports_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "libraries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "library_imports_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "library_inventory"
      referencedColumns: ["library_id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "accounts_per_drop": number,"billing_interval": Database["public"]['Enums']["billing_interval"],"content_types": (Database["public"]['Enums']["content_type"])[],"created_at": string,"currency": string,"delivery_cadence": Database["public"]['Enums']["plan_cadence"],"drops_per_month": number,"id": string,"is_public": boolean,"name": string,"price_cents": number,"sort_order": number,"stripe_price_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accounts_per_drop": number,"billing_interval"?: Database["public"]['Enums']["billing_interval"],"content_types"?: (Database["public"]['Enums']["content_type"])[],"created_at"?: string,"currency"?: string,"delivery_cadence": Database["public"]['Enums']["plan_cadence"],"drops_per_month": number,"id": string,"is_public"?: boolean,"name": string,"price_cents": number,"sort_order"?: number,"stripe_price_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "accounts_per_drop"?: number,"billing_interval"?: Database["public"]['Enums']["billing_interval"],"content_types"?: (Database["public"]['Enums']["content_type"])[],"created_at"?: string,"currency"?: string,"delivery_cadence"?: Database["public"]['Enums']["plan_cadence"],"drops_per_month"?: number,"id"?: string,"is_public"?: boolean,"name"?: string,"price_cents"?: number,"sort_order"?: number,"stripe_price_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"provider_calls": {
                  Row: {
                    "business_id": string | null,"cost_cents": number | null,"created_at": string,"credits_used": number | null,"drop_id": string | null,"duration_ms": number | null,"endpoint": string,"error": string | null,"id": string,"provider": string,"status_code": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id"?: string | null,"cost_cents"?: number | null,"created_at"?: string,"credits_used"?: number | null,"drop_id"?: string | null,"duration_ms"?: number | null,"endpoint": string,"error"?: string | null,"id"?: string,"provider": string,"status_code"?: number | null
                  }
                  Update: {
                    "business_id"?: string | null,"cost_cents"?: number | null,"created_at"?: string,"credits_used"?: number | null,"drop_id"?: string | null,"duration_ms"?: number | null,"endpoint"?: string,"error"?: string | null,"id"?: string,"provider"?: string,"status_code"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "provider_calls_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "provider_calls_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "provider_calls_drop_id_fkey"
      columns: ["drop_id"]
isOneToOne: false
      referencedRelation: "drops"
      referencedColumns: ["id"]
    }
                  ]
                },"sector_requests": {
                  Row: {
                    "alerted_at": string | null,"business_id": string,"created_at": string,"custom_industries": (string)[],"due_at": string | null,"employee_ranges": (Database["public"]['Enums']["employee_range"])[],"fulfilled_at": string | null,"icp_id": string,"id": string,"industry_slugs": (string)[],"library_id": string | null,"notes": string | null,"regions": (Database["public"]['Enums']["region_code"])[],"status": Database["public"]['Enums']["sector_request_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alerted_at"?: string | null,"business_id": string,"created_at"?: string,"custom_industries"?: (string)[],"due_at"?: string | null,"employee_ranges"?: (Database["public"]['Enums']["employee_range"])[],"fulfilled_at"?: string | null,"icp_id": string,"id"?: string,"industry_slugs"?: (string)[],"library_id"?: string | null,"notes"?: string | null,"regions"?: (Database["public"]['Enums']["region_code"])[],"status"?: Database["public"]['Enums']["sector_request_status"],"updated_at"?: string
                  }
                  Update: {
                    "alerted_at"?: string | null,"business_id"?: string,"created_at"?: string,"custom_industries"?: (string)[],"due_at"?: string | null,"employee_ranges"?: (Database["public"]['Enums']["employee_range"])[],"fulfilled_at"?: string | null,"icp_id"?: string,"id"?: string,"industry_slugs"?: (string)[],"library_id"?: string | null,"notes"?: string | null,"regions"?: (Database["public"]['Enums']["region_code"])[],"status"?: Database["public"]['Enums']["sector_request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sector_requests_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sector_requests_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "sector_requests_icp_id_fkey"
      columns: ["icp_id"]
isOneToOne: false
      referencedRelation: "icps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sector_requests_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "libraries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sector_requests_library_id_fkey"
      columns: ["library_id"]
isOneToOne: false
      referencedRelation: "library_inventory"
      referencedColumns: ["library_id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "business_id": string,"cancel_at_period_end": boolean,"canceled_at": string | null,"created_at": string,"current_period_end": string | null,"current_period_start": string | null,"id": string,"plan_id": string,"status": Database["public"]['Enums']["subscription_status"],"stripe_subscription_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"cancel_at_period_end"?: boolean,"canceled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string | null,"id"?: string,"plan_id": string,"status": Database["public"]['Enums']["subscription_status"],"stripe_subscription_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"cancel_at_period_end"?: boolean,"canceled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string | null,"id"?: string,"plan_id"?: string,"status"?: Database["public"]['Enums']["subscription_status"],"stripe_subscription_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "member_activity"
      referencedColumns: ["business_id"]
    },{
      foreignKeyName: "subscriptions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"suppressions": {
                  Row: {
                    "affected_count": number,"created_at": string,"id": string,"reason": string | null,"scrub_log": NonNullable<Json>,"type": Database["public"]['Enums']["suppression_type"],"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "affected_count"?: number,"created_at"?: string,"id"?: string,"reason"?: string | null,"scrub_log"?: NonNullable<Json>,"type": Database["public"]['Enums']["suppression_type"],"value": string
                  }
                  Update: {
                    "affected_count"?: number,"created_at"?: string,"id"?: string,"reason"?: string | null,"scrub_log"?: NonNullable<Json>,"type"?: Database["public"]['Enums']["suppression_type"],"value"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "library_inventory": {
                  Row: {
                    "deliverable_count": number | null,"is_low": boolean | null,"library_id": string,"name": string,"slug": string,"status": Database["public"]['Enums']["library_status"],"weekly_demand": number | null,"weeks_of_supply": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"member_activity": {
                  Row: {
                    "accounts_booked": number | null,"accounts_contacted": number | null,"accounts_delivered": number | null,"accounts_replied": number | null,"accounts_viewed": number | null,"business_id": string,"business_name": string | null,"not_acting": boolean | null,"not_fit_ratio": number | null,"owner_id": string,"poor_fit": boolean | null,"traction": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "businesses_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "deliverable_companies":
{ Args: { "p_business_id": string,"result_limit"?: number,"p_audience_lineage_id"?: string }; Returns: {
              "company_id": string,"score": number,"score_breakdown": Json
            }[]
                           },
"ensure_sector_request":
{ Args: { "p_business_id": string }; Returns: string
                           },
"get_my_streak":
{ Args: Record<PropertyKey, never>; Returns: {
              "best_streak": number,"current_streak": number
            }[]
                           },
"update_account_state":
{ Args: { "p_booked_call"?: boolean,"p_contacted"?: boolean,"p_drop_account_id": string,"p_fit_status"?: Database["public"]['Enums']["fit_status"],"p_not_fit_reason"?: Database["public"]['Enums']["not_fit_reason"],"p_replied"?: boolean,"p_viewed"?: boolean }; Returns: {
              "booked_call_at": string | null,
"business_id": string,
"company_id": string,
"contact_id": string | null,
"contacted_at": string | null,
"created_at": string,
"drop_id": string,
"fit_reason": string,
"fit_status": Database["public"]['Enums']["fit_status"] | null,
"id": string,
"linkedin_message": string,
"not_fit_reason": Database["public"]['Enums']["not_fit_reason"] | null,
"outreach_angle": string,
"position": number,
"replied_at": string | null,
"score": number | null,
"score_breakdown": Json | null,
"signal_id": string | null,
"snapshot": NonNullable<Json>,
"updated_at": string,
"viewed_at": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "drop_accounts"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "account_event_type": "delivered"|"viewed"|"marked_fit"|"marked_not_fit"|"contacted"|"replied"|"booked_call","audience_review_verdict": "fit"|"not_fit","billing_interval": "monthly"|"yearly","campaign_status": "draft"|"active"|"completed"|"archived","content_type": "linkedin_post"|"x_post"|"blog_idea","data_source": "ocean"|"predictleads"|"csv"|"manual","deal_size": "under_10k"|"10k_25k"|"25k_75k"|"75k_plus","drop_status": "scheduled"|"building"|"delivered"|"failed"|"skipped","email_status": "verified"|"risky"|"invalid"|"unknown","employee_range": "1-10"|"11-50"|"51-200"|"201-500"|"501-1000"|"1000+","fit_status": "fit"|"not_fit","import_status": "pending"|"processing"|"completed"|"failed","library_status": "building"|"active"|"paused"|"archived","not_fit_reason": "too_small"|"too_big"|"wrong_industry"|"wrong_region"|"already_client","plan_cadence": "weekly"|"monthly","region_code": "north_america"|"uk_ireland"|"europe"|"apac"|"latin_america","sector_request_status": "open"|"in_progress"|"fulfilled"|"declined","signal_type": "funding"|"hiring"|"leadership_change"|"product_launch"|"expansion"|"news"|"other","subscription_status": "trialing"|"active"|"past_due"|"canceled"|"incomplete"|"incomplete_expired"|"unpaid"|"paused","suppression_type": "company_domain"|"person_linkedin"|"email","user_role": "standard"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_event_type": ["delivered", "viewed", "marked_fit", "marked_not_fit", "contacted", "replied", "booked_call"],"audience_review_verdict": ["fit", "not_fit"],"billing_interval": ["monthly", "yearly"],"campaign_status": ["draft", "active", "completed", "archived"],"content_type": ["linkedin_post", "x_post", "blog_idea"],"data_source": ["ocean", "predictleads", "csv", "manual"],"deal_size": ["under_10k", "10k_25k", "25k_75k", "75k_plus"],"drop_status": ["scheduled", "building", "delivered", "failed", "skipped"],"email_status": ["verified", "risky", "invalid", "unknown"],"employee_range": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],"fit_status": ["fit", "not_fit"],"import_status": ["pending", "processing", "completed", "failed"],"library_status": ["building", "active", "paused", "archived"],"not_fit_reason": ["too_small", "too_big", "wrong_industry", "wrong_region", "already_client"],"plan_cadence": ["weekly", "monthly"],"region_code": ["north_america", "uk_ireland", "europe", "apac", "latin_america"],"sector_request_status": ["open", "in_progress", "fulfilled", "declined"],"signal_type": ["funding", "hiring", "leadership_change", "product_launch", "expansion", "news", "other"],"subscription_status": ["trialing", "active", "past_due", "canceled", "incomplete", "incomplete_expired", "unpaid", "paused"],"suppression_type": ["company_domain", "person_linkedin", "email"],"user_role": ["standard", "admin"]
          }
        }
} as const
