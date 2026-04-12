# Music × Color Reaction Time

**Balanced Incomplete Block Design (BIBD) · Visual Choice Reaction Time Study**

A mobile-first web experiment for studying how music familiarity and stimulus color interact with choice reaction time.

## 📐 Design

| Factor | Level 1 | Level 2 |
|--------|---------|---------|
| **Music** | soothing | competitive |
| **Color** | Yellow | Red |

**4 Treatments:** T1=soothing·Yellow, T2=soothing·Red, T3=competatitive·Yellow, T4=competatitive·Red

### BIBD (t=4, k=2, b=6, r=3, λ=1)

| Block | Treatment A | Treatment B |
|-------|-------------|-------------|
| 1 | soothing·Yellow | soothing·Red |
| 2 | soothing·Yellow | competatitive·Yellow |
| 3 | soothing·Yellow | competatitive·Red |
| 4 | soothing·Red | competatitive·Yellow |
| 5 | soothing·Red | competatitive·Red |
| 6 | competatitive·Yellow | competatitive·Red |

Minimum **6 subjects** (one per block). Replicate for λ=2 with 12 subjects.

## 🚀 Deploy to GitHub Pages

1. Fork or upload this repo to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/repo-name`

## 📱 How to Run the Experiment

1. Open the site on a **mobile phone in landscape mode**
2. Fill in the Setup screen: subject name, BIBD block, music names, trial count
3. Subject holds phone with **both thumbs on the left and right buttons**
4. When a circle lights up on one side, press that side's button as fast as possible
5. Each treatment: 5 or 10 trials, then a 3-minute rest break
6. After both treatments, download the **Excel file** with all data

## 📊 Excel Output

Three sheets per session:

- **Raw_Trials** — every trial with RT, correctness, stimulus side, response
- **Summary** — mean RT, accuracy per treatment
- **Session_Info** — metadata (subject, block, music names, date)

## 📁 File Structure

```
index.html          # Main app
css/style.css       # Dark lab aesthetic
js/app.js           # Experiment logic + Excel export
README.md
```
