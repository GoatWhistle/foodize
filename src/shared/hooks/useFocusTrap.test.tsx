import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { useFocusTrap } from "@shared/hooks/useFocusTrap";

let offsetParentDescriptor: PropertyDescriptor | undefined;

beforeAll(() => {
  offsetParentDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetParent",
  );
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === "BODY" ? null : document.body;
    },
  });
});

afterAll(() => {
  if (offsetParentDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetParent",
      offsetParentDescriptor,
    );
  }
});

interface HarnessProps {
  active?: boolean;
  onEscape?: () => void;
  empty?: boolean;
}

const Harness = ({ active = true, onEscape, empty = false }: HarnessProps) => {
  const ref = useFocusTrap<HTMLDivElement>({ active, onEscape });
  return (
    <div>
      <button data-testid="outside">outside</button>
      <div ref={ref} tabIndex={-1} data-testid="container">
        {!empty && (
          <>
            <button data-testid="first">first</button>
            <button data-testid="mid">mid</button>
            <button data-testid="last">last</button>
          </>
        )}
      </div>
    </div>
  );
};

describe("useFocusTrap", () => {
  it("focuses the first focusable element when active", () => {
    const { getByTestId } = render(<Harness />);
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("calls onEscape when Escape is pressed", () => {
    const onEscape = vi.fn();
    render(<Harness onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("wraps focus from last to first on Tab", () => {
    const { getByTestId } = render(<Harness />);
    const last = getByTestId("last");
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("wraps focus from first to last on Shift+Tab", () => {
    const { getByTestId } = render(<Harness />);
    const first = getByTestId("first");
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByTestId("last"));
  });

  it("does not attach handlers when inactive", () => {
    const onEscape = vi.fn();
    const { getByTestId } = render(<Harness active={false} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(getByTestId("first"));
  });

  it("focuses the container when there are no focusable children", () => {
    const { getByTestId } = render(<Harness empty />);
    expect(document.activeElement).toBe(getByTestId("container"));
  });

  it("keeps focus inside container on Tab when empty", () => {
    const { getByTestId } = render(<Harness empty />);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByTestId("container"));
  });

  it("ignores non Tab/Escape keys", () => {
    const onEscape = vi.fn();
    const { getByTestId } = render(<Harness onEscape={onEscape} />);
    getByTestId("mid").focus();
    fireEvent.keyDown(document, { key: "a" });
    expect(document.activeElement).toBe(getByTestId("mid"));
    expect(onEscape).not.toHaveBeenCalled();
  });
});
