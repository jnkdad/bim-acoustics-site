# AVTools v3.0.0 — Release Notes

Revit 2025 and 2026 · J. Stevens BIM Acoustics, LLC

v3.0.0 brings **Room Exchange** to everyone, puts the Room Exchange engine under System Designer's room acoustics, and adds a **License Manager** with a new **RoomExchange plan**.

## Plans

| Plan | Price | Includes |
|---|---|---|
| Standard | $60/month or $600/year | System Designer: layout, coverage and room acoustics; Lucius chat |
| RoomExchange | $80/month or $800/year | Room Exchange; Lucius |
| AVTools Suite Pro | $99/month or $990/year | System Designer Pro, SpecTool and Room Exchange; Lucius tools |

The free 14-day trial unlocks every Pro feature. Annual plans are two months free.

## New: Room Exchange — Revit rooms to EASE 5

Room Exchange turns the Revit rooms you tick into an EASE 5 room model: a DWG of closed faces, one layer per surface material, which EASE imports as a closed volume with one Selection Set per layer.

- **Closed volumes.** Room Exchange fills each room's air and finds every surface the air touches: floors, walls, ceilings, roofs, glass, doors, columns, stairs, curtain walls and operable partitions, in the model and in its links. Small gaps are sealed, and the result tells you whether each volume is closed.
- **Layers named from the model.** Each layer is named after the Revit material on the room side, so you can tell the surfaces apart when you assign EASE materials.
- **Curved ceilings and roofs** go out as flat panels of a size you set (default 4 ft).
- **Glass railings** come out as glass panels. Rails, posts and balusters are left out as detail.
- **Structural steel** in the room becomes one panel per member.
- **Stair and atrium openings** inside a room are kept open.
- **Demolished elements are left out** automatically.
- **Checklist before export.** Untick scenery and suspect floors, or send elements to the plan image (PNG) only. Choices are remembered per project.
- **Custom Perimeter.** Trace a boundary in plan for spaces no room describes: open lobbies, atriums, stadium bowls. Perimeters are saved in the project, can be adjusted in 3D against the real floor and roof, and several perimeters (one per level) can export as one model.
- **Connected rooms.** When a space opens into rooms you did not tick, the result offers to add them and choose again.
- **Origin marker.** Place the JSBA Room Ref Origin family to set EASE's origin and orientation; Room Exchange loads it into the project for you.
- **Import Loudspeakers.** Brings loudspeaker positions and aims from an EASE project back into Revit as your loudspeaker families.
- **Faster big exports.** The EASE model is built in a separate process beside Revit, many times faster than inside it. If one or two very heavy elements made a read slow, Room Exchange names them and offers to leave them out.
- **Support in one click.** Zip Support Files packs the logs and room snapshot for support@bimacoustics.net.
- **Lucius knows Room Exchange.** Open Lucius (BIM Acoustics tab → Utilities) and ask for help with a result, the checklist or an EASE import.

Room Exchange is supported with EASE 5. The exported DXF and DWG files also appear to import into Bose Modeler and ODEON, but this has not been fully tested and is not supported. They may work in other applications that import DXF or DWG files containing 3D polylines and/or 3D faces.

**Room Exchange requires AutoCAD on the same machine.** Room Exchange writes the model as a DXF and uses AutoCAD only to convert it to the DWG that EASE 5 imports; nothing else is done in AutoCAD. The DXF export does not use AutoCAD.

## System Designer

- **Room Acoustics uses the Room Exchange engine.** Each room is read as a closed shell, with the same capture as an EASE export, so the RT60 gets every surface, which way it faces, and the true air volume. A room the engine cannot close falls back to the earlier method, with a note.
- **Assign Materials** lists one row per kind of surface material (not per Revit type), with a **Leave out** column for scenery and structure that should not count in the RT60.
- **Refresh** on Room Acoustics reads the rooms again and recalculates. A slow read caused by one or two heavy elements offers to leave them out.
- **Occupancy and People** columns on the Rooms tab.
- **Reset All Design State** also removes what AVTools placed in the model, after showing what it will remove and asking first.
- **Placement:** a loudspeaker hosted on a linked ceiling gets the room's level in Schedule Level when Revit leaves it empty.
- **Layout:** the grid-rotation detector no longer turns a room it reads as square onto a single skewed wall.

## Licensing and Lucius

- **License Manager** (BIM Acoustics tab → Utilities) shows your plan, the plans with their buy links, **Validate Now**, and **Manage or Upgrade Subscription** to move between plans. It works with no project open. Subscription settings have moved here from the About tab.
- **Lucius button** on the Utilities panel. Lucius no longer opens by itself when System Designer starts.
- **A trial shows as "Free trial"**, not as a paid plan.
- **Validate Now sends your name, company, add-in version and Revit version** with the license check, so support can see which version you run.
- **Lucius privacy:** the model's name, linked models' names, folder paths and file names are replaced with short aliases before anything is sent to the assistant.

## Installing

Installing v3.0.0 replaces v2.3.x and the 2.4.0 beta builds. Project state, license activation and EULA acceptance carry forward. Lucius and SpecTool need an internet connection; everything else, Room Exchange included, works offline once your license is activated.
