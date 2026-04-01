const SKIN_CLASS = "fap-minimal-skin";
const STORAGE_KEY = "fapMinimalSkinEnabled";
const LINK_HINT_ID = "fap-link-hint";
const ANIME_SPLINE_WRAPPER_ID = "fap-anime-spline-wrap";
const ANIME_SPLINE_IFRAME_SRC = "https://my.spline.design/chibimiku-qAHLDeyTKstVZb7xLHigNvFG/";

/** Nút "Tài liệu" trên Chronos: luôn mở trang quản lý syllabus SV (FLM). */
const FLM_STUDENT_SYLLABUS_URL = "https://flm.fpt.edu.vn/gui/role/student/SyllabusManagement";

/** Tên môn tiếng Việt (theo mã); bổ sung dần — mặc định chỉ hiện mã nếu không có mục. */
const FAP_SUBJECT_TITLE_VI = {
  MLN131: "Chủ nghĩa xã hội khoa học",
  SEP490: "Đồ án tốt nghiệp",
};

const FAP_QUICK_PRIORITY_ORDER = [
  "Report/ViewAttendstudent.aspx",
  "Grade/StudentGrade.aspx",
  "Grade/StudentTranscript.aspx",
  "FrontOffice/Courses.aspx",
  "Report/ScheduleOfWeek.aspx",
  "Exam/ScheduleExams.aspx",
  "FrontOffice/StudentCurriculum.aspx",
  "App/SendAcad.aspx",
  "App/AcadAppView.aspx",
];

const FAP_QUICK_LINKS = [
  { href: "Report/ViewAttendstudent.aspx", label: "Báo cáo điểm danh" },
  { href: "Grade/StudentGrade.aspx", label: "Báo cáo điểm theo kỳ" },
  { href: "Grade/StudentTranscript.aspx", label: "Báo cáo điểm toàn khóa" },
  { href: "FrontOffice/Courses.aspx", label: "Chuyển lớp / Tạm ngưng môn" },
  { href: "Course/Courses.aspx", label: "Lịch học" },
  { href: "Report/ScheduleOfWeek.aspx", label: "Thời khóa biểu từng tuần" },
  { href: "Exam/ScheduleExams.aspx", label: "Xem lịch thi" },
  { href: "FrontOffice/StudentCurriculum.aspx", label: "Khung chương trình" },
  { href: "App/SendAcad.aspx", label: "Gửi đơn" },
  { href: "App/AcadAppView.aspx", label: "Xem đơn" },
  { href: "User/Profile.aspx", label: "Hồ sơ sinh viên" },
  { href: "User/ChangePasswordFEID.aspx", label: "Đổi mật khẩu FEID" },
  { href: "Finance/TransReport.aspx", label: "Lịch sử giao dịch" },
  { href: "Feedback/StudentFeedBack.aspx", label: "Góp ý giảng dạy" },
  { href: "Student.aspx", label: "Trang chủ sinh viên" },
];

const NOTICE_DEADLINE_SHARED_5W = "5 tuần trước học kỳ mới";
const NOTICE_DEADLINE_SHARED_1W = "1 tuần trước học kỳ mới";

const NOTICE_VI_ROWS = [
  { proc: "1. Chuyển ngành", deadline: NOTICE_DEADLINE_SHARED_5W },
  { proc: "2. Chuyển cơ sở", deadline: NOTICE_DEADLINE_SHARED_5W },
  { proc: "3. Nhập học trở lại", deadline: "10 ngày trước học kỳ mới" },
  { proc: "4. Bảo lưu học kỳ", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "5. Tạm ngưng tiến độ 1 học kỳ để học lại", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "6. Tạm ngừng môn", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "7. Đăng ký học lại", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "8. Đăng ký học đã chậm kỳ", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "9. Đăng ký học cải thiện", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "10. Chuyển lớp", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "11. Thôi học tự nguyện", deadline: NOTICE_DEADLINE_SHARED_1W },
  { proc: "12. Thi cải thiện điểm", deadline: "12 giờ trưa ngày trước ngày thi lại" },
  { proc: "13. Phúc tra", deadline: "3 ngày sau ngày công bố kết quả" },
  { proc: "14. Miễn điểm danh", deadline: "Trước khi học kỳ bắt đầu" },
  {
    proc: "15. Nộp học phí chuyên ngành",
    deadline: "5 ngày làm việc trước học kỳ mới (không tính thứ Bảy, Chủ nhật)",
  },
  {
    proc: "16. Nộp học phí Tiếng Anh dự bị",
    deadline: "3 ngày làm việc trước khi bắt đầu khóa học (không tính thứ Bảy, Chủ nhật)",
  },
  {
    proc: "17. Đăng ký thi thẩm định các môn học trực tuyến",
    deadline: "12h thứ Sáu tuần thứ 9 của học kỳ",
  },
];

let linkHintDelegateAttached = false;
let revealObserver = null;

let paletteAllItems = [];
let paletteFilteredItems = [];
let paletteSelectedIndex = 0;
let paletteKeydownBound = false;

/** Report/ScheduleOfWeek.aspx — Chronos tactical schedule */
let fapChronosIntervalId = null;

/** Cache map mã môn → stats + attendUrl từ ViewAttendstudent (5 phút). */
let fapAttendCourseMapCache = null;
let fapAttendCourseMapCacheAt = 0;
const FAP_ATTEND_MAP_CACHE_MS = 5 * 60 * 1000;

function isScheduleWeekPage() {
  return /ScheduleOfWeek\.aspx/i.test(location.pathname || "");
}

function findScheduleWeekTable() {
  const sel = document.getElementById("ctl00_mainContent_drpSelectWeek");
  return sel?.closest("table") ?? null;
}

function scheduleCellIsEmpty(td) {
  const t = td.textContent.replace(/\s+/g, "").trim();
  return t === "" || t === "-";
}

function scheduleMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  return h * 60 + m;
}

function scheduleNowInRange(start, end) {
  const a = scheduleMinutes(start);
  const b = scheduleMinutes(end);
  if (a == null || b == null) {
    return false;
  }
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= a && cur <= b;
}

function scheduleParseTimeRange(td) {
  const el = td.querySelector(".label-success");
  if (!el) {
    return null;
  }
  const m = el.textContent.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!m) {
    return null;
  }
  return { start: m[1], end: m[2] };
}

function chronosStatusLabelVi(kind) {
  if (kind === "attended") {
    return "Đã tham gia";
  }
  if (kind === "missed") {
    return "Vắng";
  }
  return "Sắp tới";
}

