# V3.1.4 — Clean Database

- Thay database Quiz bằng `data/vocab-3000-clean.json` được gộp từ 3 PDF người dùng cung cấp.
- Quiz dùng đúng **3000 mục sạch**: 2995 mục từ nguồn chính + 5 mục sạch từ nguồn chủ đề để đủ 3000.
- Loại khỏi Quiz mọi mục thiếu nghĩa / IPA / từ loại hoặc bị đánh dấu mâu thuẫn.
- Không còn gọi API dịch để lấy nghĩa Quiz.
- IPA và từ loại luôn lấy từ database sạch; Dictionary API chỉ dùng để tìm audio nếu có mạng.
- Bỏ tab CEFR A1–B2 vì 3 PDF không hỗ trợ level đáng tin cậy.
- Badge ở câu hỏi đổi từ level sang **từ loại**.
- Giữ nguyên SRS, streak, từ sai và tiến độ cũ theo `english3000State`.
- 60 chủ đề vẫn được giữ; chủ đề chưa có từ khớp sạch sẽ hiển thị mờ và không cho chọn.
- GitHub Pages không cần build database nữa: deploy static trực tiếp.
