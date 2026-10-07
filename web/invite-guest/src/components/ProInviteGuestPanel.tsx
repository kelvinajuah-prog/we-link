import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProInviteBridge, SearchGuest, WelinkEventOption } from "../types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  bridge: ProInviteBridge;
  events: WelinkEventOption[];
};

function mapDbStatus(
  raw: ReturnType<ProInviteBridge["invitationStatus"]>
): "invite" | "pending" | "accepted" | "declined" {
  if (raw === "pending") return "pending";
  if (raw === "accepted") return "accepted";
  if (raw === "declined") return "declined";
  return "invite";
}

export function ProInviteGuestPanel({ bridge, events }: Props) {
  const activeEvents = useMemo(
    () => events.filter((e) => e.status !== "cancelled"),
    [events]
  );
  const [eventId, setEventId] = useState(activeEvents[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<SearchGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!eventId && activeEvents[0]?.id) setEventId(activeEvents[0].id);
  }, [activeEvents, eventId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      const res = await bridge.searchGuests(q.trim());
      setGuests(res.ok ? res.guests : []);
      setLoading(false);
    },
    [bridge]
  );

  useEffect(() => {
    if (!query.trim()) {
      setGuests([]);
      setLoading(false);
      return;
    }
    const t = window.setTimeout(() => {
      runSearch(query);
    }, 280);
    return () => window.clearTimeout(t);
  }, [query, runSearch]);

  const refreshLocal = () => bump((n) => n + 1);

  const handleInvite = async (guestId: string) => {
    if (!eventId) return;
    setActionKey(`${eventId}:${guestId}`);
    const res = await bridge.sendInvitation(eventId, guestId);
    setActionKey(null);
    if (!res.ok) {
      setToast(res.error || "Could not send invitation.");
      return;
    }
    setToast(res.message || "Invitation Sent");
    refreshLocal();
  };

  const handleWithdraw = async (guestId: string) => {
    if (!eventId) return;
    setActionKey(`${eventId}:${guestId}:w`);
    const res = await bridge.withdrawInvitation(eventId, guestId);
    setActionKey(null);
    if (!res.ok) {
      setToast(res.error || "Could not withdraw invitation.");
      return;
    }
    setToast("Invitation withdrawn");
    refreshLocal();
  };

  const showEmpty = !loading && query.trim().length > 0 && guests.length === 0;

  return (
    <section className="welink-invite-scope rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-7">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Events</p>
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Invite Guest</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Search the WeLink guest directory and send event invitations. Guests can accept or decline before the event
          appears on their schedule.
        </p>
      </header>

      {activeEvents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white px-4 py-6 text-sm text-muted">
          Schedule an event first, then return here to invite guests.
        </p>
      ) : (
        <>
          <label className="mb-4 block text-sm font-semibold text-ink">
            Event
            <select
              className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-ink/10 focus:ring-2"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              {activeEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-ink">
            Search guests
            <div className="relative mt-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest by name, username, or email…"
                className="w-full rounded-full border border-line bg-white py-3 pl-4 pr-4 text-sm text-ink outline-none ring-ink/10 placeholder:text-stone-400 focus:ring-2"
                autoComplete="off"
              />
            </div>
          </label>

          {toast ? (
            <p
              className="mt-4 rounded-full bg-ink px-4 py-2 text-center text-sm font-medium text-white"
              role="status"
            >
              {toast}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            {!query.trim() ? (
              <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-muted">
                Type a name, username, or email to find guests to invite.
              </p>
            ) : loading ? (
              <p className="text-sm text-muted">Searching…</p>
            ) : showEmpty ? (
              <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-muted">
                No guest found. Try another name or username
              </p>
            ) : (
              guests.map((g) => {
                const st = mapDbStatus(bridge.invitationStatus(eventId, g.id));
                const busy = actionKey === `${eventId}:${g.id}` || actionKey === `${eventId}:${g.id}:w`;
                return (
                  <article
                    key={g.id}
                    className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={bridge.avatarUrl({ photo: g.photo, name: g.name })}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-line"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{g.name}</p>
                        <p className="truncate text-xs text-muted">@{g.username}</p>
                        <p className="mt-1 text-sm text-ink/80">
                          {g.profession} · {g.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {st === "pending" ? (
                        <>
                          <StatusBadge status="pending" />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleWithdraw(g.id)}
                            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-canvas disabled:opacity-60"
                          >
                            Withdraw invite
                          </button>
                        </>
                      ) : st === "accepted" ? (
                        <StatusBadge status="accepted" />
                      ) : st === "declined" ? (
                        <>
                          <StatusBadge status="declined" />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleInvite(g.id)}
                            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                          >
                            Invite again
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || !eventId}
                          onClick={() => handleInvite(g.id)}
                          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                        >
                          Invite
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}
