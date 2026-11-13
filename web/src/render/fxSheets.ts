// Frame layout of the sprite-sheet effects in www/fx, from PVFX Foundry by nerijs (https://nerijs.itch.io/pvfx-foundry,
// CC0 1.0). Each sheet is a grid of w x h cells read left to right, top to bottom; (px, py) is the effect's
// anchor in a cell and ms each frame's duration. Generated from the pack's manifests.

export interface FxSheet { w: number; h: number; cols: number; rows: number; px: number; py: number; ms: number[] }

export const FX_SHEETS = {
  hitSpark: { w: 64, h: 64, cols: 8, rows: 1, px: 32, py: 32, ms: [80, 80, 80, 80, 80, 80, 80, 80] },  // impacts/hit-spark
  critHit: { w: 96, h: 80, cols: 8, rows: 2, px: 48, py: 40, ms: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70] },  // impacts/crit-hit
  groundSlam: { w: 128, h: 64, cols: 8, rows: 3, px: 64, py: 44, ms: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70] },  // impacts/ground-slam
  shockRing: { w: 120, h: 52, cols: 8, rows: 2, px: 60, py: 30, ms: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70] },  // impacts/shockwave-ring
  curseSkull: { w: 96, h: 112, cols: 8, rows: 4, px: 48, py: 66, ms: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80] },  // shadow/curse
  voidImplode: { w: 96, h: 96, cols: 8, rows: 3, px: 48, py: 48, ms: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70] },  // shadow/void-implosion
  cursedBloom: { w: 72, h: 72, cols: 8, rows: 3, px: 36, py: 38, ms: [65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65] },  // explosions/arcane-burst
  staticBurst: { w: 112, h: 112, cols: 8, rows: 2, px: 56, py: 58, ms: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60] },  // lightning/static-burst
} satisfies Record<string, FxSheet>;

export type FxSheetName = keyof typeof FX_SHEETS;
