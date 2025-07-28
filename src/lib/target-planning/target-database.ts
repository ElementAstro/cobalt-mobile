import { Target, ObservatoryLocation } from './target-planner';

// Re-export types for convenience
export type { Target, ObservatoryLocation } from './target-planner';

// Popular observatory locations
export const observatoryLocations: ObservatoryLocation[] = [
  {
    id: 'home_observatory',
    name: 'Home Observatory',
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 100,
    timezone: 'America/New_York',
    lightPollution: 'moderate',
    seeingConditions: 'average'
  },
  {
    id: 'dark_sky_site',
    name: 'Dark Sky Site',
    latitude: 36.9613,
    longitude: -109.0450,
    elevation: 1500,
    timezone: 'America/Denver',
    lightPollution: 'excellent',
    seeingConditions: 'excellent'
  },
  {
    id: 'palomar_observatory',
    name: 'Palomar Observatory',
    latitude: 33.3563,
    longitude: -116.8650,
    elevation: 1712,
    timezone: 'America/Los_Angeles',
    lightPollution: 'good',
    seeingConditions: 'excellent'
  },
  {
    id: 'mauna_kea',
    name: 'Mauna Kea',
    latitude: 19.8207,
    longitude: -155.4681,
    elevation: 4205,
    timezone: 'Pacific/Honolulu',
    lightPollution: 'excellent',
    seeingConditions: 'excellent'
  }
];

