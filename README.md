# English 3000 — Choice Learning

Ứng dụng web mobile-first để học 3000 từ vựng nền tảng bằng dạng lựa chọn.

## Cấu trúc học
- 30 chặng × 100 từ.
- Mỗi phiên: 10 / 20 / 30 từ.
- 3 chế độ:
  - English → Vietnamese
  - Vietnamese → English
  - Listening → Vietnamese
- Ưu tiên ôn lại từ từng chọn sai.
- Một từ được đánh dấu "đã thuộc" sau khi trả lời đúng ít nhất 2 lần.
- Lưu tiến độ trong `localStorage`.

## Dữ liệu
App lấy danh sách từ CEFR A1–B2 từ một file JSON công khai trên GitHub khi có mạng.
Nghĩa của nhóm đầu được kèm sẵn để dùng offline. Những từ còn lại được dịch khi cần và cache trên thiết bị.

> Nếu muốn app hoàn toàn offline ngay từ lần đầu, nên đóng gói sẵn file JSON gồm đủ 3000 từ + nghĩa Việt vào repo.

## Chạy local
Có thể mở `index.html` trực tiếp, nhưng để Service Worker hoạt động nên dùng HTTP:

```bash
python -m http.server 8080
```

Mở:
`http://localhost:8080`

## GitHub Pages
1. Tạo repository mới.
2. Upload toàn bộ file.
3. Settings → Pages.
4. Deploy from a branch.
5. Chọn `main` + `/ (root)`.
6. Save.

## File
- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `sw.js`
