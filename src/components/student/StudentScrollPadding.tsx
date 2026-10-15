// AppShell's TopBar is sticky at every width (about 4 rem), and below `lg` the student MobileNav
// is a fixed bar along the bottom (3.5 rem plus the safe area). The browser does not scroll a
// focused link that is inside the viewport but under one of them: Tab hides links under the
// bottom bar, Shift+Tab under the top bar (WCAG 2.2 SC 2.4.11). Root scroll padding makes it
// scroll them clear. WS-B's shell pages (Student Home, Learn, pathway, course detail) render
// this while they are on screen: React removes the element when the learner leaves the page,
// and it works before hydration (the CSP allows inline styles). The lesson player has its own
// bars and its own rule (LessonScrollPadding). Foundation request WS-B-3 asks for the
// shell-wide rule; delete this file once it lands.
export const STUDENT_SCROLL_PADDING =
  'html{scroll-padding-top:4.5rem}' +
  '@media (width<64rem){html{scroll-padding-bottom:calc(5.5rem + env(safe-area-inset-bottom))}}';

/** Keeps focused links on WS-B's student shell pages clear of the top and bottom bars. */
export function StudentScrollPadding() {
  return <style>{STUDENT_SCROLL_PADDING}</style>;
}
