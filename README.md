# English 3000 — v2.1

Web app mobile-first học 3000 từ vựng cơ bản.

## Tính năng chính
- Học theo **Chủ đề / CEFR A1-B2 / Chặng 100 từ**.
- Phiên 10 / 20 / 30 từ.
- Anh → Việt, Việt → Anh, Nghe → chọn nghĩa.
- Ôn từ sai và lưu tiến độ bằng localStorage.
- IPA + audio từ điển; TTS chỉ là phương án dự phòng.
- Dark mode và PWA.

## Dữ liệu
- Level và topic: `mankhb2k/Vocabulary-English` trên GitHub.
- Phát âm: Free Dictionary API (`dictionaryapi.dev`).
- Nghĩa Việt: dữ liệu offline có sẵn + cache + MyMemory khi cần.

## Chạy local
```bash
python -m http.server 8080
```
Mở `http://localhost:8080`.

## Update từ V2
Xem `PATCH_NOTES.md`.
