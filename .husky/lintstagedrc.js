module.exports = {
  '*.ts': ['tsc --noEmit --skipLibCheck'],
  '*.{js,ts,wxs,wxml,wxss,json,md}': ['prettier --write'],
  '{!(package)*.json,*.code-snippets,.!(browserslist)*rc}': ['prettier --write--parser json'],
}
