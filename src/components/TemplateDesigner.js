import React from "react";
import VariableList from "./VariableList";
import { Set } from "immutable";
import TemplateEditor from "./editor/TemplateEditor";

class TemplateDesigner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      variables: Set.of("foo", "bar", "baz"),
      newVariable: "",
    };
  }

  updateNewVariable = (e) => {
    this.setState({ newVariable: e.target.value });
  };

  addVariable = (e) => {
    e.preventDefault();

    const newVariable = this.state.newVariable.trim();
    if (newVariable.length > 0) {
      this.setState({
        variables: this.state.variables.add(newVariable),
        newVariable: "",
      });
    }
  };

  render() {
    return (
      <div>
        <VariableList
          variables={this.state.variables}
          newVariable={this.state.newVariable}
          updateNewVariable={this.updateNewVariable}
          addVariable={this.addVariable}
        />
        <TemplateEditor variables={this.state.variables} />
      </div>
    );
  }
}

export default TemplateDesigner;
