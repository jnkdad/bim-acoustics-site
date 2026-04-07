# Product Pack — AV Tools Suite: AV Systems System Designer

This pack defines technically credible response patterns for the product:
**BIM Acoustics AV Tools Suite — AV Systems System Designer**, a Revit 2025 add-in for distributed loudspeaker system design.

**Anchoring rule:** If the user asks about distributed ceiling speaker layout, spacing, coverage, acoustics, RT60, STI, circuiting, zoning, material assignment, or "what does System Designer do," answer using this pack. Do not drift into generic Revit help.

---

## What This Product Is

AV Tools Suite — AV Systems System Designer is a Revit add-in that provides a complete workflow for designing, analyzing, and documenting distributed ceiling loudspeaker systems. It works inside Revit as a dockable panel and supports both host-model and linked-model architectural coordination.

The product has two editions:
- **Standard**: Room selection, speaker layout, direct-field coverage analysis, basic circuiting
- **Pro**: Full circuiting with zone support, amplifier/cabling design, line loss calculations, MEP clash coordination, room acoustics (RT60, STI), acoustic material assignment

---

## Core Capabilities (Current — v1.2+)

### Speaker Layout & Placement
- Automated grid-based loudspeaker placement in selected rooms
- Supports multiple spacing modes: Edge-to-Edge, Center-to-Center, Minimum Overlap
- Tile centering for ACT ceiling grids (2x2, 2x4)
- Corridor mode for narrow spaces (single-row layout)
- Reference plane hosting for rooms without standard ceilings (exhibit halls, catwalks)
- Linked model room support — rooms from the architect's model, speakers placed in the host AV model
- Per-room speaker type selection from loaded Revit families
- Automatic CLF/SPK acoustic data file matching for coverage and sensitivity data

### Direct-Field Coverage Analysis
- Per-room SPL grid computation based on placed speakers
- Iso-field contour visualization (±2, ±4, ±6 dB bands)
- Uniformity metrics: min/max SPL, percentile-based bands
- Adaptive grid resolution based on room size

### Room Acoustics (Pro)
- Surface extraction from Revit room geometry with automatic classification (walls, ceilings, floors, doors, windows)
- Ray casting for linked-model rooms where standard boundary detection fails
- Operable partition detection and reclassification from Room Separation lines
- Acoustic material assignment at the family/type level — assign once, applies everywhere that type appears
- Built-in absorption coefficient database (125–8000 Hz octave bands)
- RT60 calculation using three formulas: Sabine, Norris-Eyring, and Arau-Puchades
- STI (Speech Transmission Index) estimation from RT60, background noise, speaker directivity, and room geometry
- Critical distance and D/R ratio calculations
- Room Acoustics schedule generation with results written to Revit Room elements

### Circuiting & Zoning (Pro)
- Circuit ID assignment per room
- Zone support for rooms with dais/podium areas (e.g., 216/A for audience, 216/B for dais)
- Tap selection based on target SPL and speaker sensitivity
- Impedance calculations for 70V, 100V, and low-impedance systems
- Loudspeaker Circuit Schedule generation

### Amplifier & Cabling (Pro)
- Rack/amplifier source discovery and assignment
- Nearest-neighbor auto-assignment algorithm
- Cable routing with chamfer and arc wiring styles
- Line loss calculation with wire gauge recommendations
- Homerun cable annotation in floor plans
- Damping factor tracking with warning thresholds

### MEP Coordination (Future — Separate Product)
MEP clash detection and coordination tools are in development and will be offered as a separate product/license. Not available in the current release.

### Lucius AI Assistant (New — 2026)
- Embedded conversational AI inside the Revit add-in
- Can query live project data: rooms, speakers, configuration, acoustics results
- Uses Claude (Anthropic) with tool use for real-time model awareness
- Server-side context updates without client redeployment
- Voice input via push-to-talk (Whisper STT) and text chat
- Opt-in transcript capture for product improvement

---

## Technical Design Principles

### Spacing Formula
Spacing is derived from the canonical distributed-system relationship:
**S = 2 × H × tan(θ / 2)**
where S is spacing, H is height above listening plane, θ is nominal coverage angle.

This is applied as a layout rule, not an acoustic prediction. The tool uses first-order design logic; it does not replace professional engineering judgment.

### Deterministic Design
The tool is deterministic: identical inputs in the same model context produce repeatable outputs. Layout is driven by explicit user inputs and model geometry. The tool does not introduce randomization or AI-driven placement decisions.

### Linked Model Workflow
Most production projects use linked architectural models. Rooms come from the architect's linked Revit model; speakers are placed in the host AV model. The system handles coordinate transforms, ceiling detection across links, and composite room identifiers automatically.

---

## What This Product Is NOT

- It is **not** an acoustic simulation tool (not EASE, AFMG, or similar)
- It does **not** model reflections, diffraction, or room modes
- It does **not** replace engineering judgment
- It does **not** guarantee code compliance or performance outcomes
- It **does** provide first-order design assistance that experienced AV consultants use to work faster and more consistently

---

## Editions & Pricing

- **Standard**: Distributed loudspeaker layout, placement, and direct-field coverage
- **Pro**: Adds room acoustics, circuiting with zones, and amplifier/cabling design
- Subscription-based (monthly and annual options available)
- Early access program available for qualified AV consultants

---

## Common Questions

**Q: What projects is it designed for?**
Multi-room distributed systems: convention centers, corporate offices, hospitality, education, healthcare — anywhere with many rooms needing consistent ceiling speaker coverage.

**Q: Does it work with linked models?**
Yes. This is the primary workflow for most projects. Rooms come from the architect's model; speakers are placed in the host AV model.

**Q: Can it handle large spaces like exhibit halls?**
Yes. For large rooms where standard ceiling hosting fails, speakers can be placed on reference planes at specific elevations (e.g., catwalk height). The tool supports adaptive approaches for rooms over 100,000 sq ft.

**Q: How does the AI assistant (Lucius) work?**
Lucius is embedded in the Revit add-in and can read live project data — room counts, speaker configurations, acoustics results, design state. It answers questions conversationally and can explain workflows, troubleshoot issues, and summarize project status. It uses Claude (by Anthropic) with real-time tool access to the Revit model.

**Q: Does it calculate RT60 and STI?**
Yes (Pro edition). It extracts room surfaces from Revit geometry, assigns acoustic absorption materials from a built-in database, and calculates RT60 using Sabine, Eyring, and Arau-Puchades formulas. STI is estimated from the RT60 results combined with background noise and speaker directivity.
