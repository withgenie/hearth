#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/assets/app-store/1.1.0/raw"
OUT="$ROOT/docs/superpowers/app-store/screenshots/1.1.0"
FONT_KO="/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN="/System/Library/Fonts/SFNS.ttf"

command -v magick >/dev/null || {
  echo "ImageMagick is required (brew install imagemagick)." >&2
  exit 1
}

render() {
  local locale="$1" index="$2" source="$3" title="$4" subtitle="$5" mode="$6"
  local font="$FONT_EN" output="$OUT/$locale/$index.png" prepared
  [[ "$locale" == "ko" ]] && font="$FONT_KO"
  prepared="$(mktemp -t hearth-store-shot).png"

  mkdir -p "$OUT/$locale"
  if [[ "$mode" == "calendar-detail" ]]; then
    magick "$source" -background '#0e0e0d' -alpha remove -alpha off \
      -crop '2200x1120+640+520' +repage -resize '2520x1283^' -gravity center -extent '2520x1283' "$prepared"
  else
    magick "$source" -background '#0e0e0d' -alpha remove -alpha off \
      -resize '2520x1687^' -gravity north -crop '2520x1283+0+0' +repage "$prepared"
  fi

  magick -size '2880x1800' xc:'#f5ecdf' \
    -fill '#e98116' -draw 'roundrectangle 180,118 430,174 28,28' \
    -font "$font" -fill '#fffaf1' -pointsize 30 -annotate +217+158 'HEARTH 1.1' \
    -fill '#171612' -pointsize 92 -annotate +180+292 "$title" \
    -fill '#625b50' -pointsize 43 -annotate +184+375 "$subtitle" \
    "$prepared" -geometry '+180+465' -composite \
    -background '#f5ecdf' -alpha remove -alpha off -strip "$output"
  rm -f "$prepared"
}

rm -f "$OUT/ko"/*.png "$OUT/en"/*.png

render ko 01-workspace "$RAW/ko/01-projects.png" \
  '프로젝트·일정·메모를 한곳에' '하루를 흩뜨리지 않는 로컬 워크스페이스' standard
render ko 02-capture "$RAW/ko/04-memos.png" \
  '생각난 순간, 바로 기록' '메모보드와 저널이 자연스럽게 이어집니다' standard
render ko 03-calendar "$RAW/ko/03-calendar.png" \
  '한 달의 흐름을 한눈에' '종류·색상·아이콘으로 일정의 맥락까지' standard
render ko 04-drag "$RAW/ko/03-calendar.png" \
  '잡아서 옮기면 일정 변경 끝' '부드러운 프리뷰로 원하는 날짜까지 정확하게' calendar-detail
render ko 05-local "$RAW/ko/05-journal.png" \
  '가입도 구독도 없습니다' '데이터는 이 Mac의 로컬 SQLite에' standard

render en 01-workspace "$RAW/en/01-projects.png" \
  'Projects, schedule, and notes. Together.' 'A local workspace that keeps your day in focus.' standard
render en 02-capture "$RAW/en/04-memos.png" \
  'Capture a thought before it disappears.' 'Memo board and Journal keep the thread alive.' standard
render en 03-calendar "$RAW/en/03-calendar.png" \
  'See the shape of your month.' 'Event types, colors, and icons preserve context.' standard
render en 04-drag "$RAW/en/03-calendar.png" \
  'Reschedule by dragging.' 'A smooth preview follows the pointer to the right day.' calendar-detail
render en 05-local "$RAW/en/05-journal.png" \
  'No account. No subscription.' 'Your workspace stays in local SQLite on this Mac.' standard

echo "Generated 10 App Store screenshots in $OUT"
