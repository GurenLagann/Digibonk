#!/usr/bin/env bash
# Folha de conferência numerada: cada quadro da grade com o rótulo "fileira.coluna" em cima.
# uso: bash tools/sprites/contact.sh <folha.png> <grade.txt> <saida.png> [fileira]
#   grade.txt vem de tools/sprites/inspect.ts; [fileira] limita a uma fileira (ex.: 3)
set -euo pipefail
sheet=$1 grid=$2 out=$3 only=${4:-}
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
cells=(); while read -r id rect; do
  [ -n "$only" ] && [ "${id%%.*}" != "$only" ] && continue
  IFS=, read -r x y w h <<< "$rect"
  magick "$sheet" -crop "${w}x${h}+$x+$y" +repage -background '#888' -gravity south -extent 64x64 -scale 200% \
    -gravity north -splice 0x16 -fill black -pointsize 14 -annotate +0+0 "$id" "$tmp/$id.png"
  cells+=("$tmp/$id.png")
done < "$grid"
rows=(); for ((k=0; k<${#cells[@]}; k+=12)); do magick "${cells[@]:k:12}" -background '#888' +append "$tmp/row$k.png"; rows+=("$tmp/row$k.png"); done
magick "${rows[@]}" -background '#888' -append "$out"
echo "$out (${#cells[@]} quadros)"
