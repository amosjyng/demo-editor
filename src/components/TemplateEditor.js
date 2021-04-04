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
import ParameterEntity from "./ParameterEntity";
import HighlightEntity from "./HighlightEntity";

const HIGHLIGHT_ENTITY = "HIGHLIGHT";

class TemplateEditor extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: this.parameterStrategy,
        component: ParameterEntity,
      },
      {
        strategy: this.highlightStrategy,
        component: HighlightEntity,
      },
    ]);
    this.state = { editorState: EditorState.createEmpty(decorator) };
    this.editor = React.createRef();
  }

  /** Create a strategy to identify parameters in a block */
  parameterStrategy = (block, callback) => {
    const PARAMETER_REGEX = /\$[^ ]*/g;
    const text = block.getText();
    let parameterMatch, start;
    while ((parameterMatch = PARAMETER_REGEX.exec(text)) !== null) {
      start = parameterMatch.index;
      callback(start, start + parameterMatch[0].length);
    }
  };

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
    const withNewParameter = Modifier.insertText(contentState, selection, "$");

    this.setState({
      editorState: EditorState.push(
        editorState,
        withNewParameter,
        "withNewDollar"
      ),
    });
  };

  /** Create a new highlight in the template */
  onHighlight = (editorState) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      const block = contentState.getBlockForKey(selection.getStartKey());
      const existingEntityKey = block.getEntityAt(selection.getStartOffset());
      if (existingEntityKey === null) {
        const withEntity = contentState.createEntity(
          HIGHLIGHT_ENTITY,
          "MUTABLE",
          { entityRemover: this.onRemoveEntity }
        );
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

  onRemoveEntity = (entityKey) => {
    const editorState = this.state.editorState;
    const contentState = editorState.getCurrentContent();
    // It appears there's no way to retrieve the span of an entity directly
    // from the content state. We could store the span in the entity's data,
    // but then we would expose ourselves to bugs where the stored span goes
    // out of sync with the current span. For greater simplicity, we will do a
    // full search for this entity across all blocks.
    //
    // This could present a problem if the template is really long, in which
    // case we should consider storing the span, modifying Draft.js (though
    // the chances of a patch being accepted are likely low), or perhaps even
    // using a different rich text editor.
    let removedContent = contentState;
    for (const block of contentState.getBlocksAsArray()) {
      block.findEntityRanges(
        (charMetadata) => {
          return charMetadata.getEntity() === entityKey;
        },
        (start, end) => {
          const initSelection = SelectionState.createEmpty(block.getKey());
          const selection = initSelection
            .set("anchorOffset", start)
            .set("focusOffset", end);
          // apparently this is the official way to remove entities
          // see https://github.com/facebook/draft-js/issues/182
          const removedEntity = Modifier.applyEntity(
            removedContent,
            selection,
            null
          );
          removedContent = Modifier.removeRange(
            removedEntity,
            selection,
            "forward"
          );
          // can't exit early because an entity might span multiple blocks
        }
      );
    }
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
