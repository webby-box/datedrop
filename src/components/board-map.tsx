"use client";

import { useEffect, useRef } from "react";

type Pin = { lat: number; lng: number; name: string };

export function BoardMap({
  pins,
  apiKey,
}: {
  pins: Pin[];
  apiKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiKey || !ref.current || !pins.length) return;
    const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    const existing = document.querySelector<HTMLScriptElement>("script[data-datedrop-maps]");
    const boot = () => {
      const g = (window as unknown as { google?: { maps: { Map: new (el: HTMLElement, opts: object) => { setCenter: (x: object) => void }; Marker: new (opts: object) => void } } }).google;
      if (!g || !ref.current) return;
      const center = { lat: pins[0].lat, lng: pins[0].lng };
      const map = new g.maps.Map(ref.current, {
        center,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1c1914" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#d4a574" }] },
          { featureType: "water", stylers: [{ color: "#0c0b09" }] },
        ],
      });
      pins.forEach((p) => new g.maps.Marker({ map, position: { lat: p.lat, lng: p.lng }, title: p.name }));
    };
    if (existing) {
      boot();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.datedropMaps = "1";
    s.onload = boot;
    document.head.appendChild(s);
  }, [apiKey, pins]);

  if (!apiKey) {
    return (
      <div className="ticket flex h-72 items-center justify-center rounded-2xl p-6 text-center text-sm text-[#9a8f7e]">
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Pins still list below. Place data requires Google Maps Platform attribution when the map loads.
      </div>
    );
  }
  if (!pins.length) {
    return (
      <div className="ticket flex h-72 items-center justify-center rounded-2xl text-[#9a8f7e]">
        Save a confirmed place to drop a pin.
      </div>
    );
  }
  return (
    <div>
      <div ref={ref} className="h-72 w-full overflow-hidden rounded-2xl border border-[rgba(244,234,213,0.12)]" />
      <p className="map-attribution mt-2">Map data © Google. Google Maps Platform.</p>
    </div>
  );
}
