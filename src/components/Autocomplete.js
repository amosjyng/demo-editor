import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Highlighter from "react-highlight-words";

class Autocomplete extends React.Component {
  render() {
    const variableListItems = [];
    for (const variable of this.props.variables) {
      if (variable.includes(this.props.match)) {
        variableListItems.push(
          <li
            key={variable}
            onClick={() => this.props.onReplaceEntity(variable)}
          >
            <Highlighter
              searchWords={[this.props.match]}
              textToHighlight={variable}
            />
          </li>
        );
        // don't want too much clutter
        if (variableListItems.length >= 10) {
          break;
        }
      }
    }
    return <ul>{variableListItems}</ul>;
  }
}

Autocomplete.propTypes = {
  variables: PropTypes.instanceOf(Immutable.Iterable),
  match: PropTypes.string.isRequired,
  onReplaceEntity: PropTypes.func.isRequired,
};

export default Autocomplete;
