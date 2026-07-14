# MY SPA — Danh sách Issue chi tiết

> Phiên bản: 14/07/2026 · Nguồn: Rà soát 29 màn hình trong tài liệu "Tổng quan dự án"
> Mức độ: 🔴 Critical (sai tiền/sai nghiệp vụ) · 🟡 Major (dữ liệu không nhất quán) · 🟠 Minor/Enhancement (thiếu chức năng)

---

## 🔴 CRITICAL — Sửa ngay, đang gây sai dữ liệu tài chính

---

### ISS-001 · Luồng nghiệp vụ chạy ngược: Đơn hàng sinh ra Lịch hẹn

**Mức độ:** 🔴 Critical · **Module:** Lịch hẹn, Đơn hàng

**Mô tả:** Hệ thống tạo đơn hàng (thu tiền) trước, sau đó tự động sinh lịch hẹn. Ghi chú lịch hẹn hiển thị "Tự động tạo từ đơn hàng f30a8c64-...". Giờ hẹn bị gán theo giờ tạo đơn.

**Bước tái hiện:**
1. Vào Quầy POS, tạo đơn hàng có dịch vụ lúc 02:44 AM
2. Vào trang Lịch hẹn
3. Quan sát: lịch hẹn mới được tạo tự động với giờ hẹn = 02:44 AM

**Hành vi hiện tại:** Lịch hẹn có giờ 00:13, 02:34, 02:44, 03:41 (giờ spa đóng cửa). Khách không được chọn giờ thực tế.

**Hành vi mong đợi:**
- Luồng chuẩn: `Đặt lịch → Xác nhận → Check-in → Đang thực hiện → Hoàn thành → Thanh toán (sinh đơn hàng)`
- Đơn hàng chỉ được tạo TRƯỚC lịch hẹn trong 2 trường hợp: (a) bán gói liệu trình, (b) bán lẻ sản phẩm
- Nếu đơn POS chứa dịch vụ → bắt buộc mở bước chọn ngày giờ + KTV trước khi hoàn tất đơn

**Tiêu chí nghiệm thu:**
- [ ] Không thể tạo lịch hẹn ngoài khung giờ mở cửa (cấu hình được, VD 08:00–21:00)
- [ ] Đơn hàng dịch vụ luôn gắn với 1 lịch hẹn có giờ do người dùng chọn
- [ ] Ghi chú tự động hiển thị mã đơn ngắn dạng link, không hiển thị UUID

---

### ISS-002 · Cho phép "Hoàn thành" lịch hẹn trong tương lai

**Mức độ:** 🔴 Critical · **Module:** Lịch hẹn

**Mô tả:** Lịch hẹn ngày 16/07/2026 và 15/07/2026 đã ở trạng thái "Hoàn thành" trong khi ngày hiện tại là 14/07/2026.

**Bước tái hiện:**
1. Tạo lịch hẹn với ngày giờ trong tương lai
2. Đổi trạng thái sang "Hoàn thành" → hệ thống chấp nhận

**Hành vi mong đợi:**
- Chặn chuyển trạng thái "Hoàn thành" nếu `giờ hẹn > thời điểm hiện tại`
- State machine hợp lệ: chỉ cho chuyển trạng thái theo đúng thứ tự (không nhảy từ "Chờ xác nhận" thẳng sang "Hoàn thành")

**Tiêu chí nghiệm thu:**
- [ ] API từ chối cập nhật "Hoàn thành" cho lịch tương lai, trả lỗi rõ ràng
- [ ] Ma trận chuyển trạng thái được định nghĩa và enforce ở backend (không chỉ ẩn nút ở UI)

---

### ISS-003 · Hoa hồng hiển thị/tính toán mâu thuẫn giữa các trang (bug ×100)

**Mức độ:** 🔴 Critical · **Module:** Dịch vụ, Lương & hoa hồng

**Mô tả:** Trang Dịch vụ hiển thị hoa hồng "Chăm sóc da mặt cơ bản" = **0.05%**, nhưng popup Chi tiết hoa hồng tính **10%** (25.000đ trên 250.000đ) cho cùng dịch vụ. Hai trang đọc dữ liệu theo 2 quy ước khác nhau (0.05 dạng thập phân vs 5 dạng phần trăm, lệch nhau 100 lần).

