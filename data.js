// 2026 FIFA World Cup — Static data
// Group stage complete (June 2026). The 32 knockout qualifiers are locked into the
// official Round of 32 matchups (FIFA match nos. 73–88).

// Round of 32 bracket — actual qualified teams.
// R32 entries ordered so consecutive pairs feed R16: r32[2i] & r32[2i+1] → r16[i]
// QF[i] = R16[2i] vs R16[2i+1]; SF[i] = QF[2i] vs QF[2i+1]; Final = SF[0] vs SF[1]
const KNOCKOUT = {
  r32: [
    // → R16[0]
    { home: { name: "South Africa", flag: "🇿🇦" }, away: { name: "Canada",  flag: "🇨🇦" } },  // 73
    { home: { name: "Netherlands",  flag: "🇳🇱" }, away: { name: "Morocco", flag: "🇲🇦" } },  // 75
    // → R16[1]
    { home: { name: "Germany", flag: "🇩🇪" }, away: { name: "Paraguay", flag: "🇵🇾" } },  // 74
    { home: { name: "France",  flag: "🇫🇷" }, away: { name: "Sweden",   flag: "🇸🇪" } },  // 77
    // → R16[2]
    { home: { name: "Brazil",      flag: "🇧🇷" }, away: { name: "Japan",  flag: "🇯🇵" } },  // 76
    { home: { name: "Ivory Coast", flag: "🇨🇮" }, away: { name: "Norway", flag: "🇳🇴" } },  // 78
    // → R16[3]
    { home: { name: "Mexico",  flag: "🇲🇽" },        away: { name: "Ecuador",  flag: "🇪🇨" } },  // 79
    { home: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, away: { name: "DR Congo", flag: "🇨🇩" } },  // 80
    // → R16[4]
    { home: { name: "Portugal", flag: "🇵🇹" }, away: { name: "Croatia", flag: "🇭🇷" } },  // 83
    { home: { name: "Spain",    flag: "🇪🇸" }, away: { name: "Austria", flag: "🇦🇹" } },  // 84
    // → R16[5]
    { home: { name: "USA",     flag: "🇺🇸" }, away: { name: "Bosnia-Herzegovina", flag: "🇧🇦" } },  // 81
    { home: { name: "Belgium", flag: "🇧🇪" }, away: { name: "Senegal",            flag: "🇸🇳" } },  // 82
    // → R16[6]
    { home: { name: "Argentina", flag: "🇦🇷" }, away: { name: "Cape Verde", flag: "🇨🇻" } },  // 86
    { home: { name: "Australia", flag: "🇦🇺" }, away: { name: "Egypt",      flag: "🇪🇬" } },  // 88
    // → R16[7]
    { home: { name: "Switzerland", flag: "🇨🇭" }, away: { name: "Algeria", flag: "🇩🇿" } },  // 85
    { home: { name: "Colombia",    flag: "🇨🇴" }, away: { name: "Ghana",   flag: "🇬🇭" } },  // 87
  ],
};
