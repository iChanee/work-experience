import zipfile
import os

# 압축 해제
zip_path = "cti_products_txt.zip"
output_txt = "cti_products_all.txt"

with zipfile.ZipFile(zip_path, "r") as zipf:
    txt_files = [f for f in zipf.namelist() if f.endswith(".txt")]
    all_contents = []
    for fname in txt_files:
        with zipf.open(fname) as f:
            txt = f.read().decode("utf-8", errors="ignore")
            all_contents.append("\n" + "="*50 + "\n" + txt.strip())

with open(output_txt, "w", encoding="utf-8") as out:
    out.write("\n".join(all_contents))

print(f"전체 통합 파일 저장 완료 → {output_txt}")