**Hành vi mong đợi:**
- Chọn MỘT quy ước duy nhất toàn hệ thống. Khuyến nghị: DB lưu số nguyên/thập phân theo đơn vị phần trăm (`10` = 10%), UI hiển thị `10%`
- Migration sửa toàn bộ dữ liệu cũ về đúng quy ước
- Form nhập có validation: hoa hồng 0–100, cảnh báo nếu > 50%

**Tiêu chí nghiệm thu:**
- [ ] Giá trị hoa hồng hiển thị giống nhau ở: trang Dịch vụ, form sửa dịch vụ, chi tiết hoa hồng, báo cáo
- [ ] Test case: dịch vụ 250.000đ hoa hồng 10% → ghi nhận đúng 25.000đ

---

### ISS-004 · Hoa hồng không tự động — phải bấm "Sinh bù hoa hồng" thủ công

**Mức độ:** 🔴 Critical · **Module:** Lương & hoa hồng, Đơn hàng

**Mô tả:** Trang Lương có nút "Sinh bù hoa hồng", chứng tỏ hoa hồng không được ghi nhận tự động khi đơn hàng thanh toán. Rủi ro: quên chạy → thiếu lương nhân viên; chạy 2 lần → trả trùng.

**Hành vi mong đợi:**
- Hoa hồng sinh TỰ ĐỘNG (event/transaction) tại thời điểm đơn hàng chuyển trạng thái "Đã thanh toán" (với lịch hẹn: yêu cầu đồng thời "Hoàn thành")
- Idempotency: mỗi cặp (đơn hàng, dòng dịch vụ, nhân viên) chỉ sinh 1 bản ghi hoa hồng — dùng unique constraint
- Hoàn tiền/hủy đơn → tự sinh bản ghi hoa hồng ÂM (hồi tố), không xóa bản ghi cũ
- Nút "Sinh bù" giữ lại làm công cụ sửa lỗi, yêu cầu quyền admin + ghi log ai chạy, lúc nào, sinh những dòng nào

**Tiêu chí nghiệm thu:**
- [ ] Thanh toán đơn → bản ghi hoa hồng xuất hiện ngay không cần thao tác
- [ ] Chạy "Sinh bù" 2 lần liên tiếp → không tạo bản ghi trùng
- [ ] Hoàn tiền đơn → tổng hoa hồng kỳ giảm tương ứng, có dòng âm truy vết được

---

### ISS-005 · Liệu trình trừ buổi khi LÊN LỊCH thay vì khi HOÀN THÀNH

**Mức độ:** 🔴 Critical · **Module:** Liệu trình khách hàng

**Mô tả:** Gói của khách Vũ Hoàng Bách hiển thị "Đã dùng 10/10 buổi - còn 0" nhưng danh sách buổi chỉ có Buổi 2 "Hoàn thành"; các buổi 1, 4, 5, 6 mới "Đã lên lịch", buổi 3 "Đã dời lịch". Số dư buổi bị trừ ngay khi xếp lịch.

**Hành vi mong đợi:**
- Tách 2 khái niệm: `buổi đã đặt chỗ (reserved)` và `buổi đã sử dụng (consumed)`
- Chỉ trừ vào "đã sử dụng" khi buổi chuyển trạng thái "Hoàn thành"
- Hủy/dời lịch → trả buổi về trạng thái khả dụng
- Hiển thị: "Đã dùng 1/10 · Đã đặt lịch 5 · Còn tự do 4"

**Tiêu chí nghiệm thu:**
- [ ] Hủy 1 buổi đã lên lịch → số buổi còn lại tăng tương ứng
- [ ] Chỉ buổi "Hoàn thành" mới tính vào "đã dùng"

---

### ISS-006 · Chuyển đổi liệu trình làm mất giá trị tiền không truy vết

**Mức độ:** 🔴 Critical · **Module:** Chuyển đổi liệu trình

