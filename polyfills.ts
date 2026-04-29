// 1. Define polyfills FIRST before any imports
if (typeof global.Event !== 'function') {
  const EventPolyfill = function (type: string) {
    this.type = type;
  };
  EventPolyfill.prototype = {};
  (global as any).Event = EventPolyfill;
}

if (typeof global.CustomEvent !== 'function') {
  const CustomEventPolyfill = function (type: string, options: any = {}) {
    this.type = type;
    this.detail = options.detail;
  };
  // Ensure Event.prototype exists before using it
  const baseProto = (global as any).Event?.prototype || {};
  CustomEventPolyfill.prototype = Object.create(baseProto);
  (global as any).CustomEvent = CustomEventPolyfill;
}

// 2. Now import standard polyfills
import 'text-encoding';
import "@walletconnect/react-native-compat";

// Extra stubs for browser-first SDKs
if (typeof global.window === 'undefined') (global as any).window = global;
if (typeof global.self === 'undefined') (global as any).self = global;
if (typeof global.document === 'undefined') (global as any).document = {
  createElement: () => ({}),
  getElementsByTagName: () => [],
};

console.log('[Polyfills] Web events, encoding, and browser stubs polyfilled');
