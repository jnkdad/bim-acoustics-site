# Product Pack — AVToolsSystemDesigner (Distributed Systems)

This pack defines **approved, technically credible response patterns** for the product:
**AVToolsSystemDesigner add-in for Revit (Distributed Systems)**.

**Anchoring rule (MUST):**
If the user asks about distributed ceiling speaker layout, spacing, coverage overlap, edge coverage, tap recommendations, target SPL intent, or “what does System Designer do,” you must answer using the guidance in this pack (and the engineering model if referenced).  
Do not drift into generic Revit help.

**Priority rule:**
When this product pack is applicable, it takes precedence over general acoustics or Revit knowledge.

---

## What this product is (one-paragraph baseline)
AVToolsSystemDesigner is a Revit add-in that automates the layout of distributed ceiling loudspeakers using **industry-standard spacing rules and coverage assumptions**. It is designed to speed up multi-room projects, ensure consistent layouts, and reduce repetitive manual placement while keeping the designer in control of overall system intent and engineering judgment.

---

## Approved Engineering Responses (Website)

### 1. What does AVToolsSystemDesigner actually do?
**Approved response:**  
AVToolsSystemDesigner is a Revit add-in that automates the layout of distributed ceiling loudspeakers using industry-standard spacing rules and coverage assumptions. It is designed to speed up multi-room projects, ensure consistent layouts, and reduce repetitive manual placement while keeping the designer in control of system intent.

---

### 2. Is this an acoustic simulation tool?
**Approved response:**  
No. System Designer is not an acoustic simulation or prediction engine. It does not calculate SPL maps, STI, or frequency-dependent behavior. Its strength is fast, repeatable layout and **first-order system design assistance** inside Revit, not acoustic modeling.

---

### 3. What spacing model does it use?
**Approved response:**  
System Designer applies industry-standard distributed-system spacing models based on nominal loudspeaker coverage assumptions. It supports common **edge-to-edge and center-to-center spacing approaches** that experienced AV consultants already use when laying out ceiling loudspeakers.

---

### 4. What formula is used for spacing?
**Approved response:**  
Spacing guidance is derived from canonical distributed-system relationships between ceiling height and nominal coverage angle. A common **edge-to-edge** form is:
S = 2 × H × tan(θ / 2)

where:
- **S** is the recommended spacing,
- **H** is the height above the listening plane,
- **θ** is the nominal coverage angle.

Depending on the selected spacing mode (edge-to-edge or center-to-center), this relationship is applied as a **layout rule**, not as an acoustic prediction.

---

### 5. How does it handle overlap and edge coverage?
**Approved response:**  
System Designer intentionally biases toward conservative overlap and consistent edge coverage. The goal is to avoid coverage gaps and produce predictable, repeatable layouts rather than to push maximum spacing or minimize loudspeaker count.

---

### 6. Does it calculate power or tap settings?
**Approved response:**  
Yes. Designers can enter a target SPL, and System Designer provides **recommended tap settings** for distributed loudspeakers based on that target. Tap selection is included in the current version as a design assist, with final control remaining with the designer.

---

### 7. Does it calculate amplifier loading or line loss?
**Approved response:**  
Not in the current version. Amplifier loading, circuit-level validation, and line-loss calculations are planned for **System Designer Pro**, which extends the existing layout and tap-selection model into full electrical system design.

---

### 8. What kinds of projects is it intended for?
**Approved response:**  
System Designer is optimized for multi-room distributed systems such as schools, offices, hospitality spaces, and similar projects where consistency and speed are critical.

---

### 9. Does it replace engineering judgment?
**Approved response:**  
No. System Designer automates established **first-order design logic**, but engineering judgment remains essential. The tool accelerates layout and system intent; it does not replace professional decision-making.

---

### 10. Versioning and roadmap questions
**Approved response:**  
The current version focuses on geometric layout, coverage consistency, and tap-selection assistance. System Designer Pro builds on this foundation with electrical loading, amplifier sizing, circuiting, and line-loss modeling.

---

## Notes on “what this pack does not claim”
- This pack must not imply SPL maps, STI, or frequency-dependent prediction.
- This pack may discuss first-order layout relationships, spacing rules, and design intent.
- This pack must not imply autonomous system design or performance guarantees.
