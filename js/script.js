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
document.addEventListener('DOMContentLoaded', function() {
    // 1. 부드러운 스크롤링 및 하위 페이지 표시/숨김 로직
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // 외부 링크인 경우 기본 동작 수행
            if (!targetId.startsWith('#')) {
                return;
            }

            e.preventDefault();

            // 모든 sub-page-section 숨기기
            document.querySelectorAll('.sub-page-section').forEach(section => {
                section.classList.remove('active');
            });

            // 클릭된 메뉴에 해당하는 섹션만 보이기
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.classList.add('active'); // 섹션 보이게
                
                // 해당 섹션으로 부드럽게 스크롤
                const headerOffset = document.querySelector('header').offsetHeight; // 헤더 높이
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            } else {
                // targetElement가 없는 경우 (메인 페이지로 이동하는 메뉴 클릭 시)
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        });
    });

    // 페이지 로드 시 URL 해시에 따라 섹션 표시
    if (window.location.hash) {
        const initialTarget = document.querySelector(window.location.hash);
        if (initialTarget && initialTarget.classList.contains('sub-page-section')) {
            document.querySelectorAll('.sub-page-section').forEach(section => {
                section.classList.remove('active');
            });
            initialTarget.classList.add('active');

            // 헤더 높이를 고려하여 스크롤
            const headerOffset = document.querySelector('header').offsetHeight;
            const elementPosition = initialTarget.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    }


    // 2. 웹 매거진 캐러셀 (Carousel) 기능
    const carousel = document.querySelector('.magazine-carousel');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const items = document.querySelectorAll('.magazine-item');
    const itemWidth = items[0].offsetWidth + 20; // 아이템 너비 + margin (20px)
    let currentIndex = 0;

    function updateCarousel() {
        // 캐러셀 너비가 화면 너비에 따라 변할 수 있으므로 동적으로 계산
        const containerWidth = document.querySelector('.magazine-carousel-wrapper').offsetWidth - 80; // 좌우 패딩 제외
        const itemsToShow = window.innerWidth <= 768 ? 1 : 2; // 모바일 1개, 데스크탑 2개
        const itemFullWidth = items[0].offsetWidth + (window.innerWidth <= 768 ? 20 : 20); // 아이템 너비 + 마진
        
        let transformValue = -currentIndex * itemFullWidth;
        carousel.style.transform = `translateX(${transformValue}px)`;
        
        // 버튼 활성화/비활성화
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= (items.length - itemsToShow);
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    nextBtn.addEventListener('click', () => {
        const itemsToShow = window.innerWidth <= 768 ? 1 : 2;
        if (currentIndex < (items.length - itemsToShow)) {
            currentIndex++;
            updateCarousel();
        }
    });

    // 화면 크기 변경 시 캐러셀 업데이트
    window.addEventListener('resize', updateCarousel);

    // 초기 로드 시 캐러셀 업데이트
    updateCarousel();


    // 3. 메인 홈페이지로 이동 시 하위 페이지 숨기기
    document.querySelector('.logo a').addEventListener('click', function(e) {
        e.preventDefault(); // 기본 링크 동작 방지
        document.querySelectorAll('.sub-page-section').forEach(section => {
            section.classList.remove('active'); // 모든 하위 페이지 숨기기
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 최상단으로 스크롤
        history.pushState(null, '', window.location.pathname); // URL의 # 제거
    });

    // 특허 보기 및 인증 보기 링크 클릭 시 해당 페이지로 이동
    document.querySelector('a[href="#patent-page"]').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sub-page-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('patent-page').classList.add('active');
        const headerOffset = document.querySelector('header').offsetHeight;
        const targetElement = document.getElementById('patent-page');
        const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    });

    document.querySelector('a[href="#certification-page"]').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sub-page-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('certification-page').classList.add('active');
        const headerOffset = document.querySelector('header').offsetHeight;
        const targetElement = document.getElementById('certification-page');
        const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    });
});