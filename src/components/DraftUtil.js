/** This file is for convenience functions with Draft.js */

import { SelectionState } from "draft-js";

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
