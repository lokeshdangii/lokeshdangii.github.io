// Mobile nav toggle
const navMenu = document.getElementById("nav-menu");
const navToggle = document.getElementById("nav-toggle");
const navClose = document.getElementById("nav-close");

if (navToggle) navToggle.addEventListener("click", () => navMenu.classList.add("show-menu"));
if (navClose) navClose.addEventListener("click", () => navMenu.classList.remove("show-menu"));

document.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => navMenu.classList.remove("show-menu"));
});

// Theme toggle (persisted)
const themeButton = document.getElementById("theme-button");
const root = document.documentElement;

function currentTheme() {
  if (root.classList.contains("dark-theme")) return "dark";
  if (root.classList.contains("light-theme")) return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

if (themeButton) {
  themeButton.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.classList.remove("dark-theme", "light-theme");
    root.classList.add(next + "-theme");
    localStorage.setItem("selected-theme", next);
  });
}

// Scroll-up button
const scrollUp = document.getElementById("scroll-up");
window.addEventListener("scroll", () => {
  if (scrollUp) scrollUp.classList.toggle("show-scroll", window.scrollY >= 400);
});

// Fade-in on scroll
const revealTargets = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window && revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
}

// Contact form (Formspree)
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    contactStatus.textContent = "Sending...";
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        contactStatus.textContent = "Message sent — thanks, I'll get back to you soon.";
        contactForm.reset();
      } else {
        contactStatus.textContent = "Something went wrong. Please email me directly instead.";
      }
    } catch (err) {
      contactStatus.textContent = "Something went wrong. Please email me directly instead.";
    }
  });
}
