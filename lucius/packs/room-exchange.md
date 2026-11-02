# Product Pack - Room Exchange (Revit rooms to EASE 5)

**Release status: Room Exchange is generally available with AVTools v3.0.0 (November 2026; Revit 2025 and 2026), included in AVTools Suite Pro and sold on its own as the RoomExchange plan. Report issues to support@bimacoustics.net.**

Use this guide for any question about **Room Exchange**, the AV Tools Suite command that turns Revit rooms into an EASE 5 room model (a DWG of closed faces, one layer per surface material). On the website you cannot see the user's model or export; answer from this guide. Inside Revit the user opens Lucius from BIM Acoustics tab → Utilities. When the user describes a result, use the "What the result means" and "Reading the EASE import" sections. Do not invent settings, buttons or layer names that are not listed here. If something is outside this guide, say so and point the user to Zip Support Files and support@bimacoustics.net. The Room Exchange User Guide (PDF) is on the Products page and in the download ZIP.

## What it does, in one paragraph

The user ticks one or more Revit rooms. Room Exchange captures the model around them (walls, floors, ceilings, roofs, columns, structure, stairs, ramps, doors, windows, curtain walls, generic models; operable partitions and curtains by name), fills the room's air on a fine lattice, finds every surface the air touches, flattens those into faces, names each face by the material on the room side, and writes a DWG that EASE 5 imports as a closed volume. Every layer in the DWG becomes a Selection Set in EASE, so materials are assigned per layer.

## Requirements and supported programs (say these plainly when asked)

- **Revit 2025 or 2026** (Revit 2027 support is in development; not available yet).
- **AutoCAD must be installed on the same machine.** Room Exchange writes the model as a DXF and uses AutoCAD only to convert that DXF to the DWG that EASE 5 imports; nothing else is done in AutoCAD. The DXF export does not use AutoCAD.
- **Supported target: EASE 5.** The exported DXF and DWG files also appear to import into Bose Modeler and ODEON, but this has not been fully tested and is not supported. They may work in other applications that import DXF or DWG files containing 3D polylines and/or 3D faces. If asked about any program other than EASE 5, say exactly that.
- Room Exchange works offline once the license is activated; only Lucius needs an internet connection.
- The same engine reads the rooms for System Designer's Room Acoustics (RT60) in v3.0.0, so the RT60 gets every surface, which way it faces and the true air volume.

## License and plans

- Room Exchange opens with the **RoomExchange** plan (USD 80 a month or 800 a year), with **AVTools Suite Pro** (USD 99 a month or 990 a year; includes System Designer Pro, SpecTool and RoomExchange), or during the **free 14-day trial**. The trial starts when the user registers in System Designer and has all Pro features. System Designer Standard does not include Room Exchange. Annual plans are two months free.
- Without one of these, Room Exchange shows **Room Exchange — Subscription Required** and does not open.
- **License Manager** (BIM Acoustics tab → Utilities → License Manager, works with no project open) shows the current plan, the Name, Company and Subscription email boxes, **Validate Now**, the plans with their buy links, and **Manage or Upgrade Subscription**.
- After buying: enter the email used to subscribe and press **Validate Now**. The license is checked only when Validate Now is pressed, so press it again after any change to the subscription (an upgrade, a renewal after a lapse).
- **Manage or Upgrade Subscription** opens the billing portal, where the user moves from one plan to another (RoomExchange to Pro, monthly to annual) or cancels. Upgrading from RoomExchange to Pro credits the unused time on the current plan.
- For anything else about billing or licenses, point the user to support@bimacoustics.net.

## The window

