(async function () {
  const byId = (id) => document.getElementById(id);
  const list = byId("course-list");
  const entry = byId("learner-answer");
  const reflection = byId("reflection");
  const count = byId("word-count");
  let selected = null;
  let lessons = [];
  function select(lesson) {
    selected = lesson;
    byId("scenario-faculty").textContent = lesson.faculty;
    byId("scenario-title").textContent = lesson.title;
    byId("scenario-setup").textContent = lesson.setup;
    byId("scenario-prompt").textContent = lesson.prompt;
    entry.value = "";
    count.textContent = "Nothing written yet. That's okay.";
    reflection.hidden = true;
    byId("lab").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function showReflection() {
    if (!selected) return;
    if (entry.value.trim().length < 10) {
      count.textContent = "Try explaining your reasoning in a sentence first.";
      entry.focus();
      return;
    }
    byId("reflection-body").textContent = selected.reflection;
    byId("reflection-next").textContent = selected.nextStep;
    reflection.hidden = false;
    reflection.focus();
  }
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error("Catalog unavailable");
    const catalog = await res.json();
    lessons = Array.isArray(catalog.scenarios) ? catalog.scenarios : [];
    list.replaceChildren();
    for (const lesson of lessons) {
      const article = document.createElement("article");
      article.className = "course";
      const symbol = document.createElement("span");
      symbol.className = "course-symbol";
      symbol.textContent = lesson.emoji;
      const subject = document.createElement("small");
      subject.textContent = lesson.faculty.toUpperCase();
      const title = document.createElement("h3");
      title.textContent = lesson.title;
      const summary = document.createElement("p");
      summary.textContent = lesson.subtitle;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Explore sample lesson ↗";
      button.addEventListener("click", () => select(lesson));
      article.append(symbol, subject, title, summary, button);
      list.append(article);
    }
    if (lessons[0]) {
      selected = lessons[0];
      byId("scenario-faculty").textContent = selected.faculty;
      byId("scenario-title").textContent = selected.title;
      byId("scenario-setup").textContent = selected.setup;
      byId("scenario-prompt").textContent = selected.prompt;
    }
  } catch {
    list.textContent = "The learning catalog is temporarily unavailable. Please try again later.";
    byId("scenario-setup").textContent = "A customer repeatedly checks his phone, watches the entrance, then leaves.";
    byId("scenario-prompt").textContent = "What can you observe, and what remains an assumption?";
  }
  entry.addEventListener("input", () => {
    count.textContent = entry.value.length ? entry.value.length + " characters · no grade, no deadline" : "Nothing written yet. That's okay.";
    reflection.hidden = true;
  });
  byId("reflect-btn").addEventListener("click", showReflection);
  byId("retry-btn").addEventListener("click", () => { reflection.hidden = true; entry.focus(); });
})();
