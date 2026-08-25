// src/services/rewardsService.js
import { supabase } from '../../../lib/supabaseClient';

export const rewardsService = {
  // Fetch current user's points and set up realtime subscription
  async setupPointsListener(onPointsUpdate, onError) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');

      const userId = user.id;

      // Initial fetch
      const { data, error: fetchError } = await supabase
        .from('citizen')
        .select('totalpoints')
        .eq('citizenid', userId)
        .single();

      if (fetchError) throw fetchError;
      onPointsUpdate(data.totalpoints || 0);

      // Realtime subscription
      const subscription = supabase
        .channel(`citizen-points:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'citizen',
            filter: `citizenid=eq.${userId}`,
          },
          (payload) => {
            onPointsUpdate(payload.new.totalpoints || 0);
          }
        )
        .subscribe();

      return subscription;
    } catch (err) {
      onError(err);
      onPointsUpdate(0);
    }
  },

  // Handle reward redemption (marks code as used, deducts points)
  async redeemReward(reward, currentPoints, onSuccess, onError) {
    if (currentPoints < reward.points) {
      onError(new Error(`You need ${reward.points} points.`));
      return;
    }

    const originalPoints = currentPoints;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get unused codes
      const { data: codes, error: fetchError } = await supabase
        .from('discountcodes')
        .select('codeno, pointsdeducted')
        .eq('used', false);

      if (fetchError) throw fetchError;
      if (!codes || codes.length === 0) {
        throw new Error('No discount codes available right now. Please try again later.');
      }

      const randomIndex = Math.floor(Math.random() * codes.length);
      const selectedCode = codes[randomIndex];
      const codeNo = selectedCode.codeno;
      const pointsToDeduct = selectedCode.pointsdeducted ?? reward.points;

      if (currentPoints < pointsToDeduct) {
        throw new Error(`This reward requires ${pointsToDeduct} points.`);
      }

      const newPoints = currentPoints - pointsToDeduct;

      // Optimistic update via callback
      onSuccess({ newPoints, code: codeNo, title: reward.title });

      // Mark code as used
      const { error: markError } = await supabase
        .from('discountcodes')
        .update({ used: true })
        .eq('codeno', codeNo);

      if (markError) throw markError;

      // Deduct points
      const { error: updateError } = await supabase
        .from('citizen')
        .update({ totalpoints: newPoints })
        .eq('citizenid', user.id);

      if (updateError) throw updateError;

    } catch (err) {
      onError(err);
      // Caller should rollback points if needed
    }
  },

  // Cleanup subscription
  removeSubscription(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },
};