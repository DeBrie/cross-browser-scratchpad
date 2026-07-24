export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkdown(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return output;
}

export function renderMarkdown(source) {
  const lines = String(source ?? '').replaceAll('\r\n', '\n').split('\n');
  const output = [];
  let listItems = [];
  let paragraph = [];

  const flushList = () => {
    if (!listItems.length) return;
    output.push(`<ul>${listItems.join('')}</ul>`);
    listItems = [];
  };
  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`);
    paragraph = [];
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const list = /^[-*]\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      flushParagraph();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
    } else if (list) {
      flushParagraph();
      const task = /^\[([ xX])\]\s+(.*)$/.exec(list[1]);
      if (task) {
        const checked = task[1].toLowerCase() === 'x' ? ' checked' : '';
        listItems.push(`<li class="task-item"><input type="checkbox"${checked} disabled> ${inlineMarkdown(task[2])}</li>`);
      } else {
        listItems.push(`<li>${inlineMarkdown(list[1])}</li>`);
      }
    } else if (!line.trim()) {
      flushList();
      flushParagraph();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushList();
  flushParagraph();
  return output.join('');
}
