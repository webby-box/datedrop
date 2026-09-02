"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type Pin = { lat: number; lng: number; name: string };

const STYLE = "https://tiles.openfreemap.org/styles/dark";

export function BoardMap({
  pins,
  attribution,
  className,
  heightClass = "h-72",
}: {
  pins: Pin[];
  attribution?: string;
  className?: string;
  heightClass?: string;
}) {
  const center = useMemo(() => {
    if (!pins.length) return { latitude: 40.73, longitude: -73.99, zoom: 11 };
    const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
    const lng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
    return { latitude: lat, longitude: lng, zoom: pins.length === 1 ? 14 : 12 };
  }, [pins]);

  if (!pins.length) {
    return (
      <div className={`card-light flex ${heightClass} items-center justify-center rounded-3xl text-[var(--muted)]`}>
        Save a confirmed place to drop a pin.
      </div>
    );
  }

  const credit = attribution
    ? `© OpenStreetMap contributors · ${attribution}`
    : "© OpenStreetMap contributors · OpenFreeMap";

  return (
    <div className={className}>
      <div className={`${heightClass} w-full overflow-hidden rounded-3xl border border-[var(--line)]`}>
        <Map
          initialViewState={center}
          mapStyle={STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {pins.map((p) => (
            <Marker key={`${p.lat},${p.lng},${p.name}`} longitude={p.lng} latitude={p.lat} anchor="bottom">
              <div
                title={p.name}
                className="h-3 w-3 rounded-full border-2 border-white bg-white shadow-lg"
              />
            </Marker>
          ))}
        </Map>
      </div>
      <p className="map-attribution mt-2">{credit}</p>
    </div>
  );
}
