import { getLineWidth, LineWidth, LineWidthObject } from "src/utils/lineWidth";
import { TexLinebreakOptions } from "../options";

export function getElementLineWidth(
  paragraphElement: HTMLElement,
  floatingElements?: HTMLElement[],
  options?: TexLinebreakOptions,
): LineWidth {
  // Allow filtering floating elements by predicate (optional ignoreFloatingElements):
  if (typeof options?.ignoreFloatingElements === "function") {
    floatingElements = floatingElements?.filter((floatingElement) =>
      (options.ignoreFloatingElements as Function)(paragraphElement, floatingElement)
    )
  }

  let { width, boxSizing, paddingLeft, paddingRight, textIndent, lineHeight } =
    getComputedStyle(paragraphElement);
  let defaultLineWidth: number | number[] = parseFloat(width!);
  if (boxSizing === "border-box") {
    defaultLineWidth -= parseFloat(paddingLeft!);
    defaultLineWidth -= parseFloat(paddingRight!);
  }

  let lineWidths: LineWidthObject = { defaultLineWidth };

  const indentationOfFirstLine = parseInt(textIndent);
  if (indentationOfFirstLine) {
    lineWidths[0] = defaultLineWidth - indentationOfFirstLine;
  }

  if (floatingElements && floatingElements.length > 0) {
    const _lineHeight = parseFloat(lineHeight);
    if (!_lineHeight) {
      console.warn(
        "Floating elements are not supported without CSS line-height being set"
      );
    } else {
      const paragraphRect = paragraphElement.getBoundingClientRect();
      floatingElements.forEach((floatingElement) => {
        const floatingElementRect = floatingElement.getBoundingClientRect();
        const floatingElementStyle = window.getComputedStyle(floatingElement);
        let xAxisOverlap = 0;
        if (floatingElementStyle.float === "right") {
          xAxisOverlap =
            paragraphRect.width -
            (floatingElementRect.left -
              parseFloat(floatingElementStyle.marginLeft) -
              paragraphRect.left);
        } else if (floatingElementStyle.float === "left") {
          xAxisOverlap =
            paragraphRect.width -
            (paragraphRect.right -
              floatingElementRect.right -
              parseFloat(floatingElementStyle.marginRight));
        }

        const firstLineThatOverlaps = Math.floor(
          (floatingElementRect.top -
            parseFloat(floatingElementStyle.marginTop) -
            paragraphRect.top) /
            _lineHeight
        );
        const lastLineThatOverlaps = Math.floor(
          (floatingElementRect.bottom +
            parseFloat(floatingElementStyle.marginBottom) -
            paragraphRect.top) /
            _lineHeight
        );
        if (lastLineThatOverlaps < 0) return;
        for (
          let lineIndex = firstLineThatOverlaps;
          lineIndex <= lastLineThatOverlaps;
          lineIndex++
        ) {
          if (lineIndex < 0) continue;
          lineWidths[lineIndex] =
            getLineWidth(lineWidths, lineIndex) - xAxisOverlap;
        }
      });
    }
  }

  return lineWidths;
}
