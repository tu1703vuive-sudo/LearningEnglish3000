# English 3000 V3

Web app mobile-first để học 3000 từ tiếng Anh nền tảng.

## V3 có gì mới

- Học theo **Chủ đề / CEFR A1–B2 / Chặng 100 từ**
- 3 chế độ:
  - English → Vietnamese
  - Vietnamese → English
  - Listening → Vietnamese
- IPA + audio từ Dictionary API; TTS chỉ là fallback
- Hiển thị **câu ví dụ sau khi trả lời**
- SRS / spaced repetition:
  - đúng: giãn lịch theo 1 → 3 → 7 → 14 → 30 ngày
  - sai: đưa từ về lịch ôn sớm
- Dashboard:
  - số từ đến hạn ôn
  - streak
  - số câu đã học hôm nay
- Vẫn dùng `localStorage` key `english3000State`, nên giữ được dữ liệu V2/V2.1
- Service Worker cache app shell và các dữ liệu từ đã tra

## Lưu ý về dữ liệu

Danh sách từ/level/topic được tải từ bộ Vocabulary-English khi app có mạng và được trình duyệt cache.
Nghĩa tiếng Việt được lấy/cached riêng.
IPA, audio, loại từ và câu ví dụ được lấy từ Free Dictionary API.

Vì vậy:
- Phát âm **không dùng Google Translate**.
- Sau khi một từ đã được học/tra, dữ liệu của nó được cache để lần sau tải nhanh hơn.
- Lần mở đầu tiên vẫn nên có mạng để app lấy bộ từ và dữ liệu cần thiết.

## Cài lên GitHub Pages

Nếu đang dùng V2/V2.1:
1. Giải nén ZIP.
2. Ghi đè:
   - `index.html`
   - `style.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
3. Push lên GitHub.
4. Mở GitHub Pages.
5. Nếu còn giao diện cũ: đóng tab, mở lại; nếu cần xóa site cache/service worker.

Tiến độ cũ không bị xóa.

## Chạy local

```bash
python -m http.server 8080
```

Mở:
`http://localhost:8080`

## Nguồn dữ liệu

- Vocabulary/CEFR/topic: `mankhb2k/Vocabulary-English`
- IPA/audio/example: `dictionaryapi.dev`

Nghĩa/dịch ví dụ là lớp dữ liệu riêng, không liên quan đến audio phát âm.
