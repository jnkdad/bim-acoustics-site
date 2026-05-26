# System Designer Engineering Model
Canonical product name: BIM Acoustics AV Tools Suite — AV Systems System Designer.

> **Local fallback file.** This file is the local fallback used by the website Lucius Azure Function when the runtime HTTPS fetch from `https://www.bimacoustics.net/lucius/packs/system-designer.md` fails. It mirrors the v2.2.1 live system-designer pack and should be kept in sync when the live pack is updated.

---

# Product Pack — AV Tools Suite: AV Systems System Designer

This pack defines technically credible response patterns for the product:
**BIM Acoustics AV Tools Suite — AV Systems System Designer**, a Revit add-in for distributed loudspeaker system design. Current version: **v2.2.1** (Revit 2025 and 2026); legacy free version v1.2.1 supports Revit 2022–2024.

**Anchoring rule:** If the user asks about distributed ceiling speaker layout, spacing, coverage, acoustics, RT60, STI, materials, circuiting, zoning, racks, cabling, or "what does System Designer do," answer using this pack. Do not drift into generic Revit help.

---

## What This Product Is

AV Tools Suite — AV Systems System Designer is a Revit add-in that provides a complete workflow for designing, analyzing, and documenting distributed ceiling loudspeaker systems. It runs as a dockable panel inside Revit 2025 and 2026 and supports both host-model and linked-model architectural coordination.

The product has two paid editions plus a free legacy version:

- **Free (v1.2.1)** — Revit 2022–2024. Room selection, speaker layout, placement, direct-field coverage, Lucius chat (guidance only).
- **Standard (v2.2.1)** — Revit 2025 and 2026. Adds room acoustics (RT60, STI, material assignment), Lucius AI chat with read tools.
- **Pro (v2.2.1)** — Revit 2025 and 2026. Adds circuiting with zones, amps & cabling, coordination/clash detection, advanced rack workflow, and Lucius AI write tools (currently material assignment).

Pricing: Standard $60/month or $600/year. Pro $99/month or $990/year. 10-day free trial on every paid tier.

---

## The Workflow (Eight Tabs)

The tool is organized as a step-by-step workflow. Tabs in order:

1. **Rooms** — pick which rooms are in design scope. Always first. Includes the Add Temp Room workflow for spaces not yet laid out cleanly in the architectural model.
2. **Configuration** — set host mode, spacing, listener height, layout, speaker selection per room. Run **Refresh Calculations** then **Commit Placement** here.
3. **Direct-Field Coverage** — compute SPL uniformity from placed speakers. Run **Compute Results**, optionally **Draw Iso-Map**.
4. **Room Acoustics** — assign acoustic materials to surfaces, then calculate RT60 (Sabine, Norris-Eyring, Arau-Puchades) and estimated STI.
5. **Circuiting** *(Pro)* — assign circuit IDs, zones, taps, modes (70V/100V/Low-Z); generates the JSBA Loudspeaker Circuit Schedule.
6. **Amps & Cabling** *(Pro)* — rack discovery, nearest-rack assignment, wire gauge, line loss, wiring diagrams.
7. **Coordination** *(Pro)* — clash detection between AV devices and MEP/lighting/structural elements.
8. **About** — version, licensing, transcript opt-in, support tools.

Loudspeakers are placed in the host model. Rooms can come from the host or linked architectural models. Works from either Floor Plan or Reflected Ceiling Plan views.

---

## Rooms Tab — Source Column and Unified Link Scan

The Rooms tab is the always-first entry point. Every session starts here.

**Single unified scan (new in v2.2):** The previous "Host vs Linked" source dropdown has been retired. The Rooms tab now scans the host document plus every loaded Revit link in a single pass, and a new **Source** column shows which file each room came from. Rooms from unloaded links don't appear (link workset state is honored), and a duplicate-room dedup pass cleans up the case where a container model nests the same architectural link that's also loaded standalone.

**Practical effect:** for most projects you click **Rescan Rooms** once and see everything. No more switching modes when a project has rooms in multiple linked files.

---

## Rooms Tab — Add Temp Room *(new in v2.2)*

Real projects regularly have rooms that aren't bounded in the architect's Revit model — large prefunction halls, open food halls, exterior plaza spaces, or rooms still being modeled by the architect when AV layout is happening. **Add Temp Room** is a single Rooms-tab workflow that handles every variant:

