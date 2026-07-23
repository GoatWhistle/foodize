import type { AxiosInstance } from "axios";
import {
  assertRequestAllowed,
  installCertificatePinning,
  resolvePinningConfig,
} from "@/platform/certificatePinning";

interface FakeInterceptor {
  handlers: { fulfilled: (config: unknown) => unknown }[];
  use: jest.Mock;
  eject: jest.Mock;
}

const createAxios = (): AxiosInstance => {
  const request: FakeInterceptor = {
    handlers: [],
    use: jest.fn((fulfilled: (config: unknown) => unknown) => {
      request.handlers.push({ fulfilled });
      return request.handlers.length - 1;
    }),
    eject: jest.fn((id: number) => {
      request.handlers.splice(id, 1);
    }),
  };
  return { interceptors: { request } } as unknown as AxiosInstance;
};

describe("certificatePinning", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("resolves host and secure flag for an https url", () => {
    const config = resolvePinningConfig("https://api.foodize.app/api/v1");
    expect(config).toEqual({ host: "api.foodize.app", allowInsecure: false });
  });

  it("marks http urls as insecure", () => {
    const config = resolvePinningConfig("http://localhost:8000/api/v1");
    expect(config.allowInsecure).toBe(true);
  });

  it("handles an unparsable url", () => {
    const config = resolvePinningConfig("not a url");
    expect(config).toEqual({ host: "", allowInsecure: true });
  });

  it("allows requests to the pinned host over https", () => {
    const config = resolvePinningConfig("https://api.foodize.app/api/v1");
    expect(() => {
      assertRequestAllowed("/menu", "https://api.foodize.app/api/v1", config);
    }).not.toThrow();
  });

  it("rejects insecure requests", () => {
    const config = resolvePinningConfig("https://api.foodize.app/api/v1");
    expect(() => {
      assertRequestAllowed("http://api.foodize.app/menu", "https://api.foodize.app", config);
    }).toThrow(/insecure/);
  });

  it("rejects requests to an unpinned host", () => {
    const config = resolvePinningConfig("https://api.foodize.app/api/v1");
    expect(() => {
      assertRequestAllowed("https://evil.example/menu", "https://api.foodize.app", config);
    }).toThrow(/unpinned host/);
  });

  it("does not install an interceptor for insecure base urls", () => {
    const instance = createAxios();
    const spy = jest.spyOn(instance.interceptors.request, "use");
    const uninstall = installCertificatePinning(instance, {
      enabled: true,
      baseUrl: "http://localhost:8000/api/v1",
    });
    expect(spy).not.toHaveBeenCalled();
    uninstall();
  });

  it("does not install when disabled", () => {
    const instance = createAxios();
    const spy = jest.spyOn(instance.interceptors.request, "use");
    installCertificatePinning(instance, {
      enabled: false,
      baseUrl: "https://api.foodize.app/api/v1",
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("installs an interceptor that passes pinned requests and blocks others", () => {
    const instance = createAxios();
    installCertificatePinning(instance, {
      enabled: true,
      baseUrl: "https://api.foodize.app/api/v1",
    });
    const typed = instance as AxiosInstance & {
      interceptors: {
        request: { handlers: { fulfilled: (c: unknown) => unknown }[] };
      };
    };
    const run = (config: { url?: string; baseURL?: string }): unknown => {
      const handler = typed.interceptors.request.handlers[0]?.fulfilled;
      return handler?.({ url: config.url, baseURL: config.baseURL, headers: {} });
    };

    expect(run({ url: "/menu", baseURL: "https://api.foodize.app/api/v1" })).toMatchObject({
      url: "/menu",
    });
    expect(() => run({ url: "https://evil.example/menu" })).toThrow(/unpinned host/);
  });

  it("uninstalls the interceptor", () => {
    const instance = createAxios();
    const ejectSpy = jest.spyOn(instance.interceptors.request, "eject");
    const uninstall = installCertificatePinning(instance, {
      enabled: true,
      baseUrl: "https://api.foodize.app/api/v1",
    });
    uninstall();
    expect(ejectSpy).toHaveBeenCalled();
  });
});
