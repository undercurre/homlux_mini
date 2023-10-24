module.exports = {
  '*.{js,ts,wxs,wxml,wxss}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  '{!(package)*.json,*.code-snippets,.!(browserslist)*rc}': ['prettier --write--parser json'],
}