- **The space has no Revit Room at all.** Pick a number, a name, and a ceiling height; trace the perimeter in the active plan view. AVTools surfaces a synthetic **Temp Room** row in the Rooms tab. All downstream features (Configuration, Direct-Field Coverage, Circuiting, Amps & Cabling, Draw Wiring) treat it like a normal room.
- **The Revit Room exists but is unbounded (Area = 0).** Same workflow — pick the row, trace the perimeter. AVTools creates a stamped Filled Region tied to that room number that the next room scan picks up as a layout boundary.

The Filled Region is an annotation — it does **not** propagate through Revit links, so other disciplines linking the AV model never see it.

**Temp Room → Real Room auto-association:** when speakers placed in a Temp Room polygon overlap a real Revit room (a corridor, a room with a bad centroid, etc.), AVTools auto-resolves on the next **Rescan Rooms**. Speakers are re-stamped to the real room's number, the real room's row inherits the temp's design state (Speakers Placed / Circuiting Complete / Cabling Complete — promote-only, never demote), and the Temp Room row is hidden. If the temp polygon spans multiple real rooms, AVTools shows a warning dialog and waits for the polygon to be refined. If the polygon sits in genuinely unbounded space, the temp row stays visible as a normal scaffold.

Temp rooms are excluded from **Room Acoustics** because they're documentation-only placement scaffolds. If you want acoustic analysis on the underlying space, the real Revit room must exist and be in scope.

---

## Rooms Tab — Room-Type Heuristic

When you add a room to scope (Use checkbox + Next), AVTools matches the room's name against two keyword lists and seeds Configuration-tab fields accordingly:

