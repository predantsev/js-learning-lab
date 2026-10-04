// miniCodegen.js (read-only): a SIMULATION of React Native codegen for TurboModule specs, written
// for this lesson. It reads the text of one TypeScript spec and prints the Java (Android) and
// Objective-C (iOS) method signatures that React Native 0.86.3 codegen generated for the same
// types when we ran it (node_modules/react-native/scripts/generate-codegen-artifacts.js).
//
// Where it differs from the real codegen:
// - it is a line-based reader, not a TypeScript parser: one method per line, and it understands
//   only string, number, boolean, void, arrays (T[] or Array<T>), Promise<T> and a "| null" return;
//   the real codegen accepts more types (objects, enums, callbacks, events, constants);
// - it prints only the method signatures, not the whole generated files (the C++ JSI binding,
//   the Java class header, the Objective-C base class, CMake files…);
// - it does not check that the file name starts with "Native" (the real codegen uses that to find
//   specs) or read codegenConfig from package.json;
// - its error messages are its own: the real codegen has different texts.

const SCALARS = {
  string: { javaParam: 'String', javaReturn: 'String', objcParam: 'NSString *', objcReturn: 'NSString *' },
  number: { javaParam: 'double', javaReturn: 'double', objcParam: 'double', objcReturn: 'NSNumber *' },
  boolean: { javaParam: 'boolean', javaReturn: 'boolean', objcParam: 'BOOL', objcReturn: 'NSNumber *' },
};

const isArray = (type) => /^\w+\[\]$/.test(type) || /^Array<\w+>$/.test(type);

function readType(raw) {
  const type = raw.replace(/\s+/g, ' ').trim();
  if (SCALARS[type]) return { kind: 'scalar', name: type };
  if (isArray(type)) return { kind: 'array', name: type };
  return null;
}

function method(name, paramsText, returnText) {
  const params = [];
  for (const part of paramsText.split(',').map((p) => p.trim()).filter(Boolean)) {
    const match = part.match(/^(\w+)\s*:\s*(.+)$/);
    if (!match) return { error: `${name}: cannot read the parameter "${part}"` };
    const type = readType(match[2]);
    if (!type) return { error: `${name}: the type "${match[2].trim()}" is not modelled here` };
    params.push({ name: match[1], type: match[2].trim(), java: `${SCALARS[type.name]?.javaParam ?? 'ReadableArray'} ${match[1]}`, objc: SCALARS[type.name]?.objcParam ?? 'NSArray *' });
  }

  const returns = returnText.replace(/\s+/g, ' ').trim();
  let javaReturn;
  let objcReturn;
  let sync = true;
  let promise = false;
  if (returns === 'void') {
    javaReturn = 'void';
    objcReturn = 'void';
    sync = false;
  } else if (/^Promise<.+>$/.test(returns)) {
    const inner = returns.slice('Promise<'.length, -1).trim();
    if (inner !== 'void' && !readType(inner)) return { error: `${name}: the type "${inner}" is not modelled here` };
    javaReturn = 'void';
    objcReturn = 'void';
    sync = false;
    promise = true;
  } else {
    const nullable = /\|\s*null$/.test(returns);
    const base = returns.replace(/\|\s*null$/, '').trim();
    const type = readType(base);
    if (!type || type.kind !== 'scalar') return { error: `${name}: the return type "${returns}" is not modelled here` };
    javaReturn = `${nullable ? '@Nullable ' : ''}${SCALARS[base].javaReturn}`;
    objcReturn = `${SCALARS[base].objcReturn}${nullable ? ' _Nullable' : ''}`;
  }

  const javaParams = params.map((p) => p.java);
  if (promise) javaParams.push('Promise promise');
  const objcParts = params.map((p, index) => `${index === 0 ? '' : `${p.name}:`}(${p.objc})${p.name}`);
  if (promise) objcParts.push(...[`${params.length === 0 ? '' : 'resolve:'}(RCTPromiseResolveBlock)resolve`, 'reject:(RCTPromiseRejectBlock)reject']);
  const objc = objcParts.length === 0 ? `- (${objcReturn})${name};` : `- (${objcReturn})${name}:${objcParts.join(' ')};`;

  return {
    name,
    params: params.map(({ name: paramName, type }) => ({ name: paramName, type })),
    returns,
    sync,
    java: `public abstract ${javaReturn} ${name}(${javaParams.join(', ')});`,
    objc,
  };
}

// generate(text) → { moduleName, methods: [{ name, params, returns, sync, java, objc }], errors: [] }
export function generate(text) {
  const source = typeof text === 'string' ? text : '';
  const errors = [];
  const registry = source.match(/TurboModuleRegistry\.(getEnforcing|get)\s*<\s*Spec\s*>\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  const moduleName = registry ? registry[2] : null;
  if (!moduleName) errors.push('no TurboModuleRegistry.getEnforcing<Spec>(…) with a module name');

  const start = source.search(/interface\s+Spec\s+extends\s+TurboModule\s*\{/);
  if (start === -1) {
    errors.push('no "export interface Spec extends TurboModule { … }"');
    return { moduleName, methods: [], errors };
  }
  const body = source.slice(source.indexOf('{', start) + 1, source.indexOf('}', start));
  const methods = [];
  for (const line of body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'))) {
    const match = line.match(/^(\w+)\s*\(([^)]*)\)\s*:\s*([^;]+);?$/);
    if (!match) {
      errors.push(`cannot read the line "${line}"`);
      continue;
    }
    const result = method(match[1], match[2], match[3]);
    if (result.error) errors.push(result.error);
    else methods.push(result);
  }
  return { moduleName, methods, errors };
}
