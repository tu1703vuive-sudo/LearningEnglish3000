# English 3000 V3.3.2 — Topic Mapping Fix

- Bổ sung `data/topic-word-map-v1.json`: 1.579 dòng mapping, 60 chủ đề, 1.447 từ duy nhất.
- Khi `vocab-clean.json` có topic.words trống, app tự hydrate lại từ mapping nguồn.
- Chỉ map những từ thực sự tồn tại trong `vocab-clean.json`; không tự tạo từ mới.
- Giữ nguyên mapping hiện có và chỉ bổ sung phần thiếu.
- Thêm test cho tên chủ đề tiếng Việt, fallback mapping và chống duplicate.
- Tăng cache/service worker lên V3.3.2.
