import { supabase } from '../lib/supabaseClient';

export async function adminLogin(email, password) {
  // 1️⃣ Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // 2️⃣ Fetch user profile from public.users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    throw new Error("User profile not found");
  }

  // 3️⃣ Ensure user is Admin (usertype = 1)
  if (profile.usertype !== 1) {
    await supabase.auth.signOut();
    throw new Error("Unauthorized: Not an admin account");
  }

  return profile;
}