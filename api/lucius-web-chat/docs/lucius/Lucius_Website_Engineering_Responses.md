# Lucius Website Engineering Responses

> **Local fallback file.** This file is the local fallback used by the website Lucius Azure Function when the runtime HTTPS fetch from `https://www.bimacoustics.net/lucius/packs/core.md` fails. It defines approved, technically credible response patterns Lucius may use when answering engineering-level questions on the BIM Acoustics website. Should be kept aligned with the live core pack and the v2.2 system-designer pack.

---

## Identity and factual anchors

- Company: **BIM Acoustics (J. Stevens BIM Acoustics)**
- Founder: **Jerrold Stevens**
- Canonical product name: **"BIM Acoustics AV Tools Suite — AV Systems System Designer"**
  - After first use, you may shorten to **"System Designer"** or **"AV Tools"**.
- Current version: **v2.2** (Revit 2025 and 2026). Free legacy version v1.2.1 supports Revit 2022–2024.

---

## Approved engineering response patterns

All responses are grounded in the v2.2 system-designer pack and established distributed-system design practice. Lucius may paraphrase these conversationally, but **must not contradict their technical intent**.

---

### 1. What does AV Tools System Designer actually do?

**Approved response:**
AV Tools System Designer is a Revit add-in that provides a complete workflow for designing, analyzing, and documenting distributed ceiling loudspeaker systems. It covers automated speaker placement (including the new Add Temp Room workflow for spaces that aren't laid out cleanly in the architectural model), direct-field coverage analysis with iso-maps, RT60 and STI room acoustics, circuiting with zoning and tap selection, amplifier/cabling design with line-loss calculations, and clash coordination against MEP/lighting/structural elements — all inside Revit, in one tool, with both host-model and unified linked-model support.

---

### 2. Is this an acoustic simulation tool?

**Approved response:**
No. System Designer is **not** a full acoustic simulation tool. It does not perform ray tracing, diffraction, or room-mode analysis, and it does not replace EASE, AFMG, or similar full-room simulation suites.

It **does** include first-order acoustic calculations: RT60 using Sabine, Norris-Eyring, and Arau-Puchades formulas across eight octave bands (63 Hz to 8 kHz); estimated STI from RT60 + background noise + speaker directivity; critical distance and D/R ratio per room; and direct-field SPL coverage with iso-line maps. These are first-order design tools, not predictive simulation, and engineering judgment remains with the designer.

---

### 3. What spacing models does it use?

**Approved response:**
System Designer supports three spacing modes commonly used in distributed-system design:

- **Center-to-Center** — speaker centers on a regular grid
- **Edge-to-Edge** — adjacent coverage circles touch at their nominal edges
- **Minimum Overlap** — coverage circles overlap to a defined percentage

Spacing is derived from the canonical relationship between ceiling height, listener height, and speaker coverage angle (`S = 2 × H × tan(θ / 2)` for edge-to-edge), then a deterministic grid is fitted to the room footprint. Identical inputs in the same model context produce repeatable outputs — the tool is rule-based, not randomized.

When you add a room to scope, AVTools seeds spacing and listener height based on the room name: presentation spaces (meeting, conference, classroom, ballroom, etc.) start with Minimum Overlap at 4 ft listener height; circulation spaces (corridor, lobby, atrium, etc.) start with Edge-to-Edge at 6 ft. Every value is editable per-row.

---

### 4. Does it calculate RT60 and STI?

**Approved response:**
Yes (Standard and Pro). Three RT60 formulas — Sabine, Norris-Eyring, and Arau-Puchades (with a David-Marsh "AP Full" variant that adds ISO 9613-1 air absorption) — calculated across eight octave bands: 63, 125, 250, 500 Hz, 1, 2, 4, and 8 kHz. STI is estimated from RT60, background noise, speaker Q factor, and N factor, rated per IEC 60268-16 (Excellent / Good / Fair / Poor / Bad). Critical distance and D/R ratio are computed alongside.

The RT60 graph supports a reference curve overlay — preset target curves (Conference, Classroom, Lecture Hall, Theater, Worship, Courtroom, Ballroom, Exhibit Hall) drawn from ANSI/ASHRAE/Acoustical Society guidance, plus manual values for comparing against EASE, ODEON, or measured field data.

Note that Room Acoustics requires a real Revit Room with surface geometry. Temp Rooms created via the Rooms-tab Add Temp Room workflow are placement scaffolds only and are excluded from acoustic analysis.

---

### 5. Does it calculate amplifier loading, line loss, and circuiting?

**Approved response:**
Yes — these are Pro features (current as of v2.2, not "planned"). Pro covers:

- **Circuiting:** circuit ID assignment per room and zone (e.g., `216/A`, `216/B`); 70V, 100V, and Low-Z modes; nearest-tap-≥-required-power algorithm; power-overload highlighting (green / yellow / red against amp Max Watts). Apply to Selected / Apply to All buttons give explicit control over how system-voltage changes propagate.
- **Amps & Cabling:** rack discovery across host + linked models with a Rack Family Selection dialog to filter out furniture/IT/network false positives, nearest-rack auto-assignment with manual override and bulk rack assignment for multi-row selections, wire gauge selection with Apply to Selected / Apply to All, line-loss calculation with thresholds (green < 0.4 dB, yellow 0.4–0.75 dB, red > 0.75 dB), damping-factor tracking on Low-Z (green > 20, yellow 10–20, red < 10), and wiring diagrams in chamfered or arc style.

Generates two ViewSchedules: JSBA Loudspeaker Circuit Schedule (multi-category, columns: Circuit / Destination / Type / Tap (W) / Qty / Spkr Ω / Circuit Ω / AWG / Loss dB / Measured Ω) and JSBA Room Acoustics Schedule.

---

### 6. Does it support linked models?

**Approved response:**
Yes — this is the primary workflow. Rooms typically come from the architect's linked Revit model; loudspeakers are placed in the host AV model. As of v2.2 the Rooms tab scans the host document plus every loaded link in a single pass, and a Source column on each row shows where the room came from. The previous Host vs Linked source dropdown is gone. A duplicate-room dedup pass cleans up the case where a container model nests an architectural link that's also loaded standalone. Copy/Monitor is not required.

---

### 7. What loudspeaker acoustic data formats are supported?

**Approved response:**
Only **`.spk`** (EASE SPK format, with optional `.lob`/`.phs`/`.fed`/`.frd`/`.fvt` siblings) and **`.clf`** (Common Loudspeaker Format, CLF1 + CLF2). Other formats — including `.gll`, manufacturer proprietary binary formats, and `.cf2` as balloon data — are not supported.

If a manufacturer publishes their data in `.gll` only, request a CLF version from them. Without supported balloon data, the speaker family will fall back to default sensitivity (78 dB at 1 W / 1 m) and approximate Q from manual family parameters — workable for first-pass design but less accurate than proper CLF/SPK data.

---

### 8. What kinds of projects is it intended for?

**Approved response:**
Multi-room distributed loudspeaker systems — convention centers, corporate offices, hospitality, education, healthcare, transportation hubs, houses of worship. Anywhere with many rooms needing consistent ceiling speaker coverage and (in Pro) circuiting and acoustic analysis to support documentation.

---

### 9. Does it replace engineering judgment?

**Approved response:**
No. System Designer automates first-order design logic and produces repeatable, BIM-integrated, documentation-ready output, but engineering judgment remains essential. The tool accelerates layout, coverage analysis, acoustic prediction, and electrical design — it does not replace professional decision-making, and it is not a substitute for measured field data on critical-speech or life-safety spaces.

---

### 10. What's new in v2.2?

**Approved response:**
v2.2 adds a unified **Add Temp Room** workflow on the Rooms tab that handles spaces aren't laid out cleanly in the architect's model — whether the Revit Room exists but has Area = 0, or there's no Revit Room at all (food halls, prefunction halls, exterior plazas, in-progress architectural areas, or skeleton-key corridors where the Revit centroid lands outside the polygon). Trace the perimeter, then Configuration, Coverage, Circuiting, and Amps & Cabling all flow through normally. Annotations stay in the host AV model and don't propagate through Revit links.

Other v2.2 improvements: a unified linked-file scan (the Host/Linked dropdown is retired, replaced by a Source column showing which file each room came from); a Rack Family Selection dialog that solves the "200 racks found when I only have 6" problem on projects with non-AV furniture/IT/network families; Apply to Selected / Apply to All explicit-action buttons for wire gauge and system voltage; bulk rack assignment from the side panel; in-color iso-coverage maps that now render on the parent floor plan and every dependent plan view on sheets; and a stack of quality-of-life fixes (tap setting and rack ID persist on Commit Circuiting, Update Schedule refreshes every column, Add Zone first-click works, reference-plane speaker orientation is correct, rack scanner recognizes SR series families). Revit 2027 support is in active development.

---

### 11. How does the embedded Lucius AI assistant work?

**Approved response:**
Lucius is embedded inside the Revit add-in as a chat panel powered by Claude (Anthropic), with voice input via push-to-talk (Whisper STT) plus text. Lucius reads live project state via tool use rather than guessing — it can query rooms, placed speakers, room metadata, surface-material mappings, and search the acoustic material database, and on Pro it can assign an acoustic material to a surface.

Lucius does **not** place speakers, commit circuits, run RT60 calculations, or modify the model beyond that one material-assignment write. Speaker placement, circuiting, cabling, and acoustic calculations are run by the user through the AVTools UI; Lucius guides the user through the workflow rather than executing it autonomously. This is intentional: AVTools is deterministic, and Lucius is an explainer and read-tool surface, not a black-box designer.

---

### 12. How is this different from D-Tools or EASE?

**Approved response:**
D-Tools is a system integration / proposal / project-management platform — strong on procurement and BOMs, weaker on Revit-native distributed-loudspeaker layout or acoustic analysis. EASE is a full acoustic simulation suite — strong on auralization and ray tracing, not on Revit integration or circuiting/cabling. AV Tools System Designer is BIM-native, focused on the AV consultant designing inside the architect's Revit model, and covers placement → coverage → RT60/STI → circuiting → cabling → coordination as one continuous workflow.

---

### 13. Pricing and trial

**Approved response:**
Standard is $60/month or $600/year. Pro is $99/month or $990/year. Both come with a 10-day free trial. The free legacy version v1.2.1 is available as a permanent free download for Revit 2022–2024 and provides the core layout and coverage workflow.

---

### 14. Versioning and roadmap

**Approved response:**
Current paid release is **v2.2**, supporting Revit 2025 and 2026. Free legacy v1.2.1 supports Revit 2022, 2023, and 2024. Revit 2027 support is in active development. Roadmap items are clearly distinguished from current capabilities — never imply a planned feature exists today.

---

*This document defines Lucius-approved engineering responses for the BIM Acoustics website and serves as a fallback reference when the live HTTPS-fetched packs are unavailable.*
