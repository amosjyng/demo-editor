import React from "react";
import { CompositeDecorator, Editor, EditorState, Modifier } from "draft-js";
import Toolbar from "./Toolbar";
import "draft-js/dist/Draft.css";
import ParameterEntity from "./ParameterEntity";

class TemplateEditor extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: this.parameterStrategy,
        component: ParameterEntity,
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
      const text = block
        .getText()
        .slice(selection.getStartOffset(), selection.getEndOffset());
      console.log("selection is " + text);
    }
  };

  onChange = (newState) => {
    if (
      newState.getCurrentContent() ===
      this.state.editorState.getCurrentContent()
    ) {
      // none of the text changed, must be a selection change
      this.onHighlight(newState);
    }
    this.setState({ editorState: newState });
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