function parseScheduleSlotFromP(p) {
  const detail = p.querySelector('a[href*="ActivityDetail.aspx"]');
  const rawLink = (detail?.textContent || "").trim().replace(/-+\s*$/, "");
  const codeMatch = rawLink.match(/^([A-Za-z]{2,}\d{2,6}[A-Za-z0-9]*)/);
  const code = codeMatch ? codeMatch[1].toUpperCase() : null;

  const fullText = p.textContent || "";
  const atMatch = fullText.match(/at\s+([^(\n]+)/i);
  const roomCode = atMatch ? atMatch[1].replace(/\s+/g, " ").trim() : "";

  let roomName = "";
  const spanBuilding = [...p.querySelectorAll("span.label-primary")].find((s) => !s.closest('a[href*="edunext"]'));
  if (spanBuilding) {
    roomName = (spanBuilding.textContent || "").trim();
  }

  const statusFont = [...p.querySelectorAll("font")].find((f) => f.hasAttribute("color"));
  const colorRaw = (statusFont?.getAttribute("color") || "").toLowerCase();
  const statusText = (statusFont?.textContent || "").trim().toLowerCase();
  let statusKind = "upcoming";
  if (colorRaw === "green" || /attended|present/i.test(statusText)) {
    statusKind = "attended";
  } else if (colorRaw === "red" || /absent/i.test(statusText)) {
    statusKind = "missed";
  } else if (colorRaw === "black" || /future|upcoming|chưa/i.test(statusText)) {
    statusKind = "upcoming";
  }

  const timeEl = p.querySelector(".label-success");
  let timeLabel = "";
  if (timeEl) {
    const tm = timeEl.textContent.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (tm) {
      timeLabel = `${tm[1]} – ${tm[2]}`;
    }
  }

  const mat = p.querySelector("a.label-warning");
  const edu = p.querySelector('a[href*="edunext.fpt.edu.vn"], a.label-primary[href*="edunext"]');

  return {
    code,
    roomCode,
    roomName,
    statusKind,
    timeLabel,
    detail,
    mat,
    edu,
  };
}

function chronosPopoverLink(a, label) {
  if (!a?.href) {
    return null;
  }
  const out = document.createElement("a");
  out.href = a.href;
  out.className = "fap-chronos-popover__link";
  out.textContent = label;
  if (a.getAttribute("target") === "_blank" || a.target === "_blank") {
    out.target = "_blank";
    out.rel = "noopener noreferrer";
  }
  return out;
}

function createChronosStructuredCard(p) {
  const parsed = parseScheduleSlotFromP(p);
  const card = document.createElement("div");
  card.className = "fap-chronos-card";
  if (parsed.code) {
    card.dataset.fapSubjectCode = parsed.code;
  }

  const body = document.createElement("div");
  body.className = "fap-chronos-card__body";

  const roomBlock = document.createElement("div");
  roomBlock.className = "fap-chronos-card__room-block";

  const lineRoomPrimary = document.createElement("div");
  lineRoomPrimary.className = "fap-chronos-card__line fap-chronos-card__line--room-primary";
  if (parsed.roomCode) {
    lineRoomPrimary.textContent = parsed.roomCode;
  } else if (parsed.roomName) {
    lineRoomPrimary.textContent = parsed.roomName;
  } else {
    lineRoomPrimary.textContent = "—";
  }

  roomBlock.appendChild(lineRoomPrimary);
  if (parsed.roomCode && parsed.roomName) {
    const lineRoomSub = document.createElement("div");
    lineRoomSub.className = "fap-chronos-card__line fap-chronos-card__line--room-sub";
    lineRoomSub.textContent = parsed.roomName;
    roomBlock.appendChild(lineRoomSub);
  }

  const titleVi = parsed.code ? FAP_SUBJECT_TITLE_VI[parsed.code] : "";
  const lineCode = document.createElement("div");
  lineCode.className = "fap-chronos-card__line fap-chronos-card__line--code";
  lineCode.textContent = parsed.code || "—";
  if (titleVi) {
    lineCode.setAttribute("title", titleVi);
  }

  const statusRow = document.createElement("div");
  statusRow.className = "fap-chronos-card__status";

  const chip = document.createElement("span");
  chip.className = `fap-chronos-status fap-chronos-status--${parsed.statusKind}`;
  chip.textContent = chronosStatusLabelVi(parsed.statusKind);

  const progressSlot = document.createElement("div");
  progressSlot.className = "fap-chronos-card__progress-slot";

  const track = document.createElement("div");
  track.className = "fap-chronos-progress-track";
  const fill = document.createElement("div");
  fill.className = "fap-chronos-progress-fill";
  fill.style.width = "0%";
  track.appendChild(fill);

  const cap = document.createElement("span");
  cap.className = "fap-chronos-progress-cap";
  cap.textContent = "—";

  progressSlot.appendChild(track);
  progressSlot.appendChild(cap);

  statusRow.appendChild(chip);
  statusRow.appendChild(progressSlot);

  const lineTime = document.createElement("div");
  lineTime.className = "fap-chronos-card__line fap-chronos-card__line--time";
  lineTime.textContent = parsed.timeLabel || "—";

  const codeTimeRow = document.createElement("div");
  codeTimeRow.className = "fap-chronos-card__code-time-row";
  codeTimeRow.appendChild(lineCode);
  codeTimeRow.appendChild(lineTime);

  body.appendChild(roomBlock);
  body.appendChild(codeTimeRow);
  body.appendChild(statusRow);

  const peek = document.createElement("span");
  peek.className = "fap-chronos-card__peek";
  peek.setAttribute("aria-hidden", "true");
  peek.textContent = "···";

  const pop = document.createElement("div");
  pop.className = "fap-chronos-card__popover";
  pop.setAttribute("role", "group");
  pop.setAttribute("aria-label", "Liên kết nhanh");
  const popInner = document.createElement("div");
  popInner.className = "fap-chronos-card__popover-inner";

  const b1 = chronosPopoverLink(parsed.detail, "Chi tiết");
  const b2 = chronosPopoverLink(parsed.mat, "Tài liệu");
  if (b2) {
    b2.href = FLM_STUDENT_SYLLABUS_URL;
    b2.target = "_blank";
    b2.rel = "noopener noreferrer";
  }
  const b3 = chronosPopoverLink(parsed.edu, "EduNext");
  [b1, b2, b3].filter(Boolean).forEach((n) => popInner.appendChild(n));
  if (popInner.childNodes.length) {
    pop.appendChild(popInner);
  }

  card.appendChild(body);
  if (popInner.childNodes.length) {
    card.tabIndex = 0;
    card.appendChild(peek);
    card.appendChild(pop);
  }

  return card;
}

function scheduleTodayDayIndex(table) {
  const row = table.querySelector("thead tr:nth-child(2)");
  if (!row) {
    return -1;
  }
  const ths = [...row.querySelectorAll("th")];
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const candidates = new Set([
    `${dd}/${mm}`,
    `${d}/${m}`,
    `${dd}/${m}`,
    `${d}/${String(m).padStart(2, "0")}`,
  ]);
  for (let i = 0; i < ths.length; i++) {
    const raw = ths[i].textContent.replace(/\s+/g, "");
    if (candidates.has(raw)) {
      return i;
    }
  }
  return -1;
}

function scheduleClearLiveClasses(table) {
  table.querySelectorAll("td.fap-chronos-live").forEach((td) => td.classList.remove("fap-chronos-live"));
}

function scheduleUpdateLiveState(table) {
  scheduleClearLiveClasses(table);
  const dayIdx = scheduleTodayDayIndex(table);
  if (dayIdx < 0) {
    return;
  }
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const tds = [...tr.querySelectorAll("td")];
    if (tds.length <= dayIdx + 1) {
      return;
    }
    const td = tds[dayIdx + 1];
    if (!td || !td.classList.contains("fap-chronos-slot-filled")) {
      return;
    }
    const range = scheduleParseTimeRange(td);
    if (range && scheduleNowInRange(range.start, range.end)) {
      td.classList.add("fap-chronos-live");
    }
  });
}

function scheduleClearTodayColumnHighlight(table) {
  table.querySelectorAll(".fap-chronos-today-col").forEach((el) => el.classList.remove("fap-chronos-today-col"));
}

/** Tô cột trùng ngày hôm nay (theo ô dd/mm hàng 2 của thead). `dayIdx` truyền sẵn để khỏi parse lại. */
function scheduleApplyTodayColumnHighlight(table, dayIdx) {
  scheduleClearTodayColumnHighlight(table);
  const idx = typeof dayIdx === "number" ? dayIdx : scheduleTodayDayIndex(table);
  if (idx < 0) {
    return;
  }
  const dateRow = table.querySelector("thead tr:nth-child(2)");
  const dateThs = dateRow?.querySelectorAll("th");
  if (dateThs?.[idx]) {
    dateThs[idx].classList.add("fap-chronos-today-col");
  }
  const nameRow = table.querySelector("thead tr:first-child");
  if (nameRow) {
    const nameThs = [...nameRow.querySelectorAll("th:not([rowspan])")];
    if (nameThs[idx]) {
      nameThs[idx].classList.add("fap-chronos-today-col");
    }
  }
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const tds = [...tr.querySelectorAll("td")];
    if (tds.length > idx + 1) {
      tds[idx + 1]?.classList.add("fap-chronos-today-col");
    }
  });
}

function teardownScheduleChronos() {
  if (fapChronosIntervalId != null) {
    clearInterval(fapChronosIntervalId);
    fapChronosIntervalId = null;
  }
  fapAttendCourseMapCache = null;
  fapAttendCourseMapCacheAt = 0;
  document.getElementById("fap-chronos-exam-section")?.remove();
  const table = document.querySelector("table[data-fap-chronos='1']");
  document.getElementById("fap-chronos-toolbar")?.remove();
  if (table) {
    const wrap = table.closest(".fap-chronos-scroll");
    if (wrap?.parentNode) {
      wrap.parentNode.insertBefore(table, wrap);
      wrap.remove();
    }
    table.querySelectorAll(".fap-chronos-card").forEach((card) => {
      const p = card.querySelector("p.fap-chronos-raw");
      if (p && card.parentNode) {
        p.classList.remove("fap-chronos-raw");
        p.removeAttribute("hidden");
        card.parentNode.insertBefore(p, card);
      }
      card.remove();
    });
    table.querySelectorAll("td, tr").forEach((el) => {
      [...el.classList].filter((c) => c.startsWith("fap-chronos")).forEach((c) => el.classList.remove(c));
    });
    table.classList.remove("fap-chronos-schedule");
    table.removeAttribute("data-fap-chronos");
  }
  document.body.classList.remove("fap-page-schedule", "fap-chronos-show-dead-rows");
  restoreScheduleWeekFootLegend();
}

