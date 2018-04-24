import { assert } from 'chai';

import { justifyContent } from '../src/html';

function extractLines(el: HTMLElement) {
  const tmpEl = document.createElement('span');
  tmpEl.innerHTML = el.innerHTML.replace(/<br>/g, '--');
  return tmpEl.textContent!.split('--').map(s => s.trim());
}

function stripSpacing(el: HTMLElement) {
  const spans = Array.from(el.querySelectorAll('span'));
  spans.forEach(s => s.style.wordSpacing = null);
}

describe('html', () => {
  describe('justifyContent', () => {
    let para: HTMLParagraphElement;

    beforeEach(() => {
      para = document.createElement('p');
      para.innerHTML = 'This is some test content that should be wrapped';
      para.style.width = '100px';
      document.body.appendChild(para);
    });

    afterEach(() => {
      para.remove();
    });

    it('adds line breaks to existing text', () => {
      justifyContent(para);

      const lines = extractLines(para);
      assert.deepEqual(lines, [
        'This is some',
        'test content',
        'that should be',
        'wrapped',
      ]);
    });

    it('uses word-spacing to adjust lines to fill available space', () => {
      justifyContent(para);
      const spans = Array.from(para.querySelectorAll('span'));

      // Strip trailing space from each line which is not visible and not
      // accounted for when justifying the text, but does count towards the
      // width reported by `getBoundingClientRect`.
      spans.forEach(span => {
        const text = span.childNodes[0];
        text.nodeValue = text.nodeValue!.trim();
      });
      const lineWidths = spans.map(s => s.getBoundingClientRect().width);

      // Check that every line is the expected width.
      const expectedWidth = parseInt(getComputedStyle(para).width!);
      assert.deepEqual(lineWidths, lineWidths.map(() => expectedWidth));

      // Check that this has been achieved by adjusting `word-spacing`.
      spans.forEach(span => {
        const extraSpacing = parseInt(span.style.wordSpacing!);
        assert.notEqual(extraSpacing, 0);
      });
    });

    it("disables the browser's own line wrapping", () => {
      justifyContent(para);
      assert.equal(para.style.whiteSpace, 'nowrap');
    });

    it('does not add unnecessary spacing to final line', () => {
      justifyContent(para);

      const lastChild = para.childNodes[para.childNodes.length - 1];
      assert.equal(lastChild.nodeType, Node.TEXT_NODE);
      assert.equal(lastChild.nodeValue!, 'wrapped');
    });

    it('can re-justify already-justified content', () => {
      justifyContent(para);
      const firstResult = para.innerHTML;
      justifyContent(para);
      const secondResult = para.innerHTML;

      assert.equal(firstResult, secondResult);
    });

    it('justifies rich text', () => {
      para.innerHTML = `This is <b>some text</b> with <i>various styles</i>`;

      justifyContent(para);
      stripSpacing(para);

      assert.equal(para.innerHTML, '<span style="">This is </span><b><span style="">some </span><br><span style="">text</span></b><span style=""> with </span><br><i>various styles</i>');
    });

    it('applies hyphenation', () => {
      const hyphenate = (s: string) => s.split('e');

      justifyContent(para, hyphenate);

      const lines = extractLines(para);
      assert.deepEqual(lines, ['This is som', '-e test content th', 'at should be w', '-rapped']);
    });

    it('uses correct line width if `box-sizing` is `border-box`', () => {
      para.style.boxSizing = 'border-box';
      para.style.paddingLeft = '15px';
      para.style.paddingRight = '15px';

      justifyContent(para);

      const lines = extractLines(para);
      assert.deepEqual(lines, ['This is', 'some test', 'content that', 'should be', 'wrapped']);
    });

    it('accounts for font style', () => {
      para.style.fontSize = '9px';

      justifyContent(para);

      const lines = extractLines(para);
      assert.deepEqual(lines, ['This is some test content', 'that should be wrapped']);
    });

    it('does not insert line breaks in `inline-block` boxes', () => {
      para.innerHTML = `<span style="display: inline-block">
      This is a lengthy line which should not be wrapped
      </span>`;
      const initialHtml = para.innerHTML;

      justifyContent(para);

      assert.equal(para.innerHTML, initialHtml);
    });
  });
});