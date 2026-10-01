# English 3000 V3.1.4

Bản này dùng trực tiếp database đã làm sạch từ 3 PDF của người dùng.

## Database Quiz

`data/vocab-3000-clean.json` có đúng 3000 mục được phép vào Quiz.

Quy tắc lọc:
- bắt buộc có nghĩa Việt
- bắt buộc có IPA
- bắt buộc có từ loại
- không có cờ `needsReview` / mâu thuẫn

Nguồn chính được ưu tiên theo thứ tự trong `3000.pdf`. Sau đối chiếu có 2995 mục nguồn chính đạt chuẩn; 5 mục sạch từ PDF chủ đề được bổ sung để đủ 3000.

## Không tự sửa nguồn

- Nghĩa Quiz không lấy từ Google Translate / MyMemory.
- IPA và từ loại không bị Dictionary API ghi đè.
- Dictionary API chỉ được dùng để lấy **audio** khi có mạng.
- Nếu dữ liệu thiếu/không chắc, mục đó không xuất hiện trong Quiz.

## Chủ đề

60 chủ đề từ PDF theo chủ đề vẫn được giữ. Chỉ những từ khớp chính xác với bộ 3000 sạch mới được gắn vào từng chủ đề. Một số chủ đề có thể ít hoặc chưa có từ; app hiển thị trạng thái này thay vì tự đoán.

## CEFR

V3.1.4 tạm bỏ lựa chọn A1/A2/B1/B2 vì ba PDF không cung cấp CEFR nhất quán. App không tự gán level.

## Cập nhật GitHub

Nếu đang ở V3.1.3, dùng patch-only và ghi đè các file. Nhớ upload cả `data/vocab-3000-clean.json` và `.github/workflows/deploy-pages.yml`.

GitHub → Settings → Pages → Source: **GitHub Actions**.

## Báo cáo dữ liệu

- `data/vocab-3000-clean-report.json`
- `data/vocab-3000-clean-issues.csv`

Các file này để kiểm tra/chỉnh sửa, app không dùng chúng để tạo đáp án.
