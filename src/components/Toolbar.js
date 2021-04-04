import React from "react";
import ToolbarButton from "./ToolbarButton";
import PropTypes from "prop-types";
import { ButtonToolbar } from "react-bootstrap";

class Toolbar extends React.Component {
  render() {
    return (
      <ButtonToolbar className="Toolbar">
        <ToolbarButton symbol="$" onParameterize={this.props.onParameterize} />
      </ButtonToolbar>
    );
  }
}

Toolbar.propTypes = {
  onParameterize: PropTypes.func.isRequired,
};

export default Toolbar;
