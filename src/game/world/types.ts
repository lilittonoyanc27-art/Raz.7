import type * as THREE from 'three';
import type { Tr } from '../../i18n/T';
import type { InteriorKind } from '../data/places';

export type Action =
  | { type: 'exit' }
  | { type: 'enter'; place: string }
  | { type: 'product'; id: string }
  | { type: 'checkout' }
  | { type: 'shop'; cat: 'clothes' | 'vehicles' | 'equipment' | 'room' | 'all' }
  | { type: 'npc'; id: string }
  | { type: 'wardrobe' }
  | { type: 'minigame'; id: string }
  | { type: 'train'; stat: 'speed' | 'stamina' | 'shooting' | 'technique' | 'teamwork' }
  | { type: 'travel'; mode: 'train' | 'plane' | 'bus' }
  | { type: 'item'; id: string }
  | { type: 'table'; place: 'cafe' | 'restaurant' }
  | { type: 'cinema' }
  | { type: 'lesson' }
  | { type: 'football' }
  | { type: 'bed' }
  | { type: 'ped'; index: number }
  | { type: 'basket' };

export interface Interactable {
  id: string;
  pos: THREE.Vector3;
  r: number;
  label: Tr;
  action: Action;
  /** optional mesh to hide when picked */
  mesh?: THREE.Object3D;
  interior?: InteriorKind | null;
  enabled?: () => boolean;
}

export interface NpcSpawn {
  npcId: string;
  x: number;
  z: number;
  yaw: number;
  interior: InteriorKind | null;
  sit?: boolean;
}