**Mô tả:** Bản ghi chuyển đổi: giá trị quy đổi **3.150.000đ** → nhận sản phẩm "Sữa Rửa Mặt Cetaphil 500ml" giá **320.000đ**, cột Tiền bù = "—". Chênh lệch ~2.830.000đ biến mất khỏi hệ thống. Ngoài ra khách có gói "còn 0 buổi" vẫn thực hiện được chuyển đổi trị giá 3.150.000đ.

**Hành vi mong đợi:**
- Công thức bắt buộc: `Giá trị buổi còn lại − Tổng giá trị sản phẩm nhận = Tiền bù`
  - Dương → hoàn khách (tiền mặt/CK/ghi có vào tài khoản khách)
  - Âm → khách trả thêm, sinh đơn thanh toán
- Chặn chuyển đổi nếu số buổi còn lại = 0
- Chuyển đổi phải: trừ tồn kho sản phẩm, hồi tố hoa hồng bán gói tương ứng phần chưa dùng, ghi sổ đầy đủ

**Tiêu chí nghiệm thu:**
- [ ] Không thể lưu chuyển đổi khi chênh lệch ≠ 0 mà Tiền bù trống
- [ ] Gói 0 buổi còn lại → nút chuyển đổi bị vô hiệu
- [ ] Sau chuyển đổi: tồn kho giảm, có bút toán hoàn/thu chênh lệch

---

### ISS-007 · RBAC chưa hoạt động — tất cả vai trò có 0 quyền

**Mức độ:** 🔴 Critical · **Module:** Hệ thống (Vai trò, Phân quyền)

**Mô tả:** Trang Quản lý vai trò: cả 6 vai trò (ADMIN, MANAGER, RECEPTIONIST, STAFF, THERAPIST, USER) đều có "Số quyền = 0". Phân quyền chỉ là vỏ — mọi tài khoản đăng nhập đều truy cập được toàn bộ chức năng, kể cả lương và báo cáo tài chính.

**Hành vi mong đợi:**
- Định nghĩa permission matrix tối thiểu:
  - **RECEPTIONIST (Lễ tân):** lịch hẹn, khách hàng, POS, xem dịch vụ · KHÔNG: lương, báo cáo, cấu hình
  - **THERAPIST (KTV):** xem lịch của mình, cập nhật trạng thái buổi, xem hoa hồng của mình
  - **MANAGER:** tất cả trừ quản trị hệ thống
  - **ADMIN:** toàn quyền
- Enforce ở backend (middleware/guard), không chỉ ẩn menu
- Gộp STAFF và THERAPIST nếu trùng ý nghĩa (hiện 1 người gán cả 2)

**Tiêu chí nghiệm thu:**
- [ ] Đăng nhập bằng tài khoản lễ tân → gọi API lương trả về 403
- [ ] Mỗi vai trò có số quyền > 0 và đúng ma trận

---

## 🟡 MAJOR — Dữ liệu không nhất quán, sai hiển thị

---

### ISS-008 · Dashboard: doanh thu giảm hiển thị màu xanh + icon tăng trưởng

**Mức độ:** 🟡 Major · **Module:** Dashboard

**Mô tả:** "Doanh thu tháng này 2.870.999đ · -6.259.001đ so với tháng trước" hiển thị chữ xanh lá kèm icon mũi tên tăng.

**Hành vi mong đợi:** Delta âm → màu đỏ + mũi tên xuống; delta dương → xanh + mũi tên lên. Áp dụng thống nhất cho mọi thẻ chỉ số.

---

### ISS-009 · Dashboard: so sánh "Doanh thu hôm nay" với "tháng trước"

**Mức độ:** 🟡 Major · **Module:** Dashboard

**Mô tả:** Thẻ "Doanh thu hôm nay 0đ · -69% so với tháng trước" — so sánh 1 ngày với 1 tháng là vô nghĩa thống kê.

**Hành vi mong đợi:** So với cùng ngày tuần trước, hoặc trung bình ngày của 30 ngày gần nhất. Sửa label tương ứng.

---

### ISS-010 · Dashboard và trang Sản phẩm lệch số cảnh báo tồn kho

