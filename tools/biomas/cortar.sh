#!/usr/bin/env bash
# Recorta texturas repetíveis (256×256, WebP q85) dos cenários do DW1/DW3.
# Uso: tools/biomas/cortar.sh <recortes.json> <pasta-de-saída>
# As fontes ("fonte" no JSON) são relativas à raiz do repositório.
# Repetível: o recorte vira 320², e a sobra de 64px depois da borda direita/inferior
# é misturada em rampa sobre o começo — a coluna 255 encosta na 256 original, sem emenda.
set -euo pipefail

[[ $# -eq 2 ]] || { echo "uso: $0 <recortes.json> <pasta-de-saída>" >&2; exit 1; }
json=$(realpath "$1")
saida=$(realpath -m "$2")
raiz=$(cd "$(dirname "$0")/../.." && pwd)

N=256  # lado final
O=64   # faixa de mistura
M=$((N + O))

# uma linha por entrada: arquivo fonte x y w h
node -e '
  const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const [k, v] of Object.entries(r)) console.log([k, v.fonte, v.x, v.y, v.w, v.h].join("\t"));
' "$json" | while IFS=$'\t' read -r arq fonte x y w h; do
  dest="$saida/$arq"
  mkdir -p "$(dirname "$dest")"
  magick "$raiz/$fonte" -crop "${w}x${h}+${x}+${y}" +repage -resize "${M}x${M}!" -write mpr:a +delete \
    \( mpr:a -crop "${N}x${M}+0+0" +repage \) \
    \( mpr:a -crop "${O}x${M}+${N}+0" +repage \) \
    \( -size "${M}x${O}" gradient:white-black -rotate -90 \) \
    -geometry +0+0 -composite -write mpr:h +delete \
    \( mpr:h -crop "${N}x${N}+0+0" +repage \) \
    \( mpr:h -crop "${N}x${O}+0+${N}" +repage \) \
    \( -size "${N}x${O}" gradient:white-black \) \
    -geometry +0+0 -composite -strip -quality 85 "$dest"
  echo "$dest"
done
