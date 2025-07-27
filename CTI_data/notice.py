import requests
from bs4 import BeautifulSoup
import time

BASE_URL = "https://www.cti-korea.com/bbs/board.php?bo_table=notice"
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ..."
}
all_posts = []
page = 1

while True:
    url = BASE_URL if page == 1 else f"{BASE_URL}&page={page}"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")

    # 게시글 상세 URL 추출
    rows = soup.select('table tbody tr')
    post_links = []
    for row in rows:
        a = row.select_one('.bo_tit a')
        if a and 'href' in a.attrs:
            post_links.append(a['href'])

    if not post_links:
        break

    # 상세페이지 본문 추출
    for link in post_links:
        full_url = link if link.startswith("http") else "https://www.cti-korea.com" + link
        res2 = requests.get(full_url, headers=headers)
        soup2 = BeautifulSoup(res2.text, "html.parser")

        # 제목
        try:
            title = soup2.select_one('.bo_v_title, .view_tit, .sub_title, h1').get_text(strip=True)
        except:
            title = "제목 없음"

        # 본문 내용
        try:
            content = soup2.select_one('.bo_v_con, .view_content, .con_body, .content_wrap').get_text("\n", strip=True)
        except:
            content = soup2.get_text(separator="\n", strip=True)
        
        all_posts.append(f"제목: {title}\nURL: {full_url}\n\n{content}\n\n---\n")
        time.sleep(0.2)
    # 다음 페이지 버튼 있는지 체크
    next_btn = soup.select_one('a.pg_page.pg_next')
    if not next_btn or "href" not in next_btn.attrs:
        break
    page += 1

with open("공지사항_전체글.txt", "w", encoding="utf-8") as f:
    for post in all_posts:
        f.write(post)

print("완료! 모든 공지사항 본문까지 저장됨.")
