import React from "react";
import { Editor, EditorState } from "draft-js";
import Toolbar from "./Toolbar";
import "draft-js/dist/Draft.css";

class TemplateEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { editorState: EditorState.createEmpty() };
    this.onChange = (editorState) => this.setState({ editorState });
  }

  render() {
    return (
      <div className="TemplateEditor">
        <Toolbar />
        <Editor editorState={this.state.editorState} onChange={this.onChange} />
      </div>
    );
  }
}

export default TemplateEditor;
