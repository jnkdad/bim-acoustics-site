# System Designer Engineering Model
Canonical product name: AVToolsSystemDesigner add-in for Revit (Distributed Systems).
## AVToolsSystemDesigner Add‑In for Revit (Distributed Systems)

**Document purpose**
This document defines the *engineering model, assumptions, and calculation intent* behind the **AVToolsSystemDesigner add‑in for Revit (Distributed Systems)**.
It is written for experienced AV / acoustics consultants who want to understand *what is happening under the hood* before trusting or purchasing the tool.

This is **not marketing copy** and **not source code**. It is an engineering disclosure describing the canonical models and rules the add‑in implements.

---

## 1. Design Philosophy

System Designer is built to automate *industry‑standard distributed ceiling loudspeaker design practice* inside Revit.

Core principles:

* Speed and repeatability for multi‑room projects
* Consistency across similar spaces
* Rule‑based layout derived from accepted AV design conventions
* Transparency of assumptions (not a black box)

System Designer is **not** an acoustic simulation engine. It does not attempt to predict SPL maps, STI, or frequency‑dependent behavior. Its purpose is to automate layout and first‑order system intent reliably and predictably.

---

## 2. System Scope by Version

### Current Version (v1)

The current release focuses on:

* Geometric loudspeaker layout
* Industry‑standard spacing models for distributed systems
* Consistent coverage intent
* Tap‑selection recommendations based on target SPL

### Planned Version (System Designer Pro)

The Pro version extends the same model into full electrical system design, including:

* Circuit grouping
* Amplifier loading
* Line‑loss modeling
* Electrical validation across systems

The underlying geometric and spacing model remains the same.

---

## 3. Coverage Model Assumptions

System Designer assumes a **distributed ceiling loudspeaker system** with nominal conical or hemispherical coverage characteristics.

Key assumptions:

* Loudspeakers are ceiling‑hosted
* Coverage is treated as symmetric about the loudspeaker axis
* Layout intent is **uniform perceived coverage**, not maximum output
* Conservative overlap is preferred to avoid edge dropouts

These assumptions align with long‑standing AV design practice for paging, background music, and distributed reinforcement systems.

---

## 4. Spacing Models

System Designer supports industry‑standard spacing approaches commonly used by consultants:

### Edge‑to‑Edge Coverage Model

Spacing is derived from the relationship between ceiling height and nominal loudspeaker coverage angle.

Canonical form:

```
S = 2 × H × tan(θ / 2)
```

Where:

* `S` = spacing distance
* `H` = height above listening plane
* `θ` = nominal coverage angle

This model ensures adjacent loudspeakers meet at their nominal coverage edges.

---

### Center‑to‑Center Rule‑of‑Thumb Model

In some applications, spacing is expressed as a multiplier of ceiling height:

```
S = k × H
```

Where:

* `k` is a rule‑of‑thumb constant derived from distributed‑system practice

System Designer uses these relationships as **design rules**, not acoustic predictions.

---

## 5. Overlap and Edge Coverage

System Designer intentionally biases toward:

* Consistent overlap
* Conservative edge coverage
* Predictable layouts across similar rooms

The goal is to avoid coverage gaps rather than to maximize spacing or minimize loudspeaker count.

---

## 6. Tap Selection and Target SPL

### Included in Current Version

System Designer allows the designer to:

* Enter a **target SPL** for the space
* Receive **recommended tap settings** for distributed loudspeakers

Tap selection is treated as a *design assist*, not an enforced decision. Designers retain full control and review authority.

Tap recommendations are based on:

* Target SPL
* Distributed‑system assumptions
* Nominal loudspeaker behavior

---

## 7. Power, Loading, and Line Loss

### Current Version

* Amplifier loading is **not yet automatically aggregated**
* Circuit‑level electrical validation is **not yet automated**
* Line‑loss calculations are **not currently modeled**

### Planned (System Designer Pro)

System Designer Pro extends the existing model to include:

* Circuit grouping and assignment
* Amplifier sizing and loading checks
* Line‑loss modeling across cable runs

These features build directly on the geometric and tap‑selection foundation established in v1.

---

## 8. What System Designer Does Not Do

System Designer does **not**:

* Perform acoustic simulation
* Generate SPL or STI maps
* Replace tools such as EASE or manufacturer prediction software

Its strength lies in **speed, consistency, and automation inside Revit**, not acoustic modeling.

---

## 9. Engineering Intent Summary

System Designer automates the same first‑order design logic that experienced consultants already use:

* Established spacing rules
* Conservative overlap
* Practical tap selection
* Repeatable layouts across many rooms

The tool does not replace engineering judgment — it accelerates it.

---

*This document serves as the authoritative engineering reference for Lucius and future System Designer documentation.*
