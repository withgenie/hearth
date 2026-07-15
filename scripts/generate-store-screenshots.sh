#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/assets/app-store/1.1.0/raw"
OUT="$ROOT/docs/superpowers/app-store/screenshots/1.1.0"
FONT_KO="/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN="/System/Library/Fonts/SFNS.ttf"
FONT_MONO="/System/Library/Fonts/SFNSMono.ttf"

command -v magick >/dev/null || {
  echo "ImageMagick is required (brew install imagemagick)." >&2
  exit 1
}

render() {
  local locale="$1" index="$2" source="$3" title="$4" subtitle="$5" mode="$6"
  local font="$FONT_EN" output="$OUT/$locale/$index.png" prepared app_panel terminal_panel
  [[ "$locale" == "ko" ]] && font="$FONT_KO"
  prepared="$(mktemp -t hearth-store-shot).png"

  mkdir -p "$OUT/$locale"
  if [[ "$mode" == "agent" ]]; then
    app_panel="$(mktemp -t hearth-store-app).png"
    terminal_panel="$(mktemp -t hearth-store-terminal).png"

    magick "$source" -background '#0e0e0d' -alpha remove -alpha off \
      -resize '1600x1283^' -gravity center -extent '1600x1283' "$app_panel"

    if [[ "$locale" == "ko" ]]; then
      magick -size '920x1283' xc:'#141412' \
        -fill '#24211d' -draw 'roundrectangle 44,42 876,1241 28,28' \
        -fill '#e98116' -draw 'roundrectangle 78,82 372,142 30,30' \
        -font "$FONT_EN" -fill '#fffaf1' -pointsize 27 -annotate +112+123 'HEARTH SKILL' \
        -font "$FONT_EN" -fill '#8f877a' -pointsize 24 -annotate +78+205 'CLAUDE CODE  /  CODEX' \
        -font "$FONT_KO" -fill '#f5ecdf' -pointsize 43 -interline-spacing 16 \
        -annotate +78+302 $'> 오늘 작업한 PR을\n  Hearth 프로젝트로\n  정리하고 내일 리뷰를 잡아줘' \
        -stroke '#3a352e' -strokewidth 2 -draw 'line 78,560 842,560' -stroke none \
        -font "$FONT_MONO" -fill '#efb86a' -pointsize 27 -interline-spacing 14 \
        -annotate +78+645 $'hearth project create\nhearth memo create\nhearth schedule create' \
        -font "$FONT_KO" -fill '#a9d18e' -pointsize 32 -interline-spacing 18 \
        -annotate +78+910 $'✓ 프로젝트 생성\n✓ 메모 연결\n✓ 일정 등록' \
        -fill '#8f877a' -pointsize 25 -annotate +78+1178 '열려 있는 Hearth에 즉시 반영' \
        "$terminal_panel"
    else
      magick -size '920x1283' xc:'#141412' \
        -fill '#24211d' -draw 'roundrectangle 44,42 876,1241 28,28' \
        -fill '#e98116' -draw 'roundrectangle 78,82 372,142 30,30' \
        -font "$FONT_EN" -fill '#fffaf1' -pointsize 27 -annotate +112+123 'HEARTH SKILL' \
        -fill '#8f877a' -pointsize 24 -annotate +78+205 'CLAUDE CODE  /  CODEX' \
        -fill '#f5ecdf' -pointsize 38 -interline-spacing 16 \
        -annotate +78+302 $'> Turn today\'s PRs into a\n  Hearth project and schedule\n  tomorrow\'s review.' \
        -stroke '#3a352e' -strokewidth 2 -draw 'line 78,560 842,560' -stroke none \
        -font "$FONT_MONO" -fill '#efb86a' -pointsize 27 -interline-spacing 14 \
        -annotate +78+645 $'hearth project create\nhearth memo create\nhearth schedule create' \
        -font "$FONT_EN" -fill '#a9d18e' -pointsize 32 -interline-spacing 18 \
        -annotate +78+910 $'✓ Project created\n✓ Memos linked\n✓ Review scheduled' \
        -fill '#8f877a' -pointsize 25 -annotate +78+1178 'Instantly reflected in the open app' \
        "$terminal_panel"
    fi

    magick "$terminal_panel" "$app_panel" +append "$prepared"
    rm -f "$app_panel" "$terminal_panel"
  elif [[ "$mode" == "calendar-detail" ]]; then
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
  'AI 에이전트가 Hearth를 직접 움직입니다' 'Claude Code·Codex용 Hearth Skill로 프로젝트·메모·일정까지' agent
render ko 02-capture "$RAW/ko/04-memos.png" \
  '생각난 순간, 바로 기록' '메모보드와 저널이 자연스럽게 이어집니다' standard
render ko 03-calendar "$RAW/ko/03-calendar.png" \
  '한 달의 흐름을 한눈에' '종류·색상·아이콘으로 일정의 맥락까지' standard
render ko 04-drag "$RAW/ko/03-calendar.png" \
  '잡아서 옮기면 일정 변경 끝' '부드러운 프리뷰로 원하는 날짜까지 정확하게' calendar-detail
render ko 05-local "$RAW/ko/05-journal.png" \
  '가입도 구독도 없습니다' '데이터는 이 Mac의 로컬 SQLite에' standard

render en 01-workspace "$RAW/en/01-projects.png" \
  'Your AI agent works directly in Hearth.' 'The Hearth Skill turns requests into projects, memos, and schedules.' agent
render en 02-capture "$RAW/en/04-memos.png" \
  'Capture a thought before it disappears.' 'Memo board and Journal keep the thread alive.' standard
render en 03-calendar "$RAW/en/03-calendar.png" \
  'See the shape of your month.' 'Event types, colors, and icons preserve context.' standard
render en 04-drag "$RAW/en/03-calendar.png" \
  'Reschedule by dragging.' 'A smooth preview follows the pointer to the right day.' calendar-detail
render en 05-local "$RAW/en/05-journal.png" \
  'No account. No subscription.' 'Your workspace stays in local SQLite on this Mac.' standard

echo "Generated 10 App Store screenshots in $OUT"
