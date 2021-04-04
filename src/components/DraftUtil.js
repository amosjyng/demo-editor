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

/**
 * Get multiple pieces of information about the editor at once, instead of
 * breaking it out over several lines. A custom selection may optionally be
 * passed in, in which case block information for that selection will be
 * returned, rather than block information for the editor's current selection.
 */
export function getEditorMultiInfo(editorState, customSelection) {
  const contentState = editorState.getCurrentContent();
  const selection =
    customSelection === undefined
      ? editorState.getSelection()
      : customSelection;
  const blockKey = selection.getAnchorKey();
  const block = contentState.getBlockForKey(blockKey);
  const entityKey = block.getEntityAt(selection.getAnchorOffset());
  return {
    contentState: contentState,
    selection: selection,
    blockKey: blockKey,
    block: block,
    entityKey: entityKey,
  };
}

/** Create a new removeable entity in the content. */
export function createRemoveableEntity(
  selection,
  editorState,
  entityType,
  entityRemover
) {
  const { contentState, entityKey: existingEntityKey } = getEditorMultiInfo(
    editorState,
    selection
  );
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
