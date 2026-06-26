"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addUpdate, fetchUpdates } from "@/lib/reports";
import { NewUpdate, ReportUpdate } from "@/lib/types";

export function useReportUpdates(reportId: string) {
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchUpdates(reportId)
      .then((rows) => {
        if (active) {
          setUpdates(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const channel = supabase
      .channel(`report-updates-${reportId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_updates", filter: `report_id=eq.${reportId}` },
        (payload) => {
          const row = payload.new as unknown as ReportUpdate;
          setUpdates((prev) => (prev.some((u) => u.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  const add = useCallback(
    async (u: NewUpdate) => {
      const created = await addUpdate(reportId, u);
      setUpdates((prev) => (prev.some((x) => x.id === created.id) ? prev : [...prev, created]));
      return created;
    },
    [reportId]
  );

  return { updates, loading, add };
}
