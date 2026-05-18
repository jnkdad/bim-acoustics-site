# AVTools System Designer v2.2 — Release Notes

**Release date:** May 2026
**Revit compatibility:** 2025, 2026
**Editions:** Standard, Pro

---

## What's new

### Rooms tab — Add Temp Room

Real-world projects regularly have rooms that aren't bounded in the architectural Revit model — large prefunction halls, open food halls, exterior plaza spaces, or rooms still being modeled by the architect when AV layout is happening. **Add Temp Room** is a single Rooms-tab workflow that handles every variant:

- **The space has no Revit Room at all.** Pick a number, a name, and a ceiling height; trace the perimeter in the active plan view. AVTools surfaces a synthetic "Temp Room" row in the Rooms tab. All downstream features (Configuration, Direct-Field Coverage, Circuiting, Amps & Cabling, Draw Wiring) treat it like a normal room.
- **The Revit Room exists but is unbounded (Area = 0).** Same workflow — pick the row, trace the perimeter. AVTools creates a stamped Filled Region tied to that room number that the next room scan picks up as a layout boundary.

The Filled Region is an annotation, so it stays inside the host AV model and does NOT propagate through Revit links — your architect's coordinated workflows are untouched.

When speakers placed inside a Temp Room polygon overlap a real Revit room (a corridor, a room with a bad centroid, etc.), AVTools auto-resolves the real room on the next Rescan. Speakers are re-stamped with the real room's number, and the real room's row inherits the temp's design state (promote-only — Speakers Placed / Circuiting Complete / Cabling Complete). The Temp Room row is hidden once association succeeds.

Temp rooms are excluded from **Room Acoustics** because they're documentation-only placement scaffolds. If you want acoustics on the underlying space, select the real Revit room and uncheck the Temp Room row.

### Rooms tab — single unified scan (all linked files always)

The "Host vs Linked" source dropdown has been retired. The Rooms tab now scans every loaded Revit link simultaneously and shows each room with a new **Source** column indicating which file it came from. Behind the scenes, link workset state is honored — rooms from links you've unloaded won't appear, even if a stale copy is cached in another link container.

A duplicate-room dedup pass (keyed on linked-doc path name) cleans up the "I see room 02.31.05 twice" problem when an architect's container model includes the same INT link both directly and nested through another container.

### Amps & Cabling — Rack Family Selection Dialog

The amps and cabling workflow scans loaded families for keyword matches on "rack" / "cabinet" / "enclosure" / Middle Atlantic product codes to find eligible AV equipment racks. On projects with furniture, IT, or other non-AV rack families, that scan can pull in 200+ false-positive matches.

A new selection dialog now lists every keyword-matched family with its instance count, an example room, and a tick-box to include or exclude. Your choice is persisted per project, so the rack selection sticks across reboots and team-member handoffs. New families appearing in subsequent scans are flagged with a "New" status badge so they can be reviewed without disrupting the existing selection.

### Apply to Selected / Apply to All

Two new explicit-action buttons on the Amps & Cabling tab (wire gauge) and Circuiting tab (system voltage mode) replace the previous auto-apply-on-dropdown-change behavior. Picking a new default no longer pre-emptively writes to every row — you select rows, then click Apply.

### Bulk rack assignment from the rack picker panel

Multi-select rows in the Amps grid, choose a rack from the right-side panel, click Apply — every selected row updates to that rack in one click. Useful when the auto-nearest-rack assignment doesn't match your design intent and you want to force a block of circuits to a specific equipment room.

### Coverage map line styles

The iso-coverage contour lines now use Line subcategories with built-in colors (green / yellow / red) instead of per-element view overrides. The practical effect: coverage maps render in color on every view, including the dependent plan views placed on sheets. Before v2.2, the colors only showed on the parent floor plan view.

### Quality-of-life fixes

- **Tap setting and rack ID persist on Commit Circuiting.** Earlier versions read these from the UI but didn't write them to the speakers — a regression introduced when the commit was refactored. Now `JSBA_TapSetting_W` and `JSBA_RackId` are written on every speaker as part of a single commit transaction.
- **Update Schedule refreshes every column.** "Update Schedule" now performs a Commit + rebuild instead of a rebuild-only, so changes to wire gauge / tap settings / line loss show up immediately in the circuit schedule view.
- **Add Zone first-click works.** A regression that required two clicks to get the `/A` vs `/B` zone split right has been fixed. The first click now correctly assigns `/A` to the selected speakers and `/B` to the remaining ones.
- **Refresh button no longer dims.** The Amps & Cabling Refresh button stays enabled at tab arrival; on click, it always rebuilds the grid from the current model.
- **Reference-plane speaker placement orientation.** Speakers placed on horizontal reference planes (the common pattern for tall ballrooms and exhibit halls) now consistently come down with the cone facing the listener instead of the ceiling. v2.2 uses a place-on-lower-side strategy that's stable across both upward- and downward-normal reference planes.
- **Rack scanner recognizes SR series.** `MAP-SR_Series` and `SR_Series_Wall_Rack` family names are now matched by the rack scanner via an underscore-to-space normalization step before keyword matching.

---

## Bug fixes

- Temp Room ceiling height now persists across rescan (was reverting to a 12 ft default).
- Acoustics surface-area population works for linked-room projects (regression introduced by hiding the Host/Linked dropdown in v2.2).
- Draw Wiring no longer skips Temp Room circuits (level-name normalization now strips the " (temp)" decoration).
- Direct Field Coverage no longer skips Temp Rooms (input-driven instead of `IsLinkedRoom` flag).
- Various minor consistency fixes (Filled Region creation hardening, link-doc identity dedup, Mark/Consume signaling cleanup).

---

## Upgrade notes

- The v2.2 installer uninstalls any prior version automatically. Project state files (per-project JSON) and license state are preserved.
- Project state schema is unchanged from v2.0 / v2.1 — no migration required.
- Existing user-defined acoustic materials carry forward unchanged.
- Bundled JSBA family files are refreshed in each project on first launch.
- Existing room-boundary Filled Regions from prior versions keep working — v2.2 reads the older `JSBA-RoomBoundary:<num>` Comments format alongside the new `JSBA-RoomBoundary:<num>|<name>|CH:<height_ft>` format.

---

For support: **support@bimacoustics.net**
