import { render, screen } from "@testing-library/react";
import App from "./App";

window.scrollTo = jest.fn();

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/Known variables/i);
  expect(linkElement).toBeInTheDocument();
});
