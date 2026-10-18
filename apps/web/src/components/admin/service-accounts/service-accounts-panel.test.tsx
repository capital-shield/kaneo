import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import useServiceAccounts, {
  type ServiceAccount,
} from "@/hooks/queries/admin/use-service-accounts";
import ServiceAccountsPanel from "./service-accounts-panel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
vi.mock(
  "@/hooks/queries/admin/use-service-accounts",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/hooks/queries/admin/use-service-accounts")
    >()),
    default: vi.fn(),
  }),
);
const { createAccountMock, createKeyMock, revokeKeyMock, deleteAccountMock } =
  vi.hoisted(() => ({
    createAccountMock: vi.fn(),
    createKeyMock: vi.fn(),
    revokeKeyMock: vi.fn(),
    deleteAccountMock: vi.fn(),
  }));
vi.mock("@/hooks/mutations/admin/use-create-service-account", () => ({
  default: () => ({ mutateAsync: createAccountMock, isPending: false }),
}));
vi.mock("@/hooks/mutations/admin/use-create-service-account-key", () => ({
  default: () => ({ mutateAsync: createKeyMock, isPending: false }),
}));
vi.mock("@/hooks/mutations/admin/use-revoke-service-account-key", () => ({
  default: () => ({ mutateAsync: revokeKeyMock, isPending: false }),
}));
vi.mock("@/hooks/mutations/admin/use-delete-service-account", () => ({
  default: () => ({ mutateAsync: deleteAccountMock, isPending: false }),
}));

const useServiceAccountsMock = vi.mocked(useServiceAccounts);

function account(overrides: Partial<ServiceAccount> = {}): ServiceAccount {
  return {
    id: "sync",
    name: "Sync tool",
    email: "sync-tool-sync@service-account.invalid",
    createdAt: "2026-10-01T00:00:00.000Z",
    banned: false,
    keys: [],
    workspaces: [],
    ...overrides,
  };
}

function loaded(accounts: ServiceAccount[]) {
  useServiceAccountsMock.mockReturnValue({
    data: accounts,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useServiceAccounts>);
}

function openAccountMenu() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "settings:adminServiceAccounts.actions",
    }),
  );
}

beforeEach(() => {
  useServiceAccountsMock.mockReset();
  createAccountMock.mockReset();
  createKeyMock.mockReset();
  revokeKeyMock.mockReset();
  deleteAccountMock.mockReset();
});

afterEach(cleanup);

describe("ServiceAccountsPanel", () => {
  it("offers to create the first account when there are none", () => {
    loaded([]);
    render(<ServiceAccountsPanel />);

    expect(
      screen.getByText("settings:adminServiceAccounts.emptyTitle"),
    ).toBeTruthy();
  });

  it("creates an account with the entered name", async () => {
    loaded([]);
    createAccountMock.mockResolvedValue(account());
    render(<ServiceAccountsPanel />);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "settings:adminServiceAccounts.newAccount",
      })[0] as HTMLElement,
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "settings:adminServiceAccounts.create.namePlaceholder",
      ),
      { target: { value: "  Sync tool  " } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings:adminServiceAccounts.create.submit",
      }),
    );

    await waitFor(() =>
      expect(createAccountMock).toHaveBeenCalledWith("Sync tool"),
    );
  });

  it("shows workspaces and keys, and prompts to add a workspace when there are none", () => {
    loaded([
      account({
        workspaces: [{ id: "acme", name: "Acme", role: "member" }],
        keys: [
          {
            id: "key-1",
            name: "Production",
            start: "kan_ab",
            createdAt: "2026-10-01T00:00:00.000Z",
            expiresAt: null,
            lastRequest: null,
          },
        ],
      }),
      account({ id: "idle", name: "Idle" }),
    ]);
    render(<ServiceAccountsPanel />);

    expect(screen.getByText("Production")).toBeTruthy();
    expect(screen.getByText(/kan_ab/)).toBeTruthy();
    expect(
      screen.getByText("settings:adminServiceAccounts.workspaceRole"),
    ).toBeTruthy();
    expect(
      screen.getByText("settings:adminServiceAccounts.addToWorkspace"),
    ).toBeTruthy();
    expect(
      screen.getByText("settings:adminServiceAccounts.noKeys"),
    ).toBeTruthy();
  });

  it("creates a key with the default expiry and shows it once", async () => {
    loaded([account()]);
    createKeyMock.mockResolvedValue({ key: "kan_secret", apiKey: {} });
    render(<ServiceAccountsPanel />);

    openAccountMenu();
    fireEvent.click(screen.getByText("settings:adminServiceAccounts.newKey"));
    fireEvent.change(
      screen.getByPlaceholderText(
        "settings:adminServiceAccounts.key.namePlaceholder",
      ),
      { target: { value: "Production" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings:apiKey.createDialog.create",
      }),
    );

    await waitFor(() =>
      expect(createKeyMock).toHaveBeenCalledWith({
        userId: "sync",
        name: "Production",
        expiresIn: 7_776_000,
      }),
    );
    expect(await screen.findByText("kan_secret")).toBeTruthy();
  });

  it("deletes the account after confirmation", async () => {
    loaded([account()]);
    deleteAccountMock.mockResolvedValue(undefined);
    render(<ServiceAccountsPanel />);

    openAccountMenu();
    fireEvent.click(screen.getByText("common:actions.delete"));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "settings:adminServiceAccounts.confirm.delete.action",
      }),
    );

    await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledWith("sync"));
  });
});
