/* ── Config ────────────────────────────────── */
const API_BASE = "http://localhost:5000/api";

/* ── State ─────────────────────────────────── */
let selectedStyle = "business";
let selectedLength = "medium";
let lastRequest = null;

/* ── DOM Refs ──────────────────────────────── */
const topicInput    = document.getElementById("topic");
const notesInput    = document.getElementById("notes");
const notesCount    = document.getElementById("notes-count");
const generateBtn   = document.getElementById("generate-btn");
const emptyState    = document.getElementById("empty-state");
const loadingState  = document.getElementById("loading-state");
const loadingText   = document.getElementById("loading-text");
const errorState    = document.getElementById("error-state");
const errorMsg      = document.getElementById("error-msg");
const retryBtn      = document.getElementById("retry-btn");
const reportOutput  = document.getElementById("report-output");
const reportMeta    = document.getElementById("report-meta");
const reportTitle   = document.getElementById("report-title");
const reportBody    = document.getElementById("report-body");
const copyBtn       = document.getElementById("copy-btn");
const pdfBtn        = document.getElementById("pdf-btn");
const downloadBtn   = document.getElementById("download-btn");
const newBtn        = document.getElementById("new-btn");

/* ── Loading messages pool ──────────────────── */
const LOADING_MSGS = [
  "Drafting your report…",
  "Structuring sections…",
  "Polishing the prose…",
  "Almost ready…"
];

/* ── Style selection ────────────────────────── */
document.getElementById("style-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".style-btn");
  if (!btn) return;
  document.querySelectorAll(".style-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedStyle = btn.dataset.value;
});

/* ── Length selection ───────────────────────── */
document.getElementById("length-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".length-tab");
  if (!tab) return;
  document.querySelectorAll(".length-tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  selectedLength = tab.dataset.value;
});

/* ── Char counter ───────────────────────────── */
notesInput.addEventListener("input", () => {
  const len = notesInput.value.length;
  notesCount.textContent = `${len} / 3000`;
  notesCount.style.color = len > 2700 ? "#dc2626" : "";
});

/* ── Generate ───────────────────────────────── */
generateBtn.addEventListener("click", generate);
topicInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generate();
});

retryBtn.addEventListener("click", () => {
  if (lastRequest) generate();
});

newBtn.addEventListener("click", resetAll);

