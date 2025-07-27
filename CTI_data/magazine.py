import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import pytesseract
import os
import time

BASE_LIST_URL = "https://www.cti-korea.com/bbs/board.php?bo_table=magazine"
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

os.makedirs("webmagazine_imgs", exist_ok=True)
os.makedirs("webmagazine_ocr", exist_ok=True)

# 1. 웹매거진 전체 게시글 상세페이지 URL 수집
all_post_urls = []
page = 1

print("### [1단계] 전체 상세페이지 URL 수집 시작 ###")

while True:
    url = BASE_LIST_URL if page == 1 else f"{BASE_LIST_URL}&page={page}"
    res = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")
    
    rows = soup.select('table tbody tr')
    post_links = []
    for row in rows:
        a = row.select_one('.bo_tit a')
        if a and 'href' in a.attrs:
            link = a['href']
            if not link.startswith("http"):
                link = "https://www.cti-korea.com" + link
            post_links.append(link)
    if not post_links:
        break
    all_post_urls.extend(post_links)
    print(f"{page}페이지: {len(post_links)}개")
    # 다음 페이지로 넘어가는 버튼 체크
    next_btn = soup.select_one('a.pg_page.pg_next')
    if not next_btn or "href" not in next_btn.attrs:
        break
    page += 1
    time.sleep(0.5)

print(f"\n총 게시글: {len(all_post_urls)}개\n")

# 2. OCR 파이프라인 실행
print("### [2단계] 각 게시글 이미지 OCR 자동 처리 시작 ###")

for post_url in all_post_urls:
    res = requests.get(post_url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")

    # 제목 추출 (파일명 안전하게)
    try:
        title = soup.select_one('.bo_v_tit').get_text(strip=True)
        safe_title = "".join(c for c in title if c.isalnum() or c in " _-")
    except:
        title = "제목없음"
        safe_title = "제목없음"

    print(f"[{title}] OCR 추출 중...")

    # 본문 내 모든 이미지 추출
    imgs = soup.select("#bo_v_con img")
    ocr_texts = []
    for idx, img in enumerate(imgs):
        img_url = img.get('src')
        if not img_url.startswith("http"):
            img_url = "https://www.cti-korea.com" + img_url
        try:
            img_data = requests.get(img_url, timeout=10).content
            img_ext = img_url.split('.')[-1].split('?')[0]
            img_filename = f"webmagazine_imgs/{safe_title}_{idx+1}.{img_ext}"
            with open(img_filename, "wb") as f:
                f.write(img_data)
            print(f"  - 이미지 다운로드: {img_filename}")

            # OCR 인식
            image = Image.open(BytesIO(img_data))
            text = pytesseract.image_to_string(image, lang='kor+eng')
            ocr_texts.append(f"[이미지 {idx+1}: {img_url}]\n{text.strip()}\n")
            time.sleep(0.2)
        except Exception as e:
            print(f"  - OCR 실패: {e}")
            continue

    if ocr_texts:
        with open(f"webmagazine_ocr/{safe_title}_ocr.txt", "w", encoding="utf-8") as f:
            f.write(f"게시글 URL: {post_url}\n\n")
            for text in ocr_texts:
                f.write(text + "\n")
        print(f"  - OCR 텍스트 저장 → {safe_title}_ocr.txt")
    else:
        print(f"  - 본문 내 이미지 없음 or OCR 결과 없음")

    print("-" * 30)

print("\n웹매거진 전체 이미지 OCR 자동화 전체 완료!")
