import React from "react";
import Set from "immutable";

class VariableList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      variables: Set.fromJS(["foo", "bar", "baz"]),
      newVariable: "",
    };
  }

  updateNewVariable = (e) => {
    console.log(e);
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
    const variableListItems = [];
    for (const variable of this.state.variables) {
      variableListItems.push(<li key={variable}>{variable}</li>);
    }
    return (
      <div id="variable-list">
        <input
          onChange={this.updateNewVariable}
          value={this.state.newVariable}
        />
        <button onClick={this.addVariable}>Add variable</button>
        <ul>{variableListItems}</ul>
      </div>
    );
  }
}

export default VariableList;
