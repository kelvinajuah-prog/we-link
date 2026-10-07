import { useState } from "react";
import type { GuestInviteBridge } from "../types";

type Props = { bridge: GuestInviteBridge };

function fmtWhen(ts: number | null) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export function GuestInvitationInbox({ bridge }: Props) {
  const [items, setItems] = useState(() => bridge.listPending());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = () => setItems(bridge.listPending());

  const accept = async (eventId: string) => {
    setBusyId(eventId);
    setError("");
    const res = await bridge.accept(eventId);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error || "Could not accept invitation.");
      return;
    }
    refresh();
    bridge.onUpdated();
  };

  const decline = async (eventId: string) => {
    setBusyId(eventId);
    setError("");
    const res = await bridge.decline(eventId);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error || "Could not decline invitation.");
      return;
    }
    refresh();
    bridge.onUpdated();
  };

  if (!items.length) return null;

  return (
    <section className="welink-invite-scope mb-6 rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-7">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Inbox</p>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Event invitations</h2>
      </header>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <ul className="space-y-3">
        {items.map((inv) => (
          <li
            key={inv.notificationId}
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <p className="text-sm leading-relaxed text-ink">
              You have received an event invitation from <strong>{inv.proName}</strong>
            </p>
            <p className="mt-1 font-display text-lg font-bold text-ink">{inv.eventTitle}</p>
            {inv.eventAt ? <p className="mt-1 text-xs text-muted">{fmtWhen(inv.eventAt)}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === inv.eventId}
                onClick={() => accept(inv.eventId)}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
              >
                Accept Invitation
              </button>
              <button
                type="button"
                disabled={busyId === inv.eventId}
                onClick={() => decline(inv.eventId)}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-60"
              >
                Decline Invitation
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
