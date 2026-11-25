# Every state exists

**When:** an interactive element or a data view is built or changed.

Ship default, hover, focus-visible, active, disabled, loading, empty, error, partial, long content, light and dark in the same change.

Rules:
- Loading is a skeleton in place. Empty says what this is and the next action. Error says what failed and what to do.
- A state not drawn is a bug, not polish for later.
- Render each state and look at it before you call it done.
