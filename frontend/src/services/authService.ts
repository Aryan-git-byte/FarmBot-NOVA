import { supabase } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });

      if (error) {
        return { user: null, error };
      }

      return { 
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at
        } : null, 
        error: null 
      };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Sign up failed') 
      };
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error };
      }

      return { 
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at
        } : null, 
        error: null 
      };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Sign in failed') 
      };
    }
  }

  // Sign out
  static async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Sign out failed') 
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  // Subscribe to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at
      } : null;
      
      callback(user);
    });
  }
}