/** Thay chú thích FAP (attended/absent/…) bằng mô tả đúng bảng lịch tuần đã skin. */
function injectScheduleWeekFootLegend() {
  const foot = document.getElementById("ctl00_mainContent_divfoot");
  if (!foot || foot.getAttribute("data-fap-chronos-legend") === "1") {
    return;
  }
  if (!foot.dataset.fapChronosFootBackup) {
    foot.dataset.fapChronosFootBackup = foot.innerHTML;
  }
  foot.setAttribute("data-fap-chronos-legend", "1");
  foot.classList.add("fap-chronos-legend-root");
  foot.innerHTML = `
    <ul class="fap-chronos-legend-list">
      <li><strong>Hàng (Slot):</strong> mỗi hàng là một ca học theo khung giờ của trường; mỗi ô giao một slot với một ngày.</li>
      <li><strong>Cột (Mon–Sun):</strong> các ngày trong tuần đang chọn, kèm ngày/tháng ở hàng dưới; kéo ngang nếu màn hình hẹp.</li>
      <li><strong>Ô có lịch:</strong> hiển thị dạng thẻ — phòng, mã môn, giờ, trạng thái <em>buổi đó</em> trên FAP (đã tham gia / vắng / chưa có dữ liệu…), và thanh % điểm danh theo môn (có mặt / các buổi đã diễn ra trong báo cáo, không tính Future).</li>
      <li><strong>Ô «-»:</strong> không có hoạt động ở slot đó; có thể bật «Hiện các slot chỉ có dấu (-)» phía trên bảng.</li>
      <li><strong>Cột hôm nay</strong> được tô nhẹ khi trùng ngày trên máy; trong khung giờ học, ô có thể nhấn mạnh thêm.</li>
      <li><strong>Dấu ···</strong> trên thẻ: liên kết nhanh (chi tiết, tài liệu, EduNext, điểm danh).</li>
    </ul>
    <p class="fap-chronos-legend-note">Chú thích mặc định của FAP (attended / absent / «-» trong ô gốc) không còn khớp cách đọc trên thẻ: skin đã đổi sang nhãn tiếng Việt, dữ liệu vẫn từ FAP.</p>
  `;

  const prev = foot.previousElementSibling;
  if (prev?.tagName === "P" && prev.querySelector("b") && !prev.dataset.fapChronosLegendHeading) {
    prev.dataset.fapChronosLegendHeading = "1";
    prev.dataset.fapChronosFootHeadingBackup = prev.innerHTML;
    prev.querySelector("b").textContent = "Chú thích bảng lịch tuần (giao diện FAP Minimal)";
  }
}

function restoreScheduleWeekFootLegend() {
  const foot = document.getElementById("ctl00_mainContent_divfoot");
  if (foot?.dataset.fapChronosFootBackup) {
    foot.innerHTML = foot.dataset.fapChronosFootBackup;
    foot.classList.remove("fap-chronos-legend-root");
    foot.removeAttribute("data-fap-chronos-legend");
    delete foot.dataset.fapChronosFootBackup;
  }
  const foot2 = document.getElementById("ctl00_mainContent_divfoot");
  const prev = foot2?.previousElementSibling;
  if (prev?.dataset.fapChronosLegendHeading && prev.dataset.fapChronosFootHeadingBackup) {
    prev.innerHTML = prev.dataset.fapChronosFootHeadingBackup;
    delete prev.dataset.fapChronosLegendHeading;
    delete prev.dataset.fapChronosFootHeadingBackup;
  }
}

function enhanceScheduleChronos() {
  if (!isScheduleWeekPage()) {
    return;
  }
  const table = findScheduleWeekTable();
  if (!table || table.getAttribute("data-fap-chronos") === "1") {
    return;
  }

  table.setAttribute("data-fap-chronos", "1");
  table.classList.add("fap-chronos-schedule");
  document.body.classList.add("fap-page-schedule");

  const parent = table.parentNode;
  if (parent) {
    const toolbar = document.createElement("div");
    toolbar.id = "fap-chronos-toolbar";
    toolbar.className = "fap-chronos-toolbar";
    toolbar.innerHTML =
      '<label class="fap-chronos-toggle"><input type="checkbox" id="fap-chronos-show-empty" /> Hiện các slot chỉ có dấu (-)</label>';
    parent.insertBefore(toolbar, table);
    const wrap = document.createElement("div");
    wrap.className = "fap-chronos-scroll";
    parent.insertBefore(wrap, table);
    wrap.appendChild(table);

    const cb = toolbar.querySelector("#fap-chronos-show-empty");
    cb?.addEventListener("change", () => {
      document.body.classList.toggle("fap-chronos-show-dead-rows", Boolean(cb.checked));
    });
  }

  const todayDayIdx = scheduleTodayDayIndex(table);
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const tds = [...tr.querySelectorAll("td")];
    if (tds.length < 8) {
      return;
    }
    const dayTds = tds.slice(1, 8);
    const allEmpty = dayTds.every(scheduleCellIsEmpty);
    if (allEmpty) {
      tr.classList.add("fap-chronos-row-all-empty");
    }
    dayTds.forEach((td, dayIndex) => {
      if (scheduleCellIsEmpty(td)) {
        td.classList.add("fap-chronos-slot-empty");
        return;
      }
      td.classList.add("fap-chronos-slot-filled");
      const p = td.querySelector(":scope > p");
      if (!p) {
        return;
      }
      const card = createChronosStructuredCard(p);
      p.classList.add("fap-chronos-raw");
      p.setAttribute("hidden", "");
      p.parentNode.insertBefore(card, p);
      card.appendChild(p);

      if (todayDayIdx >= 0 && dayIndex === todayDayIdx) {
        const range = scheduleParseTimeRange(td);
        if (range && scheduleNowInRange(range.start, range.end)) {
          td.classList.add("fap-chronos-live");
        }
      }
    });
  });

  scheduleApplyTodayColumnHighlight(table, todayDayIdx);
  scheduleUpdateLiveState(table);
  fapChronosIntervalId = window.setInterval(() => {
    const t = document.querySelector("table[data-fap-chronos='1']");
    if (t) {
      scheduleUpdateLiveState(t);
    }
  }, 45000);

  injectExamScheduleBelowWeek();
  injectChronosAttendanceBadges();
  injectScheduleWeekFootLegend();
}

function chronosSubjectCodeFromParagraph(p) {
  if (!p) {
    return null;
  }
  const a = p.querySelector('a[href*="ActivityDetail.aspx"]');
  const raw = (a?.textContent || "").trim().replace(/-+\s*$/, "");
  let m = raw.match(/^([A-Za-z]{2,}\d{2,6}[A-Za-z0-9]*)/);
  if (m) {
    return m[1].toUpperCase();
  }
  const t = (p.textContent || "").trim();
  m = t.match(/\b([A-Z]{2,}\d{2,6})\b/);
  return m ? m[1] : null;
}

