#!/usr/bin/env python3
"""
Build English 3000 V3.1 offline pack.

Downloads:
- CEFR levels/topics from mankhb2k/Vocabulary-English
- English–Vietnamese SQLite DB from skypediacode/english-vietnamese-dictionary

Outputs:
- data/vocab-3000.json

The generated dictionary-derived data is redistributed under CC BY-SA 4.0.
See ATTRIBUTION.md.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import tempfile
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

LEVEL_URL = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-levels.json"
TOPIC_URL = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-topics.json"
DB_URL = "https://github.com/skypediacode/english-vietnamese-dictionary/raw/refs/heads/main/dictionary_en_vi.db"
TARGET = 3000

TOPIC_VI = {
    1:"Chào hỏi & bản thân",2:"Gia đình & bạn bè",3:"Số, thời gian & ngày tháng",4:"Đồ ăn & thức uống",
    5:"Màu sắc & mô tả",6:"Nghề nghiệp & công việc",7:"Nhà cửa & sinh hoạt",8:"Thói quen hằng ngày",
    9:"Thời tiết",10:"Giao thông",11:"Sở thích & thời gian rảnh",12:"Quốc gia & quốc tịch",
    13:"Quần áo & phụ kiện",14:"Thiên nhiên & động vật",15:"Mua sắm & tiền bạc",16:"Sức khỏe & cơ thể",
    18:"Văn phòng cơ bản",19:"Trường học",20:"Nhà hàng & nấu ăn",21:"Tình huống khẩn cấp",
    22:"Cảm xúc",23:"Ngoại hình & tính cách",24:"Đời sống số",25:"Du lịch & kỳ nghỉ",
    27:"Khách sạn & sân bay",28:"Kết bạn",29:"Giao tiếp xã giao",34:"Họp & thuyết trình",
    37:"Văn hóa & xã hội",38:"Truyền thông & giải trí",39:"Giáo dục nâng cao",44:"Tài chính & ngân hàng",
    49:"Môi trường & bền vững",51:"Động từ & hành động cốt lõi",53:"Tính từ & trạng từ cốt lõi",
    54:"Từ trừu tượng & học thuật",99:"Từ vựng chung"
}

EXTRA_WORDS = """
ability absence academic accept access accident achieve achievement active actual advantage adventure advertise
advertisement affect afford agency aim allow alternative amount analysis announce annual anxiety apologize appearance
apply appointment appreciate approach argue arrangement assistant attention attitude audience average avoid award
balance behavior benefit blood board borrow boss bottom brain branch brand bridge budget cancel careful cause choice
climate coach collect comfortable community company condition connect contact contain context control conversation
corner cost create customer damage dangerous data deal degree deliver department depend describe design detail develop
difference direction discover disease distance document draw dream drive duty earth education effect effort employee
employer encourage engineer enough event exact experience expert explain fact fail fair feature field figure final
focus force foreign form future gain goal government grow happen health helpful history hope idea identify image
important include increase industry influence information interest interview introduce issue job join knowledge language
law learn leave legal local manage manager material matter mean medical meeting memory message method mind minute model
modern move necessary normal notice object offer office operation opinion order ordinary original patient pattern
people period person place plan point policy position possible prepare present pressure prevent problem process product
project provide public purpose question reach reason receive reduce relationship remember report research result risk
role safe save schedule service situation skill solution staff study success suggest support system task technology
term test training understand value view visit voice wait watch way website week welcome win worker world write
""".split()

SKIP = {"adj.","adv.","n.","v.","prep.","pron.","conj.","det.","excl.","modal verb","auxiliary verb"}

def key(word: str) -> str:
    return " ".join(str(word).strip().lower().split())

def download(url: str, dst: Path) -> Path:
    dst.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "English3000-V3.1-builder/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response, dst.open("wb") as f:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    return dst

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def build_word_list(level_data):
    out, seen = [], set()
    for level in ("A1","A2","B1","B2"):
        obj = (level_data.get("levels") or {}).get(level) or {}
        for raw in obj.get("words") or []:
            word = str(raw).strip()
            k = key(word)
            if not k or k in seen or k in SKIP or len(k) > 60:
                continue
            seen.add(k)
            out.append({"word": word, "level": level, "topicIds": []})
            if len(out) >= TARGET:
                return out
    for raw in EXTRA_WORDS:
        if len(out) >= TARGET:
            break
        k = key(raw)
        if k and k not in seen:
            seen.add(k)
            out.append({"word": raw, "level": "B1", "topicIds": [99]})
    return out[:TARGET]

def attach_topics(words, topic_data):
    by_key = {key(x["word"]): x for x in words}
    topics = []
    for raw in topic_data.get("topics") or []:
        tid = raw.get("id")
        selected = []
        seen = set()
        for w in raw.get("words") or []:
            k = key(w)
            if k in by_key and k not in seen:
                seen.add(k)
                selected.append(by_key[k]["word"])
                if tid not in by_key[k]["topicIds"]:
                    by_key[k]["topicIds"].append(tid)
        if selected:
            topics.append({
                "id": tid,
                "name": raw.get("name") or f"Topic {tid}",
                "nameVi": TOPIC_VI.get(tid, raw.get("name") or f"Chủ đề {tid}"),
                "words": selected
            })
    extras = [x["word"] for x in words if not x["topicIds"]]
    if extras:
        for x in words:
            if not x["topicIds"]:
                x["topicIds"] = [99]
        topics.append({"id":99,"name":"General Core","nameVi":"Từ vựng chung","words":extras})
    return topics

def batched(values, size=400):
    values = list(values)
    for i in range(0, len(values), size):
        yield values[i:i+size]

def enrich_from_db(words, db_path: Path):
    wanted = [key(x["word"]) for x in words]
    info = {k: {"meaning":"","ipa":"","pos":"","example":""} for k in wanted}
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        for batch in batched(wanted):
            qs = ",".join("?" for _ in batch)
            sql = f"""
                SELECT lower(w.word) AS k, d.definition, d.pos, wd.example
                FROM words w
                JOIN word_definitions wd ON w.id = wd.word_id
                JOIN definitions d ON wd.definition_id = d.id
                WHERE lower(w.word) IN ({qs})
                ORDER BY w.id, wd.id
            """
            for row in conn.execute(sql, batch):
                d = info.get(row["k"])
                if d is None:
                    continue
                if not d["meaning"] and row["definition"]:
                    d["meaning"] = str(row["definition"]).strip()
                    d["pos"] = str(row["pos"] or "").strip()
                    d["example"] = str(row["example"] or "").strip()

        for batch in batched(wanted):
            qs = ",".join("?" for _ in batch)
            sql = f"""
                SELECT lower(w.word) AS k, p.ipa, p.region
                FROM words w
                JOIN pronunciations p ON w.id = p.word_id
                WHERE lower(w.word) IN ({qs})
                ORDER BY w.id, p.id
            """
            for row in conn.execute(sql, batch):
                d = info.get(row["k"])
                if d is not None and not d["ipa"] and row["ipa"]:
                    d["ipa"] = str(row["ipa"]).strip()
    finally:
        conn.close()

    missing_meaning = missing_ipa = 0
    for item in words:
        d = info[key(item["word"])]
        item.update({
            "meaning": d["meaning"],
            "ipa": d["ipa"],
            "pos": d["pos"],
            "example": d["example"],
            "exampleVi": ""
        })
        if not d["meaning"]:
            missing_meaning += 1
        if not d["ipa"]:
            missing_ipa += 1
    return missing_meaning, missing_ipa

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--levels", type=Path, help="Use an existing Vocabulary-levels.json")
    parser.add_argument("--topics", type=Path, help="Use an existing Vocabulary-topics.json")
    parser.add_argument("--db", type=Path, help="Use an existing dictionary_en_vi.db")
    parser.add_argument("--output", type=Path, default=Path("data/vocab-3000.json"))
    parser.add_argument("--min-count", type=int, default=2500)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="english3000-") as td:
        td = Path(td)
        levels_path = args.levels or download(LEVEL_URL, td / "levels.json")
        topics_path = args.topics or download(TOPIC_URL, td / "topics.json")
        db_path = args.db or download(DB_URL, td / "dictionary_en_vi.db")

        level_data = load_json(levels_path)
        topic_data = load_json(topics_path)
        words = build_word_list(level_data)
        if len(words) < args.min_count:
            raise SystemExit(f"Only {len(words)} vocabulary items found; expected at least {args.min_count}.")

        topics = attach_topics(words, topic_data)
        missing_meaning, missing_ipa = enrich_from_db(words, db_path)

        pack = {
            "meta": {
                "version": "3.1",
                "count": len(words),
                "target": TARGET,
                "fullOffline": len(words) >= args.min_count,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "missingMeaning": missing_meaning,
                "missingIpa": missing_ipa,
                "license": "CC BY-SA 4.0 for dictionary-derived data",
                "sources": [
                    "https://github.com/mankhb2k/Vocabulary-English",
                    "https://github.com/skypediacode/english-vietnamese-dictionary"
                ]
            },
            "topics": topics,
            "words": words
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(pack, ensure_ascii=False, separators=(",",":")), encoding="utf-8")

    print(f"Built {len(words)} words -> {args.output}")
    print(f"Missing Vietnamese meanings: {missing_meaning}")
    print(f"Missing IPA: {missing_ipa}")

if __name__ == "__main__":
    main()
