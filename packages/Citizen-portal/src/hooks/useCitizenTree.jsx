import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCitizenTree(citizenId) {
  const [treeLevel, setTreeLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citizenId) return;

    // Initial fetch
    const fetchTree = async () => {
      const { data, error } = await supabase
        .from("treestatus")
        .select("treelevel")
        .eq("citizenno", citizenId)
        .single();

      if (!error) {
        setTreeLevel(data.treelevel);
      }
      setLoading(false);
    };

    fetchTree();

    // Realtime subscription
    const channel = supabase
      .channel("tree-growth-" + citizenId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "treestatus",
          filter: `citizenno=eq.${citizenId}`,
        },
        (payload) => {
          setTreeLevel(payload.new.treelevel);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [citizenId]);

  return { treeLevel, loading };
}

export default useCitizenTree;