**Mức độ:** 🟡 Major · **Module:** Dashboard, Sản phẩm

**Mô tả:** Dashboard: "Cần nhập kho: 0". Trang Sản phẩm: "Sắp hết hàng: 1" (sản phẩm tồn 5). Hai nơi dùng ngưỡng khác nhau hoặc query khác nhau.

**Hành vi mong đợi:** Một nguồn sự thật duy nhất: mỗi sản phẩm có trường `ngưỡng cảnh báo tồn`, cả 2 màn hình query cùng điều kiện `tồn ≤ ngưỡng`.

---

### ISS-011 · Dashboard: "Gói liệu trình đã bán: 0" trong khi có đơn bán gói

**Mức độ:** 🟡 Major · **Module:** Dashboard

**Mô tả:** Đơn hàng tháng có dòng "Liệu trình trị mụn tận gốc 10 buổi x1 · 3.500.000đ" nhưng thẻ "Gói liệu trình đã bán trong tháng" = 0.

**Hành vi mong đợi:** Đếm số gói trong các đơn đã tạo/đã thanh toán trong tháng (định nghĩa rõ theo trạng thái nào).

---

### ISS-012 · Báo cáo lệch 100.000đ so với trang Đơn hàng + chia trung bình sai

**Mức độ:** 🟡 Major · **Module:** Báo cáo

**Mô tả:**
1. Báo cáo "Tổng doanh thu 12.000.999đ" vs Đơn hàng "Đã thu 12.100.999đ" — lệch đúng 100.000đ (khoản thanh toán một phần của đơn Tổng Quốc Khanh). Hai màn hình định nghĩa doanh thu khác nhau.
2. "Trung bình/tháng 1.000.083đ" = 12tr ÷ 12, nhưng mới hết tháng 7 → phải chia 7.

**Hành vi mong đợi:**
- Định nghĩa và ghi rõ trên UI: "Doanh thu ghi nhận" (đơn hoàn tất) vs "Tiền thực thu" (bao gồm thanh toán một phần)
- Trung bình/tháng = tổng ÷ số tháng đã có dữ liệu
- Tách riêng "doanh thu chưa thực hiện" (tiền bán gói chưa dùng buổi) khỏi doanh thu ghi nhận

---

### ISS-013 · UUID lộ ra toàn bộ giao diện người dùng

**Mức độ:** 🟡 Major · **Module:** Toàn hệ thống

**Mô tả:** Mã KH (`7308b5e1-...`), mã NV (`15f52025-8...`), mã dịch vụ (`addd7f26...`), mã đơn (`03aa2f5d-73b7-4508-b4ee-12853a88d2bf` trong cả tiêu đề hóa đơn), mã lịch hẹn, UUID trong ghi chú. Không đọc được, không tra cứu miệng được.

**Hành vi mong đợi:**
- UUID giữ làm khóa nội bộ; thêm trường `mã hiển thị` sinh tự động:
  - Khách: `KH-0001` · Nhân viên: `NV-001` · Dịch vụ: `DV-MAS-001` (theo danh mục) · Đơn: `DH-260714-001` (theo ngày) · Lịch hẹn: `LH-260714-001`
- Migration backfill mã cho dữ liệu cũ (các bản ghi đang có mã `cust-001`, `srv-mass-...` giữ nguyên nếu đã chuẩn)
- Tìm kiếm hoạt động theo mã hiển thị

---

### ISS-014 · Dữ liệu test lẫn dữ liệu thật + thiếu validation nhập liệu

**Mức độ:** 🟡 Major · **Module:** Sản phẩm, Dịch vụ, Khuyến mãi, Khách hàng

**Mô tả:** Tồn tại: sản phẩm "aaaa" (thương hiệu adidas, danh mục Điều trị mụn, 10.000đ, ảnh lỗi), dịch vụ "đấm bóp" 1.999.999đ, khuyến mãi tên "khanh" mã "t11" giảm 100đ, khách "tổng phương hà" viết thường.