// Comprehensive target database
export const targetDatabase: Target[] = [
  // Messier Objects - Galaxies
  {
    id: 'm31',
    name: 'M31',
    commonName: 'Andromeda Galaxy',
    type: 'galaxy',
    coordinates: { ra: 0.712, dec: 41.269, epoch: 2000.0 },
    magnitude: 3.4,
    size: { major: 190, minor: 60, angle: 35 },
    constellation: 'Andromeda',
    season: 'autumn',
    difficulty: 'beginner',
    minAltitude: 25,
    moonAvoidance: 30,
    filters: ['L', 'R', 'G', 'B', 'Ha'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 300, binning: 1 },
      { filter: 'R', exposureTime: 300, binning: 1 },
      { filter: 'G', exposureTime: 300, binning: 1 },
      { filter: 'B', exposureTime: 300, binning: 1 }
    ],
    notes: 'Large galaxy, excellent for wide-field imaging'
  },
  {
    id: 'm33',
    name: 'M33',
    commonName: 'Triangulum Galaxy',
    type: 'galaxy',
    coordinates: { ra: 1.564, dec: 30.660, epoch: 2000.0 },
    magnitude: 5.7,
    size: { major: 73, minor: 45, angle: 23 },
    constellation: 'Triangulum',
    season: 'autumn',
    difficulty: 'intermediate',
    minAltitude: 30,
    moonAvoidance: 45,
    filters: ['L', 'R', 'G', 'B', 'Ha'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 600, binning: 1 },
      { filter: 'Ha', exposureTime: 1200, binning: 1 }
    ],
    notes: 'Face-on spiral galaxy with prominent HII regions'
  },
  {
    id: 'm51',
    name: 'M51',
    commonName: 'Whirlpool Galaxy',
    type: 'galaxy',
    coordinates: { ra: 13.396, dec: 47.195, epoch: 2000.0 },
    magnitude: 8.4,
    size: { major: 11, minor: 7, angle: 172 },
    constellation: 'Canes Venatici',
    season: 'spring',
    difficulty: 'intermediate',
    minAltitude: 35,
    moonAvoidance: 40,
    filters: ['L', 'R', 'G', 'B', 'Ha'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 600, binning: 1 },
      { filter: 'R', exposureTime: 600, binning: 1 },
      { filter: 'G', exposureTime: 600, binning: 1 },
      { filter: 'B', exposureTime: 600, binning: 1 }
    ],
    notes: 'Classic spiral galaxy with companion NGC 5194'
  },
  {
    id: 'm81',
    name: 'M81',
    commonName: 'Bode\'s Galaxy',
    type: 'galaxy',
    coordinates: { ra: 9.926, dec: 69.065, epoch: 2000.0 },
    magnitude: 6.9,
    size: { major: 27, minor: 14, angle: 157 },
    constellation: 'Ursa Major',
    season: 'spring',
    difficulty: 'beginner',
    minAltitude: 30,
    moonAvoidance: 35,
    filters: ['L', 'R', 'G', 'B'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 300, binning: 1 },
      { filter: 'R', exposureTime: 300, binning: 1 },
      { filter: 'G', exposureTime: 300, binning: 1 },
      { filter: 'B', exposureTime: 300, binning: 1 }
    ],
    notes: 'Bright spiral galaxy, good for beginners'
  },

  // Nebulae
  {
    id: 'm42',
    name: 'M42',
    commonName: 'Orion Nebula',
    type: 'nebula',
    coordinates: { ra: 5.590, dec: -5.389, epoch: 2000.0 },
    magnitude: 4.0,
    size: { major: 85, minor: 60, angle: 0 },
    constellation: 'Orion',
    season: 'winter',
    difficulty: 'beginner',
    minAltitude: 25,
    moonAvoidance: 20,
    filters: ['L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 600, binning: 1 },
      { filter: 'OIII', exposureTime: 600, binning: 1 },
      { filter: 'SII', exposureTime: 900, binning: 1 }
    ],
    notes: 'Bright emission nebula, excellent for narrowband imaging'
  },
  {
    id: 'ngc7000',
    name: 'NGC 7000',
    commonName: 'North America Nebula',
    type: 'nebula',
    coordinates: { ra: 20.950, dec: 44.317, epoch: 2000.0 },
    magnitude: 4.0,
    size: { major: 120, minor: 100, angle: 0 },
    constellation: 'Cygnus',
    season: 'summer',
    difficulty: 'intermediate',
    minAltitude: 30,
    moonAvoidance: 35,
    filters: ['Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 1200, binning: 1 },
      { filter: 'OIII', exposureTime: 1200, binning: 1 },
      { filter: 'SII', exposureTime: 1800, binning: 1 }
    ],
    notes: 'Large emission nebula, best with narrowband filters'
  },
  {
    id: 'm57',
    name: 'M57',
    commonName: 'Ring Nebula',
    type: 'planetary_nebula',
    coordinates: { ra: 18.884, dec: 33.029, epoch: 2000.0 },
    magnitude: 8.8,
    size: { major: 1.4, minor: 1.0, angle: 0 },
    constellation: 'Lyra',
    season: 'summer',
    difficulty: 'intermediate',
    minAltitude: 35,
    moonAvoidance: 30,
    filters: ['L', 'Ha', 'OIII'],
    exposureRecommendations: [
      { filter: 'OIII', exposureTime: 600, binning: 1 },
      { filter: 'Ha', exposureTime: 600, binning: 1 },
      { filter: 'L', exposureTime: 300, binning: 1 }
    ],
    notes: 'Famous planetary nebula, excellent for OIII imaging'
  },
  {
    id: 'ic1396',
    name: 'IC 1396',
    commonName: 'Elephant Trunk Nebula',
    type: 'nebula',
    coordinates: { ra: 21.650, dec: 57.500, epoch: 2000.0 },
    magnitude: 3.5,
    size: { major: 170, minor: 140, angle: 0 },
    constellation: 'Cepheus',
    season: 'autumn',
    difficulty: 'advanced',
    minAltitude: 35,
    moonAvoidance: 40,
    filters: ['Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 1800, binning: 1 },
      { filter: 'OIII', exposureTime: 1800, binning: 1 },
      { filter: 'SII', exposureTime: 2400, binning: 1 }
    ],
    notes: 'Large emission nebula with dark globules'
  },

  // Star Clusters
  {
    id: 'm45',
    name: 'M45',
    commonName: 'Pleiades',
    type: 'star_cluster',
    coordinates: { ra: 3.790, dec: 24.117, epoch: 2000.0 },
    magnitude: 1.6,
    size: { major: 110, minor: 110, angle: 0 },
    constellation: 'Taurus',
    season: 'winter',
    difficulty: 'beginner',
    minAltitude: 25,
    moonAvoidance: 25,
    filters: ['L', 'R', 'G', 'B'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 300, binning: 1 },
      { filter: 'B', exposureTime: 600, binning: 1 }
    ],
    notes: 'Beautiful open cluster with blue reflection nebulae'
  },
  {
    id: 'm13',
    name: 'M13',
    commonName: 'Hercules Globular Cluster',
    type: 'star_cluster',
    coordinates: { ra: 16.695, dec: 36.460, epoch: 2000.0 },
    magnitude: 5.8,
    size: { major: 20, minor: 20, angle: 0 },
    constellation: 'Hercules',
    season: 'summer',
    difficulty: 'beginner',
    minAltitude: 30,
    moonAvoidance: 20,
    filters: ['L', 'R', 'G', 'B'],
    exposureRecommendations: [
      { filter: 'L', exposureTime: 180, binning: 1 },
      { filter: 'R', exposureTime: 180, binning: 1 },
      { filter: 'G', exposureTime: 180, binning: 1 },
      { filter: 'B', exposureTime: 180, binning: 1 }
    ],
    notes: 'Bright globular cluster, excellent for color imaging'
  },

  // Supernova Remnants
  {
    id: 'ngc6960',
    name: 'NGC 6960',
    commonName: 'Western Veil Nebula',
    type: 'supernova_remnant',
    coordinates: { ra: 20.756, dec: 30.721, epoch: 2000.0 },
    magnitude: 7.0,
    size: { major: 70, minor: 6, angle: 0 },
    constellation: 'Cygnus',
    season: 'summer',
    difficulty: 'advanced',
    minAltitude: 35,
    moonAvoidance: 45,
    filters: ['Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'OIII', exposureTime: 1800, binning: 1 },
      { filter: 'Ha', exposureTime: 1200, binning: 1 },
      { filter: 'SII', exposureTime: 2400, binning: 1 }
    ],
    notes: 'Part of the Veil Nebula complex, excellent for narrowband'
  },
  {
    id: 'ngc6992',
    name: 'NGC 6992',
    commonName: 'Eastern Veil Nebula',
    type: 'supernova_remnant',
    coordinates: { ra: 20.946, dec: 31.717, epoch: 2000.0 },
    magnitude: 7.0,
    size: { major: 60, minor: 8, angle: 0 },
    constellation: 'Cygnus',
    season: 'summer',
    difficulty: 'advanced',
    minAltitude: 35,
    moonAvoidance: 45,
    filters: ['Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'OIII', exposureTime: 1800, binning: 1 },
      { filter: 'Ha', exposureTime: 1200, binning: 1 },
      { filter: 'SII', exposureTime: 2400, binning: 1 }
    ],
    notes: 'Eastern section of the Veil Nebula, rich in OIII emission'
  },

  // Seasonal Highlights
  {
    id: 'm8',
    name: 'M8',
    commonName: 'Lagoon Nebula',
    type: 'nebula',
    coordinates: { ra: 18.062, dec: -24.383, epoch: 2000.0 },
    magnitude: 6.0,
    size: { major: 90, minor: 40, angle: 0 },
    constellation: 'Sagittarius',
    season: 'summer',
    difficulty: 'intermediate',
    minAltitude: 20,
    moonAvoidance: 35,
    filters: ['Ha', 'OIII', 'SII', 'L', 'R', 'G', 'B'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 900, binning: 1 },
      { filter: 'OIII', exposureTime: 900, binning: 1 },
      { filter: 'SII', exposureTime: 1200, binning: 1 }
    ],
    notes: 'Bright emission nebula in Sagittarius, low in northern latitudes'
  },
  {
    id: 'm20',
    name: 'M20',
    commonName: 'Trifid Nebula',
    type: 'nebula',
    coordinates: { ra: 18.035, dec: -23.033, epoch: 2000.0 },
    magnitude: 6.3,
    size: { major: 20, minor: 20, angle: 0 },
    constellation: 'Sagittarius',
    season: 'summer',
    difficulty: 'intermediate',
    minAltitude: 20,
    moonAvoidance: 35,
    filters: ['Ha', 'OIII', 'SII', 'L', 'R', 'G', 'B'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 900, binning: 1 },
      { filter: 'OIII', exposureTime: 900, binning: 1 },
      { filter: 'R', exposureTime: 600, binning: 1 },
      { filter: 'B', exposureTime: 600, binning: 1 }
    ],
    notes: 'Combination emission and reflection nebula'
  },
  {
    id: 'ic434',
    name: 'IC 434',
    commonName: 'Horsehead Nebula',
    type: 'nebula',
    coordinates: { ra: 5.679, dec: -2.456, epoch: 2000.0 },
    magnitude: 6.8,
    size: { major: 8, minor: 6, angle: 0 },
    constellation: 'Orion',
    season: 'winter',
    difficulty: 'expert',
    minAltitude: 30,
    moonAvoidance: 50,
    filters: ['Ha', 'OIII', 'SII'],
    exposureRecommendations: [
      { filter: 'Ha', exposureTime: 1800, binning: 1 },
      { filter: 'OIII', exposureTime: 1800, binning: 1 }
    ],
    notes: 'Famous dark nebula silhouetted against emission nebula, requires excellent conditions'
  }
];

