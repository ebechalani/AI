import { afterEach, describe, expect, it, vi } from 'vitest';
import { firstField, showErrorsAndFocus } from '@/components/course-editor/focus';
import { sessionLost } from '@/components/course-editor/session-probe';

// The course editor's focus helpers and the session check after a thrown action call (WS-F
// review fixes). The unit suite runs without a DOM, so the elements are small fakes.

interface FakeElement {
  name: string;
  type?: string;
  checked?: boolean;
  /** false: focus() is a no-op, like a <fieldset> without tabIndex. */
  focusable: boolean;
  children: FakeElement[];
  focus(): void;
  querySelector(selector: string): FakeElement | null;
  querySelectorAll(selector: string): FakeElement[];
}

const page = { activeElement: null as FakeElement | null, body: { name: 'body' } };

function element(
  name: string,
  options: { focusable?: boolean; children?: FakeElement[]; type?: string; checked?: boolean } = {},
): FakeElement {
  const self: FakeElement = {
    name,
    type: options.type,
    checked: options.checked,
    focusable: options.focusable ?? true,
    children: options.children ?? [],
    focus() {
      if (self.focusable) page.activeElement = self;
    },
    // The fakes answer each helper's one query: the first descendant that matches by role.
    querySelector(selector: string) {
      return self.querySelectorAll(selector)[0] ?? null;
    },
    querySelectorAll(selector: string) {
      const all = self.children.flatMap((child) => [child, ...child.querySelectorAll('*')]);
      if (selector === '*') return all;
      if (selector.includes('aria-invalid')) return all.filter((e) => e.name.startsWith('invalid'));
      if (selector.includes(':checked')) return all.filter((e) => e.type === 'radio' && e.checked);
      return all.filter((e) => e.name.startsWith('field') || e.type === 'radio');
    },
  };
  return self;
}

describe('showErrorsAndFocus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    page.activeElement = null;
  });

  it('focuses the first invalid control', () => {
    vi.stubGlobal('document', page);
    const input = element('invalid-title');
    const form = element('form', { children: [input] });
    const update = vi.fn();
    showErrorsAndFocus(update, form as unknown as HTMLElement);
    expect(update).toHaveBeenCalledOnce();
    expect(page.activeElement).toBe(input);
  });

  it('hands the focus of a group that cannot take it to its first control', () => {
    vi.stubGlobal('document', page);
    const checkbox = element('field-creativity');
    const group = element('invalid-rubric', { focusable: false, children: [checkbox] });
    const alert = element('alert');
    showErrorsAndFocus(() => {}, element('form', { children: [group] }) as unknown as HTMLElement, () => alert as unknown as HTMLElement);
    expect(page.activeElement).toBe(checkbox);
  });

  it('falls back to the form alert when nothing inside can take the focus', () => {
    vi.stubGlobal('document', page);
    const group = element('invalid-empty', { focusable: false });
    const alert = element('alert');
    showErrorsAndFocus(() => {}, element('form', { children: [group] }) as unknown as HTMLElement, () => alert as unknown as HTMLElement);
    expect(page.activeElement).toBe(alert);
  });

  it('focuses the form alert when no field is invalid', () => {
    vi.stubGlobal('document', page);
    const alert = element('alert');
    showErrorsAndFocus(() => {}, element('form', { children: [element('field-title')] }) as unknown as HTMLElement, () => alert as unknown as HTMLElement);
    expect(page.activeElement).toBe(alert);
  });
});

describe('firstField', () => {
  it('is the first control, or the checked radio of a radio group', () => {
    const title = element('field-title');
    expect(firstField(element('form', { children: [title] }) as unknown as ParentNode)).toBe(title);
    const english = element('radio-en', { type: 'radio', checked: false });
    const french = element('radio-fr', { type: 'radio', checked: true });
    Object.assign(english, { name: 'language' });
    Object.assign(french, { name: 'language' });
    expect(firstField(element('form', { children: [english, french] }) as unknown as ParentNode)).toBe(french);
    expect(firstField(null)).toBeNull();
    expect(firstField(element('form') as unknown as ParentNode)).toBeNull();
  });
});

describe('sessionLost', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks the page again without following redirects', async () => {
    const fetch = vi.fn().mockResolvedValue({ type: 'opaqueredirect', status: 0 });
    vi.stubGlobal('fetch', fetch);
    await expect(sessionLost('http://localhost/en/teacher/create/c1')).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith('http://localhost/en/teacher/create/c1', {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      credentials: 'same-origin',
    });
  });

  it('reads a redirect status as a lost session too', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', status: 307 }));
    await expect(sessionLost('http://localhost/en/teacher/create')).resolves.toBe(true);
  });

  it('keeps the session when the page answers, or when there is no network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', status: 200 }));
    await expect(sessionLost('http://localhost/en/teacher/create')).resolves.toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', status: 404 }));
    await expect(sessionLost('http://localhost/en/teacher/create')).resolves.toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(sessionLost('http://localhost/en/teacher/create')).resolves.toBe(false);
  });
});
