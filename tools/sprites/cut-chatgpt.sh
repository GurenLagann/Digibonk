#!/usr/bin/env bash
# Recorta folhas do ChatGPT (uma linha = um ciclo) em quadros para o build-gemini.
# uso: bash tools/sprites/cut-chatgpt.sh <id> <folha.png> <escala%> <linhas> [<folha2> <escala2%> <linhas2> ...]
#   linhas: o prefixo do papel de cada linha da folha, de cima para baixo, separados por vírgula;
#           "-" pula a linha. O quadro N da linha vira <prefixo>N.
#   ex: bash tools/sprites/cut-chatgpt.sh greymon base.png 70 -,walk,walkdown,walkup,-,run,rundown,runup \
#                                                 diag.png 50 walkdiagdown,walkdiagup,rundiagdown,rundiagup
# O 1º quadro de walk/walkdown/walkup/walkdiagdown/walkdiagup vira também idle1/idledown/idleup/idlediagdown/idlediagup.
# Fundo transparente: só alpha>128. Fundo branco: limpa por preenchimento a partir dos cantos (FUZZ, padrão 8).
# Escala: escolha por folha para todas as vistas ficarem da mesma altura (ver gemini-prompt.md).
set -euo pipefail
cd "$(dirname "$0")/../.."
id=$1; shift
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
D=assets-src/sprites/gemini/$id; rm -rf "$D"; mkdir -p "$D"
roles=(); n=0; declare -A idle=([walk]=idle1 [walkdown]=idledown [walkup]=idleup [walkdiagdown]=idlediagdown [walkdiagup]=idlediagup)
idles=()
while [ $# -ge 3 ]; do
  sheet=$1 pct=$2; IFS=, read -ra prefixes <<< "$3"; shift 3
  magick "$sheet" PNG32:"$tmp/s.png"
  node --experimental-strip-types tools/sprites/alpha-grid.ts "$tmp/s.png" "${#prefixes[@]}" > "$tmp/grid.txt" 2> "$tmp/mode.txt"
  grep -q transparente "$tmp/mode.txt" && alpha=1 || alpha=0
  found=$(cut -d. -f1 "$tmp/grid.txt" | sort -un | wc -l)
  [ "$found" -eq "${#prefixes[@]}" ] || { echo "$sheet: achei $found linhas, esperava ${#prefixes[@]}" >&2; exit 1; }
  while read -r rc box; do
    row=${rc%.*} col=${rc#*.}; pre=${prefixes[$row]}; [ "$pre" = - ] && continue
    IFS=, read -r x y w h <<< "$box"
    if [ $alpha = 1 ]; then
      magick "$tmp/s.png" -crop "${w}x${h}+$x+$y" +repage -channel A -threshold 50% +channel "$tmp/q.png"
    else  # margem de 4px de fundo para o preenchimento dar a volta
      m=4; X=$((x-m)) Y=$((y-m)) WW=$((w+2*m)) HH=$((h+2*m))
      magick "$tmp/s.png" -crop "${WW}x${HH}+$X+$Y" +repage -fuzz "${FUZZ:-8}%" -fill none \
        -draw "color 0,0 floodfill" -draw "color $((WW-1)),0 floodfill" \
        -draw "color 0,$((HH-1)) floodfill" -draw "color $((WW-1)),$((HH-1)) floodfill" "$tmp/q.png"
    fi
    magick "$tmp/q.png" -filter box -resize "$pct%" -channel A -threshold 50% +channel PNG32:"$D/f$n.png"
    roles+=("\"$pre$((col+1))\""); n=$((n+1))
    if [ "$col" = 0 ] && [ -n "${idle[$pre]:-}" ]; then
      cp "$D/f$((n-1)).png" "$tmp/idle-${idle[$pre]}.png"; idles+=("${idle[$pre]}")
    fi
  done < "$tmp/grid.txt"
done
[ $# -eq 0 ] || { echo "argumentos sobrando: $*" >&2; exit 1; }
for r in "${idles[@]}"; do cp "$tmp/idle-$r.png" "$D/f$n.png"; roles+=("\"$r\""); n=$((n+1)); done
(IFS=,; echo "{\"roles\":[${roles[*]}],\"key\":[255,0,255]}") > "$D/roles.json"
echo "$id: $n quadros em $D — agora: npm run sprites:vpet"
