/** This file is for convenience functions with Draft.js */

import { SelectionState, Modifier, EditorState } from "draft-js";

/** Create a selection spanning within a single block. */
export function constructSelection(blockKey, start, end) {
  return SelectionState.createEmpty(blockKey)
    .set("anchorOffset", start)
    .set("focusOffset", end);
}

/** Create a collapsed selection located at a single point.  */
export function constructCaret(blockKey, position) {
  return constructSelection(blockKey, position, position);
}

/** Iterate through all entities in the content. */
export function iterateEntities(contentState, callback) {
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
}

/** Create a new removeable entity in the content. */
export function createRemoveableEntity(
  selection,
  editorState,
  entityType,
  entityRemover
) {
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(selection.getStartKey());
  const existingEntityKey = block.getEntityAt(selection.getStartOffset());
  if (existingEntityKey === null) {
    // we pass the entityRemover in a roundabout way here because there
    // doesn't appear to be a straightforward way to get it directly to
    // HighlightEntity via props
    const withEntity = contentState.createEntity(entityType, "MUTABLE", {
      entityRemover: entityRemover,
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
}
