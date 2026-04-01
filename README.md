# FAP Minimal Skin

Extension Chrome (Manifest V3) giao diện tối giản / industrial cho [FPT Academic Portal](https://fap.fpt.edu.vn).

## Privacy Policy

- Xem tại: `PRIVACY_POLICY.md`

## Tính năng (khi bật theme)

### Giao diện chung

- Nền warm monochrome, noise rất nhẹ; cột nội dung gọn (max-width); typography: Plus Jakarta Sans / Source Sans 3 / JetBrains Mono.
- Bảng, thẻ, viền 1px; hover link có thanh gợi ý URL ở dưới trang.

### Trang Student / Academic Information

- **Lưới mosaic** “Thông tin học tập”: bọc nhóm, ô lọc, thu gọn từng nhóm; Vi hóa tiêu đề/link theo khả năng; xử lý hàng thông báo / ô trống để tránh lỗi lưới (khối tối).
- **Dải lối tắt ưu tiên** (chip): điểm danh, điểm theo kỳ, điểm toàn khóa, chuyển lớp, TKB tuần, lịch thi, khung CT, gửi/xem đơn, v.v.; nhóm **Khác** (lịch học, hồ sơ, …).
- **Command palette**: **Ctrl/Cmd+K** hoặc **/** (ngoài ô nhập) để tìm và mở trang nhanh.
- Khối **IMPORTANT NOTICE** / thông báo hạn nộp: đưa xuống cuối, tiêu đề & bảng tiếng Việt khi có dữ liệu.

### Thời khóa biểu tuần (`Report/ScheduleOfWeek.aspx`) — Chronos

- Vùng bảng kiểu **dark / mono**: thẻ buổi học, nút **Chi tiết / Tài liệu / EduNext** (ẩn link trùng giao diện).
- **Slot đang diễn ra**: làm nổi bật (glow nhịp) khi trùng ngày + khung giờ; có làm mới định kỳ.
- **Ẩn các hàng chỉ có dấu (-)**; checkbox **Hiện các slot chỉ có dấu (-)** để bật lại.
- Cuộn ngang trên màn hẹp.

### Bảng điểm tích lũy (`Grade/StudentTranscript.aspx`)

- **`transcript-gpa.js`**: panel **GPA tích lũy** (có trọng số TC), quy tắc loại trừ (dòng `*`, OJT, planning, …), máy tính / dự báo tùy cấu hình trong script.

### Popup extension

- Bật/tắt theme (lưu `chrome.storage`).
- **Tặng 1 sao** → [github.com/thepKz/fap-minimalist](https://github.com/thepKz/fap-minimalist)
- **Báo lỗi** → [facebook.com/thepp.tan](https://www.facebook.com/thepp.tan/)

### Preview & dev

- **Preview tĩnh**: `preview/student-preview.html` (Bootstrap 3 + `fap-minimal.css`). Có thể thêm match localhost trong `manifest.json` để test.
- Content script **không** chạy trên mọi origin nếu không khớp `matches` — trên FAP thật cần extension đã load.

## Cài đặt miễn phí (không qua Chrome Web Store)

Cách này **không tốn phí**: tải code từ GitHub rồi bật chế độ nhà phát triển trên trình duyệt.

### Cách 1: Tải ZIP trên GitHub (nhanh nhất)

1. Vào repo: [github.com/thepKz/fap-minimalist](https://github.com/thepKz/fap-minimalist).
2. Bấm nút **Code** → **Download ZIP**.
3. Giải nén. Bạn sẽ có thư mục kiểu `fap-minimalist-main` (tên có thể khác tùy branch).
4. Bên trong là thư mục **`fap-minimal-extension`** — đó là thư mục phải chọn khi cài (trong đó có file `manifest.json` ngay tại gốc).

### Cách 2: Clone bằng Git

```bash
git clone https://github.com/thepKz/fap-minimalist.git
cd fap-minimalist/fap-minimal-extension
```

Giữ nguyên thư mục `fap-minimal-extension`; không cần `npm install` hay build gì thêm.

### Gắn extension vào Chrome / Chromium

1. Mở `chrome://extensions`.
2. Bật **Developer mode** (góc phải).
3. **Load unpacked** → chọn thư mục **`fap-minimal-extension`** (phải thấy `manifest.json` ngay trong thư mục đó).
4. Mở [FAP](https://fap.fpt.edu.vn), đăng nhập, bấm icon extension và **bật theme**.

### Microsoft Edge

1. Mở `edge://extensions`.
2. Bật **Developer mode** (cạnh dưới bên trái hoặc trong menu tùy phiên bản).
3. **Load unpacked** → chọn lại thư mục **`fap-minimal-extension`**.

### Gặp lỗi thường gặp

| Hiện tượng | Cách xử lý |
|------------|------------|
| “Manifest file is missing or unreadable” | Bạn đang chọn nhầm thư mục cha; phải chọn thư mục **có `manifest.json`**. |
| Popup không bật được theme | Đang mở tab `fap.fpt.edu.vn`, thử tắt/bật lại công tắc trong popup. |
| Cập nhật bản mới | **Download ZIP** lại và **Load unpacked** trỏ vào thư mục mới, *hoặc* trên `chrome://extensions` bấm **Reload** (mũi tên tròn) sau khi thay file. |

### Cập nhật sau này

- **ZIP**: tải lại từ GitHub, giải nén đè hoặc vào `chrome://extensions` → **Reload** extension.
- **Git**: `git pull` trong repo, rồi **Reload** extension.

## Cấu trúc thư mục

| File / thư mục | Vai trò |
|----------------|---------|
| `manifest.json` | MV3, `storage`, `activeTab`, content scripts + CSS |
| `styles/fap-minimal.css` | Theme chính (`body.fap-minimal-skin`) |
| `scripts/content.js` | Skin, mosaic, lối tắt, palette, Chronos schedule, … |
| `scripts/transcript-gpa.js` | GPA & panel trên transcript |
| `popup/` | UI bật/tắt + liên kết GitHub / Facebook |
| `preview/` | HTML preview |
| `icons/` | Icon extension |

## Icon (tùy chọn)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1
```

## Lưu ý

- Không sửa `__VIEWSTATE` / logic form; chỉ overlay giao diện và DOM phụ trợ UI.
- Extension dùng cá nhân; tuân quy định nội bộ nếu có.
