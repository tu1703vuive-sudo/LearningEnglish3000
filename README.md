# English 3000 V3.1.3 — Fast Start

Bản này tối ưu tốc độ vào bài: chỉ chuẩn bị dữ liệu cần cho câu đầu tiên, còn nghĩa các câu sau và IPA/audio/ví dụ được preload/lazy-load ở nền.

# English 3000 V3.1 — Offline Pack

V3.1 chuyển phần dữ liệu học sang **offline-first**.

## Cách hoạt động

App luôn thử đọc:

`data/vocab-3000.json`

trước. File này chứa các trường:

- `word`
- `meaning` (nghĩa Việt)
- `ipa`
- `pos`
- `example`
- `level`
- `topicIds`

Khi file đầy đủ đã được build, việc mở bài học, xem nghĩa, IPA, loại từ và ví dụ
không cần gọi API. Audio thật vẫn được lấy online khi có mạng; nếu không có
mạng app dùng TTS của thiết bị làm fallback.

## Quan trọng: ZIP có seed, GitHub Actions tự build bản đầy đủ

ZIP này chứa một **seed pack nhỏ** để app vẫn mở được ngay.

Khi bạn push repo lên GitHub, workflow:

`.github/workflows/deploy-pages.yml`

sẽ tự chạy `scripts/build_offline_pack.py`, tải các nguồn dữ liệu và tạo lại
`data/vocab-3000.json` với khoảng 3000 mục trước khi deploy GitHub Pages.

### Bật GitHub Pages

Sau khi upload/push repo:

1. GitHub → **Settings**
2. **Pages**
3. `Build and deployment` → Source: **GitHub Actions**
4. Push lại nhánh `main` hoặc mở tab **Actions** → chạy workflow
   `Build and deploy English 3000 V3.1`
5. Chờ workflow xanh rồi mở link Pages.

## Build full pack trên máy tính

Máy cần Internet ở bước build:

```bash
python scripts/build_offline_pack.py --output data/vocab-3000.json
python -m http.server 8080
```

Sau khi build xong, `data/vocab-3000.json` là file local của app.

## Build từ các file đã tải sẵn

```bash
python scripts/build_offline_pack.py   --levels path/to/Vocabulary-levels.json   --topics path/to/Vocabulary-topics.json   --db path/to/dictionary_en_vi.db   --output data/vocab-3000.json
```

## Tiến độ cũ

V3.1 tiếp tục sử dụng:

`localStorage["english3000State"]`

nên giữ tiến độ từ V2 / V2.1 / V3 trên cùng domain.

## License dữ liệu

Đọc `ATTRIBUTION.md`.

Phần dữ liệu Anh–Việt lấy từ database Skypedia được công bố theo CC BY-SA 4.0,
vì vậy khi redistribute dữ liệu đã build cần giữ attribution và tuân thủ
ShareAlike.
