# V3 Changelog

## 3.0.0

### Học
- Thêm dashboard “Hôm nay”.
- Thêm ôn từ đến hạn.
- Tự ưu tiên: từ đến hạn → từ mới → từ yếu.
- Giữ chế độ Chủ đề / Level / Chặng.
- Giữ lựa chọn 10 / 20 / 30 từ.
- Giữ 3 kiểu quiz.

### SRS
- Thêm trạng thái ôn cho từng từ.
- Lịch đúng: 1 / 3 / 7 / 14 / 30 ngày.
- Sai: giảm cấp độ nhớ và đưa về ôn sớm.
- Từ đạt box >= 4 được tính là “đã thuộc”.

### Phát âm
- IPA từ từ điển.
- Ưu tiên audio US/UK/dictionary.
- Browser TTS chỉ fallback.
- Phần dịch không được dùng để tạo phát âm.

### Ngữ cảnh
- Sau mỗi câu trả lời hiện:
  - từ
  - nghĩa
  - loại từ
  - câu ví dụ
  - dịch ví dụ khi có mạng
  - lịch ôn tiếp theo

### Tương thích
- Tiếp tục dùng `english3000State`.
- Tự chuyển các từ đã thuộc/từ sai của V2.1 sang SRS khi mở V3.
