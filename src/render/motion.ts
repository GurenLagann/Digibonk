/**
 * Animação procedural por cima dos sprites (que só têm poses paradas):
 * pulinho + balanço ao andar, respiração parado, esticada no ataque, recuo no dano.
 * Valores relativos à altura do sprite; tilt em radianos, pivô nos pés.
 */
export interface Pose { y: number; sx: number; sy: number; tilt: number }
/** drawnWalk: o sprite tem quadros de caminhada desenhados → sem pulinho/balanço ao andar */
export interface MotionInput { t: number; phase: number; moving: boolean; attack: number; hurt: number; drawnWalk?: boolean }

/** altura máxima do pulinho, fração da altura do sprite */
export const HOP = 0.12;
const STEPS = 3;      // pulinhos por segundo
const WADDLE = 0.12;  // balanço lateral máximo (rad)
const LAND = 0.1;     // amassada ao tocar o chão
const BREATH = 0.03;
const ATTACK_TIME = 0.18, ATTACK_STRETCH = 0.25;
const HURT_TILT = 0.3;

export function motionPose({ t, phase, moving, attack, hurt, drawnWalk = false }: MotionInput): Pose {
  let y = 0, tilt = 0, sy: number;
  if (moving && drawnWalk) {
    sy = 1;
  } else if (moving) {
    const w = Math.PI * (t * STEPS + phase);
    const s = Math.sin(w), up = Math.abs(s);
    y = HOP * up;
    tilt = WADDLE * s;
    sy = 1 - LAND * (1 - up) ** 4;
  } else {
    sy = 1 + BREATH * Math.sin(2 * Math.PI * 1.2 * (t + phase));
  }
  const k = Math.max(0, 1 - attack / ATTACK_TIME);
  sy /= 1 + ATTACK_STRETCH * k;
  tilt -= HURT_TILT * hurt;
  return { y, sx: 1 / sy, sy, tilt };
}
