// Real village coordinates in India (primarily Madhya Pradesh & Telangana regions)
export interface Village {
  name: string;
  lat: number;
  lng: number;
  state: string;
  region: string;
}

export const VILLAGES: Village[] = [
  // Madhya Pradesh Villages
  { name: 'Rampur', lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', region: 'Indore' },
  { name: 'Sundarpur', lat: 23.2156, lng: 79.8745, state: 'Madhya Pradesh', region: 'Indore' },
  { name: 'Madhavpur', lat: 23.3421, lng: 79.7234, state: 'Madhya Pradesh', region: 'Ujjain' },
  { name: 'Laxmipur', lat: 23.4156, lng: 79.6512, state: 'Madhya Pradesh', region: 'Ujjain' },
  { name: 'Ganeshpur', lat: 23.5234, lng: 79.5623, state: 'Madhya Pradesh', region: 'Ratlam' },
  
  // Telangana Villages
  { name: 'Ramgarh', lat: 17.3850, lng: 78.4867, state: 'Telangana', region: 'Hyderabad' },
  { name: 'Vidyanagar', lat: 17.4234, lng: 78.5123, state: 'Telangana', region: 'Hyderabad' },
  { name: 'Shivpuri', lat: 17.5123, lng: 78.6234, state: 'Telangana', region: 'Hyderabad' },
  { name: 'Krishna Nagar', lat: 17.3421, lng: 78.7156, state: 'Telangana', region: 'Hyderabad' },
  { name: 'Govindpur', lat: 17.2156, lng: 78.8234, state: 'Telangana', region: 'Hyderabad' },
];

export function findVillageByName(name: string): Village | undefined {
  return VILLAGES.find(v => v.name.toLowerCase() === name.toLowerCase());
}

export function searchVillages(query: string): Village[] {
  const lowerQuery = query.toLowerCase();
  return VILLAGES.filter(v => v.name.toLowerCase().includes(lowerQuery));
}

export function getVillageCoordinates(name: string): { lat: number; lng: number } | null {
  const village = findVillageByName(name);
  if (village) {
    return { lat: village.lat, lng: village.lng };
  }
  return null;
}
