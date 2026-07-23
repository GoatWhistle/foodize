import { render, screen } from "@testing-library/react-native";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { t } from "@/i18n";

jest.mock("@/hooks/useNetworkStatus");

const mockedStatus = jest.mocked(useNetworkStatus);

describe("OfflineBanner", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while online", () => {
    mockedStatus.mockReturnValue({ isOnline: true, justReconnected: false });
    render(<OfflineBanner />);
    expect(screen.queryByTestId("offline-banner")).toBeNull();
  });

  it("shows the offline message when offline", () => {
    mockedStatus.mockReturnValue({ isOnline: false, justReconnected: false });
    render(<OfflineBanner />);
    expect(screen.getByText(t("common.network.offline"))).toBeTruthy();
  });

  it("shows the reconnected message on reconnect", () => {
    mockedStatus.mockReturnValue({ isOnline: true, justReconnected: true });
    render(<OfflineBanner />);
    expect(screen.getByText(t("common.network.backOnline"))).toBeTruthy();
  });
});
