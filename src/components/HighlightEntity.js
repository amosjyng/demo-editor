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
    const { entityRemover } = contentState.getEntity(entityKey).getData();
    this.entityRemover = entityRemover;
    this.entityType = contentState.getEntity(entityKey).getType();
  }

  removeEntity = () => {
    this.entityRemover(this.props.blockKey, this.props.start, this.props.end);
  };

  render() {
    let variant = "secondary"; // for unknown future variants
    if (this.entityType === EntityType.PARAMETER) {
      variant = "primary"; // blue
    } else if (this.entityType === EntityType.HIGHLIGHT) {
      variant = "danger"; //red
    }
    return (
      <Button as="span" variant={variant} className="HighlightEntity">
        {this.props.children}
        <span onClick={this.removeEntity}>X</span>
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