| Category | Name tokens (any match, case-insensitive) | Seeded values |
|---|---|---|
| **Presentation** | classroom, instruction, training, lecture, meeting, conference, board room, ballroom, auditorium, theater, lab, library, cafeteria, cafe, restaurant, dining, food court, lounge, break room, bar, pub, tavern, bistro, club | Spacing **Minimum Overlap** · Listener **4.0 ft** (seated) · Target SPL **82 dB** |
| **Circulation** | lobby, corridor, hallway, hall, vestibule, concourse, restroom, toilet, entry, foyer, atrium | Spacing **Edge to Edge** · Listener **6.0 ft** (standing) · Target SPL **76 dB** |
| **Fallback** (name doesn't match either list) | — | Spacing & Listener stay at the project's **Global Defaults** · Target SPL **82 dB** |

The heuristic only fires when a row is **still at the project's Global Defaults** for spacing and listener height. If you've manually edited those fields on a row, the heuristic backs off and won't overwrite your work on a re-add. These are keyword presets you can override — not magic, not AI-driven, just a starting-point convenience.

---

## Speaker Layout & Placement

**Three spacing modes:**
- **Center-to-Center** — speaker centers on a regular grid
- **Edge-to-Edge** — coverage circles touch
- **Minimum Overlap** — coverage circles overlap to a defined percentage

The tool derives coverage radius from ceiling height, listener height, and the speaker's coverage angle, then fills the room with a grid. Spacing is **deterministic**: identical inputs in the same model context produce repeatable outputs.

**Host modes:**
- **Ceiling / Auto** — speaker hosted to the detected ceiling
- **Reference Plane** — for rooms without standard ceilings (exhibit halls, catwalks, open-to-deck spaces). v2.2 uses a place-on-lower-side strategy that consistently brings speakers down cone-toward-listener on horizontal reference planes (the common pattern for tall ballrooms and exhibit halls).
- **Fallback Z** — fixed elevation when neither ceiling nor reference plane is appropriate

**Tile centering** is supported for ACT ceiling grids (2×2, 2×4) so speakers align to tiles rather than landing on grid lines.

**Linked model rooms:** rooms from the architect's linked model are fully supported. Speakers are placed in the host AV model. Copy/Monitor is not required.

**Acoustic data files for speakers** — only **`.spk`** (EASE SPK format, with optional `.lob`/`.phs`/`.fed`/`.frd`/`.fvt` siblings) and **`.clf`** (Common Loudspeaker Format, CLF1 + CLF2) are supported. `.gll`, manufacturer proprietary binary formats, and `.cf2` as balloon data are **not** supported. If a manufacturer only provides `.gll`, request CLF data from them; without supported data, the family falls back to default sensitivity (78 dB at 1W/1m) and approximate Q from manual family parameters.

**Nudge tool:** for fine-tuning speaker positions after auto-layout. Click Nudge on a Configuration row → AVTools selects all that room's placed speakers in Revit's UI and hands focus to the canvas → use Revit's native arrow-key nudge with Shift/Ctrl modifiers → Esc when done.

**Grid θ rotation:** blank = auto-detect from room polygon's longest edge. Override per-row when auto-detect picks the wrong axis (irregular rooms, ceiling tile grid running off-axis from the room polygon, soffit-driven orientation).

---

## Direct-Field Coverage Analysis

**Compute Results** scans placed speakers and computes per-room uniformity using each room's Target SPL and Listener Height. Results display:

- Speakers Placed count
- Target SPL
- Min / Max SPL
- Range
- Uniformity bands: **% within ±1 dB**, **% within ±2 dB**, **% within ±3 dB**, **% > +3 dB**

Yellow cells flag metrics outside preferred thresholds; review by adjusting spacing, layout, target SPL, or speaker count, then re-Commit Placement and re-Compute Results.

**Draw Iso-Map** draws bucketed iso-line contours on the active view at the listener plane. **Clear Map** removes them.

**Coverage map line styles (new in v2.2):** the iso-coverage contour lines now use Line subcategories with built-in colors (green / yellow / red) instead of per-element view overrides. The practical effect: coverage maps render in color on the parent floor plan **and** on every dependent plan view placed on sheets. Before v2.2, the colors only appeared on the parent view.

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

**Reference curve overlay:** the RT60 graph supports a reference curve dropdown with preset target curves (Conference/Meeting, Classroom, Lecture Hall, Theater, Worship, Courtroom, Ballroom, Exhibit Hall) — sourced from ANSI/ASHRAE/Acoustical Society guidance. Manual reference values can also be entered per band, useful for: (1) comparing against another model (EASE, ODEON, CATT), (2) overlaying measured field data to validate prediction, or (3) tuning material assignments on renovation projects until the AVTools prediction matches measurement.

**Schedule preservation:** running RT60 on one level no longer wipes results for rooms at other levels. Calculations persist across runs.

**Temp Rooms are not analyzed.** Acoustics calculations require a real Revit Room with surface geometry; Temp Rooms (placement scaffolds) are excluded from this tab.

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

Assigns circuit IDs per room or zone. First time on the tab: one circuit per room (e.g., `02.31.05`). **Add Zone** splits a room's circuit into sub-zones (`/A`, `/B`, `/C`), useful for divisible rooms with operable partitions or separate audience/dais areas. The first-click zone split correctly assigns `/A` to the picked speakers and `/B` to the rest.

**Modes:**
- **70V** — North American constant-voltage; multi-tap transformers in parallel; typical paging/BGM/presentation
- **100V** — same as 70V at 100V line voltage; European standard, also long cable runs in NA
- **Low-Z** — direct low-impedance distribution, no transformer; high-fidelity music, single-speaker zones, theater

**Apply to Selected / Apply to All** (new in v2.2): explicit-action buttons replace the previous auto-apply-on-dropdown-change for system voltage mode. Picking a new default no longer pre-emptively writes to every row — select rows, then click Apply. The Apply-button inventory is intentional: these buttons exist where they make sense (system voltage on Circuiting, wire gauge on Amps & Cabling, host/layout on Configuration) and don't exist elsewhere.

**Tap selection:** nearest tap ≥ required power algorithm. Power-overload highlighting: green < ~80% Max Watts, yellow 80–100% (tight, no headroom), red > 100% (must fix before issuing documentation).

**Commit Circuiting** writes circuit ID, tap setting, and rack ID to every speaker as part of a single commit transaction; the values stick on subsequent reads. **Update Schedule** does a Commit + rebuild rather than a rebuild-only, so changes to wire gauge, tap settings, or line loss show up immediately in the circuit schedule view.

**JSBA Loudspeaker Circuit Schedule** is a multi-category ViewSchedule with these columns: Circuit, Destination, Type, Tap (W), Qty, Spkr (Ω), Circuit (Ω), AWG, Loss (dB), Measured (Ω). The schedule is tracked by Revit UniqueId, so renaming it on a sheet doesn't break the linkage.

**Tag families** are bundled and auto-load on first project use — JSBA Circuit ID Tag (multi-category, circuit ID only for coordination drawings) and a variant with Tap Watts displayed (for installation drawings, eliminates installer error of default-tap-set).

---

## Amps & Cabling *(Pro)*

**Rack workflow:**

1. **Rack Locations** — scans the entire project for rack candidates (across host + linked models) using keyword matches on family names: rack, cabinet, enclosure, Middle Atlantic product codes. Family names with underscores (e.g., `MAP-SR_Series`, `SR_Series_Wall_Rack`) are normalized to spaces before matching so the SR series is recognized correctly.

2. **Rack Family Selection dialog (new in v2.2)** — the rack scan can pull in hundreds of false-positive matches on projects with furniture, IT racks, network cabinets, or other "rack/cabinet/enclosure" families that aren't AV equipment racks. After the scan, a selection dialog lists every keyword-matched family with its instance count and an example room, plus a tick-box to include or exclude. As of v2.2.1, your choice is **persisted at user scope** (in `%APPDATA%\BimAcoustics\UserState.json`), so the rack selection follows you across every project you open on your machine. New families appearing in subsequent scans are flagged with a **"New"** status badge so they can be reviewed without disrupting existing selections.

3. **Pick Racks in Model** — fallback when the category-based scan misses racks (e.g., racks modeled in Generic Models). User picks racks manually in Revit selection mode.

4. **Assign Rack IDs** — writes the rack ID parameter per a configurable naming convention.

**Nearest-rack assignment** routes each circuit to its nearest rack by room-centroid → rack-location distance (TSP nearest-neighbor). Manual override per circuit available via dropdown — useful for keeping all circuits in one room on the same rack, AV/IT separation, or dedicated VIP-room racks.

**Bulk rack assignment (new in v2.2):** multi-select rows in the Amps grid, choose a rack from the right-side panel, click Apply. Every selected row updates to that rack in one click — useful when the auto-nearest-rack assignment doesn't match your design intent and you want to force a block of circuits to a specific equipment room. **Recompute Nearest Racks** re-runs auto-assignment and is idempotent (Ctrl+Z to revert).

**Apply to Selected / Apply to All** (new in v2.2): explicit-action buttons replace auto-apply-on-dropdown-change for wire gauge. Pick a new default, then choose how to apply it. Per-row overrides remain available.

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
Yes — this is the primary workflow. Rooms typically come from the architect's linked model; speakers are placed in the host AV model. As of v2.2 the Rooms tab scans the host doc plus every loaded link in a single pass, and a Source column shows which file each room came from.

**Q: Which Revit versions are supported?**
v2.2.1 (current paid release): Revit 2025 and 2026. Revit 2027 support is in active development. v1.2.1 (free legacy): Revit 2022, 2023, 2024.

**Q: What's new in v2.2.1?**
v2.2.1 is a polish + reliability release on top of v2.2. Highlights:

- **Proper MSI installer** — replaces the previous sideload ZIP. Clean install / uninstall / upgrade-over-prior-version behavior. Project state, license activation, and per-room configuration carry forward across upgrades.
- **In-app End User License Agreement** — first launch (and any future material EULA revision) presents the full agreement with a scrollable view and tick-to-accept. Acceptance is recorded per Windows user.
- **Per-family loudspeaker filter dialog** — Scan Loudspeakers on the Configuration tab now opens a tick-box dialog of every family that survived the classifier, with instance count, category, and example room. JSBA- or AVIXA-stamped families are auto-ticked. Same multi-select / range-select pattern as the Rack Family Selection dialog.
- **User-level state for filter choices** — rack and loudspeaker family selections now live at user scope rather than per-project. Curated lists follow you to every project you open on your machine.
- **Cloud-delivered Lucius knowledge** — Lucius's underlying documentation ships from the cloud rather than embedded in the add-in DLL, so knowledge updates reach every active user the moment they're published, no installer rebuild needed.
- **Place Rack ID Tags fix** — a face-hosted-rack defect that collapsed all rack tags onto the active view's floor plan is fixed; tags now distribute across every level where racks actually sit.
- **Refreshed ribbon button** — redrawn pendant-loudspeaker icon at native 16/32-pixel sizes, label changed to "System Designer" (was "AV Design").

**Q: What's new in v2.2?**
A unified **Add Temp Room** workflow on the Rooms tab handles spaces that aren't laid out cleanly in the architect's model — whether the Revit Room exists but is unbounded (Area = 0), or there's no Revit Room at all (food halls, prefunction halls, exterior plazas, in-progress architectural areas). Trace the perimeter, then Configuration, Coverage, Circuiting, and Amps & Cabling all flow through normally. Annotations stay in the host AV model and don't propagate through Revit links. Plus a unified linked-file scan (the Host/Linked dropdown is gone, replaced by a Source column), a Rack Family Selection dialog that solves the 200+ false-positive racks problem, Apply to Selected / Apply to All buttons for explicit control over wire gauge and system voltage application, in-color coverage maps that render on every view including dependent plans on sheets, and a stack of quality-of-life fixes (tap setting + rack ID persist on Commit Circuiting, Update Schedule refreshes every column, Add Zone first-click works, reference-plane speaker orientation is correct, rack scanner recognizes SR series families).

**Q: How do I lay out speakers in a room that doesn't exist in the architectural model?**
Use **Add Temp Room** on the Rooms tab. Pick a number, name, and ceiling height, then trace the perimeter in your active plan view. AVTools creates a synthetic Temp Room row that behaves like a normal room for Configuration, Coverage, Circuiting, and Cabling. Temp rooms are excluded from Room Acoustics (placement scaffolds only). Once you place speakers, AVTools auto-resolves the underlying real Revit room (if any) on the next Rescan and re-stamps the speakers to that real room.

**Q: How do I lay out speakers in a Revit room that has Area = 0 (unbounded)?**
Use **Add Temp Room** on the Rooms tab — it's the unified workflow for both unbounded Revit rooms and spaces with no Revit Room at all. Select the row, trace the perimeter. AVTools stamps a Filled Region with the room number encoded in Comments; the next Rescan picks that polygon up as the room's layout boundary. The Filled Region is an annotation and does not propagate through Revit links.

**Q: I placed speakers in a Temp Room but the underlying corridor still shows Not Started.**
Click Rescan Rooms. AVTools runs the temp-to-real association pass on every Rescan — speakers in a Temp Room polygon that overlaps a real Revit room get re-stamped to the real room, and the real room's design state inherits the temp's. If the corridor still doesn't update, the temp polygon may be crossing more than one real room (watch for a warning dialog) or it may sit in genuinely unbounded space with no real room beneath.

**Q: Why does my rack scan find 200 racks when I only have 6?**
The keyword scan matches "rack" / "cabinet" / "enclosure" / Middle Atlantic product codes across every family in host + linked models. Furniture, IT racks, and network cabinets can light up. Use the Rack Family Selection dialog that appears after **Rack Locations**: tick only the families that should count as AV racks. Your choice persists per project — the dialog won't re-prompt for already-confirmed or already-rejected families. New families appearing in later scans flag with a "New" badge so they can be reviewed without disrupting existing selections.

**Q: What loudspeaker data file formats are supported?**
**`.spk`** (EASE SPK with optional sibling `.lob`/`.phs`/`.fed`/`.frd`/`.fvt`) and **`.clf`** (Common Loudspeaker Format, CLF1 + CLF2). Other formats — including `.gll`, manufacturer proprietary binary formats, and `.cf2` as balloon data — are not supported. If a manufacturer publishes `.gll` only, request CLF data from them.

**Q: Does it calculate RT60 and STI?**
Yes (Standard and Pro). Three RT60 formulas — Sabine, Norris-Eyring, Arau-Puchades — across eight octave bands (63 Hz to 8 kHz). STI is estimated from RT60, background noise, speaker Q, and N factor. Critical distance and D/R ratio are computed alongside.

**Q: How is this different from D-Tools or EASE?**
D-Tools is a system integration / proposal / project-management platform — strong on procurement and BOMs, not on Revit-native distributed-loudspeaker layout or acoustic analysis. EASE is a full acoustic simulation suite — strong on auralization and ray tracing, not on Revit integration or circuiting/cabling. AVTools is BIM-native, focused on the AV consultant designing inside the architect's Revit model, and covers placement → coverage → RT60/STI → circuiting → cabling → coordination as one continuous workflow.

**Q: How do I get started?**
Download the 10-day free trial of Standard or Pro from the products page. The free v1.2.1 (Revit 2022–2024) is available as a permanent free download for the core layout and coverage workflow. Both run as a dockable panel inside Revit; no external dependencies.

**Q: Where do I report bugs or request features?**
The About tab includes Bundle Logs (ZIP), Open Logs Folder, and Copy Support Info to gather diagnostic information. Email support@bimacoustics.net with the bundled logs and a description of the issue or feature request.

**Q: Will you be at InfoComm 2026?**
Yes — BIM Acoustics will be at **InfoComm 2026 in Las Vegas, June 17–19**. Find Jerrold Stevens at the **AtlasIED booth N7132** in the North Hall of the Las Vegas Convention Center. Live demos of AVTools System Designer welcome — stop by and say hi.

**Q: Where is the AtlasIED booth at InfoComm 2026?**
Booth **N7132** in the **North Hall** of the Las Vegas Convention Center. Jerrold Stevens of BIM Acoustics will be there with AtlasIED June 17–19.
