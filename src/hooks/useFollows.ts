"use client";

import { useCallback, useEffect, useState } from "react";
import { Follow, getFollows, toggleFollow } from "@/lib/follows";
import { Report } from "@/lib/types";

// Lee la lista de seguidos y se re-renderiza cuando cambia (en esta pestaña vía
// el evento "ccc-follows", o en otra pestaña vía el evento "storage").
export function useFollows() {
  const [follows, setFollows] = useState<Follow[]>([]);

  useEffect(() => {
    const sync = () => setFollows(getFollows());
    sync();
    window.addEventListener("ccc-follows", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ccc-follows", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((report: Report) => toggleFollow(report), []);
  const followingIds = new Set(follows.map((f) => f.id));

  return { follows, toggle, isFollowing: (id: string) => followingIds.has(id) };
}
