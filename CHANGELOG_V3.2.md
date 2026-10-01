# V3.2 Changelog — Adaptive Quiz

## Adaptive engine
- `Học thông minh` tạo buổi học theo mục tiêu khoảng **40% từ đến hạn + 40% từ mới + 20% từ yếu**; thiếu nhóm nào thì tự bù từ phù hợp.
- Mỗi từ có lịch sử riêng theo dạng bài: Anh→Việt, Việt→Anh, Nghe và Gõ.
- Từ mới: bắt đầu bằng nhận diện nghĩa.
- Đang học: đảo chiều Việt→Anh / Anh→Việt.
- Đang nhớ: ưu tiên nghe.
- Gần thuộc: chuyển sang **gõ từ**, buộc phải nhớ chủ động.
- Từ yếu/sai: hạ độ khó và đưa về ôn sớm.

## Smart distractors
- Đáp án nhiễu ưu tiên từ **cùng chủ đề + cùng từ loại + độ dài gần nhau**.
- Loại trùng nghĩa để tránh hai đáp án cùng đúng.

## Typing quiz
- Thêm bài `Gõ từ tiếng Anh`.
- Enter để kiểm tra.
- Có gợi ý chữ đầu; gợi ý không tự tính là đúng.
- Chấp nhận khác biệt dấu gạch nối / khoảng trắng cơ bản.

## Compatibility
- Giữ `english3000State`, SRS, streak, mastered và tiến độ V3.1.x.
- Thêm `state.adaptive` nhưng không xóa lịch sử cũ.
