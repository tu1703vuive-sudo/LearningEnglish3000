# V3.1 Changelog

## 3.1.0

- Thêm `data/vocab-3000.json` làm nguồn local ưu tiên.
- Thêm card trạng thái gói offline trên màn hình chính.
- Thêm script `scripts/build_offline_pack.py`.
- Thêm GitHub Actions tự build gói offline khi deploy Pages.
- Nghĩa / IPA / loại từ / ví dụ có thể chạy hoàn toàn local sau build.
- Audio từ điển được tải khi có mạng; TTS chỉ fallback.
- Service Worker cache cả `data/vocab-3000.json`.
- Giữ SRS và `english3000State` của các bản trước.
- Thêm `ATTRIBUTION.md` cho dữ liệu CC BY-SA 4.0.