**Rooms tab**
- A list of the rooms in the model and in linked models (linked rooms are marked by their document). The filter box narrows the list by number or name.
- Tick rooms and press **Export**. Several ticked rooms that share an open connection export as one volume; rooms with no connection export as separate files.
- After the model is read in Revit, a small window shows **Building the EASE model … in a separate process** with the time so far and **Cancel**. The EASE model is built by a separate program beside the add-in, many times faster than inside Revit; Revit waits. Cancel stops the export and writes nothing. If that program cannot run, the model is built inside Revit (slower, same result) and the result dialog says why.
- **File name**: optional. Empty names the files after the room numbers, with the suffix `_fill`. A typed name is used as given (illegal characters replaced). When one export writes several files, the room numbers are appended.
- **Export for**: DWG (EASE 5, other) is the normal choice for EASE 5. DWG needs AutoCAD on the machine (used only for the DXF→DWG conversion). DXF (Bose Modeler, EASE 4, other) is for Bose Modeler, which reads DXF only, and for EASE 4. Room Exchange is supported with EASE 5; the files also appear to import into Bose Modeler and ODEON but that is not fully tested or supported (see Requirements above).
- **Custom Perimeter…**: trace a boundary by clicking in a plan view when no placed room describes the space (open lobbies, atriums, stadium bowls). The user gives a number, name, base and top (level plus offset). The perimeter is saved in the project as a Filled Region with a see-through volume, listed in the room list (Source: Perimeter), and exported through the same engine as a room. **Edit Perimeter…** changes its number, name, base or top; **Adjust in 3D…** sets base and top against the real floor and roof. Save the model after tracing, or the perimeter is lost.
- A perimeter takes in every space inside its outline that the air reaches: rooms inside it do not stop the air, and an open doorway into a back-of-house room lets the air in there too. Trace along the space's own edge to keep such rooms out.
- **One perimeter per level** (an atrium whose edge changes floor to floor): in each level's plan, Custom Perimeter → **Trace & Save** (saves without exporting and returns to the room list with it ticked, plus earlier ticks). The base starts at the plan's level and the top at the next level up, which can be a mezzanine level; check it. With 2+ perimeters ticked, Export asks **Merge Perimeters**: Yes (default) = one model, No = each separately. In one model a perimeter stops at the floor of the one above where that floor is solid; through an open floor (atrium void, stair opening) the air runs on. Ticked rooms export apart from the perimeters.
- **Curved walls in a perimeter**: Trace draws straight lines only. Trace a rough outline with **Trace & Save**, then select the perimeter's Filled Region in the plan, click **Edit Boundary** and use **Pick Lines** on the curved walls or an arc tool; Finish, and save the model. The next export reads the new outline (arcs as short straight lines); only the outer loop counts. Edit Perimeter → Save redraws the see-through volume.

