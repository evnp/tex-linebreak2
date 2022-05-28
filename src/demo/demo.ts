/**
 * The "layout" demo illustrates simple usage of the TeX line-breaking algorithm
 * to lay out a paragraph of justified text and render it into an HTML canvas.
 */

import Hypher from 'hypher';
import enUsPatterns from 'hyphenation.en-us';
import { justifyContent } from 'src/html/justifyContent';
import { renderToCanvas } from 'src/demo/demoCanvas';

export const hyphenateFn = (word: string) => new Hypher(enUsPatterns).hyphenate(word);

export const textarea = document.querySelector('textarea')!;
export const lineWidthSlider = document.querySelector('.js-line-width')! as HTMLInputElement;
export const outputElement = document.querySelector('.output-p')! as HTMLElement;
export const plainBrowserOutputElement = document.querySelector('.css-output-p')! as HTMLElement;

export function rerender() {
  const lineWidth = parseInt(lineWidthSlider.value);
  const outputElementStyle = window.getComputedStyle(outputElement);
  const padding = {
    left: parseInt(outputElementStyle.paddingLeft!),
    right: parseInt(outputElementStyle.paddingRight!),
  };
  document.body.style.setProperty('--line-width', `${lineWidth}px`);

  justifyContent(document.querySelectorAll('p.demo-static, div.demo-static p'), null, {}, true);

  return;

  const htmlParagraph = document.querySelector<HTMLElement>('.html-p')!;
  htmlParagraph.innerHTML = textarea.value;
  const textContent = htmlParagraph.textContent!;

  justifyContent(
    htmlParagraph,
    null,
    {
      softHyphenationPenalty: 30,
    },
    true,
  );

  // Render to canvas.
  renderToCanvas(textContent, padding, lineWidth);

  // Render using CSS `text-justify`
  plainBrowserOutputElement.innerHTML = textarea.value;
}

// Render text and re-render on changes.
textarea.addEventListener('input', rerender);
lineWidthSlider.addEventListener('input', rerender);
rerender();

// const htmlParagraphs = Array.from(document.querySelectorAll('.js-tex-linebreak'));
// htmlParagraphs.forEach((el) => justifyContent(el as HTMLElement));
