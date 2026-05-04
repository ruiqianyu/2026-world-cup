// 2026 FIFA World Cup — Static data
// Groups from the December 5, 2025 draw at the Kennedy Center, Washington D.C.

const GROUPS = [
  { name: "A", teams: [
    { name: "Mexico",       flag: "🇲🇽" },
    { name: "South Korea",  flag: "🇰🇷" },
    { name: "South Africa", flag: "🇿🇦" },
    { name: "Czechia",      flag: "🇨🇿" },
  ]},
  { name: "B", teams: [
    { name: "Canada",             flag: "🇨🇦" },
    { name: "Switzerland",        flag: "🇨🇭" },
    { name: "Qatar",              flag: "🇶🇦" },
    { name: "Bosnia-Herzegovina", flag: "🇧🇦" },
  ]},
  { name: "C", teams: [
    { name: "Brazil",   flag: "🇧🇷" },
    { name: "Morocco",  flag: "🇲🇦" },
    { name: "Haiti",    flag: "🇭🇹" },
    { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ]},
  { name: "D", teams: [
    { name: "USA",       flag: "🇺🇸" },
    { name: "Paraguay",  flag: "🇵🇾" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "Turkey",    flag: "🇹🇷" },
  ]},
  { name: "E", teams: [
    { name: "Germany",     flag: "🇩🇪" },
    { name: "Ecuador",     flag: "🇪🇨" },
    { name: "Ivory Coast", flag: "🇨🇮" },
    { name: "Curaçao",     flag: "🇨🇼" },
  ]},
  { name: "F", teams: [
    { name: "Netherlands", flag: "🇳🇱" },
    { name: "Japan",       flag: "🇯🇵" },
    { name: "Tunisia",     flag: "🇹🇳" },
    { name: "Sweden",      flag: "🇸🇪" },
  ]},
  { name: "G", teams: [
    { name: "Belgium",     flag: "🇧🇪" },
    { name: "Iran",        flag: "🇮🇷" },
    { name: "Egypt",       flag: "🇪🇬" },
    { name: "New Zealand", flag: "🇳🇿" },
  ]},
  { name: "H", teams: [
    { name: "Spain",        flag: "🇪🇸" },
    { name: "Uruguay",      flag: "🇺🇾" },
    { name: "Saudi Arabia", flag: "🇸🇦" },
    { name: "Cape Verde",   flag: "🇨🇻" },
  ]},
  { name: "I", teams: [
    { name: "France",  flag: "🇫🇷" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "Norway",  flag: "🇳🇴" },
    { name: "Iraq",    flag: "🇮🇶" },
  ]},
  { name: "J", teams: [
    { name: "Argentina", flag: "🇦🇷" },
    { name: "Austria",   flag: "🇦🇹" },
    { name: "Algeria",   flag: "🇩🇿" },
    { name: "Jordan",    flag: "🇯🇴" },
  ]},
  { name: "K", teams: [
    { name: "Portugal",   flag: "🇵🇹" },
    { name: "Colombia",   flag: "🇨🇴" },
    { name: "Uzbekistan", flag: "🇺🇿" },
    { name: "DR Congo",   flag: "🇨🇩" },
  ]},
  { name: "L", teams: [
    { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Croatia", flag: "🇭🇷" },
    { name: "Panama",  flag: "🇵🇦" },
    { name: "Ghana",   flag: "🇬🇭" },
  ]},
];

// Round of 32 bracket — official matchups (FIFA match nos. 73–88).
// best3rdSlot: index 0–7 into the sorted bestThirds array, or -1 if not a best-3rd slot.
// R32 entries ordered so consecutive pairs feed R16: r32[2i] & r32[2i+1] → r16[i]
// QF[i] = R16[2i] vs R16[2i+1]; SF[i] = QF[2i] vs QF[2i+1]; Final = SF[0] vs SF[1]
const KNOCKOUT = {
  r32: [
    // → R16[0] (match 89: W73 vs W75)
    { home: "2nd A", away: "2nd B",    best3rdSlot: -1 },  // 73
    { home: "1st F", away: "2nd C",    best3rdSlot: -1 },  // 75
    // → R16[1] (match 90: W74 vs W77)
    { home: "1st E", away: "Best 3rd", best3rdSlot: 0  },  // 74
    { home: "1st I", away: "Best 3rd", best3rdSlot: 1  },  // 77
    // → R16[2] (match 91: W76 vs W78)
    { home: "1st C", away: "2nd F",    best3rdSlot: -1 },  // 76
    { home: "2nd E", away: "2nd I",    best3rdSlot: -1 },  // 78
    // → R16[3] (match 92: W79 vs W80)
    { home: "1st A", away: "Best 3rd", best3rdSlot: 2  },  // 79
    { home: "1st L", away: "Best 3rd", best3rdSlot: 3  },  // 80
    // → R16[4] (match 93: W83 vs W84)
    { home: "2nd K", away: "2nd L",    best3rdSlot: -1 },  // 83
    { home: "1st H", away: "2nd J",    best3rdSlot: -1 },  // 84
    // → R16[5] (match 94: W81 vs W82)
    { home: "1st D", away: "Best 3rd", best3rdSlot: 4  },  // 81
    { home: "1st G", away: "Best 3rd", best3rdSlot: 5  },  // 82
    // → R16[6] (match 95: W86 vs W88)
    { home: "1st J", away: "2nd H",    best3rdSlot: -1 },  // 86
    { home: "2nd D", away: "2nd G",    best3rdSlot: -1 },  // 88
    // → R16[7] (match 96: W85 vs W87)
    { home: "1st B", away: "Best 3rd", best3rdSlot: 6  },  // 85
    { home: "1st K", away: "Best 3rd", best3rdSlot: 7  },  // 87
  ],
};