async function generate() {
  const topic = topicInput.value.trim();
  const notes = notesInput.value.trim();

  if (!topic) {
    topicInput.focus();
    topicInput.style.borderColor = "#dc2626";
    topicInput.style.boxShadow = "0 0 0 3px rgba(220,38,38,.15)";
    setTimeout(() => {
      topicInput.style.borderColor = "";
      topicInput.style.boxShadow = "";
    }, 1800);
    return;
  }

  lastRequest = { topic, notes, style: selectedStyle, length: selectedLength };

  showState("loading");
  generateBtn.disabled = true;
  generateBtn.querySelector(".btn-text").textContent = "Generating…";

  // Cycle through loading messages
  let msgIdx = 0;
  loadingText.textContent = LOADING_MSGS[0];
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
    loadingText.textContent = LOADING_MSGS[msgIdx];
  }, 1800);

  try {
    const res = await fetch(`${API_BASE}/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastRequest),
    });

    const data = await res.json();
    clearInterval(msgInterval);

    if (!res.ok || !data.success) {
      throw new Error(data.error || "An unexpected error occurred. Please try again.");
    }

    renderReport(data);
  } catch (err) {
    clearInterval(msgInterval);
    showError(err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.querySelector(".btn-text").textContent = "Generate Report";
  }
}

/* ── Render ─────────────────────────────────── */
function renderReport(data) {
  const styleLabel = capitalize(data.style);
  const lengthLabel = capitalize(data.length);

  reportMeta.textContent = `${styleLabel} Report · ${lengthLabel}`;
  reportTitle.textContent = data.topic;
  reportBody.innerHTML = markdownToHtml(data.report);

  showState("report");
}

/* ── Minimal Markdown → HTML ────────────────── */
function markdownToHtml(md) {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold (must come before italic)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^\s*[-•*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> blocks in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    // Paragraphs: plain text lines not starting with an HTML tag
    .replace(/^(?!<[a-zA-Z\/])(.+)$/gm, "<p>$1</p>")
    // Merge adjacent </ul><ul> (dedup wrapping)
    .replace(/<\/ul>\s*<ul>/g, "")
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, "")
    // Clean excessive newlines
    .replace(/\n{2,}/g, "\n");

  return html;
}

/* ── Copy ───────────────────────────────────── */
copyBtn.addEventListener("click", async () => {
  const text = `${reportTitle.textContent}\n\n${reportBody.innerText}`;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "✓ Copied";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.innerHTML = "<span>⎘</span> Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch {
    copyBtn.textContent = "Failed";
    setTimeout(() => { copyBtn.innerHTML = "<span>⎘</span> Copy"; }, 1500);
  }
});

/* ── PDF Download ────────────────────────────── */
pdfBtn.addEventListener("click", async () => {
  const title    = reportTitle.textContent || "report";
  const meta     = reportMeta.textContent   || "";
  const bodyHtml = reportBody.innerHTML;

  // Build a self-contained printable element with inline styles
  const el = document.createElement("div");
  el.style.cssText = "font-family:Georgia,serif;color:#0f0f0f;padding:0;";
  el.innerHTML = `
    <div style="margin-bottom:8px;">
      <span style="font-family:monospace;font-size:10px;text-transform:uppercase;
                   letter-spacing:.1em;color:#2c5fff;background:#dce6ff;
                   padding:3px 10px;border-radius:100px;">${meta}</span>
    </div>
    <h1 style="font-size:26px;font-weight:700;margin:12px 0 4px;line-height:1.25;">${title}</h1>
    <hr style="border:none;border-top:2px solid #2c5fff;margin:16px 0 24px;" />
    <div style="font-size:13px;line-height:1.9;color:#222;">${bodyHtml}</div>
    <div style="margin-top:40px;padding-top:12px;border-top:1px solid #e2e2e2;
                font-family:monospace;font-size:10px;color:#888;text-align:right;">
      Generated by ReportAI &nbsp;·&nbsp; Powered by Gemini
    </div>
  `;

  // Apply inline styles to child elements so html2canvas renders them correctly
  el.querySelectorAll("h2").forEach(h => {
    h.style.cssText = "font-size:18px;font-weight:700;margin:22px 0 6px;padding-bottom:5px;border-bottom:2px solid #dce6ff;";
  });
  el.querySelectorAll("h3").forEach(h => {
    h.style.cssText = "font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4a4a4a;margin:16px 0 5px;";
  });
  el.querySelectorAll("p").forEach(p  => { p.style.marginBottom = "10px"; });
  el.querySelectorAll("ul,ol").forEach(l  => { l.style.cssText = "margin:6px 0 12px 20px;"; });
  el.querySelectorAll("li").forEach(li => { li.style.marginBottom = "4px"; });
  el.querySelectorAll("strong").forEach(s  => { s.style.fontWeight = "700"; });
  el.querySelectorAll("blockquote").forEach(bq => {
    bq.style.cssText = "border-left:3px solid #2c5fff;padding:8px 14px;margin:12px 0;background:#dce6ff;border-radius:0 6px 6px 0;font-style:italic;";
  });

  const filename = slugify(title) || "report";

  // Show spinner while generating
  const originalHtml = pdfBtn.innerHTML;
  pdfBtn.disabled = true;
  pdfBtn.textContent = "⏳ Exporting…";

  const opt = {
    margin:      [14, 14, 14, 14],
    filename:    `${filename}.pdf`,
    image:       { type: "jpeg", quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak:   { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(opt).from(el).save();
  } finally {
    pdfBtn.disabled = false;
    pdfBtn.innerHTML = originalHtml;
  }
});

/* ── Download (.txt) ─────────────────────────── */
downloadBtn.addEventListener("click", () => {
  const title = reportTitle.textContent || "report";
  const rawText = lastRequest
    ? `Topic: ${lastRequest.topic}\nStyle: ${lastRequest.style}\nLength: ${lastRequest.length}\n\n${reportBody.innerText}`
    : reportBody.innerText;

  const blob = new Blob([rawText], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${slugify(title)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ── Helpers ────────────────────────────────── */
function showState(state) {
  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  reportOutput.classList.add("hidden");

  if (state === "loading")  loadingState.classList.remove("hidden");
  else if (state === "error") errorState.classList.remove("hidden");
  else if (state === "report") reportOutput.classList.remove("hidden");
  else emptyState.classList.remove("hidden");
}

function showError(msg) {
  errorMsg.textContent = msg;
  showState("error");
}

function resetAll() {
  showState("empty");
  topicInput.value = "";
  notesInput.value = "";
  notesCount.textContent = "0 / 3000";
  lastRequest = null;
  topicInput.focus();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
