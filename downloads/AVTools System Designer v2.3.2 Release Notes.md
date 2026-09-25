# AVTools System Designer v2.3.2 — Release Notes

**Release date:** September 2026
**Revit compatibility:** 2025, 2026
**Editions:** Standard, Pro
**Signing:** Fully signed (Microsoft Trusted Signing)

---

## SpecTool 1.0 (Pro)

SpecTool leaves Release Candidate status. The RC1 label is gone from the SpecTool window, and the feedback from live projects since v2.3.1 is built in.

### Section merge — no more one-item spec sections

A single item such as a patchbay can classify into its own section (27 15 00 Communications Cabling, 27 21 00 Networking) and force a whole spec into existence. The new **Merge…** button on the Sections page folds one section into another. For example, merge 27 15 00 into 27 41 00 and the patchbay keeps its own article but generates inside 27 41 00. Merged sections show where they now generate, and merges are saved per project and reversible. The Sections page also scans the model automatically the first time it opens, so every section is listed up front.

### Header and footer fields fill themselves

Create / Update now refreshes the section number, section title, phase and issue date in the document's headers and footers, so they no longer have to be hand-edited on every issue. Values come from your Setup page. The format comes from the architect's template: "100% Design Development" becomes "50% Construction Documents", "100% DD" becomes "50% CD", and date order follows the template. A new **Issue date** field on Setup defaults to today.

### Better datasheets, better specs

- **Specs from product web pages.** When a manufacturer publishes specs on a web page but no PDF datasheet (common for displays), From URL now saves the page and reads its specs at generation.
- **Stricter AI datasheet hunt.** The web hunt now accepts only single-product PDF datasheets. It rejects manuals, quick-starts, comparison charts, multi-product catalogs, reseller pages and policies, and it keeps a file only if the file itself names the model. If nothing qualifies, the row says so and points you to From URL or Attach.
- **Product descriptions come from the datasheet.** Form factor and mounting ("outdoor in-ground loudspeaker, 360° coverage") are read from the datasheet instead of being guessed from the model name.
- **Datasheets are read at Generate** even if you never opened the Datasheets step, and a corrected or replaced datasheet now takes effect when you regenerate.
- **Exact filename wins.** When several library files contain a model name, the exact match (`XT850i.pdf`) is used over a partial one.
- **Long catalogs and manuals** are read around the model's own section rather than only from the start of the document.
- Placeholder values in a Revit family (coverage "0", "N/A", "TBD") no longer block the real value from the datasheet.

### Smaller fixes

- Size/variant products that share a Type code (e.g. rack blank panels BP1–BP6) generate as one Type listing all sizes instead of one paragraph per size.
- The Include checkbox on the Products page toggles on the first click, and an excluded product no longer lingers on the Datasheets page.
- A clearer message when you try to generate a section that has been merged into another, naming the section to open instead.

### New: SpecTool Quick Start

A new two-page **SpecTool Quick Start** takes you from an open project to your first issued spec: what to have ready, the six screens in order, and the five things that most often trip people up. It's included in the download alongside the full SpecTool User Guide, which is updated for all of the above.

---

## System Designer

### Rooms — Remove Selected Rooms works again

**Remove Selected Rooms** reported success but left the room's placed elements in the model. Removal now runs through Revit's supported event mechanism, deletes the room's JSBA-managed elements, and then reports the actual outcome.

### Circuiting — the circuit schedule keeps your edits

- **Create/Update Schedule no longer resets a schedule you've customized.** Fields, column order, sorting and filters are only set when the schedule is first created. Before, every update put the default template back.
- **Loudspeakers only.** Racks, amplifiers, switches and other JSBA-managed equipment no longer appear in the loudspeaker circuit schedule.

### Design state — equipment rooms stay "Not Started"

Rooms that contain only racks or other AV equipment (no loudspeakers) no longer get stuck showing "Speakers Placed" after every rescan.

### Amps & Cabling — same-level rack assignment

- **New option: "Only assign racks on the same level."** When checked, a room with no rack on its own level is left unassigned instead of being matched to a rack on another floor. It is unchecked by default, which keeps the previous behavior.
- Rooms and racks that have no Revit level association now get their level from their numbering (e.g. room `02.34.00`, rack `ER-02.01.01`), so the same-level search no longer silently falls back to racks on other floors.

---

## Installer and licensing

- **New product name.** Apps & Features now lists **AVTools System Designer**, published by **J. Stevens BIM Acoustics LLC**, which matches the name on the digital signature.
- **Upgrades in place.** Installing v2.3.2 automatically replaces any earlier v2.x. The install folder is unchanged (`C:\Program Files\JSBA\System Designer`).
- **No migration.** License activation, project state and per-project configuration carry forward unchanged; existing projects open as-is.
- **Internet connection.** SpecTool and the Lucius assistant need an internet connection; both run through the BIM Acoustics cloud service. The rest of System Designer works offline once your license has been activated.
- **Correct version reporting.** The About tab and license activation now report the installed version (earlier builds reported v2.2.2).
- On first launch Revit shows a **Signed Add-In** prompt naming J. Stevens BIM Acoustics LLC as publisher. Choose **Always Load**.
- Fully signed MSI installer and add-in assemblies via Microsoft Trusted Signing. Revit 2025 / 2026.

---

For support: **support@bimacoustics.net**
