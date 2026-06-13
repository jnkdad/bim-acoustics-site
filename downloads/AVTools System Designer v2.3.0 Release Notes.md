# AVTools System Designer v2.3 — Release Notes

**Release date:** June 2026
**Revit compatibility:** 2025, 2026
**Editions:** Standard, Pro
**Signing:** Fully signed (Microsoft Trusted Signing)

---

## What's improved

### Room Acoustics — complete surface capture on host-model rooms

Fixed a defect where rooms bounded by walls in the **active model** (rather than a linked architectural model) could omit wall, floor, and ceiling areas from the Assign Materials surface list. Affected surfaces reported 0 ft² and were left out of the RT60 calculation. All bounding surfaces are now captured and areased correctly, so Assign Materials shows the complete surface set and RT60 reflects every bounding surface in the room.

Linked-model projects (the most common workflow, where rooms come from the architect's linked model) were unaffected and behave exactly as before.

---

## Maintenance

- Fully signed installer and assemblies via Microsoft Trusted Signing (continued from v2.2.2).
- Revit 2025 / 2026 compatibility maintained.
- Project state, license activation, and per-project configuration carry forward unchanged — no migration required; existing projects open as-is.
- Bundled JSBA family files are refreshed in each project on first launch.

---

For support: **support@bimacoustics.net**