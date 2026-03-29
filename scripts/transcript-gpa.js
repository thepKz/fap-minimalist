/**
 * StudentTranscript.aspx — GPA tích lũy (có trọng số TC) và máy tính / dự báo.
 * Không đưa vào bảng / không cộng GPA: (*) trên dòng transcript hoặc tên môn kết thúc bằng *; TC=0 (trừ planning); mã OJT (thực tập).
 */
(function transcriptGpaIife() {
  const PANEL_ID = "fap-transcript-gpa-panel";
  const BAR_ID = "fap-transcript-gpa-bar";

  /** Tên môn (cột Subject Name) kết thúc bằng dấu * → không tính. */
  function subjectNameEndsWithStar(name) {
    return /\*\s*$/.test(String(name || "").trim());
  }

  /** Thực tập OJT: mã môn bắt đầu bằng OJT — không tính GPA (kể cả dòng nhập tay trong máy tính). */
  function isOjtExcludedFromGpa(code) {
    return /^OJT/i.test(String(code || "").trim());
  }

  /**
   * Dòng môn ĐK tốt nghiệp (*): có ký tự * ở bất kỳ ô nào; cột cuối có span đỏ (FAP) như cũ.
   * Không quét span đỏ ở mọi ô — tránh nhầm trạng thái khác.
   */
  function transcriptRowHasGradAsterisk(tr) {
    if (!tr) {
      return false;
    }
    const tds = tr.querySelectorAll("td");
    for (const td of tds) {
      if ((td.textContent || "").includes("*")) {
        return true;
      }
    }
    const last = tds[tds.length - 1];
    if (last?.querySelector("span[style*=\"color:red\"], span[style*=\"color: red\"]")) {
      return true;
    }
    return false;
  }

  function parseGradeFromTd(td) {
    if (!td) {
      return null;
    }
    const raw = (td.textContent || "").replace(/\s/g, "").replace(",", ".");
    if (!raw) {
      return null;
    }
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }

  function parseTranscriptGradeTable() {
    const table = document.querySelector("#ctl00_mainContent_divGrade table.table");
    if (!table) {
      return [];
    }
    const out = [];
    for (const tr of table.querySelectorAll("tbody tr")) {
      const tds = tr.querySelectorAll("td");
      if (tds.length !== 11 && tds.length !== 10) {
        continue;
      }
      const code = (tds[3]?.textContent || "").trim();
      const name = (tds[6]?.textContent || "").trim();
      const statusText = (tds[9]?.textContent || "").trim();
      /** FAP: dòng Not started / Studying thường chỉ có 10 cột (không có ô * cuối). */
      const isPlanning =
        /not\s*started|studying|chưa\s*bắt\s*đầu|đang\s*học/i.test(statusText);
      const creditRaw = (tds[7]?.textContent || "").replace(/\s/g, "").replace(",", ".");
      const creditParsed = Number.parseFloat(creditRaw);
      let creditNum = Number.isFinite(creditParsed) && creditParsed > 0 ? creditParsed : 0;
      let grade = parseGradeFromTd(tds[8]);
      if (isPlanning) {
        creditNum = 0;
        grade = null;
      }
      const hasStar = transcriptRowHasGradAsterisk(tr);
      const nameEndStar = subjectNameEndsWithStar(name);
      const semester = (tds[2]?.textContent || "").trim();
      const creditZeroSkip = !isPlanning && creditNum <= 0;
      const ojtExcluded = isOjtExcludedFromGpa(code);
      const excludedRule = hasStar || nameEndStar || creditZeroSkip || ojtExcluded;
      out.push({
        code,
        name,
        credit: creditNum,
        grade,
        planning: isPlanning,
        hasGradAsterisk: hasStar,
        nameEndsWithStar: nameEndStar,
        semester,
        excluded: excludedRule,
      });
    }
    return out;
  }

  /**
   * Bước 2: sau khi syncSimulatorFromInputs(), quét state — chỉ dòng có TC>0 và điểm hợp lệ.
   * (Môn loại trừ đã không có trong state; dòng thiếu TC/điểm bỏ qua.)
   */
  function computeGpa(rows) {
    let sumGn = 0;
    let sumN = 0;
    for (const r of rows) {
      if (isOjtExcludedFromGpa(r.code)) {
        continue;
      }
      const cr = Number(r.credit);
      const cred = Number.isFinite(cr) && cr > 0 ? cr : 0;
      if (cred <= 0 || r.grade == null || !Number.isFinite(r.grade)) {
        continue;
      }
      sumGn += r.grade * cred;
      sumN += cred;
    }
    if (sumN <= 0) {
      return null;
    }
    return Math.round((sumGn / sumN) * 1000) / 1000;
  }

  function formatGpa(g) {
    return g != null ? g.toFixed(3) : "—";
  }

  /** Đủ TC và điểm để tính vào GPA (khớp computeGpa). */
  function rowCountsTowardGpa(r) {
    if (isOjtExcludedFromGpa(r.code)) {
      return false;
    }
    const cr = Number(r.credit);
    const cred = Number.isFinite(cr) && cr > 0 ? cr : 0;
    return cred > 0 && r.grade != null && Number.isFinite(r.grade);
  }

  /** Môn chưa đủ TC hoặc điểm → đưa lên trên; giữ thứ tự ổn định trong nhóm. */
  function sortRowsIncompleteFirst(rows) {
    const indexed = rows.map((r, i) => ({ r, i }));
    indexed.sort((a, b) => {
      const aInc = !rowCountsTowardGpa(a.r);
      const bInc = !rowCountsTowardGpa(b.r);
      if (aInc !== bInc) {
        return aInc ? -1 : 1;
      }
      return a.i - b.i;
    });
    return indexed.map((x) => x.r);
  }

  function sortSimulatorStateIncompleteFirst() {
    simulatorState = sortRowsIncompleteFirst(simulatorState);
  }

  function buildInitialSimulatorRows(parsed) {
    const list = [];
    let id = 0;
    for (const p of parsed) {
      if (p.excluded) {
        continue;
      }
      id += 1;
      list.push({
        id: `t-${id}`,
        code: p.code,
        subjectName: p.name || "",
        credit: p.credit,
        grade: p.grade,
        planning: Boolean(p.planning),
        source: "transcript",
      });
    }
    return sortRowsIncompleteFirst(list);
  }

  let simulatorState = [];
  let panelEl = null;
  let nextManualId = 0;
  /** Các dòng trên bảng điểm FAP bị loại (không đưa vào bảng tính); dùng hiển thị trong panel. */
  let lastExcludedFromTranscript = [];

  /** Luôn lấy node panel đang nằm trong document (tránh closure panelEl lệch sau khi DOM đổi). */
  function getGpaPanelRoot() {
    return document.getElementById(PANEL_ID) || panelEl;
  }

  function getGpaPanelTbody() {
    return getGpaPanelRoot()?.querySelector("[data-fap-gpa-tbody]") ?? null;
  }

  function paintGpaTableBody(tbody) {
    tbody.innerHTML = "";
    for (const r of simulatorState) {
      const tr = document.createElement("tr");
      /** Không dùng data-id / dataset.id (dễ lệch trình duyệt); id dùng để sync ô nhập → state. */
      tr.setAttribute("data-fap-gpa-rid", r.id);
      tr.dataset.source = r.source || "transcript";
      const codeCell =
        r.source === "manual"
          ? `<td class="fap-transcript-gpa-code-td-manual"><input type="text" class="fap-transcript-gpa-in-code" value="${escapeAttr(r.code)}" placeholder="VD: SEP490" autocomplete="off" aria-label="Mã môn" /></td>`
          : `<td class="fap-transcript-gpa-code-td">${escapeHtml(r.code)}</td>`;
      const cv = r.credit > 0 ? r.credit : "";
      const gv = r.grade != null ? r.grade : "";
      const cAttr = cv === "" ? "" : escapeAttr(String(cv));
      const gAttr = gv === "" ? "" : escapeAttr(String(gv));
      tr.innerHTML = `
        ${codeCell}
        <td><input type="text" inputmode="decimal" autocomplete="off" class="fap-transcript-gpa-in-c" data-k="credit" value="${cAttr}" aria-label="Tín chỉ" /></td>
        <td><input type="text" inputmode="decimal" autocomplete="off" class="fap-transcript-gpa-in-g" data-k="grade" value="${gAttr}" placeholder="—" aria-label="Điểm" /></td>
        <td><button type="button" class="fap-transcript-gpa-btn-del" data-id="${escapeAttr(r.id)}">Xóa</button></td>
      `;
      tbody.appendChild(tr);
    }
    wireDirectGpaInputs(tbody);
  }

  /**
   * Gắn listener trực tiếp từng ô TC/điểm (text + inputmode decimal); capture để chạy trước script trang nếu có.
   */
  function wireDirectGpaInputs(tbody) {
    if (!tbody) {
      return;
    }
    const cap = { capture: true };
    tbody.querySelectorAll("input.fap-transcript-gpa-in-c, input.fap-transcript-gpa-in-g, input.fap-transcript-gpa-in-code").forEach((inp) => {
      inp.addEventListener("input", onInputChange, { passive: true, capture: true });
      inp.addEventListener("keyup", onInputChange, { passive: true, capture: true });
      inp.addEventListener(
        "paste",
        () => {
          requestAnimationFrame(onInputChange);
        },
        { passive: true, capture: true },
      );
      inp.addEventListener("change", onDirectInputChange, cap);
      inp.addEventListener("blur", onBlurSyncGpa, cap);
    });
  }

  /** Dự phòng: một số trình duyệt/kịch bản number input ít bắn input đủ — blur vẫn sync GPA. */
  function onBlurSyncGpa(e) {
    const t = e.target;
    if (!t?.classList) {
      return;
    }
    if (
      t.classList.contains("fap-transcript-gpa-in-c") ||
      t.classList.contains("fap-transcript-gpa-in-g") ||
      t.classList.contains("fap-transcript-gpa-in-code")
    ) {
      updatePanelGpaDisplay();
    }
  }

  function onDirectInputChange(e) {
    const t = e.target;
    if (!t?.classList) {
      return;
    }
    if (t.classList.contains("fap-transcript-gpa-in-c") || t.classList.contains("fap-transcript-gpa-in-g")) {
      onCreditOrGradeChangeForReorder();
    } else if (t.classList.contains("fap-transcript-gpa-in-code")) {
      onInputChange();
    }
  }

  function refreshExcludedTranscriptListEl() {
    const host = getGpaPanelRoot()?.querySelector("[data-fap-gpa-excluded-list]");
    if (!host) {
      return;
    }
    if (lastExcludedFromTranscript.length === 0) {
      host.innerHTML =
        '<p class="fap-transcript-gpa-excluded-empty">Không có dòng nào trên bảng điểm bị loại theo quy tắc (hoặc chưa có dữ liệu).</p>';
      return;
    }
    const items = lastExcludedFromTranscript
      .map((p) => {
        const c = escapeHtml(p.code || "");
        const n = escapeHtml(p.name || "");
        return `<li><strong>${c}</strong>${n ? ` — ${n}` : ""}</li>`;
      })
      .join("");
    host.innerHTML = `<ul class="fap-transcript-gpa-excluded-ul">${items}</ul>`;
  }

  /** Bước 1 (bổ sung): bắt nút Xóa — ủy quyền trên panel (tbody thay liên tục). */
  function attachGpaPanelClickDelegationOnce() {
    if (!panelEl || panelEl.dataset.fapGpaClickDel === "1") {
      return;
    }
    panelEl.dataset.fapGpaClickDel = "1";
    panelEl.addEventListener("click", onGpaPanelClickBubble);
  }

  function onGpaPanelClickBubble(e) {
    const btn = e.target.closest?.(".fap-transcript-gpa-btn-del");
    if (!btn || !getGpaPanelRoot()?.contains(btn)) {
      return;
    }
    const id = btn.getAttribute("data-id");
    if (!id) {
      return;
    }
    simulatorState = simulatorState.filter((x) => x.id !== id);
    renderPanelTable();
    updatePanelGpaDisplay();
  }

  /** Sau khi sửa TC/điểm: sắp lại; chỉ vẽ lại bảng nếu thứ tự dòng đổi (tránh mất focus khi Tab giữa 2 ô). */
  function onCreditOrGradeChangeForReorder() {
    onInputChange();
    const orderBefore = simulatorState.map((r) => r.id).join("|");
    sortSimulatorStateIncompleteFirst();
    const orderAfter = simulatorState.map((r) => r.id).join("|");
    if (orderBefore === orderAfter) {
      return;
    }
    const tbody = getGpaPanelTbody();
    if (!tbody) {
      return;
    }
    paintGpaTableBody(tbody);
    updatePanelGpaDisplay();
  }

  function renderPanelTable() {
    const tbody = getGpaPanelTbody();
    if (!tbody) {
      return;
    }
    syncSimulatorFromInputs();
    sortSimulatorStateIncompleteFirst();
    paintGpaTableBody(tbody);
    updatePanelGpaDisplay();
  }

  function syncSimulatorFromInputs() {
    const tbody = getGpaPanelTbody();
    if (!tbody) {
      return;
    }
    for (const tr of tbody.querySelectorAll("tr")) {
      const id = tr.getAttribute("data-fap-gpa-rid");
      if (!id) {
        continue;
      }
      const row = simulatorState.find((x) => x.id === id);
      if (!row) {
        continue;
      }
      const codeIn = tr.querySelector(".fap-transcript-gpa-in-code");
      if (codeIn && row.source === "manual") {
        row.code = (codeIn.value || "").trim();
      }
      const cIn = tr.querySelector(".fap-transcript-gpa-in-c");
      const gIn = tr.querySelector(".fap-transcript-gpa-in-g");
      const rawC = cIn ? String(cIn.value ?? "").trim().replace(",", ".") : "";
      const cv = rawC === "" ? Number.NaN : Number.parseFloat(rawC);
      row.credit = Number.isFinite(cv) && cv > 0 ? cv : 0;
      const gv = gIn ? String(gIn.value ?? "").trim().replace(",", ".") : "";
      if (gv === "") {
        row.grade = null;
      } else {
        const g = Number.parseFloat(gv);
        row.grade = Number.isFinite(g) ? g : null;
      }
    }
  }

  function onInputChange() {
    updatePanelGpaDisplay();
  }

  function csvEscapeCell(val) {
    const s = val == null ? "" : String(val);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function exportGpaToExcelCsv() {
    syncSimulatorFromInputs();
    sortSimulatorStateIncompleteFirst();
    const tbody = getGpaPanelTbody();
    if (tbody) {
      paintGpaTableBody(tbody);
    }
    updatePanelGpaDisplay();
    const g = computeGpa(simulatorState);
    const lines = [];
    lines.push(["Mã môn", "TC", "Điểm", "Tính vào GPA", "Nguồn"].map(csvEscapeCell).join(","));
    for (const r of simulatorState) {
      const tc = r.credit > 0 ? String(r.credit) : "";
      const gr = r.grade != null && Number.isFinite(r.grade) ? String(r.grade) : "";
      lines.push(
        [
          r.code || "",
          tc,
          gr,
          rowCountsTowardGpa(r) ? "Có" : "Không",
          r.source === "manual" ? "Thêm tay" : "Bảng điểm",
        ]
          .map(csvEscapeCell)
          .join(","),
      );
    }
    lines.push("");
    lines.push(["GPA (ước tính)", "", "", g != null ? g.toFixed(3) : "—", ""].map(csvEscapeCell).join(","));
    const csv = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fname = `fap-gpa-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
    a.href = url;
    a.download = fname;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** Bước 2–3: đọc ô nhập → state → computeGpa → ghi vào panel + thanh. */
  function updatePanelGpaDisplay() {
    syncSimulatorFromInputs();
    const g = computeGpa(simulatorState);
    const text = formatGpa(g);
    const root = getGpaPanelRoot();
    let el = root?.querySelector("[data-fap-gpa-panel-result]");
    if (!el) {
      el = root?.querySelector(".fap-transcript-gpa-panel-gpa-big");
    }
    if (el) {
      el.textContent = text;
    }
    const bar = document.getElementById(BAR_ID);
    const strong = bar?.querySelector("[data-fap-gpa-current]");
    if (strong) {
      strong.textContent = text;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function openPanel() {
    const root = getGpaPanelRoot();
    if (!root) {
      return;
    }
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    updatePanelGpaDisplay();
  }

  function closePanel() {
    const root = getGpaPanelRoot();
    if (!root) {
      return;
    }
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function resetSimulatorFromTranscript() {
    const parsed = parseTranscriptGradeTable();
    lastExcludedFromTranscript = parsed.filter((p) => p.excluded);
    simulatorState = buildInitialSimulatorRows(parsed);
    renderPanelTable();
    refreshExcludedTranscriptListEl();
  }

  function enhanceTranscriptGpa() {
    if (!/StudentTranscript\.aspx/i.test(location.pathname || "")) {
      return;
    }
    if (document.getElementById(BAR_ID)) {
      return;
    }
    const divGrade = document.getElementById("ctl00_mainContent_divGrade");
    if (!divGrade) {
      return;
    }

    const parsed = parseTranscriptGradeTable();
    lastExcludedFromTranscript = parsed.filter((p) => p.excluded);
    simulatorState = buildInitialSimulatorRows(parsed);
    const gpaNow = computeGpa(simulatorState);

    const bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.className = "fap-transcript-gpa-bar";
    bar.innerHTML = `
      <div class="fap-transcript-gpa-bar-inner">
        <span class="fap-transcript-gpa-label">GPA ước tính (cập nhật khi sửa bảng dưới; khác số GPA trên FAP):</span>
        <span class="fap-transcript-gpa-num-wrap"><strong class="fap-transcript-gpa-num" data-fap-gpa-current">${formatGpa(gpaNow)}</strong></span>
        <button type="button" class="fap-transcript-gpa-btn-open" id="fap-transcript-gpa-open-btn">Máy tính GPA &amp; dự báo</button>
      </div>
    `;
    divGrade.parentNode?.insertBefore(bar, divGrade);

    panelEl = document.createElement("div");
    panelEl.id = PANEL_ID;
    panelEl.className = "fap-transcript-gpa-panel";
    panelEl.hidden = true;
    panelEl.setAttribute("aria-hidden", "true");
    panelEl.setAttribute("role", "dialog");
    panelEl.setAttribute("aria-modal", "true");
    panelEl.setAttribute("aria-label", "Máy tính GPA");
    panelEl.innerHTML = `
      <div class="fap-transcript-gpa-panel-backdrop" data-fap-gpa-close="1"></div>
      <div class="fap-transcript-gpa-panel-sheet">
        <header class="fap-transcript-gpa-panel-head">
          <h3 class="fap-transcript-gpa-panel-title">Môn tính GPA (đã ẩn môn loại trừ)</h3>
          <button type="button" class="fap-transcript-gpa-panel-x" data-fap-gpa-close="1" aria-label="Đóng">×</button>
        </header>
        <div class="fap-transcript-gpa-panel-hero">
          <span class="fap-transcript-gpa-panel-hero-label">GPA (ước tính)</span>
          <strong class="fap-transcript-gpa-panel-gpa-big" data-fap-gpa-panel-result="">${formatGpa(gpaNow)}</strong>
        </div>
        <p class="fap-transcript-gpa-panel-hint">Điểm hoặc TC để trống → không tính dòng đó. GPA = Σ(điểm×TC)/Σ(TC) (làm tròn 3 chữ số thập phân). <strong>GPA ước tính chỉ từ bảng trong khung này</strong> (ô nhập → đồng bộ rồi mới tính), <strong>không</strong> lấy trực tiếp từ bảng điểm FAP phía sau. Sửa TC/điểm là số trên thanh và ô lớn bên trên đổi theo (không cố định).</p>
        <details class="fap-transcript-gpa-excluded-details">
          <summary class="fap-transcript-gpa-excluded-summary"><span class="fap-transcript-gpa-excluded-summary-text">▸ Không tính GPA: điều kiện &amp; môn bị ẩn</span><span class="fap-transcript-gpa-excluded-summary-hint"> (bấm để mở)</span></summary>
          <div class="fap-transcript-gpa-excluded-rules">
            <p class="fap-transcript-gpa-excluded-p">• Dòng có dấu <strong>*</strong> trên transcript (bất kỳ ô, hoặc cột cuối span đỏ), hoặc <strong>tên môn</strong> (Subject Name) kết thúc bằng <strong>*</strong> → không đưa vào đây.<br>
            • <strong>TC = 0</strong> trên bảng điểm → không đưa vào (trừ <strong>Not started / Studying</strong> — vẫn hiện để nhập TC dự báo).<br>
            • <strong>Mã môn thực tập OJT</strong> (bắt đầu bằng <strong>OJT</strong>) → <strong>không</strong> tính GPA. Trên transcript môn này không đưa vào bảng dưới; nếu thêm tay mã OJT thì dòng vẫn hiện nhưng <strong>không cộng</strong> vào GPA.<br>
            • Các môn còn lại (ví dụ <strong>SYB302c</strong>) <strong>có</strong> vào bảng và tính GPA khi có đủ TC và điểm.</p>
            <p class="fap-transcript-gpa-excluded-sub">Danh sách môn trên FAP bị loại theo các điều kiện trên:</p>
            <div data-fap-gpa-excluded-list></div>
          </div>
        </details>
        <div class="fap-transcript-gpa-panel-actions">
          <button type="button" class="fap-transcript-gpa-btn-primary" id="fap-gpa-add">+ Thêm môn</button>
          <button type="button" class="fap-transcript-gpa-btn-secondary" id="fap-gpa-reset">Khôi phục từ bảng điểm</button>
          <button type="button" class="fap-transcript-gpa-btn-secondary" id="fap-gpa-export-csv" title="Mở bằng Excel hoặc Google Sheets">Xuất Excel (CSV)</button>
        </div>
        <div class="fap-transcript-gpa-table-wrap">
          <table class="fap-transcript-gpa-table">
            <thead>
              <tr>
                <th>Mã môn</th>
                <th>TC</th>
                <th>Điểm</th>
                <th></th>
              </tr>
            </thead>
            <tbody data-fap-gpa-tbody></tbody>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(panelEl);

    attachGpaPanelClickDelegationOnce();
    renderPanelTable();
    refreshExcludedTranscriptListEl();

    bar.querySelector("#fap-transcript-gpa-open-btn")?.addEventListener("click", openPanel);
    panelEl.querySelectorAll("[data-fap-gpa-close]").forEach((el) => {
      el.addEventListener("click", closePanel);
    });
    panelEl.querySelector("#fap-gpa-reset")?.addEventListener("click", () => {
      resetSimulatorFromTranscript();
    });
    panelEl.querySelector("#fap-gpa-export-csv")?.addEventListener("click", exportGpaToExcelCsv);
    panelEl.querySelector("#fap-gpa-add")?.addEventListener("click", () => {
      nextManualId += 1;
      simulatorState.unshift({
        id: `m-${nextManualId}`,
        code: "",
        credit: 0,
        grade: null,
        source: "manual",
      });
      renderPanelTable();
      const first = panelEl.querySelector(
        "[data-fap-gpa-tbody] tr:first-child .fap-transcript-gpa-in-code, [data-fap-gpa-tbody] tr:first-child .fap-transcript-gpa-in-c",
      );
      first?.focus();
    });

    document.addEventListener("keydown", onDocKey);
  }

  function onDocKey(e) {
    const root = getGpaPanelRoot();
    if (e.key === "Escape" && root && !root.hidden) {
      closePanel();
    }
  }

  function teardownTranscriptGpa() {
    document.getElementById(BAR_ID)?.remove();
    document.getElementById(PANEL_ID)?.remove();
    panelEl = null;
    simulatorState = [];
    lastExcludedFromTranscript = [];
    document.removeEventListener("keydown", onDocKey);
    document.body.style.overflow = "";
  }

  window.fapTranscriptGpa = {
    enhance: enhanceTranscriptGpa,
    teardown: teardownTranscriptGpa,
  };
})();
