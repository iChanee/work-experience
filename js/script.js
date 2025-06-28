// 기본적인 JavaScript 코드를 여기에 추가할 수 있습니다.

// 예시: 내비게이션 메뉴 클릭 시 부드럽게 스크롤
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 기타 동적인 요소 (예: 폼 유효성 검사, 슬라이더 등)를 추가할 수 있습니다.