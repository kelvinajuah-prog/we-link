import { createRoot, Root } from "react-dom/client";
import "./index.css";
import { ProInviteGuestPanel } from "./components/ProInviteGuestPanel";
import { GuestInvitationInbox } from "./components/GuestInvitationInbox";
import type { GuestInviteBridge, ProInviteBridge, WelinkEventOption } from "./types";

const roots = new WeakMap<HTMLElement, Root>();

function getRoot(el: HTMLElement) {
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  return root;
}

export function mountProInviteGuest(
  container: HTMLElement,
  options: { bridge: ProInviteBridge; events: WelinkEventOption[] }
) {
  getRoot(container).render(<ProInviteGuestPanel bridge={options.bridge} events={options.events} />);
}

export function mountGuestInvitations(container: HTMLElement, options: { bridge: GuestInviteBridge }) {
  getRoot(container).render(<GuestInvitationInbox bridge={options.bridge} />);
}

export function unmountInviteUi(container: HTMLElement) {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
}

declare global {
  interface Window {
    WeLinkInviteUI?: {
      mountProInviteGuest: typeof mountProInviteGuest;
      mountGuestInvitations: typeof mountGuestInvitations;
      unmountInviteUi: typeof unmountInviteUi;
    };
  }
}

if (typeof window !== "undefined") {
  window.WeLinkInviteUI = {
    mountProInviteGuest,
    mountGuestInvitations,
    unmountInviteUi
  };
}
