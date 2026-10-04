// A frame with a heading: whatever the caller nests inside goes under the heading as children. The
// form and the list share it, so both parts of the page look the same. With `headingRef` the heading
// can also take focus from code (tabIndex -1: focusable by code, but not a stop for the Tab key).
import type { ReactNode, Ref } from "react";

type SectionProps = { title: string; children: ReactNode; headingRef?: Ref<HTMLHeadingElement> };

export function Section({ title, children, headingRef }: SectionProps) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={headingRef === undefined ? undefined : -1}>
        {title}
      </h2>
      {children}
    </section>
  );
}
