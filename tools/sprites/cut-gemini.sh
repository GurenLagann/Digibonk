#!/usr/bin/env bash
# Recorta uma folha "16-bit FULL SPRITE SHEET" do Gemini em quadros para o build-gemini.
# uso: tools/sprites/cut-gemini.sh <id> <folha.jpeg|png> <escala%> papel:célula[:flip] ...
#   :flip espelha aquele quadro (para quando a IA desenhou virado para o outro lado)
#   ex: tools/sprites/cut-gemini.sh greymon greymon.jpeg 75 walk1:3 ... idle1:31 attack:42 hurt:44
# Lista as células (índice x,y,w,h) com: tools/sprites/cut-gemini.sh --cells <folha>
# Folhas irregulares: CELLS=arquivo com linhas "índice x,y,w,h" no lugar da detecção; INSET=px de margem cortada (padrão 3)
# Os quadros ficam como na folha: o jogo assume sprite olhando para a ESQUERDA.
set -euo pipefail
cd "$(dirname "$0")/../.."
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
if [ "$1" = --cells ]; then magick "$2" PNG32:"$tmp/s.png"; node --experimental-strip-types tools/sprites/cells.ts "$tmp/s.png" 2>/dev/null; exit; fi
id=$1 sheet=$2 pct=$3; shift 3
magick "$sheet" PNG32:"$tmp/s.png"
if [ -n "${CELLS:-}" ]; then cp "$CELLS" "$tmp/cells.txt"
else node --experimental-strip-types tools/sprites/cells.ts "$tmp/s.png" 2>/dev/null > "$tmp/cells.txt"; fi
D=assets-src/sprites/gemini/$id; rm -rf "$D"; mkdir -p "$D"
roles=(); n=0
for pr in "$@"; do
  IFS=: read -r role idx flip <<< "$pr"
  mirror=(); [ "${flip:-}" = flip ] && mirror=(-flop)
  IFS=, read -r x y w h <<< "$(awk -v i="$idx" '$1==i{print $2}' "$tmp/cells.txt")"
  key=$(magick "$tmp/s.png" -format "%[pixel:p{$((x+4)),$((y+4))}]" info:)
  magick "$tmp/s.png" -crop "${w}x${h}+$x+$y" +repage -shave "${INSET:-3}x${INSET:-3}" -fuzz 18% -transparent "$key" "${mirror[@]}" \
    -filter box -resize "$pct%" -channel A -threshold 50% +channel PNG32:"$D/f$n.png"
  roles+=("\"$role\""); n=$((n+1))
done
(IFS=,; echo "{\"roles\":[${roles[*]}],\"key\":[64,240,168]}") > "$D/roles.json"
echo "$id: $n quadros em $D"
