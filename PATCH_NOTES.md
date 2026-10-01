# English 3000 — Patch 2.1

## Có gì mới

### 1. Học theo chủ đề thật
- Thêm 3 cách chọn: **Chủ đề / Trình độ / Chặng**.
- Mặc định mở ở **Chủ đề**.
- Chủ đề được lấy trực tiếp từ `Vocabulary-topics.json` của cùng bộ dữ liệu đang dùng, không tự đoán bằng từ khóa.
- Có ô tìm kiếm chủ đề.
- Vẫn giữ 30 chặng × 100 từ của V2 để không phá cách học cũ.

### 2. Sửa phát âm
- Hiển thị **IPA** ngay dưới từ khi không làm lộ đáp án.
- Ưu tiên audio từ **Free Dictionary API**.
- Nếu từ điển có audio US/UK, app hiện nút riêng.
- Nếu từ điển không có audio, app mới dùng `speechSynthesis` của trình duyệt làm dự phòng.
- Chế độ Nghe không hiện IPA trước khi trả lời để tránh lộ đáp án.

### 3. Không dùng Google Translate để phát âm
- Đã bỏ endpoint Google Translate khỏi luồng dịch của app.
- Nghĩa tiếng Việt vẫn dùng nghĩa offline đã có trước, cache cũ, và MyMemory khi cần.

### 4. Giữ nguyên tiến độ cũ
Patch vẫn dùng:
`localStorage["english3000State"]`

Vì vậy khi thay file trên GitHub Pages, số từ đã học, từ sai và tiến độ V2 vẫn được giữ trên cùng trình duyệt/điện thoại.

## Cách cài patch
Ghi đè 4 file sau trong repo V2:
- `index.html`
- `style.css`
- `app.js`
- `sw.js`

Sau đó commit/push lên GitHub Pages. Nếu trình duyệt vẫn hiện bản cũ, đóng tab rồi mở lại hoặc xóa cache site một lần vì Service Worker cũ có thể còn lưu file.