function attendParseCourseCodeFromLink(anchor) {
  const t = anchor?.textContent || "";
  const m = t.match(/\(([A-Za-z]{2,}\d{2,6})\)/);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Dòng chân bảng FAP: "ABSENT: 7% ABSENT SO FAR (1 ABSENT ON 15 TOTAL)."
 * Tổng Z gồm cả Future; % khớp portal hơn là chỉ đếm Non-Future trong tbody.
 */
function attendReportFooterSummary(table) {
  for (const tr of table.querySelectorAll("tr")) {
    const tds = tr.querySelectorAll("td");
    if (tds.length !== 1) {
      continue;
    }
    const text = (tds[0].textContent || "").replace(/\s+/g, " ").trim();
    const m = text.match(
      /(\d+)\s*%\s*ABSENT\s+SO\s+FAR\s*\(\s*(\d+)\s+ABSENT\s+ON\s+(\d+)\s+TOTAL\s*\)/i,
    );
    if (!m) {
      continue;
    }
    const absent = Number(m[2], 10);
    const total = Number(m[3], 10);
    if (!Number.isFinite(absent) || !Number.isFinite(total) || total <= 0 || absent < 0 || absent > total) {
      continue;
    }
    const nonAbsent = total - absent;
    const pct = Math.round((nonAbsent / total) * 100);
    return { absent, total, nonAbsent, pct };
  }
  return null;
}

/**
 * Parse bảng điểm danh giống snapshot `scrawl/attend.txt`: `table.table-bordered.table1`,
 * cột trạng thái "Attedance status" (Present / Absent / Future).
 * Hiển thị lịch: đếm Present / buổi đã diễn ra (bỏ Future) — ví dụ 9/10, không dùng footer 14/15.
 * Footer FAP (gồm Future trong mẫu) chỉ đính kèm `footerNote` cho tooltip.
 */
function attendReportStatsFromDoc(doc) {
  const table =
    doc.querySelector("table.table.table-bordered.table1") || doc.querySelector("table.table-bordered.table1");
  if (!table) {
    return null;
  }
  /** FAP often emits an empty <tbody> before <thead>; first querySelector("tbody") misses real rows. */
  const rows = [...table.querySelectorAll("tbody tr")].filter((tr) => tr.querySelectorAll("td").length >= 8);
  const totalAll = rows.length;
  if (totalAll === 0) {
    return null;
  }
  let present = 0;
  let held = 0;
  for (const tr of rows) {
    const tds = tr.querySelectorAll("td");
    const status = (tds[6]?.textContent || "").trim();
    if (/future/i.test(status)) {
      continue;
    }
    held++;
    if (/present/i.test(status)) {
      present++;
    }
  }
  const pct = held > 0 ? Math.round((present / held) * 100) : null;
  const out = { present, held, totalAll, pct };
  const footer = attendReportFooterSummary(table);
  if (footer) {
    out.footerNote = {
      absent: footer.absent,
      total: footer.total,
      pctAbsent: Math.round((footer.absent / footer.total) * 100),
    };
  }
  return out;
}

function collectAttendCourseIndex(doc) {
  const div = doc.querySelector("#ctl00_mainContent_divCourse");
  if (!div) {
    return { selectedCode: null, links: [] };
  }
  let selectedCode = null;
  for (const b of div.querySelectorAll("b")) {
    const m = (b.textContent || "").match(/\(([A-Za-z]{2,}\d{2,6})\)/);
    if (m) {
      selectedCode = m[1].toUpperCase();
      break;
    }
  }
  const links = [...div.querySelectorAll('a[href*="course="]')];
  return { selectedCode, links };
}

async function fetchAttendCourseMap() {
  const now = Date.now();
  if (fapAttendCourseMapCache && now - fapAttendCourseMapCacheAt < FAP_ATTEND_MAP_CACHE_MS) {
    return fapAttendCourseMapCache;
  }
  let baseUrl;
  try {
    baseUrl = new URL("../Report/ViewAttendstudent.aspx", location.href).href;
  } catch {
    return null;
  }
  const res = await fetch(baseUrl, { credentials: "same-origin" });
  if (!res.ok) {
    return null;
  }
  /** URL sau redirect — trùng môn đang chọn (bold) trên báo cáo */
  const pageUrl = new URL(res.url);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const map = new Map();
  const { selectedCode, links } = collectAttendCourseIndex(doc);
  if (selectedCode) {
    const stats = attendReportStatsFromDoc(doc);
    if (stats?.totalAll > 0) {
      map.set(selectedCode, { ...stats, attendUrl: pageUrl.href });
    }
  }
  await Promise.all(
    links.map(async (a) => {
      const code = attendParseCourseCodeFromLink(a);
      if (!code || map.has(code)) {
        return;
      }
      const rawHref = a.getAttribute("href");
      if (!rawHref) {
        return;
      }
      const href = new URL(rawHref, pageUrl).href;
      try {
        const r = await fetch(href, { credentials: "same-origin" });
        if (!r.ok) {
          return;
        }
        const coursePageUrl = new URL(r.url);
        const h = await r.text();
        const d = new DOMParser().parseFromString(h, "text/html");
        const stats = attendReportStatsFromDoc(d);
        if (stats?.totalAll > 0) {
          map.set(code, { ...stats, attendUrl: coursePageUrl.href });
        }
      } catch {
        /* ignore */
      }
    }),
  );
  fapAttendCourseMapCache = map;
  fapAttendCourseMapCacheAt = now;
  return map;
}

/** Thêm mục Điểm danh vào popover (tạo popover tối thiểu nếu chưa có). */
function ensureChronosCardAttendLink(card, attendUrl) {
  if (!attendUrl || card.querySelector("[data-fap-attend-link='1']")) {
    return;
  }
  let popInner = card.querySelector(".fap-chronos-card__popover-inner");
  if (!popInner) {
    const pop = document.createElement("div");
    pop.className = "fap-chronos-card__popover";
    pop.setAttribute("role", "group");
    pop.setAttribute("aria-label", "Liên kết nhanh");
    popInner = document.createElement("div");
    popInner.className = "fap-chronos-card__popover-inner";
    pop.appendChild(popInner);
    if (!card.querySelector(".fap-chronos-card__peek")) {
      const peek = document.createElement("span");
      peek.className = "fap-chronos-card__peek";
      peek.setAttribute("aria-hidden", "true");
      peek.textContent = "···";
      card.appendChild(peek);
    }
    card.appendChild(pop);
    card.tabIndex = 0;
  }
  const a = document.createElement("a");
  a.href = attendUrl;
  a.className = "fap-chronos-popover__link";
  a.textContent = "Điểm danh";
  a.setAttribute("data-fap-attend-link", "1");
  popInner.appendChild(a);
}

function injectChronosAttendanceBadges() {
  if (!isScheduleWeekPage()) {
    return;
  }
  void (async () => {
    const table = document.querySelector("table[data-fap-chronos='1']");
    if (!table) {
      return;
    }
    let map;
    try {
      map = await fetchAttendCourseMap();
    } catch {
      return;
    }
    if (!map || map.size === 0) {
      return;
    }
    table.querySelectorAll("tbody td.fap-chronos-slot-filled").forEach((td) => {
      const card = td.querySelector(".fap-chronos-card");
      if (!card || card.dataset.fapAttendSynced === "1") {
        return;
      }
      const code = card.dataset.fapSubjectCode || chronosSubjectCodeFromParagraph(card.querySelector("p.fap-chronos-raw"));
      if (!code || !map.has(code)) {
        return;
      }
      const { present, held, totalAll, pct, footerNote, attendUrl } = map.get(code);
      const fill = card.querySelector(".fap-chronos-progress-fill");
      const cap = card.querySelector(".fap-chronos-progress-cap");
      const slot = card.querySelector(".fap-chronos-card__progress-slot");
      if (fill) {
        fill.style.width = held > 0 && pct != null ? `${pct}%` : "0%";
      }
      if (cap) {
        cap.textContent =
          held > 0 && pct != null ? `${present}/${held} • ${pct}%` : "—";
      }
      if (slot) {
        if (held > 0 && pct != null) {
          let title = `Điểm danh: ${present} có mặt / ${held} buổi đã diễn ra (không tính Future) · ${pct}%. ${totalAll} dòng trong danh sách.`;
          if (footerNote) {
            title += ` Footer FAP: ${footerNote.pctAbsent}% absent (${footerNote.absent}/${footerNote.total}, mẫu gồm Future).`;
          }
          slot.setAttribute("title", title);
        } else {
          slot.setAttribute(
            "title",
            totalAll > 0
              ? `Chưa có buổi nào đủ điều kiện đếm (chỉ Future hoặc chưa diễn ra). ${totalAll} buổi trong danh sách.`
              : "",
          );
        }
      }
      ensureChronosCardAttendLink(card, attendUrl);
      card.dataset.fapAttendSynced = "1";
    });
  })();
}

/** Lấy lịch thi từ Exam/ScheduleExams.aspx và chèn dưới bảng tuần (một trang, tiếng Việt). */
function scheduleExamFetchUrl() {
  try {
    return new URL("../Exam/ScheduleExams.aspx", location.href).href;
  } catch {
    return "";
  }
}

const SCHEDULE_EXAM_TH_VI = [
  "STT",
  "Mã môn",
  "Tên môn",
  "Ngày thi",
  "Phòng",
  "Giờ",
  "Hình thức",
  "Loại thi",
  "Ngày công bố",
  "Ghi chú",
];

function injectExamScheduleBelowWeek() {
  if (!isScheduleWeekPage()) {
    return;
  }
  if (document.getElementById("fap-chronos-exam-section")) {
    return;
  }
  const weekWrap = document.querySelector("table[data-fap-chronos='1']")?.closest(".fap-chronos-scroll");
  if (!weekWrap?.parentNode) {
    return;
  }

  const url = scheduleExamFetchUrl();
  if (!url) {
    return;
  }

  void (async () => {
    if (document.getElementById("fap-chronos-exam-section")) {
      return;
    }
    let html = "";
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) {
        return;
      }
      html = await res.text();
    } catch {
      return;
    }
    if (!html || document.getElementById("fap-chronos-exam-section")) {
      return;
    }

    const parsed = new DOMParser().parseFromString(html, "text/html");
    const srcTable = parsed.querySelector("#ctl00_mainContent_divContent table");
    if (!srcTable) {
      return;
    }

    const section = document.createElement("section");
    section.id = "fap-chronos-exam-section";
    section.className = "fap-chronos-exam-section";

    const sheet = document.createElement("div");
    sheet.className = "fap-chronos-exam-sheet";

    const h3 = document.createElement("h3");
    h3.className = "fap-chronos-exam-heading";
    h3.textContent = "Lịch thi";

    const scroll = document.createElement("div");
    scroll.className = "fap-chronos-exam-scroll";

    const table = document.importNode(srcTable, true);
    table.classList.add("fap-chronos-exam-table");
    table.removeAttribute("width");
    table.querySelectorAll("[width]").forEach((el) => el.removeAttribute("width"));

    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      const ths = [...headerRow.querySelectorAll("th")];
      ths.forEach((th, i) => {
        const label = SCHEDULE_EXAM_TH_VI[i];
        if (label) {
          th.textContent = label;
        }
      });
    }

    const bodyRows = table.querySelectorAll("tbody tr");
    const hasData = [...bodyRows].some((tr) => {
      const tds = tr.querySelectorAll("td");
      return tds.length > 0 && [...tds].some((td) => td.textContent.replace(/\s+/g, "").length > 0);
    });

    if (!hasData) {
      const empty = document.createElement("p");
      empty.className = "fap-chronos-exam-empty";
      empty.textContent = "Hiện chưa có lịch thi.";
      scroll.appendChild(empty);
    } else {
      scroll.appendChild(table);
    }

    sheet.appendChild(h3);
    sheet.appendChild(scroll);
    section.appendChild(sheet);
    weekWrap.parentNode.insertBefore(section, weekWrap.nextSibling);
  })();
}

function ensureLinkHintEl() {
  let el = document.getElementById(LINK_HINT_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = LINK_HINT_ID;
    el.setAttribute("role", "status");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<span class="fap-link-hint-kbd" aria-hidden="true">Đích</span><span class="fap-link-hint-url"></span>';
    document.body.appendChild(el);
  }
  return el;
}

function resolveHref(anchor) {
  const href = anchor.getAttribute("href");
  if (href == null || href.trim() === "") {
    return "";
  }
  try {
    return new URL(href, location.href).href;
  } catch {
    return href;
  }
}

function attachLinkHintDelegates() {
  if (linkHintDelegateAttached) {
    return;
  }
  linkHintDelegateAttached = true;

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!document.body.classList.contains(SKIN_CLASS)) {
        return;
      }
      const a = e.target.closest?.("a[href]");
      if (!a || a.id === LINK_HINT_ID || a.closest(`#${LINK_HINT_ID}`)) {
        return;
      }
      const url = resolveHref(a);
      const el = ensureLinkHintEl();
      const urlEl = el.querySelector(".fap-link-hint-url");
      if (urlEl) {
        urlEl.textContent = url || a.getAttribute("href") || "";
      }
      el.classList.add("fap-link-hint--active");
      el.setAttribute("aria-hidden", "false");
    },
    true
  );

  document.addEventListener(
    "mouseout",
    (e) => {
      if (!document.body.classList.contains(SKIN_CLASS)) {
        return;
      }
      const from = e.target.closest?.("a[href]");
      if (!from) {
        return;
      }
      const to = e.relatedTarget;
      if (to && from.contains(to)) {
        return;
      }
      const nextLink = to?.closest?.("a[href]");
      if (nextLink && nextLink !== from) {
        return;
      }
      const el = document.getElementById(LINK_HINT_ID);
      if (el) {
        el.classList.remove("fap-link-hint--active");
        el.setAttribute("aria-hidden", "true");
      }
    },
    true
  );
}

function refreshLinkHintState(enabled) {
  attachLinkHintDelegates();
  const el = document.getElementById(LINK_HINT_ID);
  if (!enabled && el) {
    el.classList.remove("fap-link-hint--active");
    el.setAttribute("aria-hidden", "true");
    const urlEl = el.querySelector(".fap-link-hint-url");
    if (urlEl) {
      urlEl.textContent = "";
    }
  }
}

function clearRevealClasses() {
  document.querySelectorAll(".fap-skin-reveal").forEach((node) => {
    node.classList.remove("fap-skin-reveal", "fap-skin-reveal--visible");
    node.style.removeProperty("--fap-reveal-index");
  });
}

function normalizePaletteUrl(href) {
  try {
    const u = new URL(href, location.href);
    return u.origin + u.pathname + u.search;
  } catch {
    return href;
  }
}

function collectPaletteItems() {
  const seen = new Set();
  const out = [];
  const add = (fullUrl, label) => {
    const key = normalizePaletteUrl(fullUrl);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const cleanLabel = String(label).trim().replace(/\s+/g, " ").slice(0, 120);
    if (cleanLabel.length < 2) {
      return;
    }
    out.push({ url: fullUrl, label: cleanLabel });
  };

  FAP_QUICK_LINKS.forEach(({ href, label }) => {
    try {
      add(new URL(href, location.href).href, label);
    } catch {
      /* skip bad href */
    }
  });

  const scope =
    document.querySelector("#ctl00_mainContent_divMain") ||
    document.querySelector("#aspnetForm") ||
    document.body;
  let scraped = 0;
  const maxScraped = 64;
  scope.querySelectorAll("a[href]").forEach((a) => {
    if (scraped >= maxScraped) {
      return;
    }
    const raw = a.getAttribute("href");
    if (!raw || raw === "#" || raw.trim().toLowerCase().startsWith("javascript")) {
      return;
    }
    const text = a.textContent.trim().replace(/\s+/g, " ");
    if (text.length < 2) {
      return;
    }
    const full = resolveHref(a);
    const key = normalizePaletteUrl(full);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push({ url: full, label: text.slice(0, 120) });
    scraped++;
  });

  return out;
}

function ensureCommandPalette() {
  let root = document.getElementById("fap-command-palette");
  if (root) {
    return root;
  }
  root = document.createElement("div");
  root.id = "fap-command-palette";
  root.className = "fap-command-palette";
  root.setAttribute("hidden", "");
  root.innerHTML = `
    <div class="fap-palette-backdrop" tabindex="-1" aria-hidden="true"></div>
    <div class="fap-palette-panel" role="dialog" aria-modal="true" aria-label="Tìm và mở trang">
      <label class="fap-acad-sr-only" for="fap-palette-input">Tìm và mở trang</label>
      <input type="search" id="fap-palette-input" class="fap-palette-input" autocomplete="off" spellcheck="false" placeholder="Gõ tên trang hoặc một phần URL…" />
      <ul id="fap-palette-list" class="fap-palette-list" role="listbox"></ul>
      <p class="fap-palette-hint">
        <kbd class="fap-palette-kbd">Enter</kbd> mở ·
        <kbd class="fap-palette-kbd">Esc</kbd> đóng ·
        <kbd class="fap-palette-kbd">Ctrl</kbd>+<kbd class="fap-palette-kbd">K</kbd> / <kbd class="fap-palette-kbd">/</kbd>
      </p>
    </div>
  `;
  document.body.appendChild(root);

  root.querySelector(".fap-palette-backdrop").addEventListener("click", () => {
    closeCommandPalette();
  });

  const input = root.querySelector("#fap-palette-input");
  input.addEventListener("input", () => {
    paletteSelectedIndex = 0;
    renderPaletteList();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      movePaletteSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      movePaletteSelection(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmPaletteSelection();
    }
  });

  return root;
}

