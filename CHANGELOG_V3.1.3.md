# V3.1.3 — Fast Start

- Không hydrate nghĩa + IPA + audio + ví dụ cho toàn bộ 10–30 từ trước khi vào bài.
- Chỉ chờ tối đa dữ liệu đủ cho câu đầu + 3 đáp án.
- Nếu nghĩa đã có trong offline pack/cache: vào quiz ngay, không hiện màn loading.
- Preload nghĩa các câu tiếp theo bằng 3 worker chạy nền.
- IPA/audio/loại từ/ví dụ lazy-load sau khi câu hỏi đã hiện.
- Prefetch tài nguyên cho câu hiện tại + câu kế trong thời gian rảnh.
- Nút Tiếp tục chỉ chờ câu kế nếu dữ liệu nghĩa chưa sẵn, không quay lại màn loading toàn trang.
- Giữ nguyên localStorage/SRS/tiến độ cũ.
