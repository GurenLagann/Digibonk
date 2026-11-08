/**
 * Rótulo do placeholder: o nome inteiro (as 3 primeiras letras repetiam, ex.: Angemon/Angewomon = ANG).
 * Nomes longos quebram em duas linhas num espaço ou numa maiúscula perto do meio; palavra única fica numa linha.
 */
export function placeholderLabel(name: string): string[] {
  if (name.length <= 7) return [name];
  const mid = name.length / 2;
  let best = -1;
  for (let i = 2; i < name.length - 2; i++) {
    const boundary = name[i] === ' ' || (name[i] >= 'A' && name[i] <= 'Z' && name[i - 1] >= 'a' && name[i - 1] <= 'z');
    if (boundary && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best > 0 ? [name.slice(0, best).trim(), name.slice(best).trim()] : [name];
}
