# Demo editor

## General commands

Mostly for my own benefit. To run in a development environment:

```bash
npm install
npm start
```

To run in a production environment:

```bash
npm install serve -g
npm run build
serve -s build -l 80
```

To format:

```bash
npx prettier --write src/
```

To lint:

```bash
npx eslint src/
```

## Decisions

I wanted to demonstrate my ability to deliver a finished product from beginning to end with minimal input, so I went ahead and made a bunch of design decisions on my own. I can certainly communicate more about the decisions I'm making if so desired. In any case, these designs are highly reversible:

- How do we handle intersections (including subsets and supersets) of entities (aka parameters and highlighted sections)? I've decided to not allow intersections, except for superset selections -- which will consume all subset entities.
  - In the future, it probably makes sense to mark some entity types as mergeable (e.g. two highlighted sections should perhaps blob into one) and others as non-mergeable (e.g. two adjacent parameters should stay separate).
- How do we want to handle keyboard selections (e.g. shift + arrow keys)? I decided to treat this the same way as mouse highlights. If we wish to distinguish the two, we could try to flag either keyboard inputs or mouse presses, and handle state updates accordingly.
- Do we want to allow for editing entities after they're created? In retrospect, it would've been simpler to mark them as immutable after they're finalized, and only allow the user to delete them as an entire unit. Instead, I chose to allow further arbitrary edits to entities after creation, which has resulted in some usability nits that I describe further below.
- Do we want to allow for an entity to span multiple lines? I decided against this. If a selection is made over multiple lines, multiple independent highlighted sections will be created, one for each separate line.

Some of the more interesting code design decisions I had to make are documented in the "ENTITY MAGIC" and "AUTOCOMPLETE POSITIONING" sections of [TemplateEditor.js](src/components/editor/TemplateEditor.js).

## TODOs

I have tested this on the following browsers:

- Chrome on Ubuntu/Mac OS/Windows
- Firefox on Ubuntu/Windows
- Edge on Windows
- Safari on Mac OS/iOS

I believe major functionality should work all right on the desktop browsers. The mobile experience is unfortunately rather buggy, since [Draft.js does not support mobile](https://draftjs.org/docs/advanced-topics-issues-and-pitfalls/). This is admittedly something I should have researched in advance, but at this point it requires too much effort to change for a weekend project.

There are unfortunately a bunch of remaining concerns/features that I did not have time to tackle:

- The mobile experience, as already mentioned
- On Firefox, placing the caret inside an entity by clicking. This seems to work on other browsers, and other features seem to work in Firefox. You can still put the caret inside the entity on Firefox by using backspace.
- A piece of unintuitive behavior where if your text is in the state `abc[$def]|xyz` (where the `[]` represents the entity and the `|` represents the caret), and you press left arrow 1x + delete, the result is `ab|[$def]xyz`. However, if instead you press left arrow 3x + delete, or press delete 2x, the result is `abc[$de|]xyz`.
- A piece of unintuitive behavior where pressing shift + left on a single character that is sandwiched in between two entities will not do anything, but pressing shift + right on that same character will cause it to become a highlight in its own right.
- A piece of unintuitive behavior where hitting enter while in the middle of a parameter will cause the rest of the parameter to be truncated. Perhaps a better choice would be to turn the rest of the parameter into plaintext on a new line.
- Adding a magic space to allow prepending to highlights. Currently this is only possible for parameters due to the presence of the dollar sign as an enclosing character.
- Allowing the user to actually enter in a dollar sign without resorting to copy-pasting (e.g. if the user wishes to do something like "$`$PRICE`")
- Proper undo and redo functionality (currently quite limited and unpredictable)
- Restrictions on what can go inside a parameter
- Multiple editors on the same page, drawing from the same variables list for autocompletion.
- Supporting wrapping of long entities
- Hiding the autocompletion instead of destroying/recreating it every time could be more efficient

There are of course a bunch of other concerns that I did tackle. I would normally write tests against these cases (and other more basic ones) to prevent regressions, but I skipped that this time around in the interest of time because I estimate it would take a few more hours for me to learn how to write proper React tests. Nonetheless, here they are:

- Caret placement after block creation
- Caret placement after selecting an autocomplete option
- Deletion of entire parameter block when the dollar sign is deleted. (We could alternatively pretend like the dollar sign does not exist, and delete the character before it, but I opted against this.)
- Entity color changes after a separate entity gets removed, due to how React reconciles diffs in children
- Autocomplete dropdown should always be aligned with the parameter text, no matter what other changes happen in the editor (e.g. plaintext being added, other entities getting removed/added)
- Selecting a single space shouldn't result in the deletion of said space. (This was due to handling the aforementioned "entity magic.")
- Autocomplete should appear once the parameter is created, no matter if it was invoked by typing a $ or pressing the $ button.
- Double-clicking a piece of text that was sandwiched in between two entities should result in the creation of a new entity. (This was due to weirdness in text selection that came from the delete button.)
- Double-clicking text inside of entities should be allowed (e.g. if the user decides to select the entire parameter and replace it with something else)

Otherwise, apart from the lack of testing, I believe the code quality is similar to how I usually write code.
