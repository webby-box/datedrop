"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type Pin = { lat: number; lng: number; name: string };

const STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function BoardMap({
  pins,
  attribution,
}: {
  pins: Pin[];
  /** Extra places-provider line, e.g. "Powered by Geoapify". */
  attribution?: string;
}) {
  const center = useMemo(() => {
    if (!pins.length) return { latitude: 40.73, longitude: -73.99, zoom: 11 };
    const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
    const lng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
    return { latitude: lat, longitude: lng, zoom: pins.length === 1 ? 14 : 12 };
  }, [pins]);

  if (!pins.length) {
    return (
      <div className="ticket flex h-72 items-center justify-center rounded-2xl text-[#9a8f7e]">
        Save a confirmed place to drop a pin.
      </div>
    );
  }

  const credit = attribution
    ? `© OpenStreetMap contributors · ${attribution}`
    : "© OpenStreetMap contributors · OpenFreeMap";

  return (
    <div>
      <div className="h-72 w-full overflow-hidden rounded-2xl border border-[rgba(244,234,213,0.12)]">
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
                className="h-3 w-3 rounded-full border-2 border-[#0c0b09] bg-[#c45c26] shadow-lg"
              />
            </Marker>
          ))}
        </Map>
      </div>
      <p className="map-attribution mt-2">{credit}</p>
    </div>
  );
}
