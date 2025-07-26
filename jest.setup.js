import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock Notification API
global.Notification = class Notification {
  constructor(title, options) {
    this.title = title;
    this.options = options;
  }
  close() {}
  static permission = 'default';
  static requestPermission() {
    return Promise.resolve('granted');
  }
}

// Mock PushManager
global.PushManager = class PushManager {
  subscribe() {
    return Promise.resolve({
      endpoint: 'https://example.com/push',
      getKey: () => new ArrayBuffer(0),
    });
  }
}

// Mock ServiceWorker
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: jest.fn(() => Promise.resolve({
        pushManager: new PushManager(),
      })),
      ready: Promise.resolve({
        pushManager: new PushManager(),
      }),
    },
    writable: true,
  });
}

// Mock AbortSignal.timeout (newer Web API)
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = jest.fn((delay) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  });
}

// Mock matchMedia (only if window is available)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock performance.now
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock Canvas and WebGL for device detection
const mockCanvas = {
  getContext: jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return {}; // Mock WebGL context
    }
    if (contextType === 'webgl2') {
      return {}; // Mock WebGL2 context
    }
    return null;
  }),
  width: 300,
  height: 150,
}

// Mock document.createElement for canvas (only in jsdom environment)
if (typeof document !== 'undefined') {
  const originalCreateElement = document.createElement
  document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas
    }
    return originalCreateElement.call(document, tagName)
  })
}

// Mock HTMLCanvasElement.prototype.getContext (only in jsdom environment)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return {}; // Mock WebGL context
    }
    if (contextType === 'webgl2') {
      return {}; // Mock WebGL2 context
    }
    return null;
  })
}

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})