// Helper functions for target selection
export function getTargetsByType(type: Target['type']): Target[] {
  return targetDatabase.filter(target => target.type === type);
}

export function getTargetsBySeason(season: Target['season']): Target[] {
  return targetDatabase.filter(target => target.season === season || target.season === 'all');
}

export function getTargetsByDifficulty(difficulty: Target['difficulty']): Target[] {
  return targetDatabase.filter(target => target.difficulty === difficulty);
}

export function getTargetsByConstellation(constellation: string): Target[] {
  return targetDatabase.filter(target => target.constellation === constellation);
}

export function searchTargets(query: string): Target[] {
  const lowerQuery = query.toLowerCase();
  return targetDatabase.filter(target => 
    target.name.toLowerCase().includes(lowerQuery) ||
    target.commonName?.toLowerCase().includes(lowerQuery) ||
    target.constellation.toLowerCase().includes(lowerQuery)
  );
}

export function getTargetById(id: string): Target | undefined {
  return targetDatabase.find(target => target.id === id);
}

export function getBeginnerTargets(): Target[] {
  return targetDatabase.filter(target => 
    target.difficulty === 'beginner' && 
    target.magnitude <= 8.0
  );
}

export function getCurrentSeasonTargets(): Target[] {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  let season: Target['season'];
  if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'autumn';
  else season = 'winter';
  
  return getTargetsBySeason(season);
}

export default targetDatabase;
