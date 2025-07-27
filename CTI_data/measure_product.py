import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import pytesseract
import os
import time

BASE_URL = "https://www.cti-korea.com"
START_URL = BASE_URL + "/product.php?cat_tab=2"
HEADERS = {"User-Agent": "Mozilla/5.0"}

os.makedirs("measure_imgs", exist_ok=True)

def full_url(href):
    if href.startswith("http"):
        return href
    elif href.startswith("/"):
        return BASE_URL + href
    elif href.startswith("./"):
        return BASE_URL + href[1:]
    else:
        return BASE_URL + "/" + href

def ocr_image_from_url(img_url, file_prefix):
    try:
        res = requests.get(img_url, timeout=10)
        ext = img_url.split(".")[-1].split("?")[0]
        img_filename = f"measure_imgs/{file_prefix}.{ext}"
        with open(img_filename, "wb") as f:
            f.write(res.content)
        image = Image.open(BytesIO(res.content))
        text = pytesseract.image_to_string(image, lang='kor+eng')
        ocr = text.strip() if text.strip() else "(이미지 내 OCR 추출 텍스트 없음)"
        return img_filename, ocr
    except Exception as e:
        return None, f"(OCR 실패: {e})"

def parse_product_detail(product_url):
    res = requests.get(product_url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")
    lines = []
    try:
        # 제품 정보
        trs = soup.select('section#bo_v table tr')
        info = {}
        for tr in trs:
            th = tr.select_one('th')
            td = tr.select_one('td')
            if th and td:
                key = th.get_text(strip=True)
                val = td.get_text(strip=True)
                info[key] = val
        prod_name = info.get("제품명", "")
        prod_model = info.get("모델명", "")
        prod_cate = info.get("분류명", "")

        lines.append("="*50)
        lines.append(f"■ 제품명: {prod_name}")
        lines.append(f"■ 모델명: {prod_model}")
        lines.append(f"■ 분류명: {prod_cate}")
        lines.append(f"■ 상세페이지: {product_url}")

        # 대표이미지
        img_tag = soup.select_one("#bo_v_img img")
        if img_tag:
            main_img = img_tag.get("src")
            lines.append(f"[대표이미지]: {main_img}")
            file_prefix = prod_name.replace(" ", "_")[:30] + "_main"
            img_path, ocr = ocr_image_from_url(full_url(main_img), file_prefix)
            lines.append(f"  [대표이미지 OCR]\n{ocr}")

        # 본문이미지 (여러개)
        body_imgs = soup.select("#bo_v_con img")
        for idx, img in enumerate(body_imgs):
            body_img_url = img.get("src")
            lines.append(f"[본문이미지 {idx+1}]: {body_img_url}")
            file_prefix = f"{prod_name.replace(' ', '_')[:30]}_body{idx+1}"
            img_path, ocr = ocr_image_from_url(full_url(body_img_url), file_prefix)
            lines.append(f"  [본문이미지 OCR]\n{ocr}")

        # 데이터시트
        data_link = soup.select_one('a.view_file_download')
        if data_link:
            href = data_link.get("href")
            if href:
                lines.append(f"[데이터시트]: {full_url(href)}")

        # 퀵스펙
        quickspec = ""
        for tr in trs:
            th = tr.select_one('th')
            if th and "퀵스펙" in th.text:
                td = tr.select_one('td')
                quickspec = td.get_text(" ", strip=True) if td else ""
                break
        if quickspec:
            lines.append("[퀵스펙]")
            lines.append(quickspec)

        # 제품소개
        intro = ""
        for tr in trs:
            th = tr.select_one('th')
            if th and "제품소개" in th.text:
                td = tr.select_one('td')
                if td:
                    intro = td.get_text(" ", strip=True)
                break
        if intro:
            lines.append("[제품소개]")
            lines.append(intro)
        lines.append("-"*30)
        return "\n".join(lines)
    except Exception as e:
        return f"[ERROR]: {product_url} : {e}"

def crawl_products(start_url, visited=None):
    if visited is None:
        visited = set()
    products = []
    res = requests.get(start_url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")
    # 제품리스트
    product_links = soup.select('ul.ul_itemlist li a')
    for a in product_links:
        url = full_url(a.get('href'))
        if url not in visited:
            visited.add(url)
            prod_txt = parse_product_detail(url)
            products.append(prod_txt)
            time.sleep(0.5)
    # 서브카테고리
    sub_links = []
    for sel in ['ul.ul_category1 li a', 'ul.ul_category2 li a', 'ul.ul_category3 li a']:
        for a in soup.select(sel):
            url = full_url(a.get('href'))
            if url not in visited:
                visited.add(url)
                sub_links.append(url)
    for sub_url in sub_links:
        products.extend(crawl_products(sub_url, visited))
        time.sleep(0.1)
    return products

if __name__ == "__main__":
    print("계측제품 전체 크롤링 + 이미지 OCR 시작...")
    results = crawl_products(START_URL)
    with open("cti_measure_products_ocr.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    print(f"총 {len(results)}개 제품 저장 완료! → cti_measure_products_ocr.txt")
