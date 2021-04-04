import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";

class ToolbarButton extends React.Component {
  render() {
    return (
      <Button variant="light" onClick={this.props.onParameterize}>
        {this.props.symbol}
      </Button>
    );
  }
}

ToolbarButton.propTypes = {
  symbol: PropTypes.string.isRequired,
  onParameterize: PropTypes.func.isRequired,
};

export default ToolbarButton;
