import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import Set from "immutable";

window.scrollTo = jest.fn();
const testVariables = Set.fromJS(["foo", "bar"]);
import TemplateEditor from "./TemplateEditor";

let container = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

it("renders the editor", () => {
  act(() => {
    render(<TemplateEditor variables={testVariables} />, container);
  });
  container.querySelector(".toolbar");
  expect(container).not.toBeNull();
});
