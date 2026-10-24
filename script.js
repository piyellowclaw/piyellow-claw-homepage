"use strict";
// Both languages are full HTML documents. Storage is optional.
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
try {
  const chosen = new URLSearchParams(location.search).get("lang");
  const current = document.documentElement.lang === "en" ? "en" : "zh";
  const saved = localStorage.getItem("piyellow-language");
  if ((chosen === "en" || chosen === "zh") && chosen !== current) {
    location.replace(chosen === "en" ? "en.html?lang=en" : "index.html?lang=zh");
  } else if (!chosen && saved && saved !== current && (saved === "en" || saved === "zh")) {
    location.replace(saved === "en" ? "en.html?lang=en" : "index.html?lang=zh");
  } else {
    localStorage.setItem("piyellow-language", current);
  }
} catch (_) { /* Keep navigation usable when storage is blocked. */ }
document.querySelectorAll("[data-language]").forEach(link => {
  link.addEventListener("click", () => {
    try { localStorage.setItem("piyellow-language", link.dataset.language); } catch (_) {}
  });
});
