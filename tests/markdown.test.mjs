import test from 'node:test';
import assert from 'node:assert/strict';

import { renderMarkdown } from '../src/markdown.js';

test('escapes HTML before rendering Markdown', () => {
  assert.equal(
    renderMarkdown('# Hello\n<script>alert(1)</script>'),
    '<h1>Hello</h1><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
  );
});

test('renders links, emphasis, code, tasks, and unordered lists', () => {
  assert.equal(
    renderMarkdown('- [x] **Ship** [it](https://example.com) with `care`'),
    '<ul><li class="task-item"><input type="checkbox" checked disabled> <strong>Ship</strong> <a href="https://example.com" target="_blank" rel="noopener noreferrer">it</a> with <code>care</code></li></ul>',
  );
});

test('renders all heading levels, ordered task lists, quotes, rules, and fenced code', () => {
  assert.equal(
    renderMarkdown('##### Small heading\n\n1. First\n2. [ ] Second\n\n> A quote\n\n---\n\n```js\nconst note = true;\n```'),
    '<h5>Small heading</h5><ol><li>First</li><li class="task-item"><input type="checkbox" disabled> Second</li></ol><blockquote><p>A quote</p></blockquote><hr><pre><code class="language-js">const note = true;</code></pre>',
  );
});
