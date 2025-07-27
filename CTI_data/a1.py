import re

input_path = "계측제품.txt"
output_path = "계측제품(수정).txt"

with open(input_path, encoding='utf-8') as infile, open(output_path, 'w', encoding='utf-8') as outfile:
    for line in infile:
        if any(x in line for x in ['■ 상세페이지:', '[대표이미지]:', '[데이터시트]:']):
            continue
        outfile.write(line)