**Hành vi mong đợi:**
- Dọn toàn bộ dữ liệu test khỏi môi trường production
- Validation: tên riêng tự động chuẩn hóa hoa chữ đầu; giá phải > 0 và cảnh báo nếu lệch quá xa trung bình danh mục; mã khuyến mãi tối thiểu 4 ký tự; danh mục sản phẩm phải khớp loại sản phẩm

---

### ISS-015 · Điểm tích lũy: số lẻ, định dạng không nhất quán, không tiêu được

**Mức độ:** 🟡 Major · **Module:** Khách hàng

**Mô tả:**
1. Điểm lẻ: 3.96, 129.9, 64.89 điểm
2. Cùng trang dùng 2 quy ước: thẻ tổng "248,75" (phẩy) vs bảng "3.96" (chấm)
3. Không có cơ chế tiêu điểm ở POS — tích mà không dùng được

**Hành vi mong đợi:**
- Điểm là số nguyên (làm tròn xuống khi tích)
- Chuẩn định dạng số VN toàn hệ thống: chấm ngăn nghìn, phẩy thập phân
- POS thêm ô "Dùng điểm" với quy tắc quy đổi cấu hình được (VD 1 điểm = 1.000đ), trừ điểm khi thanh toán thành công

---

### ISS-016 · Giới tính khách mặc định "Nữ" gây nhập sai

**Mức độ:** 🟡 Major · **Module:** Khách hàng

**Mô tả:** Khách "Tổng Quốc Khanh" (tên nam) có giới tính Nữ. Form thêm khách mặc định sẵn "Nữ".

**Hành vi mong đợi:** Trường giới tính để trống, bắt chọn (hoặc cho phép "Không xác định"). Không đặt mặc định.

---

### ISS-017 · Danh mục dùng lẫn cho sản phẩm và dịch vụ; dịch vụ không có danh mục

**Mức độ:** 🟡 Major · **Module:** Danh mục, Dịch vụ

**Mô tả:** Trang "Danh mục sản phẩm" chứa cả danh mục dịch vụ ("Massage trị liệu", "Chăm sóc da") đếm 0 sản phẩm. Form Thêm dịch vụ không có trường danh mục → dịch vụ không phân loại được.

**Hành vi mong đợi:**
- Tách 2 loại danh mục hoặc thêm trường `loại` (sản phẩm/dịch vụ) trên danh mục
- Form dịch vụ bắt buộc chọn danh mục
- Trang dịch vụ có cột + bộ lọc danh mục

---

### ISS-018 · Sản phẩm không có giá vốn — giá trị tồn kho tính theo giá bán

**Mức độ:** 🟡 Major · **Module:** Sản phẩm

**Mô tả:** Sản phẩm chỉ có 1 trường giá (bán). "Giá trị tồn 42.500.000đ" = Σ(tồn × giá bán) — sai nguyên tắc kế toán, và không thể tính lãi gộp.

**Hành vi mong đợi:**
- Thêm trường giá vốn (giá nhập); giá trị tồn = Σ(tồn × giá vốn)
- Chức năng nhập kho có lịch sử (ngày, số lượng, đơn giá nhập, nhà cung cấp)
- Đơn hàng chứa sản phẩm + thanh toán → tự trừ tồn kho

---

### ISS-019 · Trang Người dùng & Vai trò mất toàn bộ dấu tiếng Việt

**Mức độ:** 🟡 Major · **Module:** Hệ thống

**Mô tả:** "Quan ly nguoi dung", "Ma nguoi dung", "Ten dang nhap", "Trang thai", "Hoat dong", "Quan ly vai tro", "Tong vai tro", "Quyen duy nhat"... trong khi các trang khác có dấu đầy đủ.

**Hành vi mong đợi:** Sửa toàn bộ label 2 trang này về tiếng Việt có dấu; rà soát chung file i18n/hard-coded string.

---

### ISS-020 · Tài khoản Administrator lẫn vào danh sách Nhân viên và bảng Lương

**Mức độ:** 🟡 Major · **Module:** Nhân viên, Lương

**Mô tả:** "Administrator" xuất hiện như 1 nhân viên (lương 0đ), được đếm vào "5 nhân viên" và có dòng trong bảng lương tháng.

