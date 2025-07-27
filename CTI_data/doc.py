import os
import re
import shutil

# OCR txt 파일들이 들어있는 폴더 경로 (압축 푼 폴더)
folder = "./webmagazine_ocr"   # 압축 해제한 폴더 경로로 변경

# 파일명 안전하게(영어,숫자,언더스코어만) + 50자 제한
def safe_filename(name, idx):
    # 한글, 특수문자 제거
    name = re.sub(r'[^A-Za-z0-9_]+', '_', name)
    # 너무 짧으면 idx 붙이기
    if len(name) < 5:
        name = f"file_{idx}"
    # 50자 제한
    return name[:50] + f"_{idx}.txt"

cnt = 0
for filename in os.listdir(folder):
    if not filename.lower().endswith(".txt"):
        continue
    old_path = os.path.join(folder, filename)
    try:
        # 새 파일명 생성
        new_filename = safe_filename(filename.replace(".txt",""), cnt)
        new_path = os.path.join(folder, new_filename)
        if old_path != new_path:
            shutil.move(old_path, new_path)
            print(f"{filename} → {new_filename}")
        cnt += 1
    except Exception as e:
        print(f"Error: {filename} | {e}")

print(f"\n정상적으로 이름이 변경된 txt 파일 개수: {cnt}")
