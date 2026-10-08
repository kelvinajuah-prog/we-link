(function () {
  var KEY = "welink-theme";
  var pref = "system";
  try {
    pref = localStorage.getItem(KEY) || "system";
  } catch (e) {
    pref = "system";
  }
  if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "system";
  var dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  var theme = pref === "light" ? "light" : dark || pref === "dark" ? "dark" : "light";
  if (pref === "system") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  var root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-pref", pref);
  root.style.colorScheme = theme;
})();