**Options tab**
- **Export folder**: where the drawings go. Default `C:\DXFExports\`. The `support` folder under it holds the logs and room snapshots.
- **Diagnostics**: on by default. Writes the capture log, the fill log and the room snapshot for every export. Leave it on.
- **Curved surfaces → Panel size (ft)**: a curved ceiling or roof goes out as flat panels of about this size along its own direction, folds over 5° kept, at least six panels across, none under 1 ft. Ceilings and Roofs only. Per project; default 4 ft; 0 = off (one face per Revit triangle, as before v3.0.0).
- **Capture Snapshot Only**: saves the room snapshot without exporting. Used for support.
- **Open Settings File**: opens `RoomExchangeSettings.json` (see Settings).
- **Zip Support Files**: packs the last export's drawing, origin file, linework notes, logs, snapshot, the settings file in use and the remembered checklist choices of the model into one zip in the support folder and opens the folder with it selected. The zip is named `RoomExchange_support_<date>_<time>.zip`; the model's name and the room numbers are inside, in `versions.txt`, not in the file name. This is what to send with a problem report.

**Workflow tab**: the short version of this guide. **About tab**: versions, file locations, Email support.


**Import Loudspeakers tab**: brings EASE loudspeaker positions and aims back into Revit as families, using the origin file written beside each drawing. Not covered further here.

## The checklist (the dialog that appears before an export)

Before capturing, Room Exchange lists the elements inside the ticked rooms that are not plain building envelope: generic models, stairs, ramps, casework, specialty equipment, and floors it suspects. Walls, ceilings, roofs and columns are the envelope and are not listed.

- **Ticked** = in the acoustic model. **Unticked** = treated as absent (a pit filler platform, a flat finish floor drawn over a raked slab, scenery).
- **PNG** column = seen but not heard: the element's lines go into the transparent plan image for EASE's Drawings (basketball court lines, roof steel for loudspeaker placement), and the element is not in the acoustic model.
- Rows with ⚠ are suspect floors: two substantial floors overlapping at different heights (a finish plane over a raked slab, a filler over a pit). The tool only flags; the user decides.
- Rows with ⛔ were **auto-excluded**: thin finish films (a floor whose whole thickness is under about 2 inches) and floors named "rendering only". They are hidden by default; the **Show auto-excluded (N)** tick lists them so one can be restored.
- Choices are remembered per project. Unticked rows come back unticked next time; tick one to restore it. **Include All** reticks everything visible.
- **Show in Revit** (or double-click) highlights or zooms to the row's elements.
- **Demolished elements are left out whatever the list says**: anything with a Phase Demolished set (in the model or a link), and anything created in a phase whose name contains "Demo". Walls are never listed and floors only when suspect, so this is how a renovation's demolished floors and walls leave the model. To keep one, clear its Phase Demolished in its own model.
- Furniture is not exported. Seats, chairs, pews and tables never appear in the model or in this list. Only two kinds of equipment and furniture are taken: operable partitions and curtains, drapes and pleated panels, both recognised by words in their family or type names (see Settings).

## What the result means (the dialog after an export)

Each exported volume gets one block of lines:

- `faces, panel(s), cf, closed/open edge(s), attribution %, s`: face count, two-sided panel count (clouds, pads, curtains, bleacher boards), the volume in cubic feet, whether the shell is closed, how much of the surface area is named from a real element (the rest is boundary or seal), and the time. A room that says **closed** will import green in EASE.
- **`N opening(s) sealed — locations in the log`**: small gaps in the model (under about 2.5 ft) that the fill closed with a seal face. Normal; dozens on a big room are fine. The seals are on `…_BOUNDARY_SEAL` layers.
- **`► The air reaches the limit of the ticked rooms toward room X over N sf with no surface there`**: the ticked rooms open into room X with nothing between. Either tick room X as well (the spaces are one volume), or the model is missing a wall, door or ceiling there. The area says how big the opening is: 50 sf is a doorway, 5,000 sf is a missing ceiling or a whole shared wall.
- **`► N sf of opening to room X across a room separation line`**: the rooms touch across a separation line only. Tick X if it is part of the space; otherwise the opening is on the `OPENING` layer for the user to give an opening material.
- **`• Room X reports no volume: Areas & Volumes is off`**: the Revit model does not compute room volumes, so the exported volume cannot be checked against Revit. Harmless; turn on Areas and Volumes in Revit's Area and Volume Computations to get the check.
- **`• Room X stops N ft below the deck at Z: the region was raised to the deck`**: the Revit room's upper limit is below the real ceiling or deck, so the fill was allowed to rise to the deck. If the room truly stops lower, a ceiling in the model will stop it.
- **`► Perimeter X: the export stops at N ft above the base …`** (or **Room X** …): the top is below the real ceiling or roof, and part of the export's top is a flat lid with nothing above it. Raise the top (Edit Perimeter, or the room's Upper Limit in Revit), or use the link **Extend … and export again**, which lifts the top for that export only (the saved perimeter or room is not changed). If the message returns, the roof over that part is not in the loaded models.
- **`• N demolished element(s) (a Phase Demolished set, or created in a Demo phase) were left out: … in <model>`**: the count per model of elements left out as demolished (see the checklist section).
- **`• The fill ran inside Revit, which is much slower: <reason>`**: the separate program that builds the EASE model was not used (not installed, or the snapshot was not saved). Same result, slower.
- **`• The origin marker used is more than 1 ft outside the captured rooms`**: the drawing's origin comes from the nearest "Room Ref Origin" marker family, which is in another room. Place a marker inside this room for a clean origin, or ignore if the offset does not matter.
- **`• … the outline of room X is N % off its Revit area`**: a linked room's boundary could not be read cleanly. Trace the room with Custom Perimeter, or place a host room over it.

Command links at the bottom: **Zip the support files**, **Open the export folder** (left out when the connected-rooms link also shows, as a dialog holds only so many links), and, when the space is open into rooms that are not ticked, **Add the N connected rooms and choose again**. Its rooms are suggestions from the fill, so tell the user to check the list before exporting. It reopens the room list with the last selection plus those rooms ticked, for the user to adjust before exporting. It offers only rooms the air reached with nothing in between (a cased opening, arch, separation line, missing wall); a room behind a door is never offered. Left off, with the reason in the fill log (`suggest: left off …` lines): outdoor and service spaces, the same space in another link, and envelope rooms spanning several other rooms. The same link also unticks ticked rooms that came out as their own volume (the "separate volume" lines), naming them in the link; a room meant to be separate can stay ticked. Repeat until the result offers no more.

A slow export: when the capture of the rooms took more than a minute and a half, mostly for one or two heavy elements (a Direct Shape of hundreds of thousands of triangles, often a piece of equipment or a model of the building skin that stands outside the rooms), a window opens after the result dialog. It names each element, says whether it is inside or outside the rooms, and has a **Show in Revit** button so you can see what it is. **Leave out and export again** adds it to this model's exclusion list and exports once more, which is much faster; **Keep it** leaves everything as it was. An element outside the rooms does not change their surfaces; one inside a room stays in the checklist, unticked, so you can put it back.

## Reading the EASE import

- **Green** volume on the Acoustic Parameters page: closed, use it.
- **Yellow**: small open edges only. EASE shows them with Hole Outlines in the 3D view. Hairline seams where a floor meets many wall bases are harmless. Long straight yellow lines across a face mean a face was written twice or is missing; send the support zip.
- **Red**: not closed. Hole Outlines shows where. Usual causes: a room that opens into an unticked neighbour (the result dialog's ► lines), or a face EASE refused (see the Import Log tab, which exists only while the project is open).
- **Import Log tab missing** = EASE refused nothing. Then yellow or red is geometry, not a rejected face.
- Volume: EASE's number should be within about 1 % of the result dialog's cf. A big difference means part of the room is missing or an extra space was swallowed.

## Layer names (every layer is an EASE Selection Set)

**The layer name is not the EASE material.** Room Exchange names each layer after the Revit material or family it found on the room side of the surface, so you can tell the surfaces apart. Which acoustic material each layer gets in EASE is your decision when you assign materials there; Room Exchange assigns nothing. A layer called WALL_GYPSUM tells you those faces are gypsum board in the model; you choose the gypsum-on-studs data set that fits.

- `EASE-$WALL_<material>`, `EASE-$FLOOR_<material>`, `EASE-$CEILING_<material>`: a surface of the room, named by the material on the room side (a compound wall's room-side layer, or the family name for a loadable family).
- `EASE-$DOOR_<material>`, `EASE-$DOOR_FRAME`, `EASE-$WINDOW`, `EASE-$STAIR_<type>`, `EASE-$COLUMN_<material>`: the same for those elements.
- `EASE-$WALL_CURTAIN_WALL`, `EASE-$CEILING_CURTAIN_WALL`: curtain wall panels and mullions.
- `EASE-$WALL_OPERABLE_PARTITION`, `EASE-$CEILING_OPERABLE_PARTITION`: an operable partition, its track, and any thin wall or glazed leaf standing on its line.
- `EASE-$CLOUD_<material>` / `EASE-$CLOUDTOP_<material>`: a floating ceiling or cloud. CLOUD is its underside facing the room; CLOUDTOP is its back facing the plenum. Both carry the cloud's own Revit material in the name. In EASE the user gives CLOUDTOP the material of whatever lies on the back of the cloud: the insulation blanket if there is one, otherwise the cloud's bare back (gypsum, metal pan). Do not say the material comes from Revit; only the name does.
- `EASE-$RAILING_<material>`: a railing's panels (glass guards), each a closed slab of the pane's thickness, cut where it enters a stair or wall; rails, posts and balusters are left out as detail.
- `EASE-$FRAMING_<material>`: structural framing in the room's air, each member one two-sided panel along its web, the member's depth tall, cut where it leaves the room. Untick the type in the checklist to leave it out, or tick PNG to see it in the plan image only.
- A hole in a room's footprint that nothing stands in (a stair or atrium opening the room is drawn round) is part of the room's air, closed at floor level; a hole a column or core stands in stays out.
- `EASE-$PANEL_<family>`, `EASE-$WALL_<family>` with `EASE-$PADBACK_AIRGAP`: wall pads, acoustic panels, curtains drawn flat; the rear face is the air gap behind a pad.
- `EASE-$BOUNDARY`: the edge of the ticked rooms where no surface stands (an opening into an unticked room, a room limit above which nothing was modelled). `EASE-$BOUNDARY_SEAL`: a small gap the exporter closed. `EASE-$OPENING`: an opening across a room separation line.
- A thin element written as a two-sided panel (screen, glazed panel, baffle) stops where the room's air ends; a curved one that runs out of the room is written as flat pieces along its curve, each cut at the room's edge.
- Faces under 1 sf take the layer of the larger face beside them, and a material that appears mostly as walls with a few square feet as floor or ceiling is folded into the wall layer, so the layer list stays short.

## Settings (`RoomExchangeSettings.json`, Options → Open Settings File)

Only these matter to a user; the rest are engine knobs.

- `ExportLocation`: the export folder. An installed copy keeps this file in the program folder, which a standard user cannot change, so changes are saved to a copy under the user's own folder (`%AppData%\JSBA\RoomExchange\RoomExchangeSettings.user.json`); Open Settings File opens that copy and the newer file is the one read.
- `DebugMode`: 1 = Diagnostics on (default).
- `SkipLinkTitles`: linked models, or categories within them, to leave out. `"FURN"` leaves out the whole furniture model; `"FURN: Walls"` leaves out only its walls (a furniture model that carries event-layout partitions drawn as walls). Comma-separated.
- `OperablePartitionKeywords`: words in a family or type name that mark an operable partition. Built-in: operable, hufcor, kwik-wall, modernfold, skyfold, moderco, folding partition, movable wall, movable partition. Set this when a project's partitions are named differently.
- `FoldedSheetKeywords`: words that mark a curtain, drape or pleated panel to be drawn flat as one sheet. Built-in: pleat, curtain, drape.
- `RefMarkerFamilyNameContains`: the origin marker family ("Room Ref Origin"). Room Exchange loads the JSBA Room Ref Origin family into the project the first time it runs there and tells the user once; the user places one instance per venue at the point they want as EASE's origin, green axis (+Y) upstage, red axis (+X) house right, never mirrored. Without a marker the export is in Revit's own coordinates and the result dialog says so.
- `ShortExportFileNames`: short file names (default true).

## Known limits (say these plainly)

- Open-air spaces (stadium bowls, terraces) get a synthetic lid at the room's upper limit; there is no open-room mode yet, and EASE 5 has no open-room calculation.
- Very large spaces take a while: a four-level atrium of about 10.7 million cf took about 15 minutes (about 10 reading the model in Revit, 5 building the EASE model); a ballroom a few minutes; a meeting room under a minute. Heavy detail (structural steel, escalators, detailed ceilings) is what makes the read slow and the face count high; untick what the acoustic model does not need.
- Furniture and seating are not exported.
- Trace draws straight lines only; for curved walls, edit the perimeter's Filled Region boundary in Revit (see Curved walls in a perimeter).
- A perimeter has no openings at the edges of rooms inside it; it takes in whatever the air reaches inside the outline.
- A linked room whose boundary cannot be read cleanly gets a warning; place a host room or use Custom Perimeter.
- Narrow angled ledges can produce a few stacked faces that EASE outlines; harmless.

## Sending a problem

1. Options → Zip Support Files (or the command link on the result dialog). The zip is in the `support` folder under the export folder, named `RoomExchange_support_<date>_<time>.zip`.
2. Email the zip to support@bimacoustics.net with a sentence on what looked wrong and, if possible, a screenshot of the EASE 3D view with Hole Outlines on.
3. The zip contains no model geometry beyond the rooms exported; the snapshot is what lets support re-run the export without the Revit model. It holds the remembered checklist choices of the exported model only. The model's name and the room numbers are inside, never in the zip's file name or the report form's link.
