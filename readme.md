# Reaction Time Experiment using BIBD

This project studies the effect of **music genre** and **visual stimulus** on human reaction time using a **Balanced Incomplete Block Design (BIBD)**.

The experiment considers two factors:

* **Music Genre**

  * Soothing
  * Metallic

* **Visual Stimulus**

  * Red Light
  * Yellow Light

This gives four treatment combinations in total.
To account for variability between participants, a BIBD with parameters

[
(v = 4,; b = 18,; k = 2,; r = 9,; \lambda = 3)
]

was used, where each participant was assigned only 2 treatment combinations.

Each participant performed 5 reaction-time trials under their assigned conditions.

The repository contains:

* Experimental frontend interface
* Audio stimuli files
* Collected dataset
* R-based statistical analysis and diagnostic plots

---

## Directory Structure

```text
├── R codes/
│   ├── code.R
│   └── data.xlsx
│
├── static/
|   ├── app.js
|   ├── metal.mp3
|   ├── soothing.mp3
│   └── style.css
│
├── index.html
└── readme.md
```

---
