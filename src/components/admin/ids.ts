// Element ids shared by the server pages and the client controls. Pure: a server component may
// import this where it must not import `focus.ts` (which depends on react-dom's flushSync).

/** Every shell's `<main>` (ARCHITECTURE.md 7.5): a stable focus target when the page itself changes. */
export const MAIN_CONTENT_ID = 'main-content';