**Hành vi mong đợi:** Tách tài khoản hệ thống khỏi hồ sơ nhân sự. Bảng nhân viên/lương chỉ hiển thị người có hồ sơ nhân sự thực. Thêm cờ `is_system_account`.

---

### ISS-021 · Danh sách buổi liệu trình hiển thị lộn xộn + buổi "Đã dời lịch" vẫn có nút Check-in

**Mức độ:** 🟡 Major · **Module:** Liệu trình khách hàng

**Mô tả:** Thứ tự hiển thị: Buổi 2, 3, 6, 4, 1, 5. Buổi 3 trạng thái "Đã dời lịch" nhưng vẫn hiện nút Check-in.

**Hành vi mong đợi:** Sắp xếp theo số buổi (hoặc ngày dự kiến). Nút hành động render theo trạng thái: "Đã dời lịch" → chỉ có "Đặt lịch lại".

---

## 🟠 MINOR / ENHANCEMENT — Thiếu chức năng nghiệp vụ

---

### ISS-022 · POS không chọn nhân viên thực hiện & tư vấn

**Mức độ:** 🟠 Major về nghiệp vụ · **Module:** POS

**Mô tả:** POS chỉ có: chọn khách → chọn dịch vụ/sản phẩm → thanh toán. Không có bước gán KTV thực hiện và nhân viên tư vấn → đơn POS không sinh được hoa hồng đúng người (nguyên nhân gốc phải có nút "Sinh bù hoa hồng" — liên quan ISS-004).

**Hành vi mong đợi:** Mỗi dòng dịch vụ trong giỏ có dropdown chọn KTV (bắt buộc); tùy chọn thêm người tư vấn cho gói/sản phẩm. Hoa hồng dịch vụ gắn KTV, hoa hồng bán hàng gắn người tư vấn.

---

### ISS-023 · POS không có chọn phương thức thanh toán / thanh toán tách

**Mức độ:** 🟠 Enhancement · **Module:** POS, Đơn hàng

**Mô tả:** Không thấy nơi chọn tiền mặt / chuyển khoản / QR khi thanh toán. Không hỗ trợ 1 đơn trả bằng nhiều phương thức (rất phổ biến ở spa: một phần tiền mặt + một phần CK + trừ buổi gói).

**Hành vi mong đợi:** Bước thanh toán có danh sách phương thức, cho phép nhập nhiều dòng thanh toán, tổng phải khớp. Báo cáo tách được doanh thu theo phương thức.

---

### ISS-024 · Hồ sơ nhân viên thiếu: kỹ năng, ca làm việc, cấp bậc hoa hồng

**Mức độ:** 🟠 Major về nghiệp vụ · **Module:** Nhân viên

**Mô tả:** Form nhân viên chỉ có tên/SĐT/email/chức vụ (text tự do)/lương/trạng thái. Không có mapping nhân viên ↔ dịch vụ được phép làm, không có ca làm việc, không có ngày vào làm, không có tỷ lệ hoa hồng theo cấp bậc.

**Hành vi mong đợi:**
- Thêm: ngày vào làm, cấp bậc (học việc/chính/cao cấp), danh sách kỹ năng (multi-select dịch vụ), lịch ca tuần
- Màn đặt lịch chỉ hiện nhân viên: đủ kỹ năng + trong ca + không trùng lịch
- Hoa hồng ưu tiên: (nhân viên, dịch vụ) → cấp bậc → mặc định dịch vụ

---

### ISS-025 · Đặt lịch không chặn trùng giờ nhân viên/phòng

**Mức độ:** 🟠 Major về nghiệp vụ · **Module:** Lịch hẹn

**Mô tả:** Không thấy cơ chế cảnh báo khi 2 lịch hẹn cùng KTV hoặc cùng phòng chồng khung giờ. Trường "Phòng" đang là tùy chọn.

**Hành vi mong đợi:**
- Kiểm tra overlap theo `(nhân viên, khoảng thời gian)` và `(phòng, khoảng thời gian)`; khoảng thời gian = giờ hẹn + thời lượng dịch vụ + buffer 10–15 phút
- Trùng → chặn lưu, gợi ý khung giờ trống gần nhất

