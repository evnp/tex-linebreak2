import { textNodesInRange } from "src/deprecated/textNodesInRange";

/**
 * Todo: limit to possible overlaps (i.e.
 * ignore those off x-axis and above element
 */
export function getFloatingElements(): HTMLElement[] {
  let floating: HTMLElement[] = [];
  Array.from(
    document.querySelectorAll<HTMLElement>("body *:not(span,script,b,i,br)")
  ).forEach((element) => {
    const { float } = window.getComputedStyle(element);
    if (float === "left" || float === "right") {
      floating.push(element);
    }
  });
  return floating;
}

/** Todo: does not work.... */
export function stripSoftHyphensFromOutputText(range: Range) {
  const text = textNodesInRange(range);

  // text.forEach((textNode) => {
  //   if (textNode.textContent?.includes(SOFT_HYPHEN)) {
  //     const split: string[] = textNode.textContent.split(/(\u00AD)/g);
  //     const wrapper = tagNode(document.createElement('span'));
  //     split.forEach((part) => {
  //       if (part === SOFT_HYPHEN) {
  //         const span = tagNode(document.createElement('span'));
  //         span.innerHTML = part;
  //         span.style.display = 'none';
  //         wrapper.appendChild(span);
  //       } else {
  //         wrapper.appendChild(document.createTextNode(part));
  //       }
  //     });
  //
  //     textNode.parentNode!.replaceChild(wrapper, textNode);
  //   }
  // });
}
