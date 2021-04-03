import React from "react";
import PropTypes from "prop-types";

class HighlightEntity extends React.Component {
  render() {
    return (
      <span className="HighlightEntity">
        <em>{this.props.children}</em>
      </span>
    );
  }
}

HighlightEntity.propTypes = {
  children: PropTypes.array.isRequired,
};

export default HighlightEntity;
