
# AVTools v3.1.0 — Release Notes

Revit 2025, 2026 and 2027 · J. Stevens BIM Acoustics, LLC

v3.1.0 adds **Revit 2027**, **F1 help** on every ribbon button, and a set of fixes from testing v3.0.0 with EASE 5. One installer covers Revit 2025, 2026 and 2027.

## Revit 2027 and the ribbon

- **Revit 2027.** System Designer, SpecTool and Room Exchange now run in Revit 2027 as well as 2025 and 2026, from the same installer.
- **F1 help.** Hover over any button on the BIM Acoustics tab and press F1 to open its help page on bimacoustics.net.
- **Two panels.** **AV Tools** holds System Designer and SpecTool; **Utilities** holds Room Exchange, Lucius and License Manager. The empty Acoustics Tools panel is gone.

## Room Exchange

- **Include loudspeakers.** A tick box beside **Export to** adds the System Designer loudspeakers in the ticked rooms to the export, and shows how many the model holds. It is remembered for the next export.
- **EASE 5 loudspeaker targets.** EASE 5 cannot import loudspeakers from a drawing, so each one is written as a small target face on the `AVTOOLS-SPEAKER-TARGETS` layer. A ceiling loudspeaker's target now lies flat one inch under the ceiling, inside the room, so it can be picked in plan; the text labels that EASE 5 rejected are gone.
- **A note before an EASE 5 export with loudspeakers.** EASE 5 imports the targets as surfaces and warns that they sit on the ceiling face. Room Exchange says so first: **Continue** exports with the targets, **Exclude loudspeakers** exports the room only. Place an EASE loudspeaker at each target, then delete the `AVTOOLS-SPEAKER-TARGETS` selection set before calculating.
- **.NET check.** The separate program that builds the EASE model runs on the .NET installed in Windows. For Revit 2025 and 2026 it now needs the .NET 8 Desktop Runtime 8.0.32 or later, as Autodesk requires App Store add-ins to run on a .NET release with the current security fixes. If the PC's .NET is older, Room Exchange shows what is installed and what is needed, with a link to Microsoft's download page, or builds the model inside Revit instead.

## System Designer

- **Iso-map.** Coverage is sampled on a grid no coarser than a quarter of the loudspeaker spacing, so each loudspeaker gets its own contour instead of contours that merge and split. Checked against EASE 5 at the same listener height.
- **Drawing a room's iso-map in a second view** no longer stops with "The type name JSBA_DFM_… is already in use".
- **Messages** from System Designer open in front of its window instead of behind it, where they could leave the window blank until they were found.
- **Tag families.** The "JSBA Circuit ID Tag w Tap" family is no longer installed; use "JSBA Circuit ID Tag w Watts".

## Lucius

- **Transcript opt-in is off unless you turn it on.** The first time you open Lucius you are asked once, with No as the default.
- **Share anonymous transcripts** tick box in the Lucius window, kept in step with the one on the About tab.

## Security

- System.IO.Packaging updated to 8.0.1.
- Room Exchange's separate program requires .NET 8.0.32 or later (Revit 2025 and 2026).
- An unused component (Microsoft.Bcl.HashCode 6.0.0) is no longer installed.
- Every AVTools program file (DLL and EXE) in the installer is signed by J. Stevens BIM Acoustics LLC.

## Installing

Installing v3.1.0 replaces v3.0.0 and earlier. Project state, license activation, settings and EULA acceptance carry forward. Close Revit before installing. Lucius and SpecTool need an internet connection; everything else, Room Exchange included, works offline once your license is activated. Room Exchange's DWG export for EASE 5 still needs AutoCAD on the same machine.
