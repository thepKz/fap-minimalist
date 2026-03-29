# FPTU — Logic điểm học phần & GPA (tham chiếu cho tool)

Tài liệu lưu theo mô tả người dùng; khi triển khai tool nên đối chiếu **Quy định / Handbook** hiện hành của trường.

---

## Điểm học phần (course grade)

- Thang điểm tổng kết học phần: **thang 10**; có thể quy đổi sang **điểm chữ** và **điểm 4** khi cần.
- **Điểm một học phần** = tổng các thành phần (chuyên cần, bài tập, giữa kỳ, cuối kỳ, …) nhân **trọng số** tương ứng.
- **Làm tròn** điểm học phần đến **1 chữ số thập phân**.
- **Học lại** môn đã đạt để cải thiện điểm: **kết quả cũ bị hủy**, chỉ **kết quả mới** được giữ.

---

## GPA (trung bình có trọng số tín chỉ)

Công thức:

\[
A = \frac{\sum_i (a_i \times n_i)}{\sum_i n_i}
\]

- \(a_i\) — **điểm tổng kết** học phần \(i\) (thang 10).
- \(n_i\) — **số tín chỉ** của học phần đó.

**Không tính vào GPA** (loại môn / nhóm môn điển hình):

- Tiếng Anh chuẩn bị (Preparatory English),
- Giáo dục quốc phòng (GDQP),
- Giáo dục thể chất (GDTC),
- OJT (thực tập tại doanh nghiệp / on-the-job training).

**Áp dụng cho:**

- Điểm trung bình **học kỳ**,
- Điểm trung bình **tích lũy**,

cùng công thức trên; **làm tròn đến 2 chữ số thập phân**.

---

## Điều kiện xét tốt nghiệp (tóm tắt)

- Hoàn thành đủ **tín chỉ** theo chương trình.
- Có **chứng chỉ / hoàn thành** các phần **GDQP**, **GDTC**, **OJT** (theo yêu cầu).
- Hoàn tất **nghĩa vụ tài chính**.
- **GPA tích lũy tại trường ≥ 5.0**.

**Hạ hạng tốt nghiệp** (có thể giảm 1 mức nếu đủ điều kiện xuất sắc/giỏi nhưng):

- Tín chỉ **học lại** vượt quá **5%** tổng tín chỉ chương trình, **hoặc**
- Từng bị **kỷ luật từ mức cảnh cáo** trở lên.

---

## Thang xếp loại (thang 10)

Theo mô tả đã cung cấp:

| Khoảng điểm (thang 10) | Xếp loại      |
|------------------------|---------------|
| 9.0 – 10.0             | Xuất sắc      |
| 8.5 – < 9.0            | Giỏi          |
| 7.5 – < 8.0            | Khá           |
| 6.5 – < 7.0            | Trung bình khá|
| 5.0 – < 5.5            | Trung bình    |
| Dưới 5.0               | Không đạt     |

**Lưu ý:** Bảng trên có **khoảng trống** giữa các mức (ví dụ 8.0–8.5, 7.0–7.5, 5.5–6.5) trong bản gốc — khi code tool cần **đối chiếu quy định chính thức** hoặc xác nhận lại ranh giới.

---

## Ví dụ nhanh

3 học phần: \((8.0, 3)\), \((7.0, 2)\), \((6.0, 4)\) tín chỉ.

\[
\text{GPA} = \frac{8 \times 3 + 7 \times 2 + 6 \times 4}{3 + 2 + 4} = \frac{62}{9} \approx 6.89
\]

(Làm tròn 2 chữ số thập phân cho GPA tích lũy / học kỳ theo quy tắc trường.)

---

## Gợi ý triển khai tool (sau này)

1. Parser / nhập liệu: danh sách `(mã môn, tín chỉ, điểm tổng kết, cờ loại môn: có/không tính GPA)`.
2. Lọc bỏ môn thuộc nhóm **không tính GPA** (theo mã hoặc tên khóa học — cần danh mục ổn định).
3. Hàm `weightedGPA(rows)`: chỉ tính trên các dòng được tính; `round(x, 2)`.
4. Hàm `courseGradeFromComponents(components[])`: trọng số + làm tròn 1 chữ số.
5. Xếp loại: map khoảng điểm sau khi **chuẩn hóa** bảng mức từ handbook.
