// 챗봇 열기/닫기
document.getElementById('open-chatbot-btn').onclick = function() {
    document.getElementById('chatbot-popup').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('chat-input').focus();
    }, 120);
};
document.getElementById('close-chatbot-btn').onclick = function() {
    document.getElementById('chatbot-popup').style.display = 'none';
};

// 엔터/버튼 입력 처리
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', function(e){
  if(e.key === 'Enter') sendMessage();
});

// 대화 출력 함수 (말풍선 스타일)
function appendMessage(sender, msg) {
  const history = document.getElementById('chat-history');
  const msgDiv = document.createElement('div');
  msgDiv.style.marginBottom = "8px";
  msgDiv.style.display = "flex";
  msgDiv.style.justifyContent = sender === "나" ? "flex-end" : "flex-start";
  msgDiv.innerHTML = `<span style="
    background:${sender==='나' ? '#e3f0ff' : '#eee'};
    color:#222;
    padding:7px 13px;
    border-radius:14px;
    display:inline-block;
    max-width:72%;
    word-break:break-all;
    font-size:15px;
    ">
    ${msg}
  </span>`;
  history.appendChild(msgDiv);
  history.scrollTop = history.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const userMsg = input.value.trim();
  if(!userMsg) return;
  appendMessage("나", userMsg);
  input.value = '';
  appendMessage("챗봇", "...");
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMsg })
  });
  const data = await res.json();
  // "..." 대신 실제 답변으로 교체
  const history = document.getElementById('chat-history');
  history.lastChild.innerHTML = `<span style="
    background:#f2e7ff;
    color:#222;
    padding:7px 13px;
    border-radius:14px;
    display:inline-block;
    max-width:72%;
    word-break:break-all;
    font-size:15px;
    ">
    ${data.reply}
  </span>`;
}
