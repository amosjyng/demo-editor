import React from "react";
import ToolbarButton from "./ToolbarButton";
import PropTypes from "prop-types";
import { ButtonToolbar } from "react-bootstrap";

export default function Toolbar(props) {
  return (
    <ButtonToolbar className="Toolbar">
      <ToolbarButton
        symbol="$"
        description="Add a new field"
        onParameterize={props.onParameterize}
      />
    </ButtonToolbar>
  );
}

Toolbar.propTypes = {
  onParameterize: PropTypes.func.isRequired,
};
