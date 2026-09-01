const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function primeiroNome(nome?: string | null, fallback = 'músico'): string {
  const texto = nome?.trim();
  if (!texto) return fallback;
  return texto.split(/\s+/)[0] ?? texto;
}

export function formatarDataCurta(iso?: string | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
  if (!dia || !mes || !ano) return String(iso);
  const mesCurto = MESES_CURTO[Number(mes) - 1];
  return mesCurto ? `${dia} ${mesCurto}` : `${dia}/${mes}`;
}

export function formatarHoraHhMm(valor?: string | null): string {
  if (!valor) return '';
  return String(valor).slice(0, 5);
}

export function formatarDataIso(iso?: string | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
  if (!dia || !mes || !ano) return String(iso);
  return `${dia}/${mes}/${ano}`;
}

export function formatarHoraAmigavel(valor?: string | null): string {
  if (!valor) return '';
  const hm = String(valor).slice(0, 5);
  const [hora, minuto] = hm.split(':');
  if (!hora) return hm;
  if (minuto === '00') return `${Number(hora)}h`;
  return hm;
}
