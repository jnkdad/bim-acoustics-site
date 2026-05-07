# Product Pack — AV Tools Suite: AV Systems System Designer

This pack defines technically credible response patterns for the product:
**BIM Acoustics AV Tools Suite — AV Systems System Designer**, a Revit add-in for distributed loudspeaker system design. Current version: **v2.1** (Revit 2025.3+); legacy free version v1.2.1 supports Revit 2022–2024.

**Anchoring rule:** If the user asks about distributed ceiling speaker layout, spacing, coverage, acoustics, RT60, STI, materials, circuiting, zoning, racks, cabling, or "what does System Designer do," answer using this pack. Do not drift into generic Revit help.

---

## What This Product Is

AV Tools Suite — AV Systems System Designer is a Revit add-in that provides a complete workflow for designing, analyzing, and documenting distributed ceiling loudspeaker systems. It runs as a dockable panel inside Revit 2025.3+ and supports both host-model and linked-model architectural coordination.

The product has two paid editions plus a free legacy version:

- **Free (v1.2.1)** — Revit 2022–2024. Room selection, speaker layout, placement, direct-field coverage, Lucius chat (guidance only).
- **Standard (v2.1)** — Revit 2025.3+. Adds room acoustics (RT60, STI, material assignment), Lucius AI chat with read tools.
- **Pro (v2.1)** — Revit 2025.3+. Adds circuiting with zones, amps & cabling, coordination/clash detection, advanced rack workflow, and Lucius AI write tools (currently material assignment).

Pricing: Standard $60/month or $600/year. Pro $99/month or $990/year. 10-day free trial on every paid tier.

---

## The Workflow (Eight Tabs)

The tool is organized as a step-by-step workflow. Tabs in order:

1. **Rooms** — pick which rooms are in design scope. Always first.
2. **Configuration** — set host mode, spacing, listener height, layout, speaker selection per room. Run **Refresh Calculations** then **Commit Placement** here.
3. **Direct-Field Coverage** — compute SPL uniformity from placed speakers. Run **Compute Results**, optionally **Draw Iso-Map**.
4. **Room Acoustics** — assign acoustic materials to surfaces, then calculate RT60 (Sabine, Norris-Eyring, Arau-Puchades) and estimated STI.
5. **Circuiting** *(Pro)* — assign circuit IDs, zones, taps, modes (70V/100V/Low-Z); generates the JSBA Loudspeaker Circuit Schedule.
6. **Amps & Cabling** *(Pro)* — rack discovery, nearest-rack assignment, wire gauge, line loss, wiring diagrams.
7. **Coordination** *(Pro)* — clash detection between AV devices and MEP/lighting/structural elements.
8. **About** — version, licensing, transcript opt-in, support tools.

Loudspeakers are placed in the host model. Rooms can come from the host or linked architectural models. Works from either Floor Plan or Reflected Ceiling Plan views.

---

## Speaker Layout & Placement

**Three spacing modes:**
- **Center-to-Center** — speaker centers on a regular grid
- **Edge-to-Edge** — coverage circles touch
- **Minimum Overlap** — coverage circles overlap to a defined percentage

The tool derives coverage radius from ceiling height, listener height, and the speaker's coverage angle, then fills the room with a grid. Spacing is **deterministic**: identical inputs in the same model context produce repeatable outputs.

**Host modes:**
- **Ceiling / Auto** — speaker hosted to the detected ceiling
- **Reference Plane** — for rooms without standard ceilings (exhibit halls, catwalks, open-to-deck spaces)
- **Fallback Z** — fixed elevation when neither ceiling nor reference plane is appropriate

**Tile centering** is supported for ACT ceiling grids (2×2, 2×4) so speakers align to tiles rather than landing on grid lines.

**Linked model rooms:** rooms from the architect's linked model are fully supported. Speakers are placed in the host AV model. Copy/Monitor is not required.

**Acoustic data files for speakers** — only **`.spk`** (EASE SPK format, with optional `.lob`/`.phs`/`.fed`/`.frd`/`.fvt` siblings) and **`.clf`** (Common Loudspeaker Format, CLF1 + CLF2) are supported. `.gll`, manufacturer proprietary binary formats, and `.cf2` as balloon data are **not** supported. If a manufacturer only provides `.gll`, request CLF data from them; without supported data, the family falls back to default sensitivity (78 dB at 1W/1m) and approximate Q from manual family parameters.

**Nudge tool (new in v2.1):** for fine-tuning speaker positions after auto-layout. Click Nudge on a row → AVTools selects all that room's placed speakers in Revit's UI and hands focus to the canvas → use Revit's native arrow-key nudge with Shift/Ctrl modifiers → Esc when done.

**Grid θ rotation:** blank = auto-detect from room polygon's longest edge. Override per-row when auto-detect picks the wrong axis (irregular rooms, ceiling tile grid running off-axis from the room polygon, soffit-driven orientation).

