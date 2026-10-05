import { generate } from './miniCodegen.js';
import { ownership } from './ownership.js';

const generated = () => generate(files['specs/NativeBatteryLevel.ts']);
const methodNamed = (name) => generated().methods.find((m) => m.name === name);

test('codegen reads the spec without errors', () => {
  expect(generated().errors, 'errors of the simulated codegen').toEqual([]);
});

test('the module is found by the name NativeBatteryLevel', () => {
  expect(generated().moduleName, 'the name passed to TurboModuleRegistry').toBe('NativeBatteryLevel');
});

test('getLevel answers through a Promise', () => {
  expect(methodNamed('getLevel')?.java, 'generated Java signature of getLevel').toBe('public abstract void getLevel(Promise promise);');
});

test('isCharging answers synchronously with a boolean', () => {
  expect(methodNamed('isCharging')?.java, 'generated Java signature of isCharging').toBe('public abstract boolean isCharging();');
});

test('the spec has only getLevel and isCharging', () => {
  expect(generated().methods.map((m) => m.name).sort(), 'the methods of the spec, sorted').toEqual(['getLevel', 'isCharging']);
});

test('the generated parts are marked codegen', () => {
  for (const part of ['androidSpecClass', 'iosSpecProtocol', 'jsiBinding']) {
    expect(ownership?.[part], `ownership.${part}`).toBe('codegen');
  }
});

test('the spec, both implementations and the registration are marked developer', () => {
  for (const part of ['specFile', 'androidModule', 'iosModule', 'registration']) {
    expect(ownership?.[part], `ownership.${part}`).toBe('developer');
  }
});