function renderPaletteList() {
  const rootById = document.getElementById("fap-command-palette");
  if (!rootById) {
    return;
  }
  const input = rootById.querySelector("#fap-palette-input");
  const list = rootById.querySelector("#fap-palette-list");
  const q = input.value.trim().toLowerCase();
  paletteFilteredItems = !q
    ? paletteAllItems
    : paletteAllItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
      );

  const visible = paletteFilteredItems.slice(0, 60);
  if (visible.length === 0) {
    paletteSelectedIndex = 0;
  } else if (paletteSelectedIndex >= visible.length) {
    paletteSelectedIndex = visible.length - 1;
  }

  list.innerHTML = "";
  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "fap-palette-empty";
    empty.textContent = "Không có mục khớp.";
    list.appendChild(empty);
    return;
  }

  visible.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = `fap-palette-item${i === paletteSelectedIndex ? " fap-palette-item--active" : ""}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === paletteSelectedIndex ? "true" : "false");

    const labelEl = document.createElement("span");
    labelEl.className = "fap-palette-item-label";
    labelEl.textContent = item.label;

    const urlEl = document.createElement("span");
    urlEl.className = "fap-palette-item-url";
    let shortUrl = item.url;
    try {
      const u = new URL(item.url);
      shortUrl = (u.pathname || "/") + u.search;
    } catch {
      /* use full */
    }
    urlEl.textContent = shortUrl;

    li.appendChild(labelEl);
    li.appendChild(urlEl);
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      window.location.assign(item.url);
    });
    list.appendChild(li);
  });
}

function movePaletteSelection(delta) {
  const visible = paletteFilteredItems.slice(0, 60);
  const len = visible.length;
  if (len === 0) {
    return;
  }
  paletteSelectedIndex = (paletteSelectedIndex + delta + len) % len;
  renderPaletteList();
  const active = document.querySelector(".fap-palette-item--active");
  active?.scrollIntoView({ block: "nearest" });
}

function confirmPaletteSelection() {
  const visible = paletteFilteredItems.slice(0, 60);
  const item = visible[paletteSelectedIndex];
  if (item) {
    window.location.assign(item.url);
  }
}

function openCommandPalette() {
  if (!document.body.classList.contains(SKIN_CLASS)) {
    return;
  }
  ensureCommandPalette();
  paletteAllItems = collectPaletteItems();
  paletteSelectedIndex = 0;
  const rootEl = document.getElementById("fap-command-palette");
  rootEl.removeAttribute("hidden");
  const input = rootEl.querySelector("#fap-palette-input");
  input.value = "";
  renderPaletteList();
  requestAnimationFrame(() => {
    input.focus();
  });
}

function closeCommandPalette() {
  const r = document.getElementById("fap-command-palette");
  if (r) {
    r.setAttribute("hidden", "");
  }
}

function toggleCommandPalette() {
  const r = document.getElementById("fap-command-palette");
  if (r && !r.hasAttribute("hidden")) {
    closeCommandPalette();
  } else {
    openCommandPalette();
  }
}

function injectQuickStrip() {
  if (document.getElementById("fap-quick-strip")) {
    return;
  }
  const main = document.getElementById("ctl00_mainContent_divMain");
  if (!main) {
    return;
  }

  const priority = [];
  const rest = [];
  FAP_QUICK_LINKS.forEach((item) => {
    if (FAP_QUICK_PRIORITY_ORDER.includes(item.href)) {
      priority.push(item);
    } else {
      rest.push(item);
    }
  });
  priority.sort(
    (a, b) => FAP_QUICK_PRIORITY_ORDER.indexOf(a.href) - FAP_QUICK_PRIORITY_ORDER.indexOf(b.href)
  );

  const strip = document.createElement("section");
  strip.id = "fap-quick-strip";
  strip.className = "fap-quick-strip";
  strip.setAttribute("aria-label", "Lối tắt thường dùng");

  const head = document.createElement("header");
  head.className = "fap-quick-strip-head";
  const title = document.createElement("h2");
  title.className = "fap-quick-strip-title";
  title.textContent = "Lối tắt thường dùng";
  const sub = document.createElement("p");
  sub.className = "fap-quick-strip-sub";
  sub.textContent = "Kênh ưu tiên: chuyển lớp, điểm, khung chương trình.";
  head.appendChild(title);
  head.appendChild(sub);

  const featNav = document.createElement("nav");
  featNav.className = "fap-quick-strip-featured";
  featNav.setAttribute("aria-label", "Lối tắt ưu tiên");
  priority.forEach(({ href, label }) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "fap-quick-chip fap-quick-chip--priority";
    a.textContent = label;
    featNav.appendChild(a);
  });

  const moreLabel = document.createElement("p");
  moreLabel.className = "fap-quick-strip-more-label";
  moreLabel.textContent = "Khác";

  const moreNav = document.createElement("nav");
  moreNav.className = "fap-quick-strip-nav fap-quick-strip-nav--more";
  moreNav.setAttribute("aria-label", "Lối tắt khác");
  rest.forEach(({ href, label }) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "fap-quick-chip fap-quick-chip--compact";
    a.textContent = label;
    moreNav.appendChild(a);
  });

  strip.appendChild(head);
  strip.appendChild(featNav);
  strip.appendChild(moreLabel);
  strip.appendChild(moreNav);

  const row = main.closest(".row");
  if (row) {
    row.insertBefore(strip, row.firstElementChild);
  } else {
    main.insertBefore(strip, main.firstChild);
  }
}

function injectAnimeSplineStage() {
  if (document.getElementById(ANIME_SPLINE_WRAPPER_ID)) {
    return;
  }
  const main = document.getElementById("ctl00_mainContent_divMain");
  if (!main) {
    return;
  }

  const section = document.createElement("section");
  section.id = ANIME_SPLINE_WRAPPER_ID;
  section.className = "box fap-anime-stage";
  section.setAttribute("aria-label", "Không gian anime");

  const title = document.createElement("h3");
  title.className = "orangeTitle";
  title.textContent = "Anime Scene";

  const shell = document.createElement("div");
  shell.className = "fap-anime-stage__shell";

  const status = document.createElement("p");
  status.className = "fap-anime-stage__status";
  status.textContent = "Đang tải không gian anime...";

  const frameWrap = document.createElement("div");
  frameWrap.className = "fap-anime-stage__frame-wrap";

  const frame = document.createElement("iframe");
  frame.className = "fap-anime-stage__frame";
  frame.src = ANIME_SPLINE_IFRAME_SRC;
  frame.title = "Anime 3D scene";
  frame.loading = "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.setAttribute("allow", "autoplay; fullscreen");

  const actions = document.createElement("div");
  actions.className = "fap-anime-stage__actions";

  const open = document.createElement("a");
  open.href = ANIME_SPLINE_IFRAME_SRC;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.className = "fap-anime-stage__open";
  open.textContent = "Mở scene tab mới";
  actions.appendChild(open);

  let done = false;
  const markDone = () => {
    if (done) {
      return;
    }
    done = true;
    status.textContent = "Scene anime đã sẵn sàng.";
  };
  const markError = () => {
    if (done) {
      return;
    }
    done = true;
    status.textContent = "Không tải được scene. Kiểm tra mạng hoặc mở bằng nút bên dưới.";
    status.classList.add("fap-anime-stage__status--warn");
  };

  const watchdog = window.setTimeout(() => {
    markError();
  }, 10000);
  frame.addEventListener("load", () => {
    window.clearTimeout(watchdog);
    markDone();
  });
  frame.addEventListener("error", () => {
    window.clearTimeout(watchdog);
    markError();
  });

  frameWrap.appendChild(frame);
  shell.appendChild(status);
  shell.appendChild(frameWrap);
  shell.appendChild(actions);
  section.appendChild(title);
  section.appendChild(shell);

  main.insertBefore(section, main.firstChild);
}

function teardownAnimeSplineStage() {
  document.getElementById(ANIME_SPLINE_WRAPPER_ID)?.remove();
}

function rewriteNoticeTableBodyVi(table) {
  table.classList.add("fap-notice-table");

  let thead = table.querySelector("thead");
  if (!thead) {
    thead = document.createElement("thead");
    table.insertBefore(thead, table.firstChild);
  }
  thead.innerHTML = "";
  const trHead = document.createElement("tr");
  const th1 = document.createElement("th");
  th1.scope = "col";
  th1.innerHTML =
    '<span class="fap-notice-th-en">Type of procedure</span><span class="fap-notice-th-vi">Loại thủ tục</span>';
  const th2 = document.createElement("th");
  th2.scope = "col";
  th2.innerHTML =
    '<span class="fap-notice-th-en">Deadline</span><span class="fap-notice-th-vi">Hạn nộp đơn</span>';
  trHead.appendChild(th1);
  trHead.appendChild(th2);
  thead.appendChild(trHead);

  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  tbody.innerHTML = "";
  NOTICE_VI_ROWS.forEach((row) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = row.proc;
    const td2 = document.createElement("td");
    td2.textContent = row.deadline || "—";
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
}

function localizeStudentHeadings() {
  const main = document.getElementById("ctl00_mainContent_divMain");
  const newsH3 = main?.querySelector(".box.topAthletes h3.orangeTitle");
  if (newsH3 && newsH3.dataset.fapOrigTitle == null) {
    newsH3.dataset.fapOrigTitle = newsH3.textContent.trim();
    newsH3.textContent = "Tin tức";
  }
}

function restoreStudentHeadings() {
  const newsH3 = document.querySelector(".box.topAthletes h3.orangeTitle");
  if (newsH3?.dataset.fapOrigTitle != null) {
    newsH3.textContent = newsH3.dataset.fapOrigTitle;
    delete newsH3.dataset.fapOrigTitle;
  }
}

function moveImportantNoticeToBottom() {
  const main = document.getElementById("ctl00_mainContent_divMain");
  if (!main) {
    return;
  }
  const noticeBox = [...main.querySelectorAll(":scope > .box")].find((b) => {
    const t = (b.querySelector("h3")?.textContent || "").trim();
    return /important\s*notice/i.test(t);
  });
  if (!noticeBox) {
    return;
  }

  const h3 = noticeBox.querySelector("h3");
  if (h3 && h3.dataset.fapOrigTitle == null) {
    h3.dataset.fapOrigTitle = h3.textContent.trim();
  }
  if (h3) {
    h3.textContent = "Thông báo hạn nộp thủ tục";
  }

  const table = noticeBox.querySelector("table.table-bordered");
  if (table && table.dataset.fapViApplied !== "1") {
    try {
      table.dataset.fapOrigInner = btoa(unescape(encodeURIComponent(table.innerHTML)));
    } catch {
      table.dataset.fapOrigInner = "";
    }
    rewriteNoticeTableBodyVi(table);
    table.dataset.fapViApplied = "1";
  }

  noticeBox.classList.add("fap-notice-panel");
  main.appendChild(noticeBox);
}

function restoreImportantNoticePosition() {
  const main = document.getElementById("ctl00_mainContent_divMain");
  const notice = main?.querySelector(".fap-notice-panel");
  if (!notice) {
    return;
  }

  const table = notice.querySelector("table.table-bordered");
  if (table?.dataset.fapOrigInner) {
    const raw = table.dataset.fapOrigInner;
    if (raw.length > 0) {
      try {
        table.innerHTML = decodeURIComponent(escape(atob(raw)));
      } catch {
        /* keep current */
      }
    }
    delete table.dataset.fapOrigInner;
    delete table.dataset.fapViApplied;
  }

  const h3 = notice.querySelector("h3");
  if (h3?.dataset.fapOrigTitle != null) {
    h3.textContent = h3.dataset.fapOrigTitle;
    delete h3.dataset.fapOrigTitle;
  }

  notice.classList.remove("fap-notice-panel");

  const academic = main.querySelector('.box[data-fap-mosaic="1"]');
  if (academic) {
    main.insertBefore(notice, academic);
  } else {
    const news = main.querySelector(".box.topAthletes");
    if (news) {
      news.insertAdjacentElement("afterend", notice);
    }
  }
}

function onCommandPaletteShortcut(e) {
  if (!document.body.classList.contains(SKIN_CLASS)) {
    return;
  }
  const palette = document.getElementById("fap-command-palette");
  const paletteOpen = palette && !palette.hasAttribute("hidden");
  if (e.key === "Escape" && paletteOpen) {
    e.preventDefault();
    closeCommandPalette();
    return;
  }
  if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    toggleCommandPalette();
    return;
  }
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const t = e.target;
    const tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) {
      return;
    }
    e.preventDefault();
    openCommandPalette();
  }
}

function attachPaletteShortcutOnce() {
  if (paletteKeydownBound) {
    return;
  }
  document.addEventListener("keydown", onCommandPaletteShortcut, true);
  paletteKeydownBound = true;
}

function hasVietnamese(s) {
  if (!s || typeof s !== "string") {
    return false;
  }
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/.test(
    s
  );
}

function stashOrigText(el) {
  if (el.dataset.fapOrigText == null) {
    el.dataset.fapOrigText = el.textContent;
  }
}

function restoreOrigTextNodes(root) {
  root.querySelectorAll("[data-fap-orig-text]").forEach((el) => {
    el.textContent = el.dataset.fapOrigText;
    delete el.dataset.fapOrigText;
  });
}

function extractViSegment(p) {
  const s = p.trim();
  if (!s) {
    return null;
  }
  const tail = s.match(/\(([^)]+)\)\s*$/);
  if (tail && hasVietnamese(tail[1])) {
    const inside = tail[1].trim();
    if (inside.includes("|")) {
      return inside
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean)
        .join(" · ");
    }
    return inside;
  }
  const bi = s.match(/^([^/]+)\/([^/]+)$/);
  if (bi) {
    const left = bi[1].trim();
    const right = bi[2].trim();
    if (hasVietnamese(right) && !hasVietnamese(left)) {
      return right;
    }
  }
  if (hasVietnamese(s) && !/[A-Za-z]{5,}/.test(s)) {
    return s;
  }
  return null;
}

function localizeSingleAnchorText(text) {
  const t = (text || "").trim();
  if (!t) {
    return t;
  }

  if (t.includes("|")) {
    const parts = t.split("|").map((p) => p.trim()).filter(Boolean);
    const bits = parts.map(extractViSegment).filter(Boolean);
    if (bits.length > 0) {
      return bits.join(" · ");
    }
  }

  const one = extractViSegment(t);
  if (one) {
    return one;
  }

  const tailParen = t.match(/\(([^)]+)\)\s*$/);
  if (tailParen && hasVietnamese(tailParen[1])) {
    const inside = tailParen[1].trim();
    if (inside.includes("|")) {
      return inside
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean)
        .join(" · ");
    }
    return inside;
  }

  const paren = t.match(/\(([^)]+)\)/);
  if (paren && hasVietnamese(paren[1])) {
    const after = t.slice(t.indexOf(paren[0]) + paren[0].length).trim();
    const dash = after.match(/^[-–]\s*(.+)$/);
    if (dash && hasVietnamese(dash[1])) {
      return `${paren[1].trim()} – ${dash[1].trim()}`;
    }
    return paren[1].trim();
  }

  return t;
}

function rebuildLiAnchorsOnly(li, anchors) {
  const frag = document.createDocumentFragment();
  anchors.forEach((a, i) => {
    if (i > 0) {
      frag.appendChild(document.createTextNode(" · "));
    }
    frag.appendChild(a);
  });
  li.textContent = "";
  li.appendChild(frag);
}

function localizeDashLi(li) {
  const anchors = [...li.querySelectorAll("a[href]")];
  if (anchors.length === 0) {
    return;
  }

  const full = li.textContent.trim();

  if (anchors.length >= 2) {
    const parenMatch = full.match(/\(([^)]+)\)\s*$/);
    if (parenMatch && hasVietnamese(parenMatch[1])) {
      const segments = parenMatch[1]
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (segments.length >= anchors.length) {
        anchors.forEach((a, i) => {
          stashOrigText(a);
          a.textContent = segments[i];
        });
        rebuildLiAnchorsOnly(li, anchors);
        return;
      }
    }
  }

  anchors.forEach((a) => stashOrigText(a));
  anchors.forEach((a) => {
    a.textContent = localizeSingleAnchorText(a.dataset.fapOrigText);
  });
  if (anchors.length > 1) {
    rebuildLiAnchorsOnly(li, anchors);
  }
}

function stashAndLocalizeMosaicHeading(h4) {
  const raw = h4.textContent.trim();
  stashOrigText(h4);
  const m = raw.match(/\(([^)]+)\)\s*$/);
  if (m && hasVietnamese(m[1])) {
    h4.textContent = m[1].trim();
    return;
  }
  const slash = raw.match(/^(.+?)\/(.+)$/);
  if (slash) {
    const left = slash[1].trim();
    const right = slash[2].trim();
    if (hasVietnamese(right) && !hasVietnamese(left)) {
      h4.textContent = right;
      return;
    }
  }
  h4.textContent = raw;
}

function localizeAcademicMosaicVi(academicBox) {
  const root = academicBox.querySelector("table.fap-acad-mosaic");
  if (!root) {
    return;
  }
  root.querySelectorAll("h4").forEach((h4) => {
    stashAndLocalizeMosaicHeading(h4);
  });
  root.querySelectorAll("li.fap-dash-li").forEach((li) => {
    localizeDashLi(li);
  });
}

function unwrapTileShell(shell) {
  const parent = shell.parentElement;
  if (!parent) {
    return;
  }
  while (shell.firstChild) {
    parent.insertBefore(shell.firstChild, shell);
  }
  shell.remove();
}

function unwrapTitleRow(row) {
  const h4 = row.querySelector("h4");
  const parent = row.parentElement;
  if (!parent) {
    row.remove();
    return;
  }
  if (h4) {
    parent.insertBefore(h4, row);
  }
  row.remove();
}

function syncTileToggleButton(btn, shell) {
  const collapsed = shell.classList.contains("fap-dash-collapsed");
  btn.textContent = collapsed ? "Mở rộng" : "Thu gọn";
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function applyAcademicFilter(academicBox, raw) {
  const q = raw.trim().toLowerCase();
  academicBox.querySelectorAll(".fap-dash-tile").forEach((td) => {
    let any = false;
    td.querySelectorAll(".fap-dash-li").forEach((li) => {
      const show = !q || li.textContent.toLowerCase().includes(q);
      li.style.display = show ? "" : "none";
      if (show) {
        any = true;
      }
    });
    td.hidden = q.length > 0 && !any;
    if (q.length > 0 && any) {
      const shell = td.querySelector(".fap-dash-tile-shell");
      if (shell?.classList.contains("fap-dash-collapsed")) {
        shell.classList.remove("fap-dash-collapsed");
        const b = shell.querySelector(".fap-dash-toggle");
        if (b) {
          syncTileToggleButton(b, shell);
        }
      }
    }
  });
}

function wireAcademicTiles(academicBox) {
  const denseDefault =
    !window.matchMedia ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  academicBox.querySelectorAll(".fap-dash-tile-shell").forEach((shell) => {
    const h4 = shell.querySelector("h4");
    if (!h4 || h4.closest(".fap-dash-title-row")) {
      return;
    }

    const row = document.createElement("div");
    row.className = "fap-dash-title-row";
    h4.parentNode.insertBefore(row, h4);

    const actions = document.createElement("div");
    actions.className = "fap-dash-title-actions";

    const meta = document.createElement("span");
    meta.className = "fap-dash-meta";
    const count = shell.querySelectorAll(".fap-dash-li").length;
    meta.textContent = `${count} mục`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fap-dash-toggle";
    btn.textContent = "Thu gọn";
    btn.setAttribute("aria-expanded", "true");

    row.appendChild(h4);
    actions.appendChild(meta);
    actions.appendChild(btn);
    row.appendChild(actions);

    btn.addEventListener("click", () => {
      shell.classList.toggle("fap-dash-collapsed");
      syncTileToggleButton(btn, shell);
    });

    if (denseDefault && count > 6) {
      shell.classList.add("fap-dash-collapsed");
      syncTileToggleButton(btn, shell);
    }
  });
}

function injectAcademicToolbar(academicBox) {
  if (document.getElementById("fap-acad-toolbar")) {
    return;
  }
  const lw = academicBox.querySelector(".listBoxWrapper");
  if (!lw) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.id = "fap-acad-toolbar";
  toolbar.className = "fap-acad-toolbar";
  toolbar.innerHTML = `
    <p class="fap-acad-toolbar-lead">Lọc theo chữ hoặc thu gọn từng nhóm.</p>
    <div class="fap-acad-toolbar-row">
      <label class="fap-acad-sr-only" for="fap-acad-filter">Lọc liên kết</label>
      <input type="search" id="fap-acad-filter" class="fap-acad-filter" autocomplete="off" placeholder="Từ khóa (lịch, điểm, học phí…)" />
      <button type="button" class="fap-acad-btn" id="fap-acad-expand-all">Mở rộng tất cả</button>
      <button type="button" class="fap-acad-btn fap-acad-btn--ghost" id="fap-acad-collapse-all">Thu gọn tất cả</button>
    </div>
  `;
  lw.insertBefore(toolbar, lw.firstChild);

  const input = toolbar.querySelector("#fap-acad-filter");
  const runFilter = () => applyAcademicFilter(academicBox, input.value);

  input.addEventListener("input", runFilter);
  input.addEventListener("search", runFilter);

  toolbar.querySelector("#fap-acad-expand-all").addEventListener("click", () => {
    academicBox.querySelectorAll(".fap-dash-tile-shell").forEach((shell) => {
      shell.classList.remove("fap-dash-collapsed");
      const b = shell.querySelector(".fap-dash-toggle");
      if (b) {
        syncTileToggleButton(b, shell);
      }
    });
    academicBox.querySelectorAll(".fap-dash-tile").forEach((td) => {
      td.hidden = false;
    });
    runFilter();
  });

  toolbar.querySelector("#fap-acad-collapse-all").addEventListener("click", () => {
    academicBox.querySelectorAll(".fap-dash-tile-shell").forEach((shell) => {
      shell.classList.add("fap-dash-collapsed");
      const b = shell.querySelector(".fap-dash-toggle");
      if (b) {
        syncTileToggleButton(b, shell);
      }
    });
  });
}

/**
 * FAP đặt hàng đầu là <td colspan="2"> chỉ chứa #ctl00_mainContent_lblThongbao (thường rỗng).
 * Với tbody display:grid + tr display:contents, colspan không còn nghĩa — một ô chỉ chiếm 1 cột
 * trong lưới 12, phần còn lại hiện nền --fap-grid-line (khối đen). Ẩn hàng rỗng hoặc kéo full width.
 */
function mosaicCellPlainText(td) {
  return td.textContent
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/**
 * Mọi hàng chỉ một <td>, không có h4 (hàng thông báo / spacer): với display:grid trên tbody
 * đều phải full-width hoặc ẩn — không phụ thuộc colspan (FAP đôi khi bỏ attribute).
 */
function normalizeAcademicMosaicGridRows(innerTbody) {
  innerTbody.querySelectorAll(":scope > tr").forEach((tr) => {
    const cells = [...tr.querySelectorAll(":scope > td")];
    if (cells.length !== 1) {
      return;
    }
    const td = cells[0];
    if (td.querySelector("h4")) {
      return;
    }
    const plain = mosaicCellPlainText(td);
    if (!plain) {
      tr.classList.add("fap-acad-mosaic-skip-row");
      tr.dataset.fapAcadMosaicSkip = "1";
      return;
    }
    td.classList.add("fap-acad-mosaic-banner");
    td.dataset.fapAcadMosaicBanner = "1";
  });
}

function enhanceAcademicMosaic() {
  const titleHeading = document.querySelector("#ctl00_mainContent_divMain .box h3.orangeTitle");
  const academicBox = titleHeading?.closest(".box");
  if (!academicBox || academicBox.dataset.fapMosaic === "1") {
    return;
  }
  const outerTd = academicBox.querySelector(".listBoxWrapper > table > tbody > tr > td");
  const innerTable = outerTd?.querySelector(":scope > table");
  const innerTbody = innerTable?.querySelector("tbody");
  if (!innerTable || !innerTbody) {
    return;
  }

  innerTable.classList.add("fap-acad-mosaic");
  normalizeAcademicMosaicGridRows(innerTbody);

  const acadH3 = academicBox.querySelector("h3.orangeTitle");
  if (acadH3 && acadH3.dataset.fapOrigTitle == null) {
    acadH3.dataset.fapOrigTitle = acadH3.textContent.trim();
    acadH3.textContent = "Thông tin học tập";
  }

  academicBox.classList.add("fap-acad-section");

  innerTbody.querySelectorAll(":scope > tr").forEach((tr) => {
    if (tr.classList.contains("fap-acad-mosaic-skip-row")) {
      return;
    }
    const cells = [...tr.querySelectorAll(":scope > td")];
    const h4Cells = cells.filter((td) => td.querySelector("h4"));

    cells.forEach((td) => {
      if (td.classList.contains("fap-acad-mosaic-banner")) {
        return;
      }
      if (!td.querySelector("h4")) {
        const empty = mosaicCellPlainText(td) === "";
        if (empty && cells.length > 1) {
          td.classList.add("fap-dash-skip");
        }
        return;
      }

      if (td.querySelector(":scope > .fap-dash-tile-shell")) {
        return;
      }

      const shell = document.createElement("div");
      shell.className = "fap-dash-tile-shell";
      while (td.firstChild) {
        shell.appendChild(td.firstChild);
      }
      td.appendChild(shell);
      td.classList.add("fap-dash-tile");

      td.querySelectorAll("ul li").forEach((li) => {
        li.classList.add("fap-dash-li");
      });
      const h4 = td.querySelector("h4");
      if (h4) {
        h4.classList.add("fap-dash-title");
      }

      const colspan = parseInt(td.getAttribute("colspan") || "1", 10);
      if (colspan >= 2) {
        td.classList.add("fap-dash-span-full");
      } else if (h4Cells.length === 2) {
        const idx = h4Cells.indexOf(td);
        td.classList.add(idx === 0 ? "fap-dash-span-a" : "fap-dash-span-b");
      } else {
        td.classList.add("fap-dash-span-full");
      }
    });
  });

  localizeAcademicMosaicVi(academicBox);

  wireAcademicTiles(academicBox);
  injectAcademicToolbar(academicBox);

  academicBox.dataset.fapMosaic = "1";
}

function teardownAcademicMosaic() {
  const academicBox = document.querySelector('#ctl00_mainContent_divMain .box[data-fap-mosaic="1"]');
  if (!academicBox) {
    return;
  }
  restoreOrigTextNodes(academicBox);
  academicBox.classList.remove("fap-acad-section");
  const acadH3 = academicBox.querySelector("h3.orangeTitle");
  if (acadH3?.dataset.fapOrigTitle != null) {
    acadH3.textContent = acadH3.dataset.fapOrigTitle;
    delete acadH3.dataset.fapOrigTitle;
  }
  document.getElementById("fap-acad-toolbar")?.remove();
  closeCommandPalette();
  document.getElementById("fap-command-palette")?.remove();
  academicBox.querySelectorAll(".fap-dash-title-row").forEach(unwrapTitleRow);
  academicBox.querySelectorAll(".fap-dash-li").forEach((li) => {
    li.style.removeProperty("display");
  });
  academicBox.querySelectorAll(".fap-dash-tile").forEach((td) => {
    td.hidden = false;
  });
  academicBox.querySelectorAll(".fap-dash-tile-shell").forEach(unwrapTileShell);
  academicBox.querySelectorAll(".fap-dash-tile").forEach((td) => {
    td.classList.remove(
      "fap-dash-tile",
      "fap-dash-span-full",
      "fap-dash-span-a",
      "fap-dash-span-b"
    );
  });
  academicBox.querySelectorAll(".fap-dash-skip").forEach((td) => {
    td.classList.remove("fap-dash-skip");
  });
  academicBox.querySelectorAll("tr.fap-acad-mosaic-skip-row").forEach((tr) => {
    tr.classList.remove("fap-acad-mosaic-skip-row");
    delete tr.dataset.fapAcadMosaicSkip;
  });
  academicBox.querySelectorAll("td.fap-acad-mosaic-banner").forEach((td) => {
    td.classList.remove("fap-acad-mosaic-banner");
    delete td.dataset.fapAcadMosaicBanner;
  });
  academicBox.querySelectorAll(".fap-dash-li").forEach((li) => {
    li.classList.remove("fap-dash-li");
  });
  academicBox.querySelectorAll(".fap-dash-title").forEach((h) => {
    h.classList.remove("fap-dash-title");
  });
  academicBox.querySelector(".fap-acad-mosaic")?.classList.remove("fap-acad-mosaic");
  delete academicBox.dataset.fapMosaic;
}

function refreshDomRemodel(enabled) {
  if (enabled) {
    enhanceAcademicMosaic();
  } else {
    teardownAcademicMosaic();
  }
}

function refreshRevealObservers(enabled) {
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }
  clearRevealClasses();
  if (!enabled) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const nodes = [];
  const quickStrip = document.getElementById("fap-quick-strip");
  if (quickStrip) {
    nodes.push(quickStrip);
  }
  document.querySelectorAll("#ctl00_mainContent_divMain > .box").forEach((el) => {
    nodes.push(el);
  });
  const noticeTable = document.querySelector(".fap-notice-panel table.table-bordered");
  if (noticeTable) {
    nodes.push(noticeTable);
  }
  const headerRow = document.querySelector(".container > .row:first-of-type");
  if (headerRow && !headerRow.querySelector("#ctl00_mainContent_divMain")) {
    nodes.push(headerRow);
  }
  document.querySelectorAll(".fap-dash-tile").forEach((el) => {
    nodes.push(el);
  });

  nodes.forEach((el, i) => {
    el.classList.add("fap-skin-reveal");
    el.style.setProperty("--fap-reveal-index", String(i));
  });

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fap-skin-reveal--visible");
        }
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
  );

  document.querySelectorAll(".fap-skin-reveal").forEach((el) => {
    revealObserver.observe(el);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll(".fap-skin-reveal:not(.fap-skin-reveal--visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh && r.bottom > 0) {
        el.classList.add("fap-skin-reveal--visible");
      }
    });
  });
}

function applySkin(enabled) {
  if (!document.body) {
    return;
  }
  document.body.classList.toggle(SKIN_CLASS, Boolean(enabled));
  if (enabled) {
    document.documentElement.lang = document.documentElement.lang || "vi";
  }
  if (enabled) {
    attachPaletteShortcutOnce();
  } else {
    closeCommandPalette();
    document.getElementById("fap-command-palette")?.remove();
  }
  queueMicrotask(() => {
    if (!enabled) {
      teardownScheduleChronos();
      window.fapTranscriptGpa?.teardown();
      restoreStudentHeadings();
      restoreImportantNoticePosition();
      document.getElementById("fap-quick-strip")?.remove();
      teardownAnimeSplineStage();
    }
    refreshDomRemodel(enabled);
    if (enabled) {
      injectQuickStrip();
      injectAnimeSplineStage();
      localizeStudentHeadings();
      moveImportantNoticeToBottom();
      enhanceScheduleChronos();
      window.fapTranscriptGpa?.enhance();
    }
    refreshLinkHintState(enabled);
    refreshRevealObservers(enabled);
  });
}

function initFromStorage() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const enabled = result[STORAGE_KEY] !== false;
    applySkin(enabled);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFromStorage);
} else {
  initFromStorage();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "fap-skin-set") {
    const enabled = Boolean(message.enabled);
    chrome.storage.local.set({ [STORAGE_KEY]: enabled }, () => {
      applySkin(enabled);
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "fap-skin-get") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({ enabled: result[STORAGE_KEY] !== false });
    });
    return true;
  }
  return false;
});
