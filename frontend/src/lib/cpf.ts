export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCpf(rawCpf: string): boolean {
  const cpf = normalizeCpf(rawCpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return (
    calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10]
  );
}
