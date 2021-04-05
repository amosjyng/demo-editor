import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Highlighter from "react-highlight-words";
import { ListGroup } from "react-bootstrap";

class Autocomplete extends React.Component {
  render() {
    const variableListItems = [];
    for (const variable of this.props.variables) {
      if (variable.includes(this.props.match) && variable != this.props.match) {
        variableListItems.push(
          <ListGroup.Item
            key={variable}
            onMouseDown={() => this.props.onReplaceEntity(variable)}
          >
            <Highlighter
              searchWords={[this.props.match]}
              textToHighlight={variable}
            />
          </ListGroup.Item>
        );
        // don't want too much clutter
        if (variableListItems.length >= 10) {
          break;
        }
      }
    }

    const positioning = {
      position: "fixed",
      left: this.props.x,
      top: this.props.y + 40,
      zIndex: 100,
    };
    return <ListGroup style={positioning}>{variableListItems}</ListGroup>;
  }
}

Autocomplete.propTypes = {
  variables: PropTypes.instanceOf(Immutable.Iterable),
  match: PropTypes.string.isRequired,
  onReplaceEntity: PropTypes.func.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

export default Autocomplete;
