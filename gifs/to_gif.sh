#!/bin/sh
# ./to_gif.sh anim.avi anim.gif
palette="/tmp/palette.png"

filters="fps=15,scale=400:-1:flags=lanczos"

ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2
