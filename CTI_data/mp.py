import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
import re
import time
from PIL import Image
from io import BytesIO
import pytesseract

BASE_URL = "https://www.cti-korea.com"
MAIN_URL = BASE_URL + "/product.php?cat_tab=1"
HEADERS = {"User-Agent": "Mozilla/5.0"}

TXT_DIR = "cti_products_txt"
IMG_DIR = "cti_product_imgs"
os.makedirs(TXT_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

def clean_txt(txt):
    return re.sub(r'\s+', ' ', txt).strip()

def ocr_image(img_url, fname):
    """이미지 URL 다운로드 + OCR"""
    try:
        img_bytes = requests.get(img_url, timeout=10).content
        with open(fname, "wb") as f:
            f.write(img_bytes)
        img = Image.open(BytesIO(img_bytes))
        text = pytesseract.image_to_string(img, lang="kor+eng")
        return text.strip()
    except Exception as e:
        return f"[이미지 OCR 실패: {e}]"

def save_txt(prod_info):
    """제품정보와 OCR 결과를 txt에 저장"""
    fname = prod_info.get("제품명") or prod_info.get("모델명") or prod_info.get("상세URL")[-12:]
    fname = "".join([c for c in fname if c.isalnum() or c in " _-"])[:50]
    path = os.path.join(TXT_DIR, f"{fname}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"■ 제품명: {prod_info.get('제품명','')}\n")
        f.write(f"■ 모델명: {prod_info.get('모델명','')}\n")
        f.write(f"■ 분류명: {prod_info.get('분류명','')}\n")
        f.write(f"■ 상세페이지: {prod_info.get('상세URL','')}\n")
        # 대표이미지와 OCR
        if prod_info.get("대표이미지"):
            f.write(f"\n[대표이미지]: {prod_info['대표이미지']}\n")
            if prod_info.get("대표이미지_OCR"):
                f.write(f"  [대표이미지 OCR]\n{prod_info['대표이미지_OCR']}\n")
        # 본문 이미지와 OCR
        if prod_info.get("본문이미지목록"):
            for idx, (img_fname, ocr_txt) in enumerate(prod_info["본문이미지목록"]):
                f.write(f"\n[본문이미지 {idx+1}]: {img_fname}\n")
                f.write(f"  [본문이미지 OCR]\n{ocr_txt}\n")
        # 기타 정보
        if prod_info.get("데이터시트"):
            f.write(f"\n[데이터시트]: {prod_info['데이터시트']}\n")
        if prod_info.get("퀵스펙"):
            f.write("\n[퀵스펙]\n" + prod_info["퀵스펙"].strip() + "\n")
        if prod_info.get("제품소개"):
            f.write("\n[제품소개]\n" + prod_info["제품소개"].strip() + "\n")
        f.write("\n-----------------------------\n")
        for k, v in prod_info.items():
            if k not in ["제품명","모델명","분류명","상세URL","대표이미지","대표이미지_OCR",
                         "본문이미지목록","데이터시트","퀵스펙","제품소개"]:
                f.write(f"{k}: {v}\n")

print("[1] 제조제품 메인 카테고리 수집")
res = requests.get(MAIN_URL, headers=HEADERS)
soup = BeautifulSoup(res.text, "html.parser")
cat1_anchors = soup.select(".ul_category1 .li_category1 a")
cat1_urls = [urljoin(BASE_URL, a["href"]) for a in cat1_anchors if "href" in a.attrs]

for cidx, cat1_url in enumerate(cat1_urls):
    res = requests.get(cat1_url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")
    cat2_anchors = soup.select(".ul_category2 .li_category2 a")
    cat2_urls = [urljoin(BASE_URL, a["href"]) for a in cat2_anchors] if cat2_anchors else [cat1_url]
    for cat2_url in cat2_urls:
        res = requests.get(cat2_url, headers=HEADERS)
        soup = BeautifulSoup(res.text, "html.parser")
        prod_anchors = soup.select(".ul_itemlist .li_item a")
        prod_urls = [urljoin(BASE_URL, a["href"]) for a in prod_anchors]
        for prod_url in prod_urls:
            res = requests.get(prod_url, headers=HEADERS)
            soup = BeautifulSoup(res.text, "html.parser")
            table = soup.select_one("table")
            prod_info = {"상세URL": prod_url}
            if table:
                rows = table.select("tr")
                for row in rows:
                    th = row.select_one("th")
                    td = row.select_one("td")
                    if not th or not td:
                        continue
                    key = clean_txt(th.get_text())
                    # 대표이미지
                    if '제품이미지' in key:
                        img_tag = td.select_one("img")
                        if img_tag and "src" in img_tag.attrs:
                            img_url = img_tag["src"]
                            if not img_url.startswith("http"):
                                img_url = urljoin(BASE_URL, img_url)
                            img_fname = os.path.join(IMG_DIR, os.path.basename(img_url))
                            ocr_result = ocr_image(img_url, img_fname)
                            prod_info["대표이미지"] = img_fname
                            prod_info["대표이미지_OCR"] = ocr_result
                        else:
                            prod_info["대표이미지"] = ""
                    # 데이터시트
                    elif '데이터시트' in key:
                        a = td.select_one("a")
                        if a and "href" in a.attrs:
                            file_url = urljoin(BASE_URL, a["href"])
                            prod_info["데이터시트"] = file_url
                    # 제품소개(본문이미지)
                    elif '제품소개' in key or '설명' in key:
                        prod_info[key] = td.get_text("\n", strip=True)
                        # 본문 내 이미지
                        imgs = td.select("img")
                        img_ocr_list = []
                        for img in imgs:
                            src = img.get("src")
                            if src:
                                if not src.startswith("http"):
                                    src = urljoin(BASE_URL, src)
                                img_fname = os.path.join(IMG_DIR, os.path.basename(src))
                                ocr_result = ocr_image(src, img_fname)
                                img_ocr_list.append((img_fname, ocr_result))
                        if img_ocr_list:
                            prod_info["본문이미지목록"] = img_ocr_list
                    else:
                        prod_info[key] = td.get_text(separator=" ", strip=True)
            save_txt(prod_info)
            print("  [✔]", prod_info.get("제품명") or prod_info.get("모델명") or prod_info["상세URL"])
            time.sleep(0.2)

print(f"\n모든 제품별 txt+OCR 저장 완료! (폴더: {TXT_DIR})")
