from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


chrome_path = '/opt/homebrew/bin/chromedriver'

options = Options()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
# options.add_argument('--headless')  # headless 모드 끄고 확인

service = Service(chrome_path)
driver = webdriver.Chrome(service=service, options=options)

driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

driver.get('https://www.saramin.co.kr/zf_user/company-info/view?csn=UGZsdVpPR2Z2ZDRtK0srWEVySGFhQT09')
time.sleep(4)

print(driver.page_source[:1000])

# 1. 회사개요
try:
    company_name = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.company_tit h1'))).text.strip()
except:
    company_name = ""
try:
    summary = "\n".join([li.text.strip() for li in driver.find_elements(By.CSS_SELECTOR, '.summary_list li')])
except:
    summary = ""
try:
    details = "\n".join([li.text.strip() for li in driver.find_elements(By.CSS_SELECTOR, '.info_list li')])
except:
    details = ""
with open("1_회사개요.txt", "w", encoding="utf-8") as f:
    f.write(f"회사명: {company_name}\n\n{summary}\n\n{details}")

# 2. 회사소개
try:
    introduction = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.company_intro .txt'))).text.strip()
except:
    introduction = "회사소개 정보 없음"
with open("2_회사소개.txt", "w", encoding="utf-8") as f:
    f.write(introduction)

# 3. 연혁 (탭 클릭 필요)
try:
    tab = driver.find_element(By.CSS_SELECTOR, 'a[data-tab="tab_history"]')
    driver.execute_script("arguments[0].click();", tab)
    time.sleep(2)
    history_items = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, '.tab_contents .history_list li')))
    history = "\n".join([li.text.strip() for li in history_items])
except:
    history = "연혁 정보 없음"
with open("3_연혁.txt", "w", encoding="utf-8") as f:
    f.write(history)

# 4. 복지/혜택 (탭 클릭 필요)
try:
    tab = driver.find_element(By.CSS_SELECTOR, 'a[data-tab="tab_welfare"]')
    driver.execute_script("arguments[0].click();", tab)
    time.sleep(2)
    welfare_items = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, '.tab_contents .welfare_area .welfare_item')))
    welfare = "\n".join([li.text.strip() for li in welfare_items])
except:
    welfare = "복지 정보 없음"
with open("4_복지혜택.txt", "w", encoding="utf-8") as f:
    f.write(welfare)

# 5. 연봉 정보 (탭 클릭 필요)
try:
    tab = driver.find_element(By.CSS_SELECTOR, 'a[data-tab="tab_salary"]')
    driver.execute_script("arguments[0].click();", tab)
    time.sleep(2)
    salary_info = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.tab_contents .salary_info'))).text.strip()
except:
    salary_info = "연봉 정보 없음"
with open("5_연봉정보.txt", "w", encoding="utf-8") as f:
    f.write(salary_info)

driver.quit()
print("카테고리별 txt 저장 완료!")
