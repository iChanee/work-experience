from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time

chrome_path = '/opt/homebrew/bin/chromedriver'

options = Options()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
service = Service(chrome_path)
driver = webdriver.Chrome(service=service, options=options)

# 회사소개 > 인사말, 연혁, 사업분야 등 메뉴별 "실제 url"
pages = {
    "인사말": "https://www.cti-korea.com/bbs/content.php?co_id=company",
    "회사연혁": "https://www.cti-korea.com/bbs/content.php?co_id=company2",
    "사업분야": "https://www.cti-korea.com/bbs/content.php?co_id=company3",
    "조직도": "https://www.cti-korea.com/bbs/content.php?co_id=company4",
    "오시는길": "https://www.cti-korea.com/bbs/content.php?co_id=company5",
    "특허현황": "https://www.cti-korea.com/theme/business/html/certificate/01.php",
    "인증현황": "https://www.cti-korea.com/theme/business/html/certificate/02.php"
}

for name, url in pages.items():
    driver.get(url)
    time.sleep(2)
    content = "내용 없음"
    # 본문 selector 여러 패턴 시도
    for selector in ['.con_body', '.content_wrap', '.sub_content', '.main_content', '.board_view', 'body']:
        try:
            el = driver.find_element(By.CSS_SELECTOR, selector)
            content = el.text.strip()
            if content and content != "":
                break
        except:
            continue
    with open(f"{name}.txt", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"{name} 저장 완료!")

driver.quit()
