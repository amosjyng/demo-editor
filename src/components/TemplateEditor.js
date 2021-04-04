import React from "react";
import {
  CompositeDecorator,
  Editor,
  EditorState,
  Modifier,
  SelectionState,
} from "draft-js";
import Toolbar from "./Toolbar";
import "draft-js/dist/Draft.css";
import HighlightEntity from "./HighlightEntity";

const HIGHLIGHT_ENTITY = "HIGHLIGHT";
const PARAM_ENTITY = "PARAM";

class TemplateEditor extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: this.highlightStrategy,
        component: HighlightEntity,
      },
    ]);
    this.state = { editorState: EditorState.createEmpty(decorator) };
    this.editor = React.createRef();
  }

  /** Create a strategy to identify highlights in a block */
  highlightStrategy = (block, callback) => {
    block.findEntityRanges((charMetadata) => {
      return charMetadata.getEntity() !== null;
    }, callback);
  };

  /** Create a new parameter in the template */
  onParameterize = (e) => {
    e.preventDefault();
    const editorState = this.state.editorState;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const withDollar = Modifier.insertText(contentState, selection, "$ ");
    const editorWithDollar = EditorState.set(editorState, {
      currentContent: withDollar,
    });

    const initSelection = SelectionState.createEmpty(selection.getStartKey());
    const selectionStart = selection.getStartOffset();
    // the paramSelection contains only the $ and a space after it
    //
    // Draft.js enforces a specific mental model of how entities work:
    //
    //  1. Entities without characters do not exist. As such, we'll need to
    //     actually insert a $ (or some other placeholder) to ensure that the
    //     parameter entity gets displayed.
    //  2. A new character inputted by the user will only contribute to an
    //     entity if that new character is sandwiched in between other
    //     characters belonging to that entity. As such, we'll need to insert
    //     a "magic" space after the $ as well, to ensure that the user can
    //     continue typing the parameter's name.
    //
    // These limitations appy to prepending/appending text for highlighted
    // entities as well, not just parameters. This has several implications
    // around usability:
    //
    //  1. All stray single-spaced entities should be removed. We could arrive
    //     at this state in several ways:
    //
    //       * The user cursor is at "a| ", and the user presses backspace
    //       * The user cursor is at "|a ", and the user presses delete
    //       * The user has a selection "[ab] " and deletes it (the selection
    //         could actually potentially span over non-entity portions of the
    //         text as well)
    //
    //     There might yet be other edge cases that I have not thought of. The
    //     most secure method of ensuring this does not happen would be to
    //     systematically identify such strays by removing all such entities
    //     after every edit. This should be fine for performance
    //     if the templates remain small. In case users start making long
    //     templates, we could switch at that point to hunting down all the
    //     edge cases where this could possibly occur. This is the approach
    //     that has been implemented.
    //
    //     An alternative would be rendering them as having no HTML at all,
    //     effectively completely hiding them. While systematic, this also
    //     produces hiccups in the editing wherein the user could press an
    //     arrow key without their cursor moving.
    //  2. Add the magic space back in if the user happens to have deleted it.
    //     The cursor should still move left when the user presses backspace.
    //
    //     An alternative would be pretending like the magic space isn't there
    //     at all, and moving the cursor an extra step in the direction the
    //     user's arrow keys/delete button moved in. But that would remove the
    //     option for the user to append to the entity, defeating the whole
    //     point of the magic space in the first place.
    const paramSelection = initSelection
      .set("anchorOffset", selectionStart)
      .set("focusOffset", selectionStart + 2);
    const newEditorState = this.createEntity(
      paramSelection,
      editorWithDollar,
      PARAM_ENTITY
    );

    // move cursor to right after the $
    const dollarCursor = initSelection
      .set("anchorOffset", selectionStart + 1)
      .set("focusOffset", selectionStart + 1);
    const dollarCursorEditor = EditorState.forceSelection(
      newEditorState,
      dollarCursor
    );

    this.setState({ editorState: dollarCursorEditor });
  };

  createEntity = (selection, editorState, entityType) => {
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const existingEntityKey = block.getEntityAt(selection.getStartOffset());
    if (existingEntityKey === null) {
      const withEntity = contentState.createEntity(entityType, "MUTABLE", {
        entityRemover: this.onRemoveEntity,
      });
      const entityKey = withEntity.getLastCreatedEntityKey();
      console.log("New highlight " + entityKey);
      const withHighlight = Modifier.applyEntity(
        withEntity,
        selection,
        entityKey
      );
      const newEditorState = EditorState.set(editorState, {
        currentContent: withHighlight,
      });
      return newEditorState;
    } else {
      console.log("Highlight already exists at location, not recreating.");
    }
  };

  iterateEntities = (contentState, callback) => {
    for (let [blockKey, block] of contentState.getBlockMap()) {
      block.findEntityRanges(
        (charMetadata) => {
          return charMetadata.getEntity() !== null;
        },
        (start, end) => {
          contentState = callback(contentState, blockKey, block, start, end);
        }
      );
    }
    return contentState;
  };

  removeStrayEntities = (contentState) => {
    return this.iterateEntities(
      contentState,
      (currentState, blockKey, block, start, end) => {
        if (start + 1 === end && block.getText()[start] === " ") {
          return this.removeEntity(currentState, blockKey, start, end);
        } else {
          const entityKey = block.getEntityAt(start);
          const entity = currentState.getEntity(entityKey);
          if (
            entity.getType() === PARAM_ENTITY &&
            block.getText()[start] !== "$"
          ) {
            // if user just deleted the dollar sign in a param entity for any
            // reason, delete the rest of the entity as well
            return this.removeEntity(currentState, blockKey, start, end);
          } else {
            return currentState;
          }
        }
      }
    );
  };

  /** Create a new highlight in the template */
  onHighlight = (editorState) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return this.createEntity(selection, editorState, HIGHLIGHT_ENTITY);
    }
    return editorState;
  };

  onChange = (newState) => {
    if (
      newState.getCurrentContent() ===
      this.state.editorState.getCurrentContent()
    ) {
      // none of the text changed, must be a selection change
      newState = this.onHighlight(newState);
    } else {
      newState = EditorState.set(newState, {
        currentContent: this.removeStrayEntities(newState.getCurrentContent()),
      });
    }
    this.setState({ editorState: newState });
  };

  removeEntity = (contentState, blockKey, start, end) => {
    // assumption: user only wants to delete a highlight from one block at a
    // time, even if the highlight spans multiple blocks
    const initSelection = SelectionState.createEmpty(blockKey);
    const selection = initSelection
      .set("anchorOffset", start)
      .set("focusOffset", end);
    // apparently this is the official way to remove entities
    // see https://github.com/facebook/draft-js/issues/182
    const removedEntity = Modifier.applyEntity(contentState, selection, null);
    return Modifier.removeRange(removedEntity, selection, "forward");
  };

  onRemoveEntity = (blockKey, start, end) => {
    const editorState = this.state.editorState;
    const contentState = editorState.getCurrentContent();
    const removedContent = this.removeEntity(
      contentState,
      blockKey,
      start,
      end
    );
    const newEditorState = EditorState.set(editorState, {
      currentContent: removedContent,
    });
    this.setState({ editorState: newEditorState });
  };

  componentDidMount() {
    this.editor.current.focus();
  }

  componentDidUpdate() {
    this.editor.current.focus();
  }

  render() {
    return (
      <div className="TemplateEditor">
        <Toolbar onParameterize={this.onParameterize} />
        <Editor
          ref={this.editor}
          editorState={this.state.editorState}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

export default TemplateEditor;
