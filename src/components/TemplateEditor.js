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
    // There is a space so that we can continue appending to a single-character
    // entity. This is a workaround given the constraints imposed by Draft.js'
    // mental model of how things work.
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
    }
    this.setState({ editorState: newState });
  };

  onRemoveEntity = (blockKey, start, end) => {
    const editorState = this.state.editorState;
    const contentState = editorState.getCurrentContent();
    // assumption: user only wants to delete a highlight from one block at a
    // time, even if the highlight spans multiple blocks
    const initSelection = SelectionState.createEmpty(blockKey);
    const selection = initSelection
      .set("anchorOffset", start)
      .set("focusOffset", end);
    // apparently this is the official way to remove entities
    // see https://github.com/facebook/draft-js/issues/182
    const removedEntity = Modifier.applyEntity(contentState, selection, null);
    const removedContent = Modifier.removeRange(
      removedEntity,
      selection,
      "forward"
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
