#!/usr/bin/env bash
# A própria folha ampliada, com cada quadro contornado e rotulado "fileira.coluna" NA POSIÇÃO ORIGINAL.
# É a melhor forma de ler folhas irregulares (quadros soltos, grupos de tamanhos diferentes).
# uso: bash tools/sprites/label.sh <folha.png> <grade.txt> <saida.png> [escala=3]
set -euo pipefail
sheet=$1 grid=$2 out=$3 k=${4:-3}
draw=()
while read -r id rect; do
  IFS=, read -r x y w h <<< "$rect"
  draw+=(-stroke '#ff00ff' -fill none -draw "rectangle $((x*k)),$((y*k)) $(((x+w)*k-1)),$(((y+h)*k-1))")
  draw+=(-stroke none -fill '#ffff00' -undercolor '#000000a0' -pointsize 13 -annotate "+$((x*k+2))+$((y*k+12))" "$id")
done < "$grid"
magick "$sheet" -background '#808080' -flatten -scale "$((k*100))%" "${draw[@]}" "$out"
echo "$out"
