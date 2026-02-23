export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface Rocket extends Entity {
  targetX: number;
  speed: number;
  progress: number; // 0 to 1
  originX: number;
}

export interface Missile extends Entity {
  targetX: number;
  targetY: number;
  speed: number;
  progress: number;
  originX: number;
  originY: number;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  expanding: boolean;
}

export interface Battery extends Point {
  id: string;
  ammo: number;
  maxAmmo: number;
  destroyed: boolean;
}

export interface City extends Point {
  id: string;
  destroyed: boolean;
}

export type GameState = 'START' | 'PLAYING' | 'WON' | 'LOST';

export interface LanguageStrings {
  title: string;
  start: string;
  intro: string;
  score: string;
  ammo: string;
  win: string;
  loss: string;
  restart: string;
  instructions: string;
}
