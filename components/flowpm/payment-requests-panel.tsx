"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { firestoreToDate } from "@/lib/firebase/firestore-dates";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { planDisplayLabel } from "@/lib/flowpm/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PaymentSubmissionRow = {
  id: string;
  gateway: string;
  plan: string;
  payerPhone: string;
  transactionId: string;
  note: string | null;
  submittedByUid: string;
  status: string;
  createdAt: Date | null;
};

export function PaymentRequestsPanel(props: { orgId: string }) {
  const { orgId } = props;
  const { firebaseUser, refreshProfile } = useFlowAuth();
  const db = getFirebaseDb();
  const [rows, setRows] = useState<PaymentSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "organizations", orgId, "paymentSubmissions"),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(25),
        );
        const snap = await getDocs(q);
        const list: PaymentSubmissionRow[] = snap.docs.map((d) => {
          const x = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            gateway: String(x.gateway ?? ""),
            plan: String(x.plan ?? ""),
            payerPhone: String(x.payerPhone ?? ""),
            transactionId: String(x.transactionId ?? ""),
            note: x.note != null ? String(x.note) : null,
            submittedByUid: String(x.submittedByUid ?? ""),
            status: String(x.status ?? ""),
            createdAt: firestoreToDate(x.createdAt),
          };
        });
        if (!cancelled) setRows(list);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [db, orgId]);

  async function approve(row: PaymentSubmissionRow) {
    const uid = firebaseUser?.uid;
    if (!uid) return;
    setBusyId(row.id);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      const subRef = doc(db, "organizations", orgId, "paymentSubmissions", row.id);
      const orgRef = doc(db, "organizations", orgId);
      const planToSet = row.plan === "agency" ? "agency" : "pro";
      batch.update(subRef, {
        status: "approved",
        reviewedByUid: uid,
        reviewedAt: serverTimestamp(),
      });
      batch.update(orgRef, { plan: planToSet });
      await batch.commit();
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage("Plan updated for the workspace.");
      await refreshProfile();
    } catch {
      setMessage("Could not approve. Check Firestore rules and deploy indexes, then try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(row: PaymentSubmissionRow) {
    const uid = firebaseUser?.uid;
    if (!uid) return;
    setBusyId(row.id);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "organizations", orgId, "paymentSubmissions", row.id), {
        status: "rejected",
        reviewedByUid: uid,
        reviewedAt: serverTimestamp(),
      });
      await batch.commit();
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage("Marked as rejected.");
    } catch {
      setMessage("Could not reject.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="border-flowpm-border shadow-card">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Payment requests (bKash / Nagad)</CardTitle>
        <p className="text-sm text-flowpm-muted">
          Pending submissions from your team. Approve after you verify the transaction — this sets the workspace plan
          to Pro or Ultra.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {message ? <p className="text-xs text-flowpm-muted">{message}</p> : null}
        {loading ? (
          <p className="text-flowpm-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-flowpm-muted">No pending payment requests.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border border-flowpm-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {row.gateway}
                    </Badge>
                    <span className="font-medium text-flowpm-body">{planDisplayLabel(row.plan)}</span>
                  </div>
                  <p className="text-xs text-flowpm-muted">
                    From: <span className="font-mono text-flowpm-body">{row.payerPhone}</span> · Txn:{" "}
                    <span className="font-mono text-flowpm-body">{row.transactionId}</span>
                  </p>
                  {row.note ? <p className="text-xs text-flowpm-muted">Note: {row.note}</p> : null}
                  <p className="text-[11px] text-flowpm-muted">
                    Submitter UID: <span className="font-mono">{row.submittedByUid}</span>
                    {row.createdAt ? ` · ${row.createdAt.toLocaleString()}` : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#0F6E56] hover:bg-[#0c5c49]"
                    disabled={busyId === row.id}
                    onClick={() => void approve(row)}
                  >
                    Approve &amp; set plan
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={busyId === row.id} onClick={() => void reject(row)}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
