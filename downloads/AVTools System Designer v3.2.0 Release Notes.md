# AVTools v3.2.0 — Release Notes

Revit 2025, 2026 and 2027 · J. Stevens BIM Acoustics, LLC · November 2026

v3.2.0 brings **STI mapping**, **3D coverage maps** and a new loudspeaker layout for awkward rooms to **AVTools System Designer**, simpler and lighter EASE 5 drawings to **Room Exchange**, and the first Beta of **Echea**, the room-acoustics add-in of BIM Acoustics Studio. One installer covers Revit 2025, 2026 and 2027.

## AVTools System Designer 3.2.0

### Maps

- **STI mapping** on the Room Acoustics tab: Compute, Draw and Clear STI Map, over the same grid as the SPL coverage map. STI is worked out at every grid point from the loudspeakers' direct field, the room's reverberant field and its background noise, per octave band from 125 Hz to 8 kHz, with the IEC 60268-16 male weighting. The target STI is 0.60 by default, and a table gives the minimum, average and maximum STI and the share of the floor at or above the target.
- **SPL iso-line step.** Choose 1, 2 or 3 dB between the lines on Direct-Field Coverage (2 dB as before).
- **Heat-map fill**, optional, for the SPL map and the STI map: semi-transparent colour bands with a label on each area.
- **Mapping views.** Each map is drawn in its own copy of the plan ("&lt;plan&gt; SPL Mapping", "&lt;plan&gt; STI Mapping"), so it can go on its own sheet and the working plan stays clean.
- **3D coverage carpet.** The SPL or STI map drawn as model elements, so it shows in 3D views, Autodesk Construction Cloud and Navisworks.
- **Export PNG** for the maps and for the RT60 graph.
- **Every loudspeaker in the room counts.** The maps and STI figures include the loudspeakers System Designer placed, those placed by hand and those in a linked model. Circuiting, cabling and schedules still take only the loudspeakers System Designer placed.
- The Room Acoustics schedule and CSV export carry the new STI figures.

### Rooms and room acoustics

- **Material assignments are kept in the Revit model** and shared both ways with Echea.
- **One left-out list in the model**, shared by System Designer, Room Exchange and Echea: an element left out in one is left out in all three.
- A **Room Exchange Custom Perimeter** is listed on the Rooms tab and can be used for room acoustics, RT60, material assignment and the STI map.
- **Room heights and perimeters follow the level's height in the model.** This fixes rooms that missed their building in models whose levels are set from the Survey Point.

### Loudspeaker layout (new, still being tested)

These layouts are still being tested. If a room comes out wrong, please send what you find to support@bimacoustics.net.

- **Narrow rooms with nooks** (a corridor with vestibules and alcoves) are laid out part by part: one centred row down the corridor, a second row where it widens, and loudspeakers in the nooks deep enough to need one. Before, such a room could end up with almost no loudspeakers in the corridor itself.
- **Curved rooms** are laid out on their real outline, and a room between two concentric arcs gets its rows on arcs.
- **Ceiling zones.** A room with two or more usable ceilings (coffers, exposed deck, a lower ceiling) asks which to use, with a loudspeaker family for each. A **Ceilings...** button on each row changes the answer later.
- Loudspeakers can be hosted on an exposed deck and on a sloped face.

### The loudspeaker list

- The list looks in Audio Visual Devices and Communication Devices. **Categories...** on the Configuration tab adds Specialty Equipment, Electrical Fixtures, Electrical Equipment or Data Devices, for firms that model their loudspeakers there.

### Smaller changes and fixes

- The Rooms list follows a rescan after the Filter box has been used.
- The panel follows a switch to another open project.
- Commit on Amps & Cabling warns when a circuit has no cable length or loss.
- The automatic tap picks the smallest tap that meets the room's required power.
- **Lucius** answers from its current knowledge even when System Designer has not been opened yet in the session.

## Room Exchange (in v3.2.0)

- **Simpler drawings.** The export leaves out detail too small to matter acoustically, so the drawing has fewer faces and fewer slivers: about 40 percent fewer faces on a room with a lot of curved geometry, and 10 to 15 percent fewer on a mostly flat room, compared with v3.1.0. The room stays closed.
  - Very small faces are removed and their neighbours stretched over the spot.
  - Small rounds (a rounded corner, a nosing) become flat.
  - A balcony front with a sloped, rounded profile along a curve becomes flat panels.
  - Neighbouring faces of one layer in the same plane are written as one face.
- **Curved walls** go out as flat strips along their curve, as curved ceilings and roofs already did. The panel size is set under Options.
- **Custom Perimeters are shared.** A perimeter traced in Room Exchange is listed in System Designer and in Echea.
- **The left-out list is shared** with System Designer and Echea and saved in the model.
- **Room heights** follow the level's height in the model (the Survey Point fix above).
- **Supported with EASE 5:** open the DWG in EASE 5. DXF is also written for programs that read only DXF. Other programs that read DXF or DWG have been tried but are not supported.

## Echea (Beta)

Echea is the room-acoustics add-in of BIM Acoustics Studio, and this is its first Beta. It traces sound rays through a room straight from the Revit model and reports reverberation, clarity, speech intelligibility, level and spaciousness per seat and per frequency band. Its results are for trying rooms and reporting what you find, not yet for basing a design decision on. A 14-day free trial of Echea starts the first time it is opened on a PC, separate from System Designer's own trial. See the Echea Beta Quick Start for the details, and send what you find to support@bimacoustics.net.

## Installing

- **Close Revit first.** v3.2.0 replaces an installed AVTools System Designer (v3.1.0 or earlier). Project state, licence activation, settings and EULA acceptance carry forward. No uninstall is needed first.
- **Existing projects** open with a 2 dB iso-line step and no fill, exactly as before. Rooms of the kinds listed under "Loudspeaker layout" can get a different loudspeaker count and positions the next time **Refresh Calculations** is pressed.
- **Internet.** Lucius and SpecTool need a connection; everything else works offline once the licence is activated.
- Room Exchange's DWG export for EASE 5 still needs AutoCAD on the same machine.
- **Support:** support@bimacoustics.net
