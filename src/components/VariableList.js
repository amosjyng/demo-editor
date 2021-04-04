import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import { Button, Form } from "react-bootstrap";

class VariableList extends React.Component {
  render() {
    const variableListItems = [];
    for (const variable of this.props.variables) {
      variableListItems.push(
        <Button variant="outline-dark">{variable}</Button>
      );
    }
    return (
      <div id="variable-list">
        <Form.Control
          placeholder="Enter a new variable name"
          onChange={this.props.updateNewVariable}
          value={this.props.newVariable}
        />
        <Button variant="outline-primary" onClick={this.props.addVariable}>
          Add variable
        </Button>
        <div>{variableListItems}</div>
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
