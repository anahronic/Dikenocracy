"""Generates the SVG cover illustrations for project tiles and pages (palette: DIRECTION.md).

    python website/tools/make_covers.py
Writes website/assets/covers/<name>-20261015.svg. One palette and line weight for all covers.
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'covers'
OUT.mkdir(parents=True, exist_ok=True)
V = '20261015'

INK = '#0b0c0e'      # line work
GOLD = '#1f2de6'     # the one accent (cobalt); name kept from the first palette
GOLD_SOFT = '#dfe2fb'
LAV = '#e2e5ea'
LAV2 = '#b9bfca'
WHITE = '#f7f8fa'
TEXT = '#0b0c0e'
GROUND = '#d5d9e0'


def svg(name, title, body, bg=None):
    s = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" role="img" aria-label="{title}">
  <rect width="480" height="270" fill="{GROUND}"/>
{body}
</svg>
'''
    (OUT / f'{name}-{V}.svg').write_text(s, encoding='utf-8', newline='\n')


# ── Converter: a dial and the same day in three calendars ─────────────────────
ticks = []
import math
for i in range(60):
    a = math.radians(i * 6)
    r1, r2 = (78, 92) if i % 5 == 0 else (86, 92)
    ticks.append(f'<line x1="{140 + r1 * math.sin(a):.1f}" y1="{135 - r1 * math.cos(a):.1f}" '
                 f'x2="{140 + r2 * math.sin(a):.1f}" y2="{135 - r2 * math.cos(a):.1f}" '
                 f'stroke="{INK}" stroke-width="{2.2 if i % 5 == 0 else 1}" stroke-linecap="round" opacity="{1 if i % 5 == 0 else .45}"/>')
svg('converter', 'Time converter: one day in Gregorian, Hebrew and DTI calendars', f'''
  <circle cx="140" cy="135" r="100" fill="{WHITE}" stroke="{LAV2}" stroke-width="2"/>
  {''.join(ticks)}
  <path d="M140 135 L140 70" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M140 135 L188 158" stroke="{GOLD}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="140" cy="135" r="7" fill="{GOLD}" stroke="{WHITE}" stroke-width="2"/>
  <g font-family="Segoe UI, Helvetica, Arial, sans-serif">
    <rect x="262" y="58" width="190" height="44" rx="10" fill="{WHITE}" stroke="{LAV2}"/>
    <text x="278" y="77" font-size="11" fill="#555c68" letter-spacing="1">GREGORIAN</text>
    <text x="278" y="94" font-size="15" font-weight="600" fill="{TEXT}">2026-10-13</text>
    <rect x="262" y="112" width="190" height="44" rx="10" fill="{WHITE}" stroke="{LAV2}"/>
    <text x="278" y="131" font-size="11" fill="#555c68" letter-spacing="1">HEBREW</text>
    <text x="436" y="148" font-size="15" font-weight="600" fill="{TEXT}" direction="rtl" unicode-bidi="embed" text-anchor="start">ב׳ חשון תשפ״ז</text>
    <rect x="262" y="166" width="190" height="44" rx="10" fill="{GOLD_SOFT}" stroke="{GOLD}"/>
    <text x="278" y="185" font-size="11" fill="{GOLD}" letter-spacing="1">DTI</text>
    <text x="278" y="202" font-size="15" font-weight="700" fill="{GOLD}">DY6837-008</text>
  </g>
  <path d="M244 80 h12 M244 134 h12 M244 188 h12" stroke="{LAV2}" stroke-width="2" stroke-linecap="round"/>''')

# ── Shadoo: sealed envelope with a padlock and cipher text ─────────────────────
svg('shadoo', 'Shadoo: a message encrypted with a shared code phrase', f'''
  <g transform="translate(118 62)">
    <rect x="0" y="20" width="244" height="150" rx="14" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>
    <path d="M6 30 L122 110 L238 30" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M6 164 L92 92 M238 164 L152 92" stroke="{LAV2}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(206 128)">
    <path d="M18 36 V22 a20 20 0 0 1 40 0 V36" fill="none" stroke="{GOLD}" stroke-width="7" stroke-linecap="round"/>
    <rect x="4" y="34" width="68" height="54" rx="10" fill="{GOLD}"/>
    <circle cx="38" cy="56" r="7" fill="{WHITE}"/>
    <rect x="35" y="58" width="6" height="16" rx="3" fill="{WHITE}"/>
  </g>
  <g font-family="Consolas, 'Courier New', monospace" font-size="14" fill="{INK}" opacity=".55">
    <text x="22" y="52">7f3a·e91c·04b2</text>
    <text x="330" y="246">c5d0·9a17·ee6f</text>
    <text x="26" y="238">AES-256-GCM</text>
    <text x="356" y="44">a91f·2b</text>
  </g>''')

# ── Survival manual: open book with shelter and checklist ──────────────────────
svg('survival', 'Post-Nuclear Survival Manual: shelter, water, health and recovery', f'''
  <g transform="translate(96 54)">
    <path d="M144 22 C104 4 52 4 6 18 V178 C52 164 104 164 144 182Z" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M144 22 C184 4 236 4 282 18 V178 C236 164 184 164 144 182Z" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M144 22 V182" stroke="{INK}" stroke-width="2"/>
    <g transform="translate(40 50)">
      <path d="M0 50 L36 18 L72 50" fill="none" stroke="{GOLD}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
      <rect x="10" y="46" width="52" height="40" rx="3" fill="{GOLD_SOFT}" stroke="{GOLD}" stroke-width="3"/>
      <rect x="29" y="62" width="14" height="24" rx="2" fill="{GOLD}"/>
    </g>
    <g stroke="{INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M176 52 l7 7 12-13"/><path d="M204 54 h50" stroke="{LAV2}"/>
      <path d="M176 88 l7 7 12-13"/><path d="M204 90 h44" stroke="{LAV2}"/>
      <path d="M176 124 l7 7 12-13"/><path d="M204 126 h52" stroke="{LAV2}"/>
    </g>
  </g>''')

# ── Planned: dashboards / simulations ───────────────────────────────────────────
svg('dashboards', 'Public dashboards (planned)', f'''
  <rect x="70" y="50" width="340" height="180" rx="14" fill="{WHITE}" stroke="{LAV2}" stroke-width="2"/>
  <path d="M96 190 L150 150 L200 166 L256 112 L310 128 L382 80" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 190 L150 150 L200 166 L256 112 L310 128 L382 80 V206 H96Z" fill="{LAV}" opacity=".7"/>
  <circle cx="256" cy="112" r="6" fill="{GOLD}"/><circle cx="382" cy="80" r="6" fill="{GOLD}"/>''')

nodes = [(120, 90), (220, 60), (320, 100), (380, 190), (250, 200), (150, 190), (240, 132)]
edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (6, 0), (6, 2), (6, 4), (1, 6)]
svg('simulations', 'Governance simulations (planned)',
    ''.join(f'<line x1="{nodes[a][0]}" y1="{nodes[a][1]}" x2="{nodes[b][0]}" y2="{nodes[b][1]}" stroke="{LAV2}" stroke-width="3"/>'
            for a, b in edges) +
    ''.join(f'<circle cx="{x}" cy="{y}" r="{16 if i == 6 else 11}" fill="{GOLD if i == 6 else WHITE}" stroke="{INK}" stroke-width="3"/>'
            for i, (x, y) in enumerate(nodes)))
print('covers written to', OUT)
