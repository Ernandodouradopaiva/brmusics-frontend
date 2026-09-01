/**
 * Máscaras para campos de formulário.
 */

/** CPF: 000.000.000-00 (até 11 dígitos) */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Telefone BR: (00) 00000-0000 ou (00) 0000-0000 */
export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Remove caracteres não numéricos (útil ao enviar para API). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Termo parece busca por CPF (maioria dos caracteres são dígitos). */
export function isCpfLikeSearch(term: string): boolean {
  const trimmed = term.trim();
  if (!trimmed) return false;
  const digits = onlyDigits(trimmed);
  const compact = trimmed.replace(/\s/g, '');
  return digits.length >= 1 && digits.length / Math.max(compact.length, 1) >= 0.5;
}

/**
 * Normaliza o termo de busca de cidadão para a API (`busca`).
 * Se parecer CPF, envia só dígitos (com ou sem máscara na digitação).
 */
export function normalizeCidadaoBuscaTerm(term: string): string {
  const trimmed = term.trim();
  if (!trimmed) return '';
  if (isCpfLikeSearch(trimmed)) {
    return onlyDigits(trimmed);
  }
  return trimmed;
}

/** Mínimo atingido para disparar busca remota (nome ≥ 2 chars; CPF ≥ 2 dígitos). */
export function cidadaoBuscaAtingeMinimo(term: string): boolean {
  const trimmed = term.trim();
  if (!trimmed) return false;
  if (isCpfLikeSearch(trimmed)) {
    return onlyDigits(trimmed).length >= 2;
  }
  return trimmed.length >= 2;
}

/** Comprimento efetivo do termo para hint de busca mínima no dropdown. */
export function cidadaoBuscaComprimentoEfetivo(term: string): number {
  const trimmed = term.trim();
  if (!trimmed) return 0;
  if (isCpfLikeSearch(trimmed)) {
    return onlyDigits(trimmed).length;
  }
  return trimmed.length;
}

/**
 * Filtra cidadão por nome ou CPF em listas locais (ex.: modal de vinculados).
 * CPF: compara só dígitos, com ou sem máscara na digitação.
 */
export function matchesCidadaoBuscaLocal(
  nome: string | null | undefined,
  cpf: string | null | undefined,
  term: string
): boolean {
  const raw = term.trim();
  if (!raw) return true;
  const qLower = raw.toLowerCase();
  const qDigits = onlyDigits(raw);
  const nomeNorm = (nome ?? '').toLowerCase();
  const cpfDigits = cpf ? onlyDigits(cpf) : '';
  const cpfFormatted = cpf ? formatCpf(cpf).toLowerCase() : '';

  if (isCpfLikeSearch(raw) && qDigits.length > 0) {
    return nomeNorm.includes(qLower) || cpfDigits.includes(qDigits);
  }
  return (
    nomeNorm.includes(qLower) ||
    cpfFormatted.includes(qLower) ||
    (qDigits.length > 0 && cpfDigits.includes(qDigits))
  );
}

/** CEP: 00000-000 (até 8 dígitos). Preserva zeros à esquerda. */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Normaliza CEP vindo da API (pode vir como number e perder zero à esquerda).
 * Retorna string formatada 00000-000, sempre com 8 dígitos (preenche com 0 à esquerda se vier number).
 */
export function normalizeCepFromApi(cep: string | number | null | undefined): string {
  if (cep == null) return '';
  const digits = typeof cep === 'number' ? String(cep).padStart(8, '0') : cep.replace(/\D/g, '');
  if (!digits.length) return '';
  const padded = digits.slice(0, 8).padStart(8, '0');
  return formatCep(padded);
}
