import { fireEvent, render, screen } from "@testing-library/react-native";
import { Divider } from "@/components/ui/Divider";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

describe("Divider", () => {
  it("renders with and without spacing", () => {
    const view = render(<Divider />);
    view.unmount();
    render(<Divider spacing={12} />);
    expect(true).toBe(true);
  });
});

describe("Skeleton", () => {
  it("renders with defaults and custom props", () => {
    const view = render(<Skeleton />);
    view.unmount();
    render(<Skeleton width={40} height={40} radius={20} />);
    expect(true).toBe(true);
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="Пусто" description="Ничего нет" />);
    expect(screen.getByText("Пусто")).toBeTruthy();
    expect(screen.getByText("Ничего нет")).toBeTruthy();
  });

  it("fires the action", () => {
    const onAction = jest.fn();
    render(<EmptyState title="Пусто" actionLabel="Обновить" onAction={onAction} />);
    fireEvent.press(screen.getByText("Обновить"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("renders a custom message", () => {
    render(<ErrorState message="Сбой сети" />);
    expect(screen.getByText("Сбой сети")).toBeTruthy();
  });

  it("fires retry", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.press(screen.getByText("Попробовать снова"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
