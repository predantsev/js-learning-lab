// Teaching stand-in for `react` + `react-dom/server` (the course runner has no npm packages).
// For the elements and props used in this unit its renderToString output matches
// react-dom/server 19.3.0 character for character (checked while the unit was written).
// Where it differs from the real thing:
// - only function components, host elements, Fragment and arrays of them; no class components,
//   context, Suspense, lazy, portals, refs to DOM nodes, streaming or hydration;
// - hooks: useState gives the initial value; its setter does nothing when called after the render
//   (on the server nothing calls it then: no clicks, no effects) and throws "not supported" when a
//   component calls it during its own render — real React then renders that component again;
//   useEffect and useLayoutEffect never run (as in React on the server), useMemo and useRef
//   compute once; no other hooks;
// - props: className → class, htmlFor → for, data-* and aria-*, lowercase attributes and the
//   boolean attributes disabled, hidden, checked; event handlers (onClick…) are left out like in
//   React. Anything else (style objects, other camelCase names, dangerouslySetInnerHTML,
//   <script>, <style>, form fields, and <img>/<link>/<meta>/<title>, which React 19 also hoists or
//   preloads; javascript: URLs) throws "not supported" instead of
//   guessing — React supports them;
// - no development warnings (missing keys, invalid nesting).
export const Fragment = Symbol('Fragment');

export function createElement(type, props, ...children) {
  const { key = null, ...rest } = props ?? {};
  if (children.length === 1) rest.children = children[0];
  else if (children.length > 1) rest.children = children;
  return { $$element: true, type, key, props: rest };
}

let hooksAllowed = false;
function hook(name) {
  if (!hooksAllowed) throw new Error(`${name} can only be called inside a component while it renders.`);
}
export function useState(initial) {
  hook('useState');
  const setState = () => {
    if (hooksAllowed) throw notSupported('Calling a state setter during render');
  };
  return [typeof initial === 'function' ? initial() : initial, setState];
}
export function useEffect() { hook('useEffect'); }
export function useLayoutEffect() { hook('useLayoutEffect'); }
export function useMemo(compute) { hook('useMemo'); return compute(); }
export function useRef(initial) { hook('useRef'); return { current: initial }; }

const VOID = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'link', 'meta', 'source', 'track', 'wbr']);
const REFUSED = new Set(['script', 'style', 'input', 'select', 'textarea', 'option', 'img', 'link', 'meta', 'title']);
const BOOLEAN = new Set(['disabled', 'hidden', 'checked']);

function escape(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[c]);
}

function notSupported(what) {
  return new Error(`${what} is not supported by this teaching renderer (mini-react.js); real React supports it.`);
}

function attributes(type, props) {
  let out = '';
  for (const [name, value] of Object.entries(props)) {
    if (name === 'children' || name === 'ref' || value == null) continue;
    if (/^on[A-Z]/.test(name)) continue;
    if (name === 'style' || name === 'dangerouslySetInnerHTML') throw notSupported(`The ${name} prop`);
    if (typeof value === 'function' || typeof value === 'symbol') continue;
    let attr = name;
    if (name === 'className') attr = 'class';
    else if (name === 'htmlFor') attr = 'for';
    else if (!/^(data|aria)-/.test(name) && name !== name.toLowerCase()) throw notSupported(`The ${name} prop`);
    if (BOOLEAN.has(attr)) {
      if (value === true) out += ` ${attr}=""`;
      continue;
    }
    if (typeof value === 'boolean' && !/^(data|aria)-/.test(attr)) continue;
    if ((attr === 'href' || attr === 'src' || attr === 'action') && /^\s*javascript:/i.test(String(value))) {
      throw notSupported('A javascript: URL');
    }
    out += ` ${attr}="${escape(value)}"`;
  }
  return out;
}

// Renders `node` and returns its HTML; `state.text` remembers whether the last thing written was
// text, because React separates two neighbouring text pieces with <!-- --> so hydration can split them.
function render(node, state) {
  if (node == null || typeof node === 'boolean') return '';
  if (node === '') return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    const html = (state.text ? '<!-- -->' : '') + escape(node);
    state.text = true;
    return html;
  }
  if (Array.isArray(node)) return node.map((child) => render(child, state)).join('');
  if (!node.$$element) throw notSupported(`Rendering ${Object.prototype.toString.call(node)} as a child`);
  const { type, props } = node;
  if (type === Fragment) return render(props.children, state);
  if (typeof type === 'function') {
    hooksAllowed = true;
    let result;
    try {
      result = type(props);
    } finally {
      hooksAllowed = false;
    }
    return render(result, state);
  }
  if (typeof type !== 'string') throw notSupported('This element type');
  if (REFUSED.has(type)) throw notSupported(`The <${type}> element`);
  const open = `<${type}${attributes(type, props)}`;
  state.text = false;
  if (VOID.has(type)) return `${open}/>`;
  const inner = render(props.children, state);
  state.text = false;
  return `${open}>${inner}</${type}>`;
}

export function renderToString(element) {
  return render(element, { text: false });
}
