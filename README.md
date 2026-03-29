# FAP Minimal Skin

Extension Chrome (Manifest V3) giao diện tối giản / industrial cho [FPT Academic Portal](https://fap.fpt.edu.vn).

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

## Cài đặt (unpacked)

1. Mở `chrome://extensions` (Edge: `edge://extensions`).
2. Bật **Developer mode**.
3. **Load unpacked** → chọn thư mục `fap-minimal-extension`.
4. Mở `https://fap.fpt.edu.vn/...` sau khi đăng nhập; bật theme từ icon extension.

Nếu popup báo không gửi được tin nhắn tới tab: đang ở tab `fap.fpt.edu.vn`, rồi bật lại công tắc.

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
