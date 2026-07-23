import { screen } from "@testing-library/react-native";

interface RefreshableProps {
  props: { refreshControl: { props: { onRefresh: () => void } } };
}

export const triggerRefresh = (testID: string): void => {
  const element = screen.getByTestId(testID) as unknown as RefreshableProps;
  element.props.refreshControl.props.onRefresh();
};
