export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      github_installations: {
        Row: {
          access_token_encrypted: string | null;
          account_login: string;
          account_type: string;
          created_at: string;
          id: string;
          installation_id: number;
          organization_id: string;
          repositories: Json;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          account_login: string;
          account_type?: string;
          created_at?: string;
          id?: string;
          installation_id: number;
          organization_id: string;
          repositories?: Json;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          account_login?: string;
          account_type?: string;
          created_at?: string;
          id?: string;
          installation_id?: number;
          organization_id?: string;
          repositories?: Json;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'github_installations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      jira_integrations: {
        Row: {
          access_token_encrypted: string;
          auth_type: string;
          auto_create_tickets: boolean;
          auto_transition_enabled: boolean;
          cloud_id: string | null;
          created_at: string;
          default_issue_type: string;
          email: string | null;
          id: string;
          is_active: boolean;
          merge_transition_id: string | null;
          organization_id: string;
          project_keys: string[];
          refresh_token_encrypted: string | null;
          site_url: string;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          access_token_encrypted: string;
          auth_type?: string;
          auto_create_tickets?: boolean;
          auto_transition_enabled?: boolean;
          cloud_id?: string | null;
          created_at?: string;
          default_issue_type?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          merge_transition_id?: string | null;
          organization_id: string;
          project_keys?: string[];
          refresh_token_encrypted?: string | null;
          site_url: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token_encrypted?: string;
          auth_type?: string;
          auto_create_tickets?: boolean;
          auto_transition_enabled?: boolean;
          cloud_id?: string | null;
          created_at?: string;
          default_issue_type?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          merge_transition_id?: string | null;
          organization_id?: string;
          project_keys?: string[];
          refresh_token_encrypted?: string | null;
          site_url?: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'jira_integrations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: true;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          channel: string;
          created_at: string;
          error_message: string | null;
          external_message_id: string | null;
          id: string;
          message_type: string;
          organization_id: string;
          payload: Json;
          recipient: string;
          review_assignment_id: string | null;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          error_message?: string | null;
          external_message_id?: string | null;
          id?: string;
          message_type: string;
          organization_id: string;
          payload?: Json;
          recipient: string;
          review_assignment_id?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          external_message_id?: string | null;
          id?: string;
          message_type?: string;
          organization_id?: string;
          payload?: Json;
          recipient?: string;
          review_assignment_id?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_review_assignment_id_fkey';
            columns: ['review_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'review_assignments';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database['public']['Enums']['organization_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: Database['public']['Enums']['organization_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database['public']['Enums']['organization_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          default_reviewer_id: string | null;
          id: string;
          name: string;
          settings: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_reviewer_id?: string | null;
          id?: string;
          name: string;
          settings?: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_reviewer_id?: string | null;
          id?: string;
          name?: string;
          settings?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_default_reviewer';
            columns: ['default_reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'reviewers';
            referencedColumns: ['id'];
          },
        ];
      };
      processed_events: {
        Row: {
          event_id: string;
          event_type: string;
          id: string;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          id?: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          id?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      pull_requests: {
        Row: {
          additions: number;
          author: string;
          author_avatar_url: string | null;
          body: string | null;
          closed_at: string | null;
          created_at: string;
          deletions: number;
          files_changed: Json;
          github_pr_id: number;
          github_pr_number: number;
          html_url: string;
          id: string;
          jira_ticket_id: string | null;
          merged_at: string | null;
          organization_id: string;
          repository: string;
          status: Database['public']['Enums']['pr_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          additions?: number;
          author: string;
          author_avatar_url?: string | null;
          body?: string | null;
          closed_at?: string | null;
          created_at?: string;
          deletions?: number;
          files_changed?: Json;
          github_pr_id: number;
          github_pr_number: number;
          html_url: string;
          id?: string;
          jira_ticket_id?: string | null;
          merged_at?: string | null;
          organization_id: string;
          repository: string;
          status?: Database['public']['Enums']['pr_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          additions?: number;
          author?: string;
          author_avatar_url?: string | null;
          body?: string | null;
          closed_at?: string | null;
          created_at?: string;
          deletions?: number;
          files_changed?: Json;
          github_pr_id?: number;
          github_pr_number?: number;
          html_url?: string;
          id?: string;
          jira_ticket_id?: string | null;
          merged_at?: string | null;
          organization_id?: string;
          repository?: string;
          status?: Database['public']['Enums']['pr_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pull_requests_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      review_assignments: {
        Row: {
          assigned_at: string;
          completed_at: string | null;
          created_at: string;
          escalated_at: string | null;
          escalation_level: Database['public']['Enums']['escalation_level'];
          first_notified_at: string | null;
          id: string;
          pull_request_id: string;
          reminded_at: string | null;
          reviewer_id: string;
          routing_rule_id: string | null;
          status: Database['public']['Enums']['assignment_status'];
          updated_at: string;
        };
        Insert: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          escalated_at?: string | null;
          escalation_level?: Database['public']['Enums']['escalation_level'];
          first_notified_at?: string | null;
          id?: string;
          pull_request_id: string;
          reminded_at?: string | null;
          reviewer_id: string;
          routing_rule_id?: string | null;
          status?: Database['public']['Enums']['assignment_status'];
          updated_at?: string;
        };
        Update: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          escalated_at?: string | null;
          escalation_level?: Database['public']['Enums']['escalation_level'];
          first_notified_at?: string | null;
          id?: string;
          pull_request_id?: string;
          reminded_at?: string | null;
          reviewer_id?: string;
          routing_rule_id?: string | null;
          status?: Database['public']['Enums']['assignment_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_assignments_pull_request_id_fkey';
            columns: ['pull_request_id'];
            isOneToOne: false;
            referencedRelation: 'pull_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_assignments_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'reviewers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_assignments_routing_rule_id_fkey';
            columns: ['routing_rule_id'];
            isOneToOne: false;
            referencedRelation: 'routing_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      reviewers: {
        Row: {
          created_at: string;
          email: string | null;
          github_username: string;
          id: string;
          is_active: boolean;
          is_team_lead: boolean;
          organization_id: string;
          slack_user_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          github_username: string;
          id?: string;
          is_active?: boolean;
          is_team_lead?: boolean;
          organization_id: string;
          slack_user_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          github_username?: string;
          id?: string;
          is_active?: boolean;
          is_team_lead?: boolean;
          organization_id?: string;
          slack_user_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviewers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviewers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      routing_rules: {
        Row: {
          conditions: Json;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          priority: number;
          reviewer_ids: string[];
          updated_at: string;
        };
        Insert: {
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          priority?: number;
          reviewer_ids?: string[];
          updated_at?: string;
        };
        Update: {
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          priority?: number;
          reviewer_ids?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'routing_rules_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      slack_integrations: {
        Row: {
          bot_token_encrypted: string;
          bot_user_id: string | null;
          created_at: string;
          escalation_channel_id: string | null;
          id: string;
          is_active: boolean;
          organization_id: string;
          team_channel_id: string | null;
          team_id: string;
          team_name: string;
          updated_at: string;
          webhook_url_encrypted: string | null;
        };
        Insert: {
          bot_token_encrypted: string;
          bot_user_id?: string | null;
          created_at?: string;
          escalation_channel_id?: string | null;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          team_channel_id?: string | null;
          team_id: string;
          team_name: string;
          updated_at?: string;
          webhook_url_encrypted?: string | null;
        };
        Update: {
          bot_token_encrypted?: string;
          bot_user_id?: string | null;
          created_at?: string;
          escalation_channel_id?: string | null;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          team_channel_id?: string | null;
          team_id?: string;
          team_name?: string;
          updated_at?: string;
          webhook_url_encrypted?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'slack_integrations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: true;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_has_org_access: { Args: { org_id: string }; Returns: boolean };
      user_is_org_admin: { Args: { org_id: string }; Returns: boolean };
    };
    Enums: {
      assignment_status:
        | 'pending'
        | 'approved'
        | 'changes_requested'
        | 'commented'
        | 'dismissed';
      escalation_level: 'none' | 'reminded' | 'escalated';
      organization_role: 'owner' | 'admin' | 'member';
      pr_status: 'open' | 'merged' | 'closed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      assignment_status: [
        'pending',
        'approved',
        'changes_requested',
        'commented',
        'dismissed',
      ],
      escalation_level: ['none', 'reminded', 'escalated'],
      organization_role: ['owner', 'admin', 'member'],
      pr_status: ['open', 'merged', 'closed'],
    },
  },
} as const;
