import React from "react";
import PropTypes from "prop-types";
import { ContentState } from "draft-js";
import EntityType from "./EntityType";
import { Button } from "react-bootstrap";

class HighlightEntity extends React.Component {
  constructor(props) {
    super(props);
    const entityKey = props.entityKey;
    const contentState = props.contentState;
    const { entityRemover, saveEntityRef } = contentState
      .getEntity(entityKey)
      .getData();
    this.entityRemover = entityRemover;
    this.button = React.createRef();
    saveEntityRef(this.props.blockKey, this.props.entityKey, this);
  }

  removeEntity = () => {
    this.entityRemover(this.props.blockKey, this.props.start, this.props.end);
  };

  getCurrentBoundingRect = () => {
    return this.button.current.getBoundingClientRect();
  };

  render() {
    let variant = "secondary"; // for unknown future variants
    // can't create this in constructor because this DOM node gets reused, and
    // so the color will end up being the wrong cached color if a preceding
    // entity gets deleted, and that entity's DOM node is used for this one.
    // This could probably be solved by working with React's reconciliation,
    // but that can be done in the future.
    const entityType = this.props.contentState
      .getEntity(this.props.entityKey)
      .getType();
    if (entityType === EntityType.PARAMETER) {
      variant = "warning"; // yellow
    } else if (entityType === EntityType.HIGHLIGHT) {
      variant = "danger"; //red
    }

    return (
      <Button
        ref={this.button}
        key={this.props.entityKey}
        as="span"
        variant={variant}
        className="entity"
      >
        {this.props.children}
        <span className="entity-rm-btn" onClick={this.removeEntity}></span>
      </Button>
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
