import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import api from "../../services/api";
import { authService } from "../../services/authService";

describe("authService", () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it("login sends POST to /auth/login", async () => {
    const mockData = { access_token: "test" };
    mock.onPost("/auth/login").reply(200, mockData);

    const result = await authService.login({
      phone_number: "123",
      password: "pw",
    });
    expect(result.data).toEqual(mockData);
  });

  it("register sends POST to /auth/register", async () => {
    const mockData = { id: "1", name: "Ivan" };
    mock.onPost("/auth/register").reply(200, mockData);

    const result = await authService.register({ name: "Ivan" });
    expect(result.data).toEqual(mockData);
  });

  it("getMe sends GET to /users/", async () => {
    const mockData = { id: "1", name: "Ivan" };
    mock.onGet("/users/").reply(200, mockData);

    const result = await authService.getMe();
    expect(result.data).toEqual(mockData);
  });
});