---

## Direct-Field Coverage Analysis

**Compute Results** scans placed speakers and computes per-room uniformity using each room's Target SPL and Listener Height. Results display:

- Speakers Placed count
- Target SPL
- Min / Max SPL
- Range
- Uniformity bands: **% within ±1 dB**, **% within ±2 dB**, **% within ±3 dB**, **% > +3 dB** *(refined in v2.1 — previously ±2/4/6)*

Yellow cells flag metrics outside preferred thresholds; review by adjusting spacing, layout, target SPL, or speaker count, then re-Commit Placement and re-Compute Results.

**Draw Iso-Map** draws bucketed iso-line contours on the active view at the listener plane. **Clear Map** removes them.

The coverage engine models **direct-field only** — no reflections, no full-room simulation. Reflections, RT60, and STI are computed separately by the Room Acoustics tab.

If results show `−999` for a room, that room has speakers without usable tap/wattage/sensitivity data: verify Loudspeaker family + acoustic data file (`.spk`/`.clf`) are set, Tap Watts is non-zero, then re-compute.

---

## Room Acoustics

**RT60 calculation — three formulas, eight octave bands each:**

- **Sabine** — standard reverb formula, assumes diffuse field
- **Norris-Eyring** — better for highly absorptive rooms
- **Arau-Puchades (AP)** — classical 1988 formula. Per-axis α from surfaces perpendicular to each axis; per-axis RT uses Eyring with that axis's α; final RT is the surface-weighted geometric mean of the three axis RTs. Robust default.
- **Arau-Puchades (Full)** — adds ISO 9613-1 air absorption per band. More accurate at 4 kHz+ where air absorption matters; numerically fragile on lopsided-absorption rooms (skipped at 63 Hz, falls back to Sabine when the geometric mean collapses).

Octave bands computed: **63, 125, 250, 500 Hz, 1, 2, 4, 8 kHz**.

AP > Eyring at 1–2 kHz in typical meeting rooms is **expected** — absorbent ceiling + carpet floor + hard gypsum walls is exactly the lopsided-absorption case AP captures and Eyring's uniform-mixing assumption hides.

**STI (Speech Transmission Index)** — estimated from RT60 bands, background noise, speaker Q factor, and N factor. Rated per IEC 60268-16:

| STI | Rating |
|---|---|
| 0.75–1.00 | Excellent |
| 0.60–0.74 | Good |
| 0.45–0.59 | Fair |
| 0.30–0.44 | Poor |
| 0.00–0.29 | Bad |

Targets: ≥ 0.50 general; ≥ 0.60 for critical-speech spaces; ≥ 0.50 mass-notification minimum.

**Critical Distance and D/R Ratio:** computed per room. Dc = 0.141 × √(Q × R) where R is the room constant. D/R is computed and displayed alongside.

**Surface attribution:** the tool extracts surfaces from Revit room geometry, classifies them by category (Wall, Floor, Ceiling, Door, Window) using face-axis vectors, and supplements with detected doors, windows, curtain walls, and storefront inserts.

**Operable partition detection:** rooms separated by operable partitions are detected. RT60 is computed for the combined state and exportable to CSV.

**Multi-ceiling attribution:** rooms with partitioned ceilings (e.g., GYP perimeter + 2'×6' ACT field) appear as one row per ceiling type in Assign Materials, each with its own area. When a single ceiling spans multiple rooms divided by operable partitions or room-separation lines, its area is distributed proportionally across covered rooms by floor area.

**Reference curve overlay (new in v2.1):** the RT60 graph supports a reference curve dropdown with preset target curves (Conference/Meeting, Classroom, Lecture Hall, Theater, Worship, Courtroom, Ballroom, Exhibit Hall) — sourced from ANSI/ASHRAE/Acoustical Society guidance. Manual reference values can also be entered per band, useful for: (1) comparing against another model (EASE, ODEON, CATT), (2) overlaying measured field data to validate prediction, or (3) tuning material assignments on renovation projects until the AVTools prediction matches measurement.

**Schedule preservation (new in v2.1):** running RT60 on one level no longer wipes results for rooms at other levels. Calculations persist across runs.

---

## Material Assignment

Click **Assign Materials** to open the picker. Built-in material database covers ~2,500 records sourced from a published German absorption-coefficient study, plus support for user EASE `.mat` folders and custom user materials. Mappings are made at the **family/type level** — assign once, applies everywhere that type appears across the project.

**Surface Area Diagnostics** panel shows per-axis areas (E/W/N/S/F/C) with three pair checks:
- **E/W pair:** OK if matched within 20%
- **N/S pair:** OK if matched within 20%
- **F/C pair:** OK if matched within 25% (more permissive because proportional-attributed ceilings can drift a few percent from floor area)

