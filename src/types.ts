export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

export interface MissileProfile {
  id: string;
  label: string;
  weight?: number;
  minRangeKm: number;
  maxRangeKm: number;
  rocketColor: number;
  trailOuterColor: number;
  trailInnerColor: number;
  flameColor: number;
  durationMin: number;
  durationMax: number;
  impactScale: number;
}

export interface Faction {
  id: string;
  name: string;
  territory: string;
  bounds: GeoBounds;
  trailColor: number;
  rocketColor: number;
  baseVolley: number;
  maxVolley: number;
  impactMultiplier: number;
  durationMin: number;
  durationMax: number;
  launchCadenceMs?: number;
  missileProfiles?: MissileProfile[];
}

export interface FactionsConfig {
  factions: Faction[];
}

export interface UnitDefinition {
  id: string;
  name: string;
  category: string;
  cost: number;
  moraleBoost: number;
  armyBoost: number;
}

export interface UnitsConfig {
  units: UnitDefinition[];
}

export interface WaveDefinition {
  factionId: string;
  intensityBonus?: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  simulation: {
    startDateUtc: string;
    hoursPerSecond: number;
  };
  waveTiming: {
    minDelayMs: number;
    maxDelayMs: number;
  };
  waves: WaveDefinition[];
}

export interface Projection {
  type: string;
  lonMin?: number;
  lonMax?: number;
  latMin?: number;
  latMax?: number;
  centralMeridian?: number;
  xScale?: number;
  rOffset?: number;
  thetaScale?: number;
  xCompression?: number;
  yAnchor?: number;
}

export interface MapViewConfig {
  mapImagePath?: string;
  projection: Projection;
  initial: {
    zoomLevel: number;
    focus: GeoPoint;
    rotationDeg: number;
  };
  zoom: {
    min: number;
    max: number;
  };
}

export interface Region {
  id: string;
  name: string;
  border: GeoPoint[];
}

export interface City {
  regionId: string;
  name: string;
  lat: number;
  lon: number;
}

export interface Target {
  lat: number;
  lon: number;
}

export interface IsraelData {
  outline: GeoPoint[];
  regions: Region[];
  cities: City[];
  targets: Target[];
}

export type ResourceKey = "money" | "morale" | "population" | "army" | "economy";

export interface Resources {
  money: number;
  morale: number;
  population: number;
  army: number;
  economy: number;
}
