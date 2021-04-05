import React from "react";
import PropTypes from "prop-types";
import { Button, Tooltip, OverlayTrigger } from "react-bootstrap";

export default function ToolbarButton(props) {
  return (
    <OverlayTrigger
      delay={{ show: 250, hide: 400 }}
      overlay={<Tooltip>{props.description}</Tooltip>}
    >
      <Button variant="light" onClick={props.onParameterize}>
        {props.symbol}
      </Button>
    </OverlayTrigger>
  );
}

ToolbarButton.propTypes = {
  symbol: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onParameterize: PropTypes.func.isRequired,
};
