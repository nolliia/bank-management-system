import '@testing-library/jest-dom';

declare global {
  namespace NodeJS {
    interface Global {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  }

  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    params: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));


jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));


jest.mock('next/headers', () => ({
  cookies: () => Promise.resolve({
    get: jest.fn(),
    set: jest.fn(),
  }),
  headers: () => Promise.resolve(new Map()),
}));

global.IS_REACT_ACT_ENVIRONMENT = true; 