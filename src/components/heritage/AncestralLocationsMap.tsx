'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Globe2, MapPin, Route } from 'lucide-react';
import type { FamilyMemberRecord } from '@/lib/data/lang-genealogy';
import {
  KNOWN_ANCESTRAL_LOCATIONS,
  MIGRATION_ROUTE_SEGMENTS,
  resolveLocationCoordinates,
  type GeoLocationInfo,
} from '@/lib/geo/locations';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MapPinData {
  id: string;
  label: string;
  historicalName?: string;
  lat: number;
  lon: number;
  regionGroup: GeoLocationInfo['regionGroup'];
  members: FamilyMemberRecord[];
  isPrimary?: boolean;
}

interface AncestralLocationsMapProps {
  members: FamilyMemberRecord[];
  focusedLocationId?: string | null;
  onSelectMemberById?: (memberId: string) => void;
  /** Compact single-member mode for Profile Details */
  singleLocationText?: string;
  secondaryLocationText?: string;
  personName?: string;
  heightClass?: string;
}

const REGION_COLORS: Record<GeoLocationInfo['regionGroup'], string> = {
  sulawesi: '#73a922',
  java: '#d97706',
  'maluku-sumatra': '#0f766e',
  netherlands: '#0b4a68',
  'north-america': '#7c3aed',
};

