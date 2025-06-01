// .prettierrc.js
module.exports = {
  semi: true,           // Add semicolons at the end of statements
  trailingComma: 'es5', // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  singleQuote: true,    // Use single quotes instead of double quotes
  printWidth: 100,      // Try to wrap lines at 100 characters (adjust to your preference)
  tabWidth: 2,          // Number of spaces per indentation-level
  useTabs: false,       // Indent lines with spaces, not tabs
  bracketSpacing: true, // Print spaces between brackets in object literals: { foo: bar }
  arrowParens: 'always',// Always include parens around a sole arrow function parameter: (x) => x
  endOfLine: 'auto',    // Handles mixed line endings (lf, crlf) automatically based on the first line ending it encounters in a file or your OS default. 'lf' is also a common choice for consistency.
};
