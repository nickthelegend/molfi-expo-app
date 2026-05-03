// 1. ABSOLUTE FIRST: Define global browser stubs
const globalObj = typeof globalThis !== 'undefined' ? globalThis : global;

(globalObj as any).window = (globalObj as any).window || globalObj;
(globalObj as any).self = (globalObj as any).self || globalObj;

const navigatorStub = {
  onLine: true,
  userAgent: 'React-Native',
};

// Use defineProperty to ensure it sticks in Hermes
try {
  Object.defineProperty(globalObj, 'navigator', {
    value: navigatorStub,
    writable: true,
    configurable: true,
  });
} catch (e) {
  (globalObj as any).navigator = navigatorStub;
}

if (typeof (globalObj as any).window.navigator === 'undefined') {
  (globalObj as any).window.navigator = navigatorStub;
}

// 2. Event Polyfills (needed for WalletConnect online/offline events)
if (typeof (globalObj as any).Event !== 'function') {
  const EventPolyfill = function (type: string) {
    this.type = type;
  };
  EventPolyfill.prototype = {};
  (globalObj as any).Event = EventPolyfill;
}

if (typeof (globalObj as any).CustomEvent !== 'function') {
  const CustomEventPolyfill = function (type: string, options: any = {}) {
    this.type = type;
    this.detail = options.detail;
  };
  const baseProto = (globalObj as any).Event?.prototype || {};
  CustomEventPolyfill.prototype = Object.create(baseProto);
  (globalObj as any).CustomEvent = CustomEventPolyfill;
}

// 3. Mock NetInfo for libraries that use it directly
(globalObj as any).NetInfo = {
  fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  addEventListener: (fn: any) => {
    // Immediate callback to simulate "online"
    setTimeout(() => fn({ isConnected: true, isInternetReachable: true }), 0);
    return () => {};
  },
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
};

// 4. Document Stub
if (typeof (globalObj as any).document === 'undefined') (globalObj as any).document = {
  createElement: () => ({}),
  getElementsByTagName: () => [],
};

// 5. Now import side-effect heavy polyfills using require to ensure order
require('text-encoding');
require('@walletconnect/react-native-compat');

console.log('[Polyfills] System status: FORCED ONLINE (v2)');
