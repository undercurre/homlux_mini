/* eslint-disable @typescript-eslint/no-var-requires */
var stringify = require('./stringify')
var parse = require('./parse')
var formats = require('./formats')

module.exports = {
  formats: formats,
  parse: parse,
  stringify: stringify,
}
