import { supabase } from '../supabase/client';

export async function createAdminUser(email: string, password: string) {
  try {
    // First, create the user in auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Failed to create user');

    // Then set their role as ADMIN
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('id', authData.user.id);

    if (updateError) throw updateError;

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error.message };
  }
}