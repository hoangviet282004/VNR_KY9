(function () {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messagesEl = document.getElementById('chatMessages');

  // ---- Markdown -> HTML (tối giản, tự viết, không phụ thuộc thư viện ngoài) ----
  // Hỗ trợ: heading (#..######), bold (**..**), italic (*..*), inline code (`..`),
  // danh sách có/không thứ tự, bảng kiểu GFM (| ... |), đoạn văn.
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderInline(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    return out;
  }

  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
  }

  function splitTableRow(line) {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((cell) => cell.trim());
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        i++;
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        i++;
        continue;
      }

      if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headerCells = splitTableRow(line);
        i += 2;
        const bodyRows = [];
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          bodyRows.push(splitTableRow(lines[i]));
          i++;
        }
        let table = '<table><thead><tr>';
        headerCells.forEach((cell) => { table += `<th>${renderInline(cell)}</th>`; });
        table += '</tr></thead><tbody>';
        bodyRows.forEach((row) => {
          table += '<tr>';
          row.forEach((cell) => { table += `<td>${renderInline(cell)}</td>`; });
          table += '</tr>';
        });
        table += '</tbody></table>';
        html.push(table);
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
          i++;
        }
        html.push('<ul>' + items.map((it) => `<li>${renderInline(it)}</li>`).join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
          i++;
        }
        html.push('<ol>' + items.map((it) => `<li>${renderInline(it)}</li>`).join('') + '</ol>');
        continue;
      }

      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^#{1,6}\s+/.test(lines[i]) &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+[.)]\s+/.test(lines[i]) &&
        !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      html.push('<p>' + paraLines.map(renderInline).join('<br>') + '</p>');
    }

    return html.join('');
  }

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
    if (who === 'bot') {
      div.innerHTML = renderMarkdown(text);
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function setBotContent(el, text) {
    el.innerHTML = renderMarkdown(text);
    messagesEl.scrollTop = messagesEl.scrollHeight;
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
        setBotContent(loadingEl, data.reply || '(Không có phản hồi)');
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
