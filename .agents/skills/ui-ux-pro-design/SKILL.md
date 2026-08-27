---
name: ui-ux-pro-design
description: World-class modern UI/UX design, visual hierarchy, micro-interactions, responsive design systems, and aesthetic polish for production web apps.
---

# UI/UX Pro Design System & Aesthetic Excellence Skill

This skill provides comprehensive instructions, design principles, and UI/UX patterns to elevate the visual polish, interactivity, and perceived quality of **Evently** to a showcase-winning standard.

---

## 1. Core Visual Principles for Award-Winning Apps

1. **Depth & Elevation Architecture**:
   - Use multi-tiered subtle shadows instead of harsh black drops:
     - Base cards: `border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
     - Floating Modals/Popovers: `border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl`
     - Inner contrast wells: `bg-slate-50/80 border border-slate-100 rounded-xl`
2. **Typography Hierarchy (Manrope)**:
   - **Page Titles**: `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`
   - **Section Headers**: `text-base sm:text-lg font-bold tracking-tight text-slate-900`
   - **Card Titles**: `text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary-700 transition`
   - **Metadata / Subtext**: `text-xs font-medium text-slate-500`
   - **Overline / Category Trackers**: `text-[10.5px] font-black uppercase tracking-wider text-slate-400`
3. **Brand Token Integrity**:
   - **Primary Teal**: `#035352` (`primary-700`), `#046a68` (`primary-600`), `#e6f2f2` (`primary-50`)
   - **Accent Yellow**: `#F3E8BC` (`amber-100` / `amber-500`)
   - **Category Tag Isolation**: Technical (Blue), Cultural (Slate), Sports (Pink), Workshop (Orange), Competition (Purple), Seminar (Amber), Conference (Slate).

---

## 2. Micro-Interactions & Motion Design

1. **Button States**:
   - Primary: `bg-primary-700 hover:bg-primary-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs active:scale-[0.97] transition-all`
   - Secondary / Action: `border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl shadow-xs active:scale-[0.97] transition-all`
   - Danger / Cancel: `border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2 rounded-xl active:scale-[0.97] transition-all`
2. **Interactive Elements**:
   - Dropdowns & Popovers: Add `animate-in fade-in zoom-in-95 duration-150` with high z-index (`z-[100]`).
   - Cards: Subtle hover lifting `hover:-translate-y-1 hover:border-slate-300 transition-all duration-200`.
   - Modals: Backdrop blur overlay `bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200`.

---

## 3. Delightful Empty States & Visual Feedback

Never show a raw empty white space. Always compose structured empty state cards:
- An oversized, soft tinted icon container (`h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center`).
- Clear, actionable title + helpful 1-sentence description.
- Primary CTA button to guide the user to the next logical step.

---

## 4. Mobile Responsiveness & Form Ergonomics

- Touch targets: Minimum 40px height for all buttons and interactive controls.
- Responsive grids: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`.
- Floating action bars on mobile viewports for critical steps (e.g. Register Now, Submit Feedback).
