import { supabase } from '../../../lib/supabaseClient';

/**
 * @param {Object} payload
 * @param {number} payload.latitude
 * @param {number} payload.longitude
 * @param {string} payload.requestedDate  // YYYY-MM-DD format
 * @param {string} payload.citizenno      // UUID from auth
 * @param {string} [payload.notes]        // optional
 * @returns {Promise<{ success: boolean, error?: any }>}
 */
export const submitPickupRequest = async ({
  latitude,
  longitude,
  requestedDate,
  citizenno,
  notes = null,
}) => {
  try {
    if (!citizenno) throw new Error('User ID is required');
    if (!requestedDate || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      throw new Error('Valid date (YYYY-MM-DD) is required');
    }

    const { error } = await supabase
      .from('garbagepickuprequest')
      .insert({
        requestdate: requestedDate,
        citizenno: citizenno,
        latitude: latitude != null ? parseFloat(latitude.toFixed(6)) : null,
        longitude: longitude != null ? parseFloat(longitude.toFixed(6)) : null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Pickup request failed:', err);
    return { success: false, error: err.message || err };
  }
};