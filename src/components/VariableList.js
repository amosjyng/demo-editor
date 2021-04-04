import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";

class VariableList extends React.Component {
  render() {
    const variableListItems = [];
    for (const variable of this.props.variables) {
      variableListItems.push(<li key={variable}>{variable}</li>);
    }
    return (
      <div id="variable-list">
        <input
          onChange={this.props.updateNewVariable}
          value={this.props.newVariable}
        />
        <button onClick={this.props.addVariable}>Add variable</button>
        <ul>{variableListItems}</ul>
      </div>
    );
  }
}

VariableList.propTypes = {
  variables: PropTypes.instanceOf(Immutable.Iterable),
  newVariable: PropTypes.string.isRequired,
  updateNewVariable: PropTypes.func.isRequired,
  addVariable: PropTypes.func.isRequired,
};

export default VariableList;
