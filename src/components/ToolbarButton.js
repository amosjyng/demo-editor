import React from "react";
import PropTypes from "prop-types";

class ToolbarButton extends React.Component {
  render() {
    return (
      <button onClick={this.props.onParameterize}>{this.props.symbol}</button>
    );
  }
}

ToolbarButton.propTypes = {
  symbol: PropTypes.string.isRequired,
  onParameterize: PropTypes.func.isRequired,
};

export default ToolbarButton;