---

### ISS-026 · Danh sách lịch hẹn thiếu cột Dịch vụ và Nhân viên

**Mức độ:** 🟠 Minor · **Module:** Lịch hẹn

**Mô tả:** Bảng chỉ có: mã, khách, ngày giờ, trạng thái, ghi chú. Lễ tân không biết khách đến làm gì, ai phục vụ nếu không mở chi tiết.

**Hành vi mong đợi:** Thêm cột Dịch vụ (rút gọn nếu nhiều) và KTV. Thêm bộ lọc theo KTV và theo ngày.

---

### ISS-027 · Quá nhiều trạng thái lịch hẹn (13 loại trong legend)

**Mức độ:** 🟠 Minor · **Module:** Lịch hẹn

**Mô tả:** Legend calendar: Chờ xác nhận, Đã xác nhận, Đã check-in, Đang chờ, Đang thực hiện, Hoàn thành, Đã hủy, Không đến, Đã dời lịch + 4 trạng thái liệu trình riêng = khó học, khó phân biệt màu.

**Hành vi mong đợi:** Gộp còn 7: Chờ xác nhận · Đã xác nhận · Đã check-in · Đang thực hiện · Hoàn thành · Đã hủy · Không đến. "Đã dời lịch" là hành động (tạo lịch mới, lịch cũ ghi chú dời), không phải trạng thái sống. Lịch từ liệu trình dùng chung trạng thái + badge "Liệu trình".

---

### ISS-028 · Khuyến mãi thiếu ràng buộc và thống kê sử dụng

**Mức độ:** 🟠 Enhancement · **Module:** Khuyến mãi

**Mô tả:** Form thiếu: mức giảm tối đa (cho loại %), giới hạn số lần dùng mỗi khách, phạm vi theo dịch vụ/danh mục cụ thể. Bảng không có cột "đã dùng/còn lại". Mặc định số lượng = 1 dễ tạo mã chỉ dùng được 1 lần ngoài ý muốn.

**Hành vi mong đợi:**
- Thêm các trường trên; số lượng mặc định "Không giới hạn"
- Đếm lượt dùng thực tế, hiển thị "Đã dùng x/y"
- Xác nhận hoa hồng tính trên giá SAU giảm (viết test case)

---

### ISS-029 · Đơn "Chờ thanh toán" treo vô thời hạn; thiếu quản lý công nợ

**Mức độ:** 🟠 Enhancement · **Module:** Đơn hàng

**Mô tả:** Đơn 5.225.000đ treo từ 28/06 (>2 tuần) không cảnh báo. Đơn "Thanh toán một phần" (còn nợ 340.000đ) không có màn hình công nợ tổng hợp theo khách và lịch sử từng lần trả.

**Hành vi mong đợi:**
- Cảnh báo/lọc đơn quá hạn X ngày; chính sách tự hủy hoặc nhắc
- Màn hình công nợ: tổng nợ theo khách, lịch sử thanh toán từng phần, nút thu nợ

---

### ISS-030 · VAT cộng ngoài giá gây số lẻ và tranh cãi tại quầy

**Mức độ:** 🟠 Enhancement · **Module:** Đơn hàng, POS

**Mô tả:** Hóa đơn: tạm tính 4.750.000 + VAT 10% = 5.225.000. Spa VN thường niêm yết giá đã gồm VAT; cộng thêm 10% lúc thanh toán khiến khách trả cao hơn bảng giá, sinh số lẻ xấu (185.625đ).

**Hành vi mong đợi:** Cấu hình hệ thống "Giá đã gồm VAT / chưa gồm VAT" (mặc định: đã gồm — hóa đơn tách ngược phần thuế để kê khai). Thuế suất cấu hình được, không hard-code 10%.

---

### ISS-031 · Bảng lương thiếu: thưởng/phạt, ứng lương, trạng thái chi trả, khóa kỳ

**Mức độ:** 🟠 Enhancement · **Module:** Lương & hoa hồng

**Mô tả:** Bảng lương chỉ có lương cơ bản + hoa hồng + tổng. Thiếu các cấu phần vận hành thực tế.

