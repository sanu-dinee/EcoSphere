import { supabase } from '../../../lib/supabaseClient';

export const submitGarbageReport = async ({
  latitude,
  longitude,
  description,
  photos,
  citizenno, // UUID of the logged-in user
}) => {
  if (photos.length === 0) {
    throw new Error('At least one photo is required');
  }

  const bucketName = 'garbage-photos'; // Your Supabase storage bucket
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let imageUrl = ''; // We'll store only ONE primary image URL (as per schema)

  try {
    // Upload the FIRST photo only (since imageurl is a single text column)
    // You can change logic to pick the "best" one or allow multiple later
    const file = photos[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `reports/${fileName}`; // Optional folder organization

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL (bucket must be public)
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    imageUrl = urlData.publicUrl;

    // Insert into illegalwastereport table
    const { error: insertError } = await supabase
      .from('illegalwastereport')
      .insert({
        description: description.trim(),
        dateposted: today,
        imageurl: imageUrl,
        status: 'pending', // Initial status
        datereport: today,
        citizenno: citizenno, // Must be a valid UUID from auth.users or your users table
        latitude: latitude ? parseFloat(latitude.toFixed(5)) : null,
        longitude: longitude ? parseFloat(longitude.toFixed(5)) : null,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};