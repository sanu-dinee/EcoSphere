import { supabase } from "../../../lib/supabaseClient";

export const fetchCitizenAddress = async (userId) => {
  if (!userId) return { address: '', province: '', nearestcouncil: '' };

  const { data, error } = await supabase
    .from("citizen")
    .select("address, province, nearestcouncil")  // ← Fixed column name
    .eq("citizenid", userId)
    .single();

  if (error || !data) {
    console.warn("fetchCitizenAddress no data/error:", error?.message);
    return { address: '', province: '', nearestcouncil: '' };  // ← Return empty object
  }
  
  return {
    address: data.address || '',
    province: data.province || '',
    council: data.nearestcouncil || ''  // ← Map to 'council' for frontend
  };
};

export const updateUserProfile = async ({
  userId,
  username,
  email,
  address,
  province,        // ← NEW
  council,         // ← NEW (maps to nearestcouncil)
  photoFile,
  currentPhotoPath,
}) => {
  if (!userId) throw new Error("User ID missing");
  if (!username?.trim() || !email?.trim())
    throw new Error("Username and email required");

  let photoUrl = currentPhotoPath;

  if (photoFile) {
    const ext = photoFile.name.split(".").pop();
    const path = `public/${userId}/profile.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, photoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    photoUrl = data.publicUrl;
  }

  // Update users table (username, email, photo)
  const { error: userError } = await supabase
    .from("users")
    .update({
      username: username.trim(),
      email: email.trim(),
      userphotopath: photoUrl,
    })
    .eq("id", userId);

  if (userError) throw userError;

  // Check if citizen exists
  const { data: citizen } = await supabase
    .from("citizen")
    .select("id")
    .eq("citizenid", userId)
    .single();

  if (!citizen) {
    // INSERT new citizen with ALL fields
    const { error } = await supabase.from("citizen").insert({
      citizenid: userId,
      fullname: username.trim(),
      address: address?.trim() || null,
      province: province?.trim() || null,           // ← NEW
      nearestcouncil: council?.trim() || null,      // ← NEW (your schema column)
      totalpoints: 0,
    });
    if (error) throw error;
  } else {
    // UPDATE existing citizen with ALL fields
    const { error } = await supabase
      .from("citizen")
      .update({ 
        fullname: username.trim(),
        address: address?.trim() || null,
        province: province?.trim() || null,           // ← NEW
        nearestcouncil: council?.trim() || null,      // ← NEW
      })
      .eq("citizenid", userId);
    if (error) throw error;
  }

  return photoUrl;
};

export const fetchTreeCount = async (userId) => {
  if (!userId) return 0;

  const { data, error } = await supabase
    .from("treestatus")
    .select("treecount")
    .eq("citizenno", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return 0;
    console.warn("Tree count fetch error:", error.message);
    return 0;
  }

  return data?.treecount || 0;
};