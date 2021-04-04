import React from "react";
import PropTypes from "prop-types";
import { ContentState } from "draft-js";

class HighlightEntity extends React.Component {
  removeEntity = () => {
    const entityKey = this.props.entityKey;
    const { entityRemover } = this.props.contentState
      .getEntity(entityKey)
      .getData();
    entityRemover(this.props.blockKey, this.props.start, this.props.end);
  };

  render() {
    return (
      <span className="HighlightEntity">
        <em>{this.props.children}</em>
        <button onClick={this.removeEntity}>X</button>
      </span>
    );
  }
}

/**
 * A list of all properties can be found at
 * https://github.com/facebook/draft-js/blob/bd48a12d41f58942547a6c58c2a39a5b2bb95b6b/src/model/decorators/DraftDecorator.js#L55-L70
 */
HighlightEntity.propTypes = {
  start: PropTypes.number.isRequired,
  end: PropTypes.number.isRequired,
  blockKey: PropTypes.string.isRequired,
  entityKey: PropTypes.string.isRequired,
  contentState: PropTypes.instanceOf(ContentState),
  children: PropTypes.array.isRequired,
};

export default HighlightEntity;
