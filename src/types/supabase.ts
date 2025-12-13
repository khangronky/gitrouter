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
      escalations: {
        Row: {
          created_at: string;
          id: string;
          level: Database['public']['Enums']['escalation_level'];
          notified_user_ids: string[] | null;
          review_assignment_id: string;
          slack_message_ts: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          level: Database['public']['Enums']['escalation_level'];
          notified_user_ids?: string[] | null;
          review_assignment_id: string;
          slack_message_ts?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          level?: Database['public']['Enums']['escalation_level'];
          notified_user_ids?: string[] | null;
          review_assignment_id?: string;
          slack_message_ts?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escalations_review_assignment_id_fkey';
            columns: ['review_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'review_assignments';
            referencedColumns: ['id'];
          },
        ];
      };
      github_installations: {
        Row: {
          account_login: string;
          account_type: string;
          created_at: string;
          id: string;
          installation_id: number;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          account_login: string;
          account_type: string;
          created_at?: string;
          id?: string;
          installation_id: number;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          account_login?: string;
          account_type?: string;
          created_at?: string;
          id?: string;
          installation_id?: number;
          organization_id?: string;
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
          access_token: string;
          cloud_id: string;
          created_at: string;
          default_project_key: string | null;
          id: string;
          organization_id: string;
          refresh_token: string | null;
          site_name: string | null;
          site_url: string;
          status_on_merge: string | null;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          cloud_id: string;
          created_at?: string;
          default_project_key?: string | null;
          id?: string;
          organization_id: string;
          refresh_token?: string | null;
          site_name?: string | null;
          site_url: string;
          status_on_merge?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          cloud_id?: string;
          created_at?: string;
          default_project_key?: string | null;
          id?: string;
          organization_id?: string;
          refresh_token?: string | null;
          site_name?: string | null;
          site_url?: string;
          status_on_merge?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'jira_integrations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
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
        Relationships: [];
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
          created_by: string;
          default_reviewer_id: string | null;
          id: string;
          name: string;
          notification_settings: Json;
          settings: Json | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          default_reviewer_id?: string | null;
          id?: string;
          name: string;
          notification_settings?: Json;
          settings?: Json | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          default_reviewer_id?: string | null;
          id?: string;
          name?: string;
          notification_settings?: Json;
          settings?: Json | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organizations_default_reviewer_fkey';
            columns: ['default_reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'reviewers';
            referencedColumns: ['id'];
          },
        ];
      };
      pull_requests: {
        Row: {
          additions: number | null;
          author_id: number | null;
          author_login: string;
          base_branch: string;
          body: string | null;
          closed_at: string | null;
          created_at: string;
          deletions: number | null;
          files_changed: string[] | null;
          github_pr_id: number;
          github_pr_number: number;
          head_branch: string;
          html_url: string;
          id: string;
          jira_ticket_id: string | null;
          merged_at: string | null;
          repository_id: string;
          status: Database['public']['Enums']['pr_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          additions?: number | null;
          author_id?: number | null;
          author_login: string;
          base_branch: string;
          body?: string | null;
          closed_at?: string | null;
          created_at?: string;
          deletions?: number | null;
          files_changed?: string[] | null;
          github_pr_id: number;
          github_pr_number: number;
          head_branch: string;
          html_url: string;
          id?: string;
          jira_ticket_id?: string | null;
          merged_at?: string | null;
          repository_id: string;
          status?: Database['public']['Enums']['pr_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          additions?: number | null;
          author_id?: number | null;
          author_login?: string;
          base_branch?: string;
          body?: string | null;
          closed_at?: string | null;
          created_at?: string;
          deletions?: number | null;
          files_changed?: string[] | null;
          github_pr_id?: number;
          github_pr_number?: number;
          head_branch?: string;
          html_url?: string;
          id?: string;
          jira_ticket_id?: string | null;
          merged_at?: string | null;
          repository_id?: string;
          status?: Database['public']['Enums']['pr_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pull_requests_repository_id_fkey';
            columns: ['repository_id'];
            isOneToOne: false;
            referencedRelation: 'repositories';
            referencedColumns: ['id'];
          },
        ];
      };
      repositories: {
        Row: {
          created_at: string;
          default_branch: string | null;
          default_reviewer_id: string | null;
          full_name: string;
          github_installation_id: string;
          github_repo_id: number;
          id: string;
          is_active: boolean;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_branch?: string | null;
          default_reviewer_id?: string | null;
          full_name: string;
          github_installation_id: string;
          github_repo_id: number;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_branch?: string | null;
          default_reviewer_id?: string | null;
          full_name?: string;
          github_installation_id?: string;
          github_repo_id?: number;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'repositories_default_reviewer_fkey';
            columns: ['default_reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'reviewers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'repositories_github_installation_id_fkey';
            columns: ['github_installation_id'];
            isOneToOne: false;
            referencedRelation: 'github_installations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'repositories_organization_id_fkey';
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
          created_at: string;
          id: string;
          notified_at: string | null;
          pull_request_id: string;
          reminder_sent_at: string | null;
          reviewed_at: string | null;
          reviewer_id: string;
          routing_rule_id: string | null;
          slack_channel_id: string | null;
          slack_message_ts: string | null;
          status: Database['public']['Enums']['review_status'];
          updated_at: string;
        };
        Insert: {
          assigned_at?: string;
          created_at?: string;
          id?: string;
          notified_at?: string | null;
          pull_request_id: string;
          reminder_sent_at?: string | null;
          reviewed_at?: string | null;
          reviewer_id: string;
          routing_rule_id?: string | null;
          slack_channel_id?: string | null;
          slack_message_ts?: string | null;
          status?: Database['public']['Enums']['review_status'];
          updated_at?: string;
        };
        Update: {
          assigned_at?: string;
          created_at?: string;
          id?: string;
          notified_at?: string | null;
          pull_request_id?: string;
          reminder_sent_at?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string;
          routing_rule_id?: string | null;
          slack_channel_id?: string | null;
          slack_message_ts?: string | null;
          status?: Database['public']['Enums']['review_status'];
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
          id: string;
          is_active: boolean;
          organization_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          updated_at?: string;
          user_id?: string;
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
          repository_id: string | null;
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
          repository_id?: string | null;
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
          repository_id?: string | null;
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
          {
            foreignKeyName: 'routing_rules_repository_id_fkey';
            columns: ['repository_id'];
            isOneToOne: false;
            referencedRelation: 'repositories';
            referencedColumns: ['id'];
          },
        ];
      };
      slack_integrations: {
        Row: {
          access_token: string;
          bot_user_id: string | null;
          created_at: string;
          default_channel_id: string | null;
          id: string;
          incoming_webhook_url: string | null;
          organization_id: string;
          team_id: string;
          team_name: string;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          bot_user_id?: string | null;
          created_at?: string;
          default_channel_id?: string | null;
          id?: string;
          incoming_webhook_url?: string | null;
          organization_id: string;
          team_id: string;
          team_name: string;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          bot_user_id?: string | null;
          created_at?: string;
          default_channel_id?: string | null;
          id?: string;
          incoming_webhook_url?: string | null;
          organization_id?: string;
          team_id?: string;
          team_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'slack_integrations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
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
          github_user_id: number | null;
          github_username: string | null;
          id: string;
          jira_account_id: string | null;
          jira_email: string | null;
          slack_user_id: string | null;
          slack_username: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          github_user_id?: number | null;
          github_username?: string | null;
          id?: string;
          jira_account_id?: string | null;
          jira_email?: string | null;
          slack_user_id?: string | null;
          slack_username?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          github_user_id?: number | null;
          github_username?: string | null;
          id?: string;
          jira_account_id?: string | null;
          jira_email?: string | null;
          slack_user_id?: string | null;
          slack_username?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          action: string | null;
          event_id: string;
          event_type: string;
          id: string;
          payload_hash: string | null;
          processed_at: string;
          repository_id: string | null;
        };
        Insert: {
          action?: string | null;
          event_id: string;
          event_type: string;
          id?: string;
          payload_hash?: string | null;
          processed_at?: string;
          repository_id?: string | null;
        };
        Update: {
          action?: string | null;
          event_id?: string;
          event_type?: string;
          id?: string;
          payload_hash?: string | null;
          processed_at?: string;
          repository_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_events_repository_id_fkey';
            columns: ['repository_id'];
            isOneToOne: false;
            referencedRelation: 'repositories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_slug: { Args: { input_text: string }; Returns: string };
      get_user_org_ids: { Args: never; Returns: string[] };
      is_org_admin:
        | { Args: { org_id: string }; Returns: boolean }
        | { Args: { org_id: string; user_id: string }; Returns: boolean };
      is_org_member:
        | { Args: { org_id: string }; Returns: boolean }
        | { Args: { org_id: string; user_id: string }; Returns: boolean };
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
      escalation_level: 'reminder_24h' | 'alert_48h';
      organization_role: 'owner' | 'admin' | 'member';
      pr_status: 'open' | 'merged' | 'closed';
      review_status:
        | 'pending'
        | 'approved'
        | 'changes_requested'
        | 'commented'
        | 'dismissed';
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
      escalation_level: ['reminder_24h', 'alert_48h'],
      organization_role: ['owner', 'admin', 'member'],
      pr_status: ['open', 'merged', 'closed'],
      review_status: [
        'pending',
        'approved',
        'changes_requested',
        'commented',
        'dismissed',
      ],
    },
  },
} as const;
