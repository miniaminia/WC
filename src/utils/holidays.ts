// 한국 공휴일 (2025~2026)
const HOLIDAYS = new Set([
  // 2025
  '2025-01-01', // 신정
  '2025-01-28', '2025-01-29', '2025-01-30', // 설날 연휴
  '2025-03-01', // 삼일절
  '2025-05-05', // 어린이날 (부처님오신날 겹침)
  '2025-05-06', // 어린이날 대체공휴일
  '2025-06-06', // 현충일
  '2025-08-15', // 광복절
  '2025-10-03', // 개천절
  '2025-10-05', '2025-10-06', '2025-10-07', // 추석 연휴 + 대체
  '2025-10-09', // 한글날
  '2025-12-25', // 성탄절
  // 2026
  '2026-01-01', // 신정
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-01', // 삼일절
  '2026-03-02', // 삼일절 대체공휴일 (3/1이 일요일)
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님오신날
  '2026-05-25', // 부처님오신날 대체공휴일 (5/24가 일요일)
  '2026-06-06', // 현충일
  '2026-08-15', // 광복절
  '2026-09-24', '2026-09-25', '2026-09-26', // 추석 연휴
  '2026-09-28', // 추석 대체공휴일
  '2026-10-03', // 개천절
  '2026-10-05', // 개천절 대체공휴일 (10/3이 토요일)
  '2026-10-09', // 한글날
  '2026-12-25', // 성탄절
]);

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function isHoliday(date: string): boolean {
  return HOLIDAYS.has(date);
}

export function isWeekend(date: string): boolean {
  const d = new Date(date + 'T00:00:00');
  return d.getDay() === 0 || d.getDay() === 6;
}

export function isNonWorkday(date: string): boolean {
  return isWeekend(date) || isHoliday(date);
}

// 비업무일이면 다음 업무일로 이동
export function adjustStartToWorkday(date: string): string {
  const d = new Date(date + 'T00:00:00');
  while (isNonWorkday(toDateStr(d))) {
    d.setDate(d.getDate() + 1);
  }
  return toDateStr(d);
}

// 비업무일이면 이전 업무일로 이동
export function adjustEndToWorkday(date: string): string {
  const d = new Date(date + 'T00:00:00');
  while (isNonWorkday(toDateStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  return toDateStr(d);
}
