(async function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const list = byId("course-list");
  const filterPanel = byId("faculty-filters");
  const entry = byId("learner-answer");
  const reflection = byId("reflection");
  const status = byId("word-count");
  const hintBody = byId("hint-body");
  const hintButton = byId("hint-btn");
  const draftById = new Map(); // Deliberately memory-only. No browser storage or network writes.
  let selected = null;
  let lessons = [];
  let activeFaculty = "All";

  const faculties = [
    ["All", "All paths"],
    ["Human intelligence", "Observation"],
    ["Financial intelligence", "Finance"],
    ["Design and systems intelligence", "Design"]
  ];

  function updateDraftStatus() {
    const length = entry.value.length;
    status.textContent = length
      ? length + " / 2000 characters · no grade, no deadline"
      : "Nothing written yet. That's okay.";
  }

  function select(lesson, shouldScroll = true) {
    if (selected) draftById.set(selected.id, entry.value);
    selected = lesson;
    byId("scenario-faculty").textContent = lesson.faculty;
    byId("scenario-title").textContent = lesson.title;
    byId("scenario-setup").textContent = lesson.setup;
    byId("scenario-prompt").textContent = lesson.prompt;
    entry.value = draftById.get(lesson.id) ?? "";
    hintBody.textContent = lesson.hint ?? "What is known, what is assumed, and what would you check next?";
    hintBody.hidden = true;
    hintButton.setAttribute("aria-expanded", "false");
    reflection.hidden = true;
    updateDraftStatus();
    for (const button of list.querySelectorAll("[data-lesson-id]")) {
      button.setAttribute("aria-current", button.dataset.lessonId === lesson.id ? "true" : "false");
    }
    if (shouldScroll) byId("lab").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyFilter() {
    const cards = Array.from(list.querySelectorAll("[data-faculty]"));
    for (const card of cards) {
      card.hidden = activeFaculty !== "All" && card.dataset.faculty !== activeFaculty;
    }
    for (const button of filterPanel.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.faculty === activeFaculty));
    }
  }

  function renderFilters() {
    filterPanel.replaceChildren();
    for (const [value, title] of faculties) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.faculty = value;
      button.textContent = title;
      button.setAttribute("aria-pressed", String(activeFaculty === value));
      button.addEventListener("click", () => {
        activeFaculty = value;
        applyFilter();
      });
      filterPanel.append(button);
    }
  }

  function renderCourses() {
    list.replaceChildren();
    for (const lesson of lessons) {
      const article = document.createElement("article");
      article.className = "course";
      article.dataset.faculty = lesson.faculty;
      const symbol = document.createElement("span");
      symbol.className = "course-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = lesson.emoji;
      const subject = document.createElement("small");
      subject.textContent = lesson.faculty.toUpperCase();
      const title = document.createElement("h3");
      title.textContent = lesson.title;
      const summary = document.createElement("p");
      summary.textContent = lesson.subtitle;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.lessonId = lesson.id;
      button.textContent = "Practice this challenge ↗";
      button.setAttribute("aria-label", "Practice: " + lesson.title);
      button.addEventListener("click", () => select(lesson));
      article.append(symbol, subject, title, summary, button);
      list.append(article);
    }
    applyFilter();
  }

  function showReflection() {
    if (!selected) return;
    if (entry.value.trim().length < 10) {
      status.textContent = "Write at least one sentence so you can compare your thinking.";
      entry.focus();
      return;
    }
    draftById.set(selected.id, entry.value);
    byId("reflection-body").textContent = selected.reflection;
    byId("reflection-next").textContent = selected.nextStep;
    reflection.hidden = false;
    reflection.focus();
  }

  function nextChallenge() {
    if (!selected || lessons.length === 0) return;
    const current = lessons.findIndex((lesson) => lesson.id === selected.id);
    const next = lessons[(current + 1) % lessons.length];
    if (activeFaculty !== "All" && next.faculty !== activeFaculty) {
      activeFaculty = "All";
      applyFilter();
    }
    select(next);
    entry.focus({ preventScroll: true });
  }

  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error("Catalog unavailable");
    const catalog = await res.json();
    if (!Array.isArray(catalog.scenarios) || !catalog.scenarios.length) {
      throw new Error("Catalog empty");
    }
    lessons = catalog.scenarios.filter((lesson) =>
      lesson && typeof lesson.id === "string" && typeof lesson.title === "string" &&
      typeof lesson.prompt === "string" && typeof lesson.reflection === "string"
    );
    if (!lessons.length) throw new Error("Catalog invalid");
    renderFilters();
    renderCourses();
    select(lessons[0], false);
  } catch {
    list.textContent = "The learning catalog is temporarily unavailable. Please try again later.";
    filterPanel.hidden = true;
    byId("scenario-setup").textContent = "The sample exercise could not be loaded.";
    byId("scenario-prompt").textContent = "Please return when the catalog is available.";
    entry.disabled = true;
    byId("reflect-btn").disabled = true;
    hintButton.disabled = true;
  }

  entry.addEventListener("input", () => {
    if (selected) draftById.set(selected.id, entry.value);
    updateDraftStatus();
    reflection.hidden = true;
  });
  hintButton.addEventListener("click", () => {
    const expanded = hintButton.getAttribute("aria-expanded") === "true";
    hintButton.setAttribute("aria-expanded", String(!expanded));
    hintBody.hidden = expanded;
  });
  byId("reflect-btn").addEventListener("click", showReflection);
  byId("retry-btn").addEventListener("click", () => {
    reflection.hidden = true;
    entry.focus();
  });
  byId("next-btn").addEventListener("click", nextChallenge);
})();
