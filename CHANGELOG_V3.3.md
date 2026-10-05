# English 3000 V3.3 — Sentence Learning

## Mục tiêu
Chuyển app từ chỉ học nghĩa từ đơn sang luyện khả năng **nhìn/nghe câu và hiểu người ta đang nói gì**.

## Nội dung mới
- 200 câu thực tế từ Corpus Audit V1, chia thành 15 tình huống.
- 30 mini-dialogue được biên soạn cho V3.3, 2 hội thoại/tình huống.
- Màn `Học câu thực tế` riêng ở trang chủ.
- 4 cách luyện:
  - Học câu: đọc câu → tự đoán → mở nghĩa → đánh dấu hiểu/chưa chắc.
  - Đọc hiểu: nhìn câu tiếng Anh → chọn ý tiếng Việt.
  - Nghe hiểu: chỉ nghe trước → chọn ý → sau đó hiện lại câu.
  - Hội thoại: đọc mini-dialogue → trả lời câu hỏi hiểu tình huống.
- 5/10/15/20 câu mỗi buổi.
- Theo dõi tiến độ riêng cho câu, không làm ảnh hưởng SRS từ vựng V3.2.x.
- Câu được coi là vững sau 2 lần hiểu/đúng liên tiếp; câu sai được ưu tiên xuất hiện lại.
- Chọn theo 15 tình huống hoặc `Tất cả`.
- TTS sử dụng hệ audio sẵn có của app.
- Offline PWA cache thêm sentence/dialogue dataset.

## Dataset
`data/content/sentences-v1-core-200.json`
- Quality tier: Silver.
- Giữ `source.original_en`, `source.original_vi` và cờ `correction_applied` để audit tiếp.

`data/content/dialogues-v1-core-30.json`
- Quality tier: Beta.
- Mini-dialogue biên soạn từ tình huống của Sentence Pack V1.

## Lưu ý
V3.3 là bản đầu tiên của Sentence Learning. Bộ 200 câu chưa được coi là Golden dataset; app hiển thị ghi chú này để tránh nhầm dữ liệu Beta/Silver là dữ liệu cuối cùng.
