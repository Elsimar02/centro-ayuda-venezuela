"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function usePresence() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const clientId = Math.random().toString(36).slice(2);
    const channel = supabase.channel("online-users", {
      config: { presence: { key: clientId } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") channel.track({ online_at: new Date().toISOString() });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
