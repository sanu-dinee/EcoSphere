import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ Check existing session on refresh
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        loadUserProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2️⃣ Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId) => {
    // 1️⃣ Get auth user (email lives here)
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // 2️⃣ Get profile data (NO email here)
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setUser(null);
      setLoading(false);
      return;
    }

    // 🚫 Admin-only check
    if (data.usertype !== 1) {
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      return;
    }

    // ✅ Merge auth + profile data
    setUser({
      username: data.username,
      email: authUser.email, // ✅ correct source
      contactnum: data.contactnum,
    });

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
