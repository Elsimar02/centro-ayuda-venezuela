"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchReports, moderateReport, submitReport, verifyReport } from "@/lib/reports";
import { Draft, Report, REPORT_PRIORITY } from "@/lib/types";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offlineQueue = useRef<{ draft: Draft; city: string }[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const channelId = useRef(`reports-changes-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let active = true;
    fetchReports()
      .then((rows) => {
        if (active) {
          setReports(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudo conectar con la base de datos.");
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(channelId.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as { id: string }).id);
            }
            const updated = payload.new as unknown as Report;
            const exists = prev.some((r) => r.id === updated.id);
            return exists
              ? prev.map((r) => (r.id === updated.id ? updated : r))
              : [updated, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const submit = useCallback(async (draft: Draft, scenarioCity: string, offline: boolean) => {
    if (offline) {
      offlineQueue.current.push({ draft, city: scenarioCity });
      setQueueCount(offlineQueue.current.length);
      return { id: "pendiente (offline)" } as Report;
    }
    const created = await submitReport(draft, scenarioCity);
    setReports((prev) => (prev.some((r) => r.id === created.id) ? prev : [created, ...prev]));
    return created;
  }, []);

  const flushQueue = useCallback(async () => {
    const queue = offlineQueue.current;
    offlineQueue.current = [];
    setQueueCount(0);
    for (const { draft, city } of queue) {
      try {
        await submitReport(draft, city);
      } catch {
        // se perderá si falla; el usuario puede reintentar manualmente
      }
    }
    return queue.length;
  }, []);

  const verify = useCallback(async (report: Report, kind: "confirm" | "attended" | "incorrect") => {
    const patch = await verifyReport(report, kind);
    setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, ...patch } : r)));
  }, []);

  const moderate = useCallback(async (report: Report, action: "verify" | "false" | "delete") => {
    if (action === "delete") {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      await moderateReport(report, action);
      return;
    }
    const patch = await moderateReport(report, action);
    if (patch) setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, ...patch } : r)));
  }, []);

  const sortedReports = useMemo(
    () =>
      reports.toSorted((a, b) => {
        const diff = REPORT_PRIORITY[a.type] - REPORT_PRIORITY[b.type];
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [reports]
  );

  return { reports: sortedReports, loading, error, submit, verify, moderate, flushQueue, queueCount };
}
