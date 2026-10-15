// LessonShell's sticky top bar (99 px, 123 px on phones, up to 139 px when the stepper wraps)
// and its sticky footer (93 px with the "n steps left" line; below `xl` the floating "Ask Robo
// AI" button rides on it, 153 px together) cover both ends of the viewport. The browser does not
// scroll a focused control that is inside the viewport but under one of them (WCAG 2.2 SC
// 2.4.11), nor offset an anchor target, unless the root has scroll padding.
//
// The padding applies only while focus is inside the lesson content. The bars are themselves in
// the padded strips: with the padding on while a bar holds focus, every Tab between its controls
// would scroll the page (a sticky bar stays put, so it would scroll again on the next Tab). While
// focus is elsewhere (a bar, the outline, nothing), the jump targets of the stepper chips, the
// checklist links and "n steps left" carry the same offset as a margin instead.
//
// React removes the element when the learner leaves the lesson, and it works before hydration.
// Foundation request WS-B-4 asks LessonShell to own this; delete the file once it does.
export const PLAYER_SCROLL_PADDING =
  'html:has(#main-content :focus){scroll-padding-block:10rem 10.5rem}' +
  '@media (width>=80rem){html:has(#main-content :focus){scroll-padding-bottom:7rem}}' +
  'html:not(:has(#main-content :focus)) #main-content :is([id^="stage-"],[id^="block-"]){scroll-margin-top:10rem}';

/** Keeps focused controls and jump targets clear of the player's sticky bars. */
export function LessonScrollPadding() {
  return <style>{PLAYER_SCROLL_PADDING}</style>;
}