Mismatches don't block calculation but suggest geometry to recheck. F/C mismatch specifically often points to stacked or partitioned ceilings that only partially cover the room.

**User materials:** Add Material (new entry), Add User Folder (bulk import, supports EASE .mat and JSON conforming to schema), Edit (only enabled for user materials), Duplicate (any material), Delete (with confirmation; orphans existing assignments).

**Common workflow for missing-band values:** find closest library match → Duplicate → fill in missing bands from manufacturer cut sheet or hand-calc → adjust name → Save → Assign.

---

## Circuiting *(Pro)*

Assigns circuit IDs per room or zone. First time on the tab: one circuit per room (e.g., `02.31.05`). **Add Zone** splits a room's circuit into sub-zones (`/A`, `/B`, `/C`), useful for divisible rooms with operable partitions or separate audience/dais areas (`216/A` for audience, `216/B` for dais).

**Modes:**
- **70V** — North American constant-voltage; multi-tap transformers in parallel; typical paging/BGM/presentation
- **100V** — same as 70V at 100V line voltage; European standard, also long cable runs in NA
- **Low-Z** — direct low-impedance distribution, no transformer; high-fidelity music, single-speaker zones, theater

**Tap selection:** nearest tap ≥ required power algorithm. Power-overload highlighting: green < ~80% Max Watts, yellow 80–100% (tight, no headroom), red > 100% (must fix before issuing documentation).

**JSBA Loudspeaker Circuit Schedule** is created on first **Commit Circuiting** — a multi-category ViewSchedule with these columns: Circuit, Destination, Type, Tap (W), Qty, Spkr (Ω), Circuit (Ω), AWG, Loss (dB), Measured (Ω). The schedule is tracked by Revit UniqueId, so renaming it on a sheet doesn't break the linkage.

**Tag families** are bundled with v2.1 and auto-load on first project use — JSBA Circuit ID Tag (multi-category, circuit ID only for coordination drawings) and a variant with Tap Watts displayed (for installation drawings, eliminates installer error of default-tap-set).

---

## Amps & Cabling *(Pro)*

**Rack workflow:**
1. **Rack Locations** — scans the entire project for rack candidates (across host + linked models).
2. **Pick Racks in Model** — fallback when category-based scan misses racks (e.g., racks modeled in Generic Models). User picks racks manually in Revit selection mode.
3. **Assign Rack IDs** — writes the rack ID parameter per a configurable naming convention.

**Nearest-rack assignment** routes each circuit to its nearest rack by room-centroid → rack-location distance (TSP nearest-neighbor). Manual override per circuit available via dropdown — useful for keeping all circuits in one room on the same rack, AV/IT separation, or dedicated VIP-room racks. **Recompute Nearest Racks** re-runs auto-assignment and is idempotent (Ctrl+Z to revert).

**Local Amp** flag flips a circuit from a centralized rack to an in-room amp; cable-run estimation drops dramatically.

**Estimated Longest Run** is a Manhattan-distance approximation for line-loss math only. It is **not** a cable-quantity takeoff — it doesn't account for vertical drops, tray routing, conduit penetrations, service loops, pull boxes, or rack-side dressing. For takeoff, use actual routed cable paths from cable tray drawings plus 10–20% spare.

**Line loss thresholds:** green < 0.4 dB, yellow 0.4–0.75 dB, red > 0.75 dB.
**Damping factor (Low-Z only):** green > 20, yellow 10–20, red < 10.

**Wiring styles:** Chamfered (45°/90° clean angles, default) or Arc (smooth curves). **Home Run Notes** are native Revit text annotations defaulting to the rack ID (e.g. "TO ER-02.39.16") and editable per-row from the AVTools panel so they persist across redraws.

---

## Coordination *(Pro)*

Detects clashes between placed loudspeakers and other elements (lighting, mechanical, sprinklers, structural framing, cable trays, conduits) across host + linked MEP, structural, and lighting models.

