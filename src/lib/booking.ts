import type { BookingPlatform } from "./types";

export const NO_INVENTORY_COPY =
  "We identify the place and open the booking site. We don't have live table inventory.";

export type DeepLink = {
  platform: BookingPlatform;
  url: string;
  label: string;
};

function ymd(date?: string) {
  return date || new Date().toISOString().slice(0, 10);
}

export function bookingDeepLink(opts: {
  name: string;
  websiteUri?: string;
  platform: BookingPlatform;
  date?: string;
  partySize?: number;
}): DeepLink {
  const seats = opts.partySize || 2;
  const date = ymd(opts.date);
  const site = opts.websiteUri || "";
  const q = encodeURIComponent(opts.name);

  if (opts.platform === "resy" || site.includes("resy.com")) {
    if (site.includes("resy.com")) {
      const u = new URL(site);
      u.searchParams.set("date", date);
      u.searchParams.set("seats", String(seats));
      return { platform: "resy", url: u.toString(), label: "Book on Resy" };
    }
    return {
      platform: "resy",
      url: `https://resy.com/cities?query=${q}`,
      label: "Find on Resy",
    };
  }

  if (opts.platform === "opentable" || site.includes("opentable.com")) {
    const slug = site.match(/opentable\.com\/r\/([^/?]+)/)?.[1];
    if (slug) {
      return {
        platform: "opentable",
        url: `https://www.opentable.com/r/${slug}?covers=${seats}&dateTime=${encodeURIComponent(date + "T19:00")}`,
        label: "Book on OpenTable",
      };
    }
    return {
      platform: "opentable",
      url: `https://www.opentable.com/s?covers=${seats}&dateTime=${encodeURIComponent(date + "T19:00")}&term=${q}`,
      label: "Find on OpenTable",
    };
  }

  if (opts.platform === "tock" || /tock\.com|exploretock/.test(site)) {
    if (site) return { platform: "tock", url: site, label: "Book on Tock" };
    return {
      platform: "tock",
      url: `https://www.exploretock.com/search?q=${q}`,
      label: "Find on Tock",
    };
  }

  if (opts.platform === "sevenrooms" && site) {
    return { platform: "sevenrooms", url: site, label: "Book on SevenRooms" };
  }

  if (site) {
    return { platform: "website", url: site, label: "Open restaurant site" };
  }

  return {
    platform: "unknown",
    url: `https://www.google.com/maps/search/?api=1&query=${q}`,
    label: "Find on Google Maps",
  };
}

export function bookingWindowCopy(opts: { date?: string; city?: string; restaurant?: boolean }) {
  if (!opts.date) {
    return "Set a date range on this board. Popular rooms often open 7, 14, or 30 days out — we send you to the booking site; we never show fake time slots.";
  }
  return `For ${opts.date}${opts.city ? ` in ${opts.city}` : ""}, check the booking site's calendar. DateDrop does not read live availability and will not snipe or hold a table.`;
}