function createPinIcon(color: string, count: number, isPrimary = false): L.DivIcon {
  const size = isPrimary ? 34 : count > 0 ? 28 : 22;
  const ring = isPrimary
    ? 'box-shadow: 0 0 0 4px rgba(115,169,34,0.28), 0 3px 10px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 8px rgba(0,0,0,0.32);';
  return L.divIcon({
    className: 'family-archive-map-pin',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${color};
      border:2.5px solid #ffffff;
      color:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:${size >= 28 ? 11 : 10}px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      ${ring}
    ">${count > 0 ? count : '●'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function AncestralLocationsMap({
  members,
  focusedLocationId,
  onSelectMemberById,
  singleLocationText,
  secondaryLocationText,
  personName,
  heightClass = 'h-[380px] sm:h-[440px]',
}: AncestralLocationsMapProps) {
  const { t, tc } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());

  const [showRoutes, setShowRoutes] = useState(true);
  const [clickedPinId, setClickedPinId] = useState<string | null>(null);
  const [lastFocusedProp, setLastFocusedProp] = useState<string | null | undefined>(
    focusedLocationId
  );

  if (focusedLocationId !== lastFocusedProp) {
    setLastFocusedProp(focusedLocationId);
    if (focusedLocationId) {
      setClickedPinId(focusedLocationId);
    }
  }

  const isSingleMode = Boolean(singleLocationText);

  const pins = useMemo<MapPinData[]>(() => {
    if (isSingleMode) {
      const result: MapPinData[] = [];
      const primaryLoc = resolveLocationCoordinates(singleLocationText);
      if (primaryLoc) {
        result.push({
          id: primaryLoc.id,
          label: primaryLoc.fullLabel,
          historicalName: primaryLoc.historicalName,
          lat: primaryLoc.lat,
          lon: primaryLoc.lon,
          regionGroup: primaryLoc.regionGroup,
          members: [],
          isPrimary: true,
        });
      }
      if (secondaryLocationText) {
        const secondaryLoc = resolveLocationCoordinates(secondaryLocationText);
        if (secondaryLoc && secondaryLoc.id !== primaryLoc?.id) {
          result.push({
            id: secondaryLoc.id,
            label: secondaryLoc.fullLabel,
            historicalName: secondaryLoc.historicalName,
            lat: secondaryLoc.lat,
            lon: secondaryLoc.lon,
            regionGroup: secondaryLoc.regionGroup,
            members: [],
          });
        }
      }
      return result;
    }

    const byId = new Map<string, MapPinData>();
    for (const loc of KNOWN_ANCESTRAL_LOCATIONS) {
      byId.set(loc.id, {
        id: loc.id,
        label: loc.fullLabel,
        historicalName: loc.historicalName,
        lat: loc.lat,
        lon: loc.lon,
        regionGroup: loc.regionGroup,
        members: [],
        isPrimary: loc.id === 'place-manado',
      });
    }

    for (const m of members) {
      const texts = [m.birthPlace, m.deathPlace, m.region].filter(Boolean) as string[];
      const seenForMember = new Set<string>();
      for (const txt of texts) {
        const resolved = resolveLocationCoordinates(txt);
        if (resolved && !seenForMember.has(resolved.id)) {
          seenForMember.add(resolved.id);
          const pin = byId.get(resolved.id);
          if (pin) {
            pin.members.push(m);
          }
        }
      }
    }

    return Array.from(byId.values()).filter(
      (p) =>
        p.members.length > 0 ||
        ['place-manado', 'place-tondano', 'place-kema', 'place-blitar', 'place-groningen', 'place-the-hague', 'place-calgary'].includes(p.id)
    );
  }, [isSingleMode, singleLocationText, secondaryLocationText, members]);

  // Initialize Leaflet map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const initialCenter: [number, number] =
      pins.length > 0 ? [pins[0].lat, pins[0].lon] : [1.4748, 124.8421];
    const initialZoom = isSingleMode ? 10 : 4;

    const map = L.map(el, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: !isSingleMode,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const markersMap = markerByIdRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routesLayerRef.current = null;
      markersMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers & routes whenever pins or showRoutes change
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    if (!map || !markersLayer || !routesLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();
    markerByIdRef.current.clear();

    const pinById = new Map(pins.map((p) => [p.id, p]));

    for (const pin of pins) {
      const color = REGION_COLORS[pin.regionGroup];
      const marker = L.marker([pin.lat, pin.lon], {
        icon: createPinIcon(color, pin.members.length, pin.isPrimary),
      });

      const translatedLabel = tc(pin.label);
      const countLine = isSingleMode
        ? personName
          ? `<div style="font-size:11px;color:#475569;margin-top:2px;">${personName}</div>`
          : ''
        : `<div style="font-size:11px;color:#4d7c0f;font-weight:600;margin-top:3px;">${pin.members.length} ${t.mapMembersLinked}</div>`;

      marker.bindPopup(
        `<div style="min-width:170px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13px;color:#0f172a;">${translatedLabel}</div>
          ${
            pin.historicalName
              ? `<div style="font-size:11px;color:#64748b;margin-top:1px;">${pin.historicalName}</div>`
              : ''
          }
          <div style="font-size:10px;font-family:monospace;color:#0b4a68;margin-top:3px;">
            ${pin.lat.toFixed(4)}°, ${pin.lon.toFixed(4)}°
          </div>
          ${countLine}
        </div>`
      );

      marker.on('click', () => {
        setClickedPinId(pin.id);
      });

      marker.addTo(markersLayer);
      markerByIdRef.current.set(pin.id, marker);
    }

    if (showRoutes && !isSingleMode) {
      for (const seg of MIGRATION_ROUTE_SEGMENTS) {
        const from = pinById.get(seg.fromId);
        const to = pinById.get(seg.toId);
        if (from && to) {
          L.polyline(
            [
              [from.lat, from.lon],
              [to.lat, to.lon],
            ],
            {
              color: seg.color,
              weight: 2,
              opacity: 0.55,
              dashArray: '6, 6',
            }
          )
            .bindTooltip(seg.label, { sticky: true })
            .addTo(routesLayer);
        }
      }
    }

    // Fit map bounds gracefully
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lon], isSingleMode ? 10 : 8);
    } else if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: isSingleMode ? 9 : 6 });
    }
  }, [pins, showRoutes, isSingleMode, personName, t.mapMembersLinked, tc]);

  // Fly to focused location when triggered externally
  useEffect(() => {
    if (!focusedLocationId || !mapRef.current) return;
    const pin = pins.find((p) => p.id === focusedLocationId);
    if (!pin) return;
    mapRef.current.flyTo([pin.lat, pin.lon], 10, { duration: 0.9 });
    const marker = markerByIdRef.current.get(pin.id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 450);
    }
  }, [focusedLocationId, pins]);

  const selectedPin = useMemo(
    () => (clickedPinId ? pins.find((p) => p.id === clickedPinId) || null : null),
    [clickedPinId, pins]
  );

  const handleFocusRegion = (group: 'all' | 'sulawesi' | 'java' | 'netherlands') => {
    const map = mapRef.current;
    if (!map) return;
    const subset =
      group === 'all' ? pins : pins.filter((p) => p.regionGroup === group);
    if (subset.length === 0) return;
    if (subset.length === 1) {
      map.flyTo([subset[0].lat, subset[0].lon], 10, { duration: 0.8 });
    } else {
      const bounds = L.latLngBounds(subset.map((p) => [p.lat, p.lon] as [number, number]));
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 10, duration: 0.8 });
    }
  };

  if (isSingleMode && pins.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {!isSingleMode && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleFocusRegion('all')}
            >
              <Globe2 className="size-3.5 text-[#0b4a68]" /> {t.mapFocusAll}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleFocusRegion('sulawesi')}
            >
              <MapPin className="size-3 text-[#73a922]" /> Manado &amp; Minahasa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleFocusRegion('java')}
            >
              Java
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleFocusRegion('netherlands')}
            >
              Netherlands
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            variant={showRoutes ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs"
            onClick={() => setShowRoutes((v) => !v)}
          >
            <Route className="size-3.5" /> {t.mapToggleRoutes}
          </Button>
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden border border-stone-300 shadow-xs bg-stone-100">
        <div ref={containerRef} className={`w-full ${heightClass} z-0`} />
      </div>

      {/* Interactive Pin Drawer showing linked ancestors for clicked city */}
      {!isSingleMode && selectedPin && (
        <div className="rounded-lg border border-stone-200 bg-stone-50/90 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-[#0b4a68]" />
              <span className="font-semibold text-sm text-stone-900">
                {tc(selectedPin.label)}
              </span>
              <span className="font-mono text-[11px] text-stone-500">
                ({selectedPin.lat.toFixed(3)}°, {selectedPin.lon.toFixed(3)}°)
              </span>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              {selectedPin.members.length} {t.mapMembersLinked}
            </Badge>
          </div>

          {selectedPin.members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedPin.members.slice(0, 12).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMemberById?.(m.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white hover:border-[#73a922] hover:bg-[#f4faea] px-2.5 py-0.5 text-xs font-medium text-stone-800 transition-colors cursor-pointer"
                >
                  <span>{m.fullName}</span>
                  <span className="font-mono text-[10px] text-[#0b4a68]">{m.code}</span>
                </button>
              ))}
              {selectedPin.members.length > 12 && (
                <span className="text-xs text-stone-500 self-center">
                  +{selectedPin.members.length - 12} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
