library(readxl)

# Load and Factorize
df <- read_excel('C:/Users/chakr/Desktop/Academics/_assignments_and_programs/Python/DOE/data.xlsx')
df[c("Subject", "Music", "Color")] <- lapply(df[c("Subject", "Music", "Color")], as.factor)

# Combined layout: 2x2 grid
par(mfrow = c(2, 2), mar = c(4, 4, 3, 1))

# Plot 1: RT by Music
boxplot(RT ~ Music, data = df,
        main = "RT by Music",
        col = "lightblue",
        xlab = "Music", ylab = "RT")

# Plot 2: RT by Color
boxplot(RT ~ Color, data = df,
        main = "RT by Color",
        col = "lightgreen",
        xlab = "Color", ylab = "RT")

interaction.plot(df$Music, df$Color, df$RT, col = c("red", "yellow3"), lwd = 3, lty = 1, xlab = "Music", ylab = "Mean RT", trace.label = "Color", main = "Interaction: Music × Color")

# Plot 4: Two-level boxplot (Music × Color combined)
boxplot(RT ~ Music * Color, data = df,
        col = c("red", "red", "yellow3", "yellow3"),
        main = "RT by Music × Color",
        xlab = "Music × Color",names = c("Metal\nRed", "Soothing\nRed", "Metal\nYellow", "Soothing\nYellow"),
        ylab = "RT",las = 1)

# Reset
par(mfrow = c(1, 1))

# Model -------
fit_homo <- aov(RT ~ Subject + Music * Color, data = df)

# ANOVA & Summary
library(car)
Anova(fit_homo, type = "III")
par(mfrow = c(2, 2), mar = c(4, 4, 3, 1))
plot(fit_homo)

# Means (mu + effects) and Effects (alphas/betas)
model.tables(fit_homo, type = "means")
model.tables(fit_homo, type = "effects")

bartlett.test(RT ~ interaction(Music, Color), data = df)
r_stud<-rstudent(fit_homo)
ks.test(r_stud, "pnorm")
d <- density(r_stud)

# Plot KDE
plot(d, main = "KDE + Normal Fit", lwd = 2)

# Add normal fit
x <- seq(min(r_stud), max(r_stud), length = 100)
lines(x, dnorm(x, mean = mean(r_stud), sd = sd(r_stud)),
      col = "red", lwd = 2)

legend("topright", legend = c("KDE", "Normal"),
       col = c("black", "red"), lwd = 2)
