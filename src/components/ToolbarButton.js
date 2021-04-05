import React from "react";
import PropTypes from "prop-types";
import { Button, Tooltip, OverlayTrigger } from "react-bootstrap";

class ToolbarButton extends React.Component {
  render() {
    return (
      <OverlayTrigger
        delay={{ show: 250, hide: 400 }}
        overlay={<Tooltip>{this.props.description}</Tooltip>}
      >
        <Button variant="light" onClick={this.props.onParameterize}>
          {this.props.symbol}
        </Button>
      </OverlayTrigger>
    );
  }
}

ToolbarButton.propTypes = {
  symbol: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onParameterize: PropTypes.func.isRequired,
};

export default ToolbarButton;
