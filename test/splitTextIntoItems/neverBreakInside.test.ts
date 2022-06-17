import { texLinebreakMonospace } from "src/utils/monospace";

it("neverBreakInside", () => {
  const text = `te{st test}{ t}est test`;

  assert.deepEqual(
    texLinebreakMonospace(text, {
      lineWidth: 2,
      forceOverflowToBreak: false,
      neverBreakInside: [/{.+?}/g, "t t"],
    }).plainTextLines,
    [`te{st test}`, `{ t}`, `est test`]
  );
});