**Hành vi mong đợi:**
- Thêm: thưởng, phạt, ứng lương (khấu trừ), số buổi/đơn thực hiện trong kỳ
- Trạng thái kỳ lương: Nháp → Đã chốt → Đã chi. Kỳ đã chốt thì hoa hồng phát sinh sau (hồi tố) tự nhảy sang kỳ kế tiếp
- Giữ và mở rộng popup drill-down chi tiết hoa hồng (điểm tốt hiện có)

---

### ISS-032 · Thiếu nhắc lịch tự động (SMS/Zalo)

**Mức độ:** 🟠 Enhancement · **Module:** Lịch hẹn

**Mô tả:** Không có cơ chế nhắc khách trước giờ hẹn — tính năng giảm no-show hiệu quả nhất cho spa VN.

**Hành vi mong đợi:** Nhắc tự động trước 24h và 2h qua Zalo ZNS/SMS; template cấu hình được; log gửi thành công/thất bại.

---

### ISS-033 · Xóa cứng dữ liệu có lịch sử giao dịch

**Mức độ:** 🟠 Major về an toàn dữ liệu · **Module:** Toàn hệ thống

**Mô tả:** Nút thùng rác đỏ tồn tại trên: dịch vụ, khách hàng, nhân viên, lịch hẹn (kể cả lịch "Hoàn thành"), sản phẩm, người dùng. Xóa cứng sẽ vỡ dữ liệu báo cáo, hoa hồng, liệu trình lịch sử.

**Hành vi mong đợi:**
- Bản ghi có giao dịch liên quan → chỉ cho "Ngừng hoạt động" (soft delete), backend chặn DELETE
- Bản ghi chưa từng phát sinh giao dịch → cho xóa với hộp thoại xác nhận
- Lịch hẹn "Hoàn thành" không được xóa, chỉ được xem

---

### ISS-034 · Sidebar có cả "Gói liệu trình" và "Gói dịch vụ" gây nhầm lẫn

**Mức độ:** 🟠 Minor · **Module:** Điều hướng

**Mô tả:** Menu "Gói liệu trình" (nhóm Khách hàng & Dịch vụ) và "Gói dịch vụ" (nhóm Hệ thống) — không rõ khác nhau thế nào.

**Hành vi mong đợi:** Nếu là một → gộp. Nếu "Gói dịch vụ" là gói subscription của phần mềm → đổi tên thành "Gói phần mềm / Nâng cấp" và chuyển khỏi ngữ cảnh dễ nhầm.

---

## Bảng tổng hợp ưu tiên

| Sprint | Issue | Chủ đề |
|--------|-------|--------|
| **Sprint 1 — Chặn sai tiền** | ISS-003, ISS-004, ISS-005, ISS-006 | Hoa hồng ×100, hoa hồng tự động, trừ buổi liệu trình, tiền bù chuyển đổi |
| **Sprint 2 — Luồng chuẩn** | ISS-001, ISS-002, ISS-022, ISS-023, ISS-025 | Đảo luồng lịch hẹn→đơn, chặn hoàn thành tương lai, POS chọn NV + phương thức TT, chặn trùng lịch |
| **Sprint 3 — Dữ liệu sạch** | ISS-013, ISS-014, ISS-016, ISS-017, ISS-018, ISS-019, ISS-020, ISS-033 | Mã thân thiện, dọn test data, danh mục, giá vốn, tiếng Việt, tách admin, soft delete |
| **Sprint 4 — Hoàn thiện** | ISS-007, ISS-008→012, ISS-015, ISS-021, ISS-024, ISS-026→032, ISS-034 | RBAC thật, dashboard, điểm tích lũy, hồ sơ NV, kỳ lương, công nợ, nhắc lịch |

---

*Ghi chú sử dụng: mỗi issue có thể copy nguyên khối làm 1 ticket (Jira/Trello/GitHub Issue) hoặc 1 prompt cho AI coding tool. Phần "Tiêu chí nghiệm thu" dùng làm định nghĩa hoàn thành (DoD) khi test.*
