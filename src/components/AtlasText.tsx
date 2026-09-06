import { memo } from "react";

/**
 * ATLAS returns plain prose by contract, so there is no markdown renderer here
 * on purpose — rendering markup would invite exactly the visual formatting the
 * system prompt forbids. Paragraphs are split on blank lines; single newlines
 * are preserved as line breaks.
 */
function AtlasTextBase({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="whitespace-pre-wrap [overflow-wrap:anywhere] text-[15px] leading-[1.75] text-ink [&:not(:first-child)]:mt-4"
        >
          {para}
        </p>
      ))}
    </>
  );
}

export const AtlasText = memo(AtlasTextBase);
