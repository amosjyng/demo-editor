import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import { Button, Card, Form, Col } from "react-bootstrap";

class VariableList extends React.Component {
  render() {
    const variableListItems = [];
    for (const variable of this.props.variables) {
      variableListItems.push(
        <Button variant="outline-dark" key={variable}>
          {variable}
        </Button>
      );
    }
    return (
      <Card body>
        <Card.Title>Known variables</Card.Title>
        <Form>
          <Form.Row>
            <Col>
              <Form.Control
                placeholder="Enter a new variable name"
                onChange={this.props.updateNewVariable}
                value={this.props.newVariable}
              />
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-primary"
                onClick={this.props.addVariable}
              >
                Add variable
              </Button>
            </Col>
          </Form.Row>
        </Form>
        <div className="variable-list">{variableListItems}</div>
      </Card>
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
