"use client";
import { feature } from "topojson-client";
import { geoCentroid, geoContains, geoBounds } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — JSON topology
import topo from "world-atlas/countries-110m.json";

export type CountryF = Feature<Geometry, { name: string }> & { id: string };

let cache: { features: CountryF[]; byId: Map<string, CountryF> } | null = null;
export function countries() {
  if (cache) return cache;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(topo as any, (topo as any).objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
  const features = (fc.features as CountryF[]).filter((f) => f.id && f.properties?.name && f.properties.name !== "Antarctica");
  cache = { features, byId: new Map(features.map((f) => [String(f.id), f])) };
  return cache;
}

export const countryList = () =>
  countries()
    .features.map((f) => ({ id: String(f.id), name: f.properties.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

export function countryAt(lat: number, lon: number) {
  return countries().features.find((f) => geoContains(f, [lon, lat])) ?? null;
}

/** A random point inside a country (so many players can share one country without overlapping). */
export function spotIn(id: string, seed = Math.random()) {
  const f = countries().byId.get(id);
  if (!f) return { lat: 20, lon: 0 };
  const [[x0, y0], [x1, y1]] = geoBounds(f);
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 60; i++) {
    const lon = x0 + (x1 - x0) * rnd();
    const lat = y0 + (y1 - y0) * rnd();
    if (geoContains(f, [lon, lat])) return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
  }
  const [lon, lat] = geoCentroid(f);
  return { lat, lon };
}
