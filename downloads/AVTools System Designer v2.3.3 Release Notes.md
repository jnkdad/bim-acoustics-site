# AVTools System Designer v2.3.3 — Release Notes

**Release date:** September 2026
**Revit compatibility:** 2025, 2026
**Editions:** Standard, Pro
**Signing:** Fully signed (Microsoft Trusted Signing)

---

## What's changed

### Encrypted connections for licensing and Lucius

- **Licensing.** License activation, validation and first-launch registration now connect to the BIM Acoustics licensing service over **HTTPS**. Registration sends your name, email and company, and that information is now always encrypted in transit.
- **Lucius and SpecTool.** The Lucius assistant, SpecTool generation and the datasheet web hunt now reach the BIM Acoustics AI service over **HTTPS** (`lucius.bimacoustics.net`). Your questions, the model context Lucius reads, and SpecTool's equipment lists are now encrypted end to end.

### A warning before using a non-loudspeaker family

The manual loudspeaker pick lists every loaded family type, so it's possible to choose something that isn't a loudspeaker, such as a panelboard. Placement and coverage would then quietly assume 90° coverage and 78 dB sensitivity, and the results would look real. System Designer now asks before using a family type that doesn't look like a loudspeaker or has no coverage data, and names what's missing. The default answer is No.

### Add-in name in Revit

Revit's Signed Add-In prompt and Add-In Manager now show the add-in as **AVTools System Designer**, published by J. Stevens BIM Acoustics LLC, matching the installer and the digital signature.

---

## Installation

- Installing v2.3.3 upgrades v2.3.2 or any earlier v2.x in place.
- License activation, project state and per-project configuration carry forward unchanged; no migration.
- SpecTool and the Lucius assistant need an internet connection. The rest of System Designer works offline once your license has been activated.

---

For support: **support@bimacoustics.net**
