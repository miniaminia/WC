// FullCalendar end는 exclusive이므로 inclusive end → exclusive end 변환
export function toFCEnd(inclusiveEnd: string): string {
  const d = new Date(inclusiveEnd);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function toInclusiveEnd(exclusiveEnd: string): string {
  const d = new Date(exclusiveEnd);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}
