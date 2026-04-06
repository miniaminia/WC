import type { Role } from '../types';

// Role별 밝기 오프셋 (기획=어둡게, 디자인=중간, 퍼블리싱=밝게)
const ROLE_LIGHTNESS_OFFSET: Record<Role, number> = {
  '기획': 0,
  '디자인': 18,
  '퍼블리싱': 36,
  '오픈일': 0, // 오픈일은 아래에서 별도 처리
};

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getRoleColor(baseHex: string, role: Role): string {
  if (role === '오픈일') return '#1a1a1a';
  const [h, s, l] = hexToHsl(baseHex);
  const offset = ROLE_LIGHTNESS_OFFSET[role];
  const newL = Math.min(l + offset, 85);
  return hslToHex(h, s, newL);
}

export function getTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  // 상대 휘도 계산
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1a1a2e' : '#ffffff';
}

export function generateProjectColor(existingColors: string[]): string {
  const palette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1',
  ];
  const available = palette.find(c => !existingColors.includes(c));
  return available ?? palette[existingColors.length % palette.length];
}

export function isDuplicateColor(color: string, existingColors: string[]): boolean {
  return existingColors.some(c => c.toLowerCase() === color.toLowerCase());
}
