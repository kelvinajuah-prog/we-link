export type InviteStatus = "invite" | "pending" | "accepted" | "declined" | null;

export type SearchGuest = {
  id: string;
  name: string;
  username: string;
  profession: string;
  location: string;
  photo: string;
};

export type WelinkEventOption = {
  id: string;
  title: string;
  status: string;
};

export type ProInviteBridge = {
  searchGuests: (query: string) => Promise<{ ok: boolean; guests: SearchGuest[]; error?: string }>;
  sendInvitation: (
    eventId: string,
    guestId: string
  ) => Promise<{ ok: boolean; status?: string; message?: string; error?: string }>;
  withdrawInvitation: (eventId: string, guestId: string) => Promise<{ ok: boolean; error?: string }>;
  invitationStatus: (eventId: string, guestId: string) => InviteStatus;
  avatarUrl: (guest: { photo?: string; name?: string }) => string;
};

export type GuestInviteBridge = {
  listPending: () => Array<{
    notificationId: string;
    eventId: string;
    eventTitle: string;
    proName: string;
    eventAt: number | null;
    message: string;
  }>;
  accept: (eventId: string) => Promise<{ ok: boolean; error?: string }>;
  decline: (eventId: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdated: () => void;
};
