import { supabase } from '../supabase/client';
import { LoginFormData } from './validation';

export async function signInWithEmail({ email, password }: LoginFormData) {
  try {
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from authentication');

    // Fetch user role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (roleError) throw roleError;
    if (!userData) throw new Error('User data not found');

    return {
      user: data.user,
      session: data.session,
      role: userData.role,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

export async function getUserRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('User role not found');

    return data;
  } catch (error: any) {
    console.error('Error fetching user role:', error);
    throw new Error(error.message || 'Failed to fetch user role');
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}