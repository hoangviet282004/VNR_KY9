(function () {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messagesEl = document.getElementById('chatMessages');

  function togglePanel() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  }

  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') togglePanel();
    }
    if (e.key === 'Escape') panel.classList.remove('open');
  });

  function addMessage(text, who) {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-' + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    input.value = '';
    sendBtn.disabled = true;

    const loadingEl = addMessage('Đang trả lời...', 'bot');
    loadingEl.classList.add('chat-msg-loading');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json();

      loadingEl.classList.remove('chat-msg-loading');
      if (!res.ok) {
        loadingEl.textContent = 'Lỗi: ' + (data.error || 'Không thể kết nối máy chủ.');
      } else {
        loadingEl.textContent = data.reply || '(Không có phản hồi)';
      }
    } catch (err) {
      loadingEl.classList.remove('chat-msg-loading');
      loadingEl.textContent = 'Lỗi kết nối tới máy chủ. Vui lòng thử lại.';
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
