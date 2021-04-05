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
import { Iterable, Map } from "immutable";
import Autocomplete from "./Autocomplete";
import EntityType from "./EntityType";
import { Card } from "react-bootstrap";
import {
  constructCaret,
  constructSelection,
  createRemoveableEntity,
  getEntitySelection,
  getText,
  getEditorMultiInfo,
  iterateEntities,
  entityType,
} from "./DraftUtil";

const PARAM_BINDING = "template-parameterize";

class TemplateEditor extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: this.allEntitiesStrategy,
        component: HighlightEntity,
      },
    ]);
    this.state = {
      editorState: EditorState.createEmpty(decorator),
      entityPositions: Map(),
    };
    this.editor = React.createRef();
    this.entityData = {
      entityRemover: this.onRemoveEntity,
      getActiveParam: this.getActiveParam,
      updateEntityRenderPosition: this.updateEntityRenderPosition,
    };
  }

  /**
   * Assuming that all entityKey's in a block are unique, this returns a string
   * uniquely identifying an entity in a block.
   */
  getEntityID = (blockKey, entityKey) => {
    return blockKey + "/" + entityKey;
  };

  /**
   * Save the entity's position. See "AUTOCOMPLETE POSITIONING" for details
   * on why this is needed.
   */
  updateEntityRenderPosition = (blockKey, entityKey, entityPosition) => {
    const entityID = this.getEntityID(blockKey, entityKey);
    if (
      entityType(this.state.editorState, entityKey) === EntityType.PARAMETER
    ) {
      this.setState({
        entityPositions: this.state.entityPositions.set(
          entityID,
          entityPosition
        ),
      });
    }
  };

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

  /** Identify all entities in a block */
  allEntitiesStrategy = (block, callback) => {
    block.findEntityRanges((charMetadata) => {
      return charMetadata.getEntity() !== null;
    }, callback);
  };

  /** Create a new parameter in the template */
  parameterizeCurrentPosition = () => {
    const editorState = this.state.editorState;
    const { selection, contentState, entityKey } = getEditorMultiInfo(
      editorState
    );
    if (entityKey !== null) {
      // only create a new parameter if we're not already inside an entity
      return;
    }
    // Draft.js expects insertions to occur at collapsed selections, so make
    // sure to collapse it first before doing so. In the future, if there
    // exists such a selection, we may actually want to convert the whole
    // selection into a parameter entity.
    const collapsedSelection = constructCaret(
      selection.getStartKey(),
      selection.getStartOffset()
    );

    // ### ENTITY MAGIC ###
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
    const withDollar = Modifier.insertText(
      contentState,
      collapsedSelection,
      "$ "
    );
    const editorWithDollar = EditorState.set(editorState, {
      currentContent: withDollar,
    });

    const selectionStart = selection.getStartOffset();
    const paramSelection = constructSelection(
      selection.getStartKey(),
      selectionStart,
      selectionStart + 2
    );
    const newEditorState = createRemoveableEntity(
      paramSelection,
      editorWithDollar,
      EntityType.PARAMETER,
      this.entityData
    );
    if (newEditorState === null) {
      return; // do nothing if new entity could not be created
    }

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

  /**
   * Removes entities where only the magic space remains, as well as parameters
   * where the dollar sign has been deleted. See "ENTITY MAGIC" for more
   * details on the magic spacing.
   */
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
   * Adds magic spacing back in to entity. See "ENTITY MAGIC" on why this space
   * exists. Should call this function after removeStrayEntities to avoid
   * letting the magic spacing mess with the deletion.
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
    const highlightedEntity = createRemoveableEntity(
      selection,
      editorState,
      EntityType.HIGHLIGHT,
      this.entityData
    );
    if (highlightedEntity === null) {
      return editorState; // don't do anything else if entity already exists
    }
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

  /** See if a selection is eligible to be turned into a highlighted entity. */
  isValidHighlight = (selection) => {
    return (
      !selection.isCollapsed() &&
      // make sure selected text is not empty -- otherwise, we'll end up
      // deleting selected single spaces due to the post-processing cleanup
      getText(this.state.editorState, selection).trim().length > 0
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
      if (this.isValidHighlight(newEditorState.getSelection())) {
        newEditorState = this.onHighlight(newEditorState);
      }
    } else {
      // text changed, see if any entities need to be removed
      newEditorState = EditorState.set(newEditorState, {
        currentContent: this.patchEntities(newEditorState.getCurrentContent()),
      });
    }
    this.setState({ editorState: newEditorState });
  };

  /**
   * Remove an entity. May be triggered in various ways, e.g. by keyboard
   * deletion or the user manually clicking the remove button.
   */
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

  /** Callback for when the user hits the delete button on an entity */
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

  /**
   * Callback for when the user selects something from the autocomplete
   * dropdown
   */
  onReplaceParam = (replacement) => {
    const editorState = this.state.editorState;
    // once asynchronicity is introduced, we'll need to add a check to see if
    // the content has changed since the autocomplete was triggered
    const {
      blockKey,
      contentState,
      entitySelection,
      entityKey,
    } = this.getActiveParam();
    const newEntityText = "$" + replacement + " ";
    const replacedContent = Modifier.replaceText(
      contentState,
      entitySelection,
      newEntityText,
      undefined,
      entityKey
    );
    const newEditorState = EditorState.set(editorState, {
      currentContent: replacedContent,
    });
    const movedCaret = EditorState.forceSelection(
      newEditorState,
      constructCaret(
        blockKey,
        entitySelection.getStartOffset() + newEntityText.length
      )
    );
    this.setState({ editorState: movedCaret });
    // unsure why focus doesn't work otherwise, but this does the trick for now
    setTimeout(() => {
      this.editor.current.focus();
    }, 100);
  };

  /**
   * If there exists a param that the user is actively editing, this function
   * will return information about it. Otherwise, the function will return
   * null.
   */
  getActiveParam = () => {
    const editorState = this.state.editorState;
    const {
      selection,
      block,
      blockKey,
      contentState,
      entityKey,
    } = getEditorMultiInfo(editorState);
    if (!selection.isCollapsed()) {
      return null;
    }
    if (entityKey === null) {
      return null;
    }
    if (contentState.getEntity(entityKey).getType() !== EntityType.PARAMETER) {
      return null;
    }
    return {
      contentState,
      entityKey,
      blockKey,
      entitySelection: getEntitySelection(block, entityKey),
    };
  };

  /** Get the text for the param that the user is currently typing in. */
  getActiveParamString = (activeParam) => {
    if (activeParam === null) {
      return null;
    }
    const text = getText(this.state.editorState, activeParam.entitySelection);
    // start + 1 to remove leading $, end - 1 to remove magic space
    return text.substring(1, text.length - 1);
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
    // ### AUTOCOMPLETE POSITIONING ###
    // We need to align the autocomplete somehow to appear right under where
    // the user is typing. We could do so by asking the browser for the current
    // position of the caret and creating the dropdown based on that. However,
    // creating the autocomplete this way using the caret position is
    // rather janky. The dropdown will shift to the right as the user types,
    // but even more importantly, the browser often reports the caret position
    // as (0, 0) on initial load. Ideally we could tie the autocomplete
    // functionality to the position of the entity itself.
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
    // The purpose of updateEntityRenderPosition is to capture and save this
    // information. We cannot simply get this on the fly because
    // HighlightEntity does not rerender on caret changes, and we run into the
    // same problem as noted above. This is the solution in place.
    const activeParam = this.getActiveParam();
    const entityString = this.getActiveParamString(activeParam);
    let autocomplete = false;
    if (entityString !== null) {
      const entityID = this.getEntityID(
        activeParam.blockKey,
        activeParam.entityKey
      );
      const entityPosition = this.state.entityPositions.get(entityID);
      if (entityPosition !== undefined) {
        autocomplete = (
          <Autocomplete
            match={entityString}
            variables={this.props.variables}
            onReplaceEntity={this.onReplaceParam}
            x={entityPosition.left}
            y={entityPosition.top}
          />
        );
      }
    }
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
  variables: PropTypes.instanceOf(Iterable),
};

export default TemplateEditor;
