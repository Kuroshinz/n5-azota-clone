# Kế hoạch Triển khai: Hệ thống Phân quyền Sở hữu Đề thi, Bảo mật Dữ liệu Riêng tư & Bắt buộc Đăng nhập

> **Trạng thái:** ĐÃ HOÀN TẤT 100% - ĐÃ BẢO MẬT GIAO DIỆN SẢN PHẨM TRÊN PORT 3000

## 1. Tóm tắt Yêu cầu & Kết quả Thực hiện

1. **Tầng lớp bắt buộc Đăng nhập trước khi sử dụng web (Global Auth Gate):**
   - [x] Đã thiết lập Next.js Edge Middleware tại `src/middleware.ts`.
   - [x] Chưa đăng nhập không thể truy cập bất kỳ trang nào (trừ `/login` và `/register`), bị tự động chuyển hướng HTTP 307 về `/login?redirect=...`.
   - [x] API bảo vệ trả về `401 Unauthorized` nếu không có JWT token hợp lệ.

2. **Quyền sở hữu Đề thi riêng biệt (Exam Ownership) & Chia sẻ công khai (Public Sharing):**
   - [x] Mỗi tài khoản sở hữu đề thi riêng của mình (`authorId = currentUser.id`).
   - [x] Đề thi có cờ `isPublic` (Công khai / Riêng tư). Tác giả có thể bật/tắt chia sẻ đề thi cho người khác.
   - [x] Khi công khai, tác giả có nút "Copy Link thi" gửi cho học sinh/tài khoản khác vào thi.

3. **Giới hạn Quyền nghiêm ngặt đối với Người vào làm đề (Strict Exam Taker Boundary):**
   - [x] **Chỉ được:** Vào làm bài thi qua mã/link (`/exam/[id]`), nộp bài, và xem điểm cùng kết quả cá nhân của chính mình.
   - [x] **Tuyệt đối KHÔNG ĐƯỢC:**
     - Không có quyền chỉnh sửa nội dung đề thi (`/teacher/edit/[id]` -> Chặn 403 Forbidden ở cả API lẫn giao diện cảnh báo).
     - Không có quyền xóa đề thi (`DELETE /api/exams/[id]` -> Chặn 403 Forbidden).
     - Không có quyền xem danh sách bài nộp của người khác hay kết quả thi của cả lớp (`/teacher/submissions/[id]` -> Chặn 403 Forbidden).

4. **Trang chủ Cá nhân hóa & Bảo mật Dữ liệu (User Dashboard):**
   - [x] **Mục "Đề thi của tôi":** Chỉ hiển thị các đề do chính tài khoản tạo (quản lý, sửa, xóa, xem bài nộp, copy link).
   - [x] **Mục "Vào phòng thi nhanh":** Cho phép dán link thi hoặc nhập mã đề thi từ tài khoản khác để vào làm bài.
   - [x] **Mục "Lịch sử làm bài của tôi":** Chỉ hiển thị các bài thi mà chính tài khoản này đã từng nộp và xem lại điểm cá nhân (`/api/submissions?myHistory=true`).

---

## 2. Nhật ký Triển khai Chi tiết

- [x] **Nhiệm vụ 1: Global Authentication Gate**
  - Tạo `src/middleware.ts` kiểm tra cookie `azota_token`.
  - Tự động chuyển hướng toàn bộ khách vãng lai về `/login`.
- [x] **Nhiệm vụ 2: Schema Quyền Sở Hữu & Tùy chọn Công khai**
  - Cập nhật `prisma/schema.prisma` với trường `authorId` và `isPublic: Boolean @default(true)`.
  - Đồng bộ cơ sở dữ liệu `prisma db push` và sinh `prisma generate`.
- [x] **Nhiệm vụ 3: Phân quyền API nghiêm ngặt & Kiểm thử TDD**
  - Viết bộ test phân quyền `tests/privacyAuthorization.test.ts` (Đạt 3/3 tests).
  - Cập nhật `/api/exams`, `/api/exams/[id]`, `/api/submissions`.
- [x] **Nhiệm vụ 4: Hoàn thiện Bảo vệ Giao diện Frontend**
  - Thêm Author Guard vào `src/app/teacher/edit/[id]/page.tsx`.
  - Thêm Author Guard vào `src/app/teacher/submissions/[id]/page.tsx`.
  - Tái cấu trúc Dashboard `src/app/page.tsx` với khối Vào thi nhanh, Quản lý đề thi của tôi và Lịch sử làm bài cá nhân.
- [x] **Nhiệm vụ 5: Kiểm thử Toàn diện & Triển khai Port 3000**
  - Chạy `npm test`: 13 test files (58/58 tests) ĐẠT 100%.
  - Chạy `npx tsc --noEmit`: 0 lỗi type.
  - Chạy `npm run build`: Tạo thành công optimized production build.
  - Chạy Next.js Production Server trên `http://localhost:3000`.
  - Chạy kịch bản kiểm thử bảo mật `verify_e2e_security.js`: Xác minh 5/5 kịch bản bảo mật, phân quyền và cách ly tài khoản thành công 100%.

---

## 3. Cập nhật Bảo mật Màn hình Đăng nhập
- [x] Đã gỡ bỏ toàn bộ khối và các nút bấm điền nhanh tài khoản (Admin, Giáo viên, Học sinh mẫu) trên trang `/login`.
- [x] Trang đăng nhập được giữ sạch sẽ, chuẩn giao diện sản phẩm thương mại nhiều người dùng, yêu cầu người dùng tự nhập tài khoản và mật khẩu.
- [x] Tài khoản Admin (`admin@azota.vn` / `0999999999`, mật khẩu `admin123`) được bảo vệ an toàn trong cơ sở dữ liệu, chỉ duy nhất người sở hữu biết thông tin để đăng nhập.
