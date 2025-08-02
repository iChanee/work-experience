// js/script.js (최종 수정 버전)

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. 내비게이션 메뉴 클릭 로직 ---
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetHref = this.getAttribute('href'); // 예: "company-intro.html#greeting" 또는 "#greeting"

            // 1-1. 해시(#)로만 시작하는 링크인 경우 (같은 페이지 내 이동)
            if (targetHref.startsWith('#')) {
                e.preventDefault(); // 브라우저의 기본 동작(바로 이동) 방지

                const targetId = targetHref;
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    // 중요: 현재 페이지의 모든 .main-page-section을 숨기고, 클릭된 섹션만 보이게 합니다.
                    document.querySelectorAll('.main-page-section').forEach(section => {
                        section.classList.remove('active'); // 모든 섹션에서 active 클래스 제거
                    });
                    targetElement.classList.add('active'); // 클릭된 섹션에 active 클래스 추가

                    // URL 해시 업데이트 (브라우저 주소창에 #id 표시)
                    history.pushState(null, '', targetId);

                    // 헤더 높이를 고려하여 부드럽게 스크롤 (이때 스크롤은 거의 항상 0으로 갈 것)
                    const header = document.querySelector('header');
                    const headerOffset = header ? header.offsetHeight : 0;
                    const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition, // 이 경우 0에 가까운 값으로 스크롤됨
                        behavior: "smooth"
                    });
                }
            }
            // 1-2. 해시(#)로 시작하지 않는 링크인 경우 (다른 HTML 파일로 이동)
            //     이 경우 e.preventDefault()를 호출하지 않으므로, 브라우저가 해당 href로
            //     정상적으로 페이지를 로드할 것입니다.
        });
    });

    // --- 2. 페이지 로드 시 URL 해시에 따라 섹션 표시 및 스크롤 ---
    // (하위 페이지로 직접 접근했거나, 새로고침 시 특정 섹션을 보이게 함)
    // 이 로직은 하위 페이지에서만 의미가 있습니다.
    const sections = document.querySelectorAll('.main-page-section');
    if (sections.length > 0) { // 현재 페이지에 .main-page-section이 있을 경우만 작동
        let targetSection = null;
        if (window.location.hash) {
            targetSection = document.querySelector(window.location.hash);
        }

        // URL 해시가 없거나 유효하지 않은 경우, 첫 번째 섹션을 기본으로 보이게 함
        if (!targetSection) {
            targetSection = sections[0]; // 첫 번째 섹션 보이게
        }

        // 모든 섹션을 숨기고, 타겟 섹션만 보이게 합니다.
        sections.forEach(section => {
            section.classList.remove('active');
        });
        if (targetSection) {
            targetSection.classList.add('active'); // 해당 섹션 활성화

            // 해당 섹션으로 부드럽게 스크롤
            const header = document.querySelector('header');
            const headerOffset = header ? header.offsetHeight : 0;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    }

    // --- 3. 웹 매거진 캐러셀 (Carousel) 기능 ---
    // (메인 페이지에만 해당하며, 안정성을 위해 요소 존재 여부 확인)
    const carousel = document.querySelector('.magazine-carousel');
    if (carousel) {
        // --- 웹 매거진 캐러셀 정확히 카드 하나만큼 이동 ---
        const carousel = document.querySelector('.magazine-carousel');
        const prevBtn = document.querySelector('.carousel-nav.prev');
        const nextBtn = document.querySelector('.carousel-nav.next');
        let currentIndex = 0;

        function getCardFullWidth() {
            const item = document.querySelector('.magazine-item');
            if (!item) return 0;
            const style = window.getComputedStyle(item);
            const width = item.offsetWidth;
            const marginRight = parseFloat(style.marginRight || 0);
            return width + marginRight;
        }

        function updateCarousel() {
            const cardWidth = getCardFullWidth();
            const items = document.querySelectorAll('.magazine-item');
            if (items.length === 0 || cardWidth === 0) return;

            const maxIndex = Math.max(0, items.length - 1);
            const translateX = currentIndex * cardWidth;
            document.querySelector('.magazine-carousel').style.transform = `translateX(-${translateX}px)`;

            prevBtn.disabled = currentIndex <= 0;
            nextBtn.disabled = currentIndex >= maxIndex;
        }

        prevBtn?.addEventListener('click', () => {
            const items = document.querySelectorAll('.magazine-item');
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextBtn?.addEventListener('click', () => {
            const items = document.querySelectorAll('.magazine-item');
            if (currentIndex < items.length - 1) {
                currentIndex++;
                updateCarousel();
            }
        });

        window.addEventListener('resize', updateCarousel);
        document.addEventListener('DOMContentLoaded', updateCarousel);

    }

    // --- 4. 로고 클릭 시 메인 페이지 상단으로 스크롤 및 URL 해시 제거 ---
    const logoLink = document.querySelector('.logo a');
    if (logoLink && logoLink.getAttribute('href') === 'index.html') {
        logoLink.addEventListener('click', function(e) {
            const isRootPath = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
            if (isRootPath && window.location.hash) {
                e.preventDefault(); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                history.pushState(null, '', window.location.pathname); 
            }
        });
    }

    // --- 5. 특허 보기 및 인증 보기 링크 클릭 처리 제거 --- (이전과 동일)

    // --- 6. 협력사 캐러셀 (Partners Carousel) 기능 - 수정된 부분 ---
    const partnersCarousel = document.querySelector('.partners-carousel');
    if (partnersCarousel) {
        const partnersPrevBtn = document.querySelector('.carousel-nav.prev-partner');
        const partnersNextBtn = document.querySelector('.carousel-nav.next-partner');
        const partnersItems = document.querySelectorAll('.partner-item');
        let partnersCurrentIndex = 0;

        function updatePartnersCarousel() {
            if (partnersItems.length === 0) return;

            // 화면 너비에 따라 보여줄 아이템 개수 결정
            let itemsToShow;
            if (window.innerWidth <= 768) {
                itemsToShow = 1; // 768px 이하 (모바일)
            } else if (window.innerWidth <= 992) { // 992px 이하 (태블릿 가로)
                itemsToShow = 2; // 2개 노출
            } else { // 992px 초과 (데스크탑)
                itemsToShow = 3; // 3개 노출
            }
            
            // 각 아이템의 실제 너비를 계산 (margin 포함)
            const itemStyle = window.getComputedStyle(partnersItems[0]);
            const itemMarginRight = parseFloat(itemStyle.marginRight) || 0;
            const itemMarginLeft = parseFloat(itemStyle.marginLeft) || 0;
            const itemSpacing = itemMarginLeft + itemMarginRight; // 항목당 총 좌우 마진
            
            // 실제 캐러셀의 offsetWidth를 사용하거나, 첫 항목 너비를 기준으로 계산
            // 현재 CSS 설정에 따르면 itemWidth = items[0].offsetWidth + itemSpacing
            const itemFullWidth = partnersItems[0].offsetWidth + itemSpacing;

            let transformValue = -partnersCurrentIndex * itemFullWidth;
            partnersCarousel.style.transform = `translateX(${transformValue}px)`;
            
            partnersPrevBtn.disabled = partnersCurrentIndex === 0;
            // itemsToShow가 0이 되는 경우 방지 (최소 1개는 보여야 하므로)
            partnersNextBtn.disabled = partnersCurrentIndex >= (partnersItems.length - itemsToShow);
        }

        partnersPrevBtn.addEventListener('click', () => {
            if (partnersCurrentIndex > 0) {
                partnersCurrentIndex--;
                updatePartnersCarousel();
            }
        });

        partnersNextBtn.addEventListener('click', () => {
            let itemsToShow;
            if (window.innerWidth <= 768) {
                itemsToShow = 1;
            } else if (window.innerWidth <= 992) {
                itemsToShow = 2;
            } else {
                itemsToShow = 3;
            }

            if (partnersCurrentIndex < (partnersItems.length - itemsToShow)) {
                partnersCurrentIndex++;
                updatePartnersCarousel();
            }
        });

        window.addEventListener('resize', updatePartnersCarousel);
        updatePartnersCarousel(); // 초기 로드 시 캐러셀 위치 설정
    }

    // --- 7. 현직자 소통 캐러셀 (employee-carousel)
    const employeeCarousel = document.querySelector('.employee-carousel');
    if (employeeCarousel) {
    const employeePrevBtn = document.querySelector('.carousel-nav.prev-employee');
    const employeeNextBtn = document.querySelector('.carousel-nav.next-employee');
    const employeeCards = document.querySelectorAll('.employee-card');
    let employeeCurrentIndex = 0;

    function updateEmployeeCarousel() {
        if (employeeCards.length === 0) return;

        let itemsToShow;
        if (window.innerWidth <= 768) {
        itemsToShow = 1;
        } else if (window.innerWidth <= 992) {
        itemsToShow = 2;
        } else {
        itemsToShow = 3;
        }

        const cardStyle = window.getComputedStyle(employeeCards[0]);
        const marginL = parseFloat(cardStyle.marginLeft) || 0;
        const marginR = parseFloat(cardStyle.marginRight) || 0;
        const fullWidth = employeeCards[0].offsetWidth + marginL + marginR;

        const transformValue = -employeeCurrentIndex * fullWidth;
        employeeCarousel.style.transform = `translateX(${transformValue}px)`;

        employeePrevBtn.disabled = employeeCurrentIndex === 0;
        employeeNextBtn.disabled = employeeCurrentIndex >= (employeeCards.length - itemsToShow);
    }

    employeePrevBtn.addEventListener('click', () => {
        if (employeeCurrentIndex > 0) {
        employeeCurrentIndex--;
        updateEmployeeCarousel();
        }
    });

    employeeNextBtn.addEventListener('click', () => {
        let itemsToShow;
        if (window.innerWidth <= 768) {
        itemsToShow = 1;
        } else if (window.innerWidth <= 992) {
        itemsToShow = 2;
        } else {
        itemsToShow = 3;
        }

        if (employeeCurrentIndex < (employeeCards.length - itemsToShow)) {
        employeeCurrentIndex++;
        updateEmployeeCarousel();
        }
    });

    window.addEventListener('resize', updateEmployeeCarousel);
    updateEmployeeCarousel(); // 초기 위치 설정
    }
});

// 로그인 로그아웃 버튼
async function updateLoginStateButton() {
  let btnLi = document.getElementById('loginStateBtnLi');
  if (!btnLi) return;
  let res = await fetch('/api/me', { credentials: 'include' });
  let data = await res.json();
  if (data.loggedIn) {
    btnLi.innerHTML = `<button id="logoutBtn" class="nav-auth-btn">로그아웃</button>`;
    document.getElementById('logoutBtn').onclick = async function() {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
      location.reload();
    };
  } else {
    btnLi.innerHTML = `<a href="login.html" class="nav-auth-btn">로그인</a>`;
  }
}
document.addEventListener('DOMContentLoaded', updateLoginStateButton);


// 오피스 사진 카드 클릭 시 라이트박스 표시
document.addEventListener("DOMContentLoaded", function() {
  const officePhotoCards = document.querySelectorAll('.office-photo-card');
  const lightbox = document.getElementById('lightbox');
  if (officePhotoCards.length && lightbox) {
    officePhotoCards.forEach(card => {
      card.addEventListener('click', function() {
        const fullsrc = card.getAttribute('data-full');
        const caption = card.getAttribute('data-caption') || '';
        document.querySelector('.lightbox-img').src = fullsrc;
        document.querySelector('.lightbox-caption').textContent = caption;
        lightbox.classList.add('active');
      });
    });
    lightbox.querySelector('.close').onclick = function() {
      lightbox.classList.remove('active');
      document.querySelector('.lightbox-img').src = '';
      document.querySelector('.lightbox-caption').textContent = '';
    };
    // 배경 클릭 시 닫기
    lightbox.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
        document.querySelector('.lightbox-img').src = '';
        document.querySelector('.lightbox-caption').textContent = '';
      }
    });
  }
});


// 직무 상세 버튼 클릭 시 모달 표시
document.querySelectorAll('.job-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const job = this.dataset.job;
    let title = '';
    let content = '';
    if (job === 'frontend') {
      title = '프론트엔드 개발'; // 실제 직무명으로 변경
      content = `- React 기반 SPA 개발\n- 사용자 UI/UX 개선\n- HTML/CSS/JS 유지보수\n- 디자이너, 기획자와 협업`; //자세한 직무 설명은 이곳에
    } else if (job === 'backend') {
      title = '백엔드 개발';
      content = `- Node.js 기반 API 서버 개발\n- MySQL 기반 DB 설계\n- 인증 및 세션 관리\n- 프론트엔드 API 연동`;
    } else if (job === 'marketing') {
      title = '기획/마케팅';
      content = `- 서비스 기획 및 운영 전략 수립\n- 경쟁사 및 시장 조사\n- 블로그, SNS, 이메일 마케팅 등 채널 운영\n- 고객 유입 및 리텐션 관리`;
    }
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').textContent = content;
    document.getElementById('jobModal').classList.add('active');
  });
});

function closeModal() {
  document.getElementById('jobModal').classList.remove('active');
}
