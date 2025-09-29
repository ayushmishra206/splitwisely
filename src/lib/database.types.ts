export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          member_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          group_id: string;
          member_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          member_id?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_member_id_fkey';
            columns: ['member_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          payer_id: string | null;
          description: string;
          amount: string;
          expense_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          payer_id?: string | null;
          description: string;
          amount: string;
          expense_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          payer_id?: string | null;
          description?: string;
          amount?: string;
          expense_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_payer_id_fkey';
            columns: ['payer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          member_id: string;
          share: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          member_id: string;
          share: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          member_id?: string;
          share?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_splits_expense_id_fkey';
            columns: ['expense_id'];
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_splits_member_id_fkey';
            columns: ['member_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          from_member: string;
          to_member: string;
          amount: string;
          settlement_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_member: string;
          to_member: string;
          amount: string;
          settlement_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_member?: string;
          to_member?: string;
          amount?: string;
          settlement_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'settlements_from_member_fkey';
            columns: ['from_member'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settlements_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settlements_to_member_fkey';
            columns: ['to_member'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      is_group_member: {
        Args: { target_group: string };
        Returns: boolean;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

export type Tables<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Row'];
export type TablesInsert<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Insert'];
export type TablesUpdate<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Update'];
