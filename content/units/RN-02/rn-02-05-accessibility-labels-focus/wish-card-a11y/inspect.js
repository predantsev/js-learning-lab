// Preview helper: prints what the browser preview exposes to assistive technology —
// the role and the label react-native-web produced from accessibilityRole and accessibilityLabel.
// This is the browser's accessibility information, NOT what VoiceOver or TalkBack say on a phone.
export function printAccessibility(root) {
  const elements = [...root.querySelectorAll('*')].filter((el) => el.getAttribute('role') || el.getAttribute('aria-label') || el.tagName === 'INPUT' || el.getAttribute('tabindex') === '0');
  for (const el of elements) {
    const role = el.getAttribute('role') ?? (el.tagName === 'INPUT' ? 'textbox' : '%%noRole%%');
    const label = el.getAttribute('aria-label');
    console.log(`${role}: ${label === null ? '%%noLabel%%' : `"${label}"`}`);
  }
}
