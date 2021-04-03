import React from "react";
import ToolbarButton from "./ToolbarButton";
import PropTypes from "prop-types";

class Toolbar extends React.Component {
  render() {
    return (
      <div className="Toolbar">
        <ToolbarButton symbol="$" onParameterize={this.props.onParameterize} />
      </div>
    );
  }
}

Toolbar.propTypes = {
  onParameterize: PropTypes.func.isRequired,
};

export default Toolbar;
