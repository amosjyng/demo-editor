import React from "react";
import ToolbarButton from "./ToolbarButton";

class Toolbar extends React.Component {
  render() {
    return (
      <div className="Toolbar">
        <ToolbarButton symbol="$" />
      </div>
    );
  }
}

export default Toolbar;
