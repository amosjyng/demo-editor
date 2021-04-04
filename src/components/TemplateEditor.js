import React from "react";
import {
  CompositeDecorator,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  SelectionState,
} from "draft-js";
import Toolbar from "./Toolbar";
import "draft-js/dist/Draft.css";
import HighlightEntity from "./HighlightEntity";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Autocomplete from "./Autocomplete";
import EntityType from "./EntityType";
import { Card } from "react-bootstrap";
import {
  constructCaret,
  constructSelection,
  iterateEntities,
} from "./DraftUtil";

const PARAM_BINDING = "template-parameterize";

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

  /** Send off a custom command if the user enters a $ */
  templateKeyBinding = (e) => {
    if (e.keyCode === 52 /* $ */) {
      return PARAM_BINDING;
    }

    return getDefaultKeyBinding(e);
  };

  /** Handle custom keystroke commands from the user */
  handleKeyCommand = (command) => {
    if (command === PARAM_BINDING) {
      this.parameterizeCurrentPosition();
      return "handled";
    } else {
      return "not-handled";
    }
  };

  /** Identify entities in a block */
  highlightStrategy = (block, callback) => {
    block.findEntityRanges((charMetadata) => {
      return charMetadata.getEntity() !== null;
    }, callback);
  };

  /** Create a new parameter in the template */
  parameterizeCurrentPosition = () => {
    const editorState = this.state.editorState;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const withDollar = Modifier.insertText(contentState, selection, "$ ");
    const editorWithDollar = EditorState.set(editorState, {
      currentContent: withDollar,
    });

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
    const paramSelection = constructSelection(
      selection.getStartKey(),
      selectionStart,
      selectionStart + 2
    );
    const newEditorState = this.createEntity(
      paramSelection,
      editorWithDollar,
      EntityType.PARAMETER
    );

    // move cursor to right after the $
    const dollarCursor = constructCaret(
      selection.getStartKey(),
      selectionStart + 1
    );
    const dollarCursorEditor = EditorState.forceSelection(
      newEditorState,
      dollarCursor
    );

    this.setState({ editorState: dollarCursorEditor });
  };

  /** Callback for parameter creation via the UI, as opposed to a keystroke. */
  onParameterize = (e) => {
    e.preventDefault();
    this.parameterizeCurrentPosition();
  };

  createEntity = (selection, editorState, entityType) => {
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const existingEntityKey = block.getEntityAt(selection.getStartOffset());
    if (existingEntityKey === null) {
      // we pass the entityRemover in a roundabout way here because there
      // doesn't appear to be a straightforward way to get it directly to
      // HighlightEntity via props
      const withEntity = contentState.createEntity(entityType, "MUTABLE", {
        entityRemover: this.onRemoveEntity,
      });
      const entityKey = withEntity.getLastCreatedEntityKey();
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
      return editorState;
    }
  };

  /** Get the current location of the caret within the input field */
  getCaretLocation = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  };

  removeStrayEntities = (contentState) => {
    return iterateEntities(
      contentState,
      (currentState, blockKey, block, start, end) => {
        if (start + 1 === end && block.getText()[start] === " ") {
          return this.removeEntity(currentState, blockKey, start, end);
        } else {
          const entityKey = block.getEntityAt(start);
          const entity = currentState.getEntity(entityKey);
          if (
            entity.getType() === EntityType.PARAMETER &&
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

  /**
   * Adds magic spacing back in to entity. Should call this function after
   * removeStrayEntities to avoid letting the magic spacing mess with the
   * deletion.
   */
  addMagicSpace = (contentState) => {
    return iterateEntities(
      contentState,
      (currentState, blockKey, block, start, end) => {
        const entityKey = block.getEntityAt(start);
        if (block.getText()[end - 1] !== " ") {
          return Modifier.insertText(
            currentState,
            constructCaret(blockKey, end),
            " ",
            undefined,
            entityKey
          );
        } else {
          return currentState;
        }
      }
    );
  };

  /** Do all post-hoc processing of entities after the latest content edit. */
  patchEntities = (contentState) => {
    const straysRemoved = this.removeStrayEntities(contentState);
    const magicSpaceAdded = this.addMagicSpace(straysRemoved);
    return magicSpaceAdded;
  };

  /** Create a new highlight in the template */
  onHighlight = (editorState) => {
    const selection = editorState.getSelection();
    const highlightedEntity = this.createEntity(
      selection,
      editorState,
      EntityType.HIGHLIGHT
    );
    const patched = EditorState.set(highlightedEntity, {
      currentContent: this.patchEntities(highlightedEntity.getCurrentContent()),
    });
    return EditorState.forceSelection(
      patched,
      // remove the highlight after we created an entity for it -- and allow
      // the user to continue typing immediately after the highlight
      constructCaret(selection.getEndKey(), selection.getEndOffset() + 1)
    );
  };

  /**
   * Handle changes to the editor. Changes can either be to the editor content,
   * or to the text selected inside the editor.
   */
  onChange = (newEditorState) => {
    if (
      newEditorState.getCurrentContent() ===
      this.state.editorState.getCurrentContent()
    ) {
      // none of the text changed, must be a selection change
      if (!newEditorState.getSelection().isCollapsed()) {
        newEditorState = this.onHighlight(newEditorState);
      }
    } else {
      newEditorState = EditorState.set(newEditorState, {
        currentContent: this.patchEntities(newEditorState.getCurrentContent()),
      });
    }
    this.setState({ editorState: newEditorState });
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

  onReplaceEntity = (replacement) => {
    const editorState = this.state.editorState;
    const contentState = editorState.getCurrentContent();
    // while there is the chance of an asynchronous bug popping up, it seems
    // rather unlikely for a local application
    const { entityKey, blockKey, start, end } = this.getActiveEntity();
    const replacedContent = Modifier.replaceText(
      contentState,
      constructSelection(blockKey, start, end),
      "$" + replacement + " ",
      undefined,
      entityKey
    );
    const newEditorState = EditorState.set(editorState, {
      currentContent: replacedContent,
    });
    this.setState({ editorState: newEditorState });
  };

  getActiveEntity = () => {
    const editorState = this.state.editorState;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return null;
    }
    const contentState = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const entityKey = block.getEntityAt(selection.getStartOffset());
    if (entityKey === null) {
      // do this check first for efficiency
      return null;
    }
    if (contentState.getEntity(entityKey).getType() !== EntityType.PARAMETER) {
      return null;
    }
    const caretPosition = selection.getStartOffset();
    let activeEntityInfo = {};
    // need to do things in this roundabout way because Draft.js doesn't appear
    // to offer any direct way of grabbing entity span from a block
    block.findEntityRanges(
      (charMetadata) => {
        return charMetadata.getEntity() === entityKey;
      },
      (start, end) => {
        if (start <= caretPosition && caretPosition < end) {
          activeEntityInfo = {
            entityKey: entityKey,
            blockKey: blockKey,
            start: start,
            end: end,
          };
        }
      }
    );
    return activeEntityInfo;
  };

  /**
   * Get the text for the entity that the caret is actively positioned over.
   */
  getActiveEntityString = () => {
    const activeEntity = this.getActiveEntity();
    if (activeEntity === null) {
      return null;
    }
    const { blockKey, start, end } = activeEntity;
    const contentState = this.state.editorState.getCurrentContent();
    const block = contentState.getBlockForKey(blockKey);
    // start + 1 to remove leading $, end - 1 to remove magic space
    return block.getText().substring(start + 1, end - 1);
  };

  componentDidMount() {
    this.editor.current.focus();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.editorState.getCurrentContent() !=
      this.state.editorState.getCurrentContent()
    ) {
      // focus back on the editor after an entity has just been created
      this.editor.current.focus();
    }
  }

  render() {
    // Positioning the autocomplete this way using the cursor position is
    // rather janky. Ideally we could tie the autocomplete functionality to the
    // position of the entity itself.
    //
    // One solution would be to render the autocomplete div as part of
    // HighlightEntity rendering. This doesn't work too well because a cursor
    // change does not cause the HighlightEntity to be rerendered, and so the
    // rendered autocomplete div stays up forever until the content is changed.
    // Which makes sense as an assumption by Draft.js -- why would the content
    // blocks need to rerender if the content state didn't change?
    //
    // Another solution would be to grab the position of the button that has
    // been rendered by the HighlightEntity corresponding to the active entity.
    // In order for that to happen, we would need it to tell us where it is.
    // Perhaps we could do this via passing in another callback function to the
    // HighlightEntity.
    const entityString = this.getActiveEntityString();
    const caret = this.getCaretLocation();
    const autocomplete =
      entityString === null || caret === null ? (
        false
      ) : (
        <Autocomplete
          match={entityString}
          variables={this.props.variables}
          onReplaceEntity={this.onReplaceEntity}
          x={caret.x}
          y={caret.y}
        />
      );
    return (
      <Card body>
        <Toolbar onParameterize={this.onParameterize} />
        <Editor
          ref={this.editor}
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand}
          keyBindingFn={this.templateKeyBinding}
          onChange={this.onChange}
          placeholder="Start typing here..."
        />
        {autocomplete}
      </Card>
    );
  }
}

TemplateEditor.propTypes = {
  variables: PropTypes.instanceOf(Immutable.Iterable),
};

export default TemplateEditor;
