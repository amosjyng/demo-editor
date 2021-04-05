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
 * Return the block and the associated entity key, if any, at the given
 * offset.
 */
function getBlockAndEntityAt(contentState, blockKey, offset) {
  const block = contentState.getBlockForKey(blockKey);
  const entityKey = block.getEntityAt(offset);
  return { block, entityKey };
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
  const { block, entityKey } = getBlockAndEntityAt(
    contentState,
    selection.getAnchorKey(),
    selection.getAnchorOffset()
  );
  return {
    contentState,
    selection,
    blockKey,
    block,
    entityKey,
  };
}

/**
 * Create a new removeable entity in the content. Returns null if entity
 * already exists, otherwise returns the new editor state.
 */
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
  if (existingEntityKey !== null) {
    return null;
  }
  const { entityKey: endingEntityKey } = getBlockAndEntityAt(
    contentState,
    selection.getFocusKey(),
    selection.getFocusOffset() - 1
  );
  if (endingEntityKey !== null) {
    return null;
  }
  // we pass the entityRemover in a roundabout way here because there
  // doesn't appear to be a straightforward way to get it directly to
  // HighlightEntity via props
  const withEntity = contentState.createEntity(entityType, "MUTABLE", {
    entityRemover: entityRemover,
  });
  const entityKey = withEntity.getLastCreatedEntityKey();
  const withHighlight = Modifier.applyEntity(withEntity, selection, entityKey);
  const newEditorState = EditorState.set(editorState, {
    currentContent: withHighlight,
  });
  return newEditorState;
}

/**
 * Given a block and an entity key, returns a selection spanning that entity
 * within the block. Assumes that the block will only have one instance of the
 * entity. Returns null if no such entity found.
 */
export function getEntitySelection(block, entityKey) {
  let entitySelection = null;
  // need to do things in this roundabout way because Draft.js doesn't appear
  // to offer any direct way of grabbing entity span from a block
  block.findEntityRanges(
    (charMetadata) => {
      return charMetadata.getEntity() === entityKey;
    },
    (start, end) => {
      entitySelection = constructSelection(block.getKey(), start, end);
    }
  );
  return entitySelection;
}

/**
 * Return the text associated with the selection inside the given block.
 * Assumes that the selection only spans a single block.
 */
export function getBlockText(block, selection) {
  return block
    .getText()
    .substring(selection.getAnchorOffset(), selection.getFocusOffset());
}

/**
 * Return the text associated with the selection. Assumes that the selection
 * only spans a single block.
 */
export function getText(editorState, selection) {
  const { block } = getEditorMultiInfo(editorState, selection);
  return getBlockText(block, selection);
}
