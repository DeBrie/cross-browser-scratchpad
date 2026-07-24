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
