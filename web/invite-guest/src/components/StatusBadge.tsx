type Props = { status: "invite" | "pending" | "accepted" | "declined" };

const styles: Record<Props["status"], string> = {
  invite: "bg-ink text-white",
  pending: "bg-amber-100 text-amber-900 border border-amber-200",
  accepted: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  declined: "bg-stone-200 text-stone-600 border border-stone-300"
};

const labels: Record<Props["status"], string> = {
  invite: "Invite",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined"
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
