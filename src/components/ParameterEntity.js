import React from "react";
import PropTypes from "prop-types";

class ParameterEntity extends React.Component {
  render() {
    return (
      <span className="ParameterEntity">
        <strong>{this.props.children}</strong>
      </span>
    );
  }
}

ParameterEntity.propTypes = {
  children: PropTypes.array.isRequired,
};

export default ParameterEntity;
