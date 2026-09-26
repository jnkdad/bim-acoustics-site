# AVTools System Designer v2.3.5 — Release Notes

**Release date:** September 2026
**Revit compatibility:** 2025, 2026
**Editions:** Standard, Pro
**Signing:** Fully signed (Microsoft Trusted Signing)

---

## What's changed

### The free trial now includes every Pro feature

The 14-day free trial unlocks the complete Pro feature set, so you can evaluate the whole workflow before choosing a plan:

- Room scanning, automated loudspeaker placement and coverage maps
- Room acoustics: material assignment, RT60 and STI
- Circuiting, amplifier and cabling design, and clash coordination
- SpecTool: CSI Part 2 specification generation
- The Lucius AI assistant, including its model tools

The About tab shows how many trial days remain. When the trial ends, Standard features (layout, coverage and room acoustics) need a Standard or Pro subscription, and Pro features need Pro. Anything you placed in your models during the trial stays in place.

### License validation fixes

- **Changing the license email works cleanly.** If you enter a different email on the About tab and click **Validate Now**, that email is now checked on its own. Previously the add-in could carry over the license from the email used before and report it as active.
- **Clear answers from the license server.** When the server turns a license down, the About tab now says so and shows the reason, instead of treating it as a temporary outage.
- **Better error messages.** If validation can't reach the server, the About tab says whether it timed out or what went wrong, and the details are saved to the log files that **Bundle Logs (ZIP)** collects for support.

---

## Also in this release

- The download includes the updated System Designer User Guide, the SpecTool Quick Start and the SpecTool User Guide.
- Everything from v2.3.3 carries forward: encrypted (HTTPS) connections for licensing, Lucius and SpecTool, the warning before using a non-loudspeaker family in manual pick, and the "AVTools System Designer" name in Revit.

---

## Installation

- Installing v2.3.5 upgrades v2.3.4, v2.3.3 or any earlier v2.x in place.
- License activation, project state and per-project configuration carry forward unchanged; no migration.
- SpecTool and the Lucius assistant need an internet connection. The rest of System Designer works offline once your license has been activated.

---

For support: **support@bimacoustics.net**
