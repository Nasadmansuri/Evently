# 🎨 Evently Official Stitch & UI/UX Design System Guidelines

**Asset ID in Stitch MCP**: `assets/9535598877651538701`  
**Primary Brand**: Deep Teal (`#035352`)  
**Typography**: Manrope (Headings: 700/800, Body: 500/600, Labels: 600/700)

---

## 1. 🌈 Color Tokens & Surfaces

| Token Name | Hex / Class | Usage |
| :--- | :--- | :--- |
| **Primary Brand** | `#035352` (`primary-700`) | Main CTA buttons, active sidebar items, selected tab pills, brand accents |
| **Primary Hover / Active** | `#023D3C` (`primary-800`) | Hover & active press states for primary actions |
| **Canvas Background** | `#F8FAFC` (`bg-slate-50`) | Global page background |
| **Surface Containers** | `#FFFFFF` (`bg-white`) | Clean card surfaces, modal dialog bodies, dropdown trays |
| **Border Accents** | `#E2E8F0` (`border-slate-200`) | Card outlines, dividers, form input borders |
| **Primary Text** | `#0F172A` (`text-slate-900`) | Headings, event titles, key metrics (high contrast) |
| **Secondary Text** | `#475569` (`text-slate-600`) | Descriptions, body paragraphs, table values |
| **Muted Metadata** | `#94A3B8` (`text-slate-400`) | Dates, timestamps, uppercase pill labels |

---

## 2. 🏷️ Category Pill Tokens (Consistent Everywhere)

* **Technical / Coding**: Cyan/Blue (`bg-blue-50 text-blue-700 border-blue-100`)
* **Cultural / Arts**: Pink/Rose (`bg-rose-50 text-rose-700 border-rose-100`)
* **Sports / Athletics**: Orange/Amber (`bg-amber-50 text-amber-700 border-amber-100`)
* **Academic / Workshop**: Emerald/Teal (`bg-emerald-50 text-emerald-700 border-emerald-100`)
* **Competition / Hackathon**: Purple/Indigo (`bg-purple-50 text-purple-700 border-purple-100`)
* **Conference / Seminar**: Slate/Indigo (`bg-slate-100 text-slate-700 border-slate-200`)

---

## 3. 🛡️ Strict Anti-AI-Slop & Human-Crafted UX Rules

1. **Uniform, Clean Metric Cards**:
   - ❌ **NEVER** use tacky multi-colored top borders (e.g. `border-t-2 border-t-amber-500`) on cards.
   - ✅ **ALWAYS** use pure white cards (`border border-slate-200/80 bg-white rounded-2xl p-5 shadow-2xs hover:border-slate-300`) with subtle icon wells.
2. **Adaptive Layout Containers**:
   - ❌ **NEVER** leave empty grey void boxes or giant generic placeholder images.
   - ✅ **ALWAYS** make layouts adaptive (e.g. Event details collapse into an elegant full-width editorial card when no banner is uploaded).
3. **Tactile Micro-Interactions**:
   - All interactive buttons must have `active:scale-95` or `active:scale-[0.98]` and `transition-all duration-150`.
4. **Rich Empty States**:
   - Empty lists or search results must render a styled Lucide icon well + clear, direct CTA button (e.g. "Browse Campus Events").
5. **No Raw Boolean Artifacts**:
   - Always cast boolean database fields with `!!event.is_team_event` so literal `0` is never rendered to the DOM.
