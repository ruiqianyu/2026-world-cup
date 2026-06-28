// 2026 FIFA World Cup — Static data
// Group stage complete (June 2026). The 32 knockout qualifiers are locked into the
// official Round of 32 matchups (FIFA match nos. 73–88).
//
// IMPORTANT: the r32 array order is NOT the numeric match order. It is arranged so
// that app.js's simple adjacency rule reproduces the official FIFA bracket, where:
//   R16: 89=W74·W77  90=W73·W75  91=W76·W78  92=W79·W80
//        93=W83·W84  94=W81·W82  95=W86·W88  96=W85·W87
//   QF:  97=W89·W90  98=W93·W94  99=W91·W92  100=W95·W96
//   SF:  101=W97·W98 102=W99·W100         Final: W101·W102
//
// R32 entries ordered so consecutive pairs feed R16: r32[2i] & r32[2i+1] → r16[i]
// QF[i] = R16[2i] vs R16[2i+1]; SF[i] = QF[2i] vs QF[2i+1]; Final = SF[0] vs SF[1]
const KNOCKOUT = {
  r32: [
    // ── Top half → Semifinal (match 101) ──
    // → R16[0] (match 89)
    { home: { name: "Germany", flag: "🇩🇪" }, away: { name: "Paraguay", flag: "🇵🇾" } },  // 74
    { home: { name: "France",  flag: "🇫🇷" }, away: { name: "Sweden",   flag: "🇸🇪" } },  // 77
    // → R16[1] (match 90)
    { home: { name: "South Africa", flag: "🇿🇦" }, away: { name: "Canada",  flag: "🇨🇦" } },  // 73
    { home: { name: "Netherlands",  flag: "🇳🇱" }, away: { name: "Morocco", flag: "🇲🇦" } },  // 75
    // → R16[2] (match 93)
    { home: { name: "Portugal", flag: "🇵🇹" }, away: { name: "Croatia", flag: "🇭🇷" } },  // 83
    { home: { name: "Spain",    flag: "🇪🇸" }, away: { name: "Austria", flag: "🇦🇹" } },  // 84
    // → R16[3] (match 94)
    { home: { name: "USA",     flag: "🇺🇸" }, away: { name: "Bosnia-Herzegovina", flag: "🇧🇦" } },  // 81
    { home: { name: "Belgium", flag: "🇧🇪" }, away: { name: "Senegal",            flag: "🇸🇳" } },  // 82

    // ── Bottom half → Semifinal (match 102) ──
    // → R16[4] (match 91)
    { home: { name: "Brazil",      flag: "🇧🇷" }, away: { name: "Japan",  flag: "🇯🇵" } },  // 76
    { home: { name: "Ivory Coast", flag: "🇨🇮" }, away: { name: "Norway", flag: "🇳🇴" } },  // 78
    // → R16[5] (match 92)
    { home: { name: "Mexico",  flag: "🇲🇽" },        away: { name: "Ecuador",  flag: "🇪🇨" } },  // 79
    { home: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, away: { name: "DR Congo", flag: "🇨🇩" } },  // 80
    // → R16[6] (match 95)
    { home: { name: "Argentina", flag: "🇦🇷" }, away: { name: "Cape Verde", flag: "🇨🇻" } },  // 86
    { home: { name: "Australia", flag: "🇦🇺" }, away: { name: "Egypt",      flag: "🇪🇬" } },  // 88
    // → R16[7] (match 96)
    { home: { name: "Switzerland", flag: "🇨🇭" }, away: { name: "Algeria", flag: "🇩🇿" } },  // 85
    { home: { name: "Colombia",    flag: "🇨🇴" }, away: { name: "Ghana",   flag: "🇬🇭" } },  // 87
  ],
};
