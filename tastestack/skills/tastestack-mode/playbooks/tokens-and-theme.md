### Tokens and theme

**Create or change design tokens and themes safely.**

1. Find the project's token file and who owns it. Global tokens belong to the owner: stop and ask before changing them.
2. Read `tastemaker-tokens`.
3. Write the change as a diff to the token source. Every semantic colour has light and dark values.
4. Build the tokens. Fix every unresolved reference and contrast failure.
5. Search the project for raw values that the new token should replace. List them; fix only those in scope.
6. Render light, dark and high-contrast and view them.
7. Run the `tastestack` gate.

**Reply:** tokens added or changed, contrast ratios for each new text pair, files that still use raw values, what was not viewed.