**Sensitivity presets:**
- Physical (0") — geometric overlaps only
- Tight (0.25–2") — default
- Normal (0.5–4")
- Conservative (1–5")

Lighting specifically uses 0" / 3" / 6" / 12" tiers per industry convention.

**Issue tracking:** each conflict has a status — Open (red, default), Coordinate (yellow, flagged for cross-discipline), Revisit (parking lot), or Resolved (green/hidden). Status persists across refreshes; markers are matched to current conflicts by speaker ID + conflict ID. Bundled Coordination Issue Marker family auto-loads on first refresh.

**Heads-up:** the engine detects clashes against Revit family elements in the listed disciplines. It does **not** detect 2D detail items, drafting components drawn as symbols, or imported DWG underlays.

---

## Lucius AI Assistant (Inside the Add-In)

Lucius is embedded inside Revit as a chat panel. Powered by Claude Sonnet (Anthropic). Voice input via push-to-talk (Whisper STT) plus text. Lucius reads your live project state via tool use rather than guessing.

**What Lucius can read in Standard + Pro:**
- Project info (title, doc path)
- Rooms in AV scope or all rooms
- Per-room metadata
- Placed speakers per room
- Rooms needing attention (unmapped materials, coverage gaps)
- Surface-to-material mappings
- Acoustic material database search

**What Lucius can write (Pro only):**
- Assign an acoustic material to a surface (with persistence)

**What Lucius does NOT do:**
- Place speakers — that's the user's job via the Configuration tab
- Commit circuits, run RT60 or coverage calculations, modify the model beyond the one material write
- Read circuit/cabling/coordination/RT60 result data programmatically — Lucius can explain the math, the workflow, and the column meanings, but the user runs the calculations and reads the results from the UI

This is intentional: AVTools is **deterministic**, and Lucius guides the user through running the deterministic tool. Lucius does not introduce randomization or "AI placement decisions."

---

## What This Product Is NOT

- **Not a full acoustic simulation tool.** No ray tracing, no diffraction, no room modes. Compare to EASE/AFMG/Treble for full acoustic simulation; AVTools is a faster, BIM-integrated first-order design tool used by AV consultants.
- **Not a replacement for engineering judgment.** First-order design assistance, not a guarantee of code compliance or measured performance.
- **Not a substitute for measured field data** on critical-speech or life-safety spaces.

It **does** produce repeatable, BIM-integrated, documentation-ready loudspeaker designs significantly faster than the manual Revit + spreadsheet + standalone-acoustics workflow most AV consultants use today.

---

## Common Questions

**Q: What projects is this designed for?**
Multi-room distributed loudspeaker systems — convention centers, corporate offices, hospitality, education, healthcare, transportation hubs, houses of worship. Anywhere with many rooms needing consistent ceiling speaker coverage and (in Pro) circuiting and acoustic analysis to support documentation.

**Q: Does it work with linked models?**
Yes — this is the primary workflow. Rooms typically come from the architect's linked model; speakers are placed in the host AV model. The tool handles host/linked coordinate transforms, ceiling detection across links, and composite room identifiers automatically.

**Q: Which Revit versions are supported?**
v2.1 (current paid release): Revit 2025.3 and higher. Revit 2027 support is in active development. v1.2.1 (free legacy): Revit 2022, 2023, 2024.

**Q: What loudspeaker data file formats are supported?**
**`.spk`** (EASE SPK with optional sibling `.lob`/`.phs`/`.fed`/`.frd`/`.fvt`) and **`.clf`** (Common Loudspeaker Format, CLF1 + CLF2). Other formats — including `.gll`, manufacturer proprietary binary formats, and `.cf2` as balloon data — are not supported. If a manufacturer publishes `.gll` only, request CLF data from them.

**Q: Does it calculate RT60 and STI?**
Yes (Standard and Pro). Three RT60 formulas — Sabine, Norris-Eyring, Arau-Puchades — across eight octave bands (63 Hz to 8 kHz). STI is estimated from RT60, background noise, speaker Q, and N factor. Critical distance and D/R ratio are computed alongside.

**Q: What's new in v2.1?**
Refined room acoustics (better surface and partition handling for stacked finishes, operable partitions, divisible-room boundaries, and multi-ceiling attribution); the new **Nudge** tool for fine-tuning speaker placement with Revit's native arrow keys; **schedule preservation** so running RT60 on one level no longer wipes calculations for other levels; **RT60 graph reference curve** overlay (preset and manual) for comparing against EASE, ODEON, or measured field data; iso-line bands refined to **±1/2/3 dB** for finer uniformity assessment; bundled JSBA tag and coordination families that auto-load on first project use; and a comprehensively updated Lucius AI knowledge base covering every tab, formula, and family setup detail.

**Q: How is this different from D-Tools or EASE?**
D-Tools is a system integration / proposal / project-management platform — strong on procurement and BOMs, not on Revit-native distributed-loudspeaker layout or acoustic analysis. EASE is a full acoustic simulation suite — strong on auralization and ray tracing, not on Revit integration or circuiting/cabling. AVTools is BIM-native, focused on the AV consultant designing inside the architect's Revit model, and covers placement → coverage → RT60/STI → circuiting → cabling → coordination as one continuous workflow.

**Q: How do I get started?**
Download the 10-day free trial of Standard or Pro from the products page. The free v1.2.1 (Revit 2022–2024) is available as a permanent free download for the core layout and coverage workflow. Both run as a dockable panel inside Revit; no external dependencies.

**Q: Where do I report bugs or request features?**
The About tab includes Bundle Logs (ZIP), Open Logs Folder, and Copy Support Info to gather diagnostic information. Email support@bimacoustics.net with the bundled logs and a description of the issue or feature request.
