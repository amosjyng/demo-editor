import React from "react";
import VariableList from "./VariableList";
import Set from "immutable";
import TemplateEditor from "./TemplateEditor";

class TemplateDesigner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      variables: Set.fromJS(["foo", "bar", "baz"]),
      newVariable: "",
    };
  }

  updateNewVariable = (e) => {
    this.setState({ newVariable: e.target.value });
  };

  addVariable = (e) => {
    e.preventDefault();

    this.setState({
      variables: this.state.variables.push(this.state.newVariable),
      newVariable: "",
    });
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
        <TemplateEditor />
      </div>
    );
  }
}

export default TemplateDesigner;
