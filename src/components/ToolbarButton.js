import React from "react";
import PropTypes from "prop-types";

class ToolbarButton extends React.Component {
  render() {
    return <button type="button">{this.props.symbol}</button>;
  }
}

ToolbarButton.propTypes = {
  symbol: PropTypes.string.isRequired,
};

export default ToolbarButton;
