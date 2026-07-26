export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inlineMarkdown(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1">');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  output = output.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return output;
}

function taskItem(value) {
  const task = /^\[([ xX])\]\s+(.*)$/.exec(value);
  if (!task) return `<li>${inlineMarkdown(value)}</li>`;
  const checked = task[1].toLowerCase() === "x" ? " checked" : "";
  return `<li class="task-item"><input type="checkbox"${checked} disabled> ${inlineMarkdown(task[2])}</li>`;
}

export function renderMarkdown(source) {
  const lines = String(source ?? "").replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const fence = /^```([^\s]*)\s*$/.exec(line);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      output.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { output.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`); index += 1; continue; }
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) { output.push("<hr>"); index += 1; continue; }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
      output.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`);
      continue;
    }
    const unordered = /^[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      const matcher = unordered ? /^[-*+]\s+(.*)$/ : /^\d+[.)]\s+(.*)$/;
      const items = [];
      while (index < lines.length) {
        const match = matcher.exec(lines[index]);
        if (!match) break;
        items.push(taskItem(match[1]));
        index += 1;
      }
      output.push(`<${unordered ? "ul" : "ol"}>${items.join("")}</${unordered ? "ul" : "ol"}>`);
      continue;
    }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+|^```|^>\s?|^[-*+]\s+|^\d+[.)]\s+|^(---+|\*\*\*+|___+)\s*$/.test(lines[index])) paragraph.push(lines[index++]);
    output.push(`<p>${paragraph.map(inlineMarkdown).join("<br>")}</p>`);
  }
  return output.join("");
}
