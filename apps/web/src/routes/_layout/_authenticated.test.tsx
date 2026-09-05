import { describe, expect, it, vi } from "vitest";
import { Route } from "./_authenticated";

const getSession = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  redirect: (options: unknown) => ({
    isRedirect: true,
    ...(options as object),
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: () => getSession(),
  },
}));

type BeforeLoad = (ctx: {
  location: {
    href: string;
    pathname: string;
    search: Record<string, unknown>;
    searchStr: string;
    hash: string;
  };
}) => Promise<unknown>;

const beforeLoad = (Route as unknown as { beforeLoad: BeforeLoad }).beforeLoad;

// router-core parses search params into a null-prototype object (qss `decode`
// uses `Object.create(null)`), so it has no `toString`/`valueOf` and throws
// "Cannot convert object to primitive value" on any string coercion.
function parsedLocation(pathname: string, searchStr = "", hash = "") {
  const search = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of new URLSearchParams(searchStr)) {
    search[key] = value;
  }

  return {
    href:
      pathname + (searchStr ? `?${searchStr}` : "") + (hash ? `#${hash}` : ""),
    pathname,
    search,
    searchStr: searchStr ? `?${searchStr}` : "",
    hash,
  };
}

describe("_authenticated guard", () => {
  it("redirects an unauthenticated visitor to sign-in instead of crashing", async () => {
    getSession.mockResolvedValue({ data: null });

    const redirected = await beforeLoad({
      location: parsedLocation("/dashboard"),
    }).catch((error: unknown) => error);

    expect(redirected).toMatchObject({
      isRedirect: true,
      to: "/auth/sign-in",
      search: { redirect: "/dashboard" },
    });
  });

  it("preserves the search string and hash in the redirect target", async () => {
    getSession.mockResolvedValue({ data: null });

    const redirected = await beforeLoad({
      location: parsedLocation("/dashboard", "tab=board", "task-1"),
    }).catch((error: unknown) => error);

    expect(redirected).toMatchObject({
      search: { redirect: "/dashboard?tab=board#task-1" },
    });
  });

  it("lets an authenticated visitor through", async () => {
    getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });

    await expect(
      beforeLoad({ location: parsedLocation("/dashboard") }),
    ).resolves.toEqual({
      session: { user: { id: "user-1" } },
      sessionError: false,
    });
  });

  it("does not redirect when the session fetch fails", async () => {
    getSession.mockRejectedValue(new Error("network down"));

    await expect(
      beforeLoad({ location: parsedLocation("/dashboard") }),
    ).resolves.toEqual({ session: null, sessionError: true });
  });
});
