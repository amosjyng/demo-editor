import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Highlighter from "react-highlight-words";
import { ListGroup } from "react-bootstrap";

export default function Autocomplete(props) {
  const variableListItems = [];
  for (const variable of props.variables) {
    if (variable.includes(props.match) && variable != props.match) {
      variableListItems.push(
        <ListGroup.Item
          key={variable}
          onMouseDown={() => props.onReplaceEntity(variable)}
        >
          <Highlighter searchWords={[props.match]} textToHighlight={variable} />
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
    left: props.x,
    top: props.y + 40,
    zIndex: 100,
  };
  return <ListGroup style={positioning}>{variableListItems}</ListGroup>;
}

Autocomplete.propTypes = {
  variables: PropTypes.instanceOf(Immutable.Iterable),
  match: PropTypes.string.isRequired,
  onReplaceEntity: PropTypes.func.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};
