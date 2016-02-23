var u = require('./util')
var isExact = u.isExact
var isRange = u.isRange
var isString = u.isString
var isLtgt = u.isLtgt
var isObject = u.isObject
var has = u.has
var map = u.map

function exact(q) {
  return function (v) {
    return q === v
  }
}
function prefix(p) {
  return function (v) {
    return isString(v) && v.substring(0, p.length) === p
  }
}

function lt (q) {
  return function (v) { return v < q }
}
function gt (q) {
  return function (v) { return v > q }
}
function lte (q) {
  return function (v) { return v <= q }
}
function gte (q) {
  return function (v) { return v >= q }
}

function combine(f, g) {
  if(!g) return f
  return function (v) {
    return f(v) && g(v)
  }
}

function ltgt (q) {
  var filter = null
  if(has(q, '$lt'))  filter = lt(q.$lt)
  if(has(q, '$lte')) filter = combine(lte(q.$lte), filter)
  if(has(q, '$gt'))  filter = combine(gt(q.$gt), filter)
  if(has(q, '$gte')) filter = combine(gte(q.$gte), filter)
  return filter
}

function all (q) {
  return function (v) {
    if(v == null) return false
    for(var k in q) if(!q[k](v[k])) return false
    return true
  }
}

function make (q) {
  if(isExact(q))       return exact(q)
  if(has(q, '$prefix')) return prefix(q.$prefix)
  if(isLtgt(q))        return ltgt(q)
  if(u.isArray(q) || u.isObject(q))
                       return all(map(q, make))
}

exports = module.exports = make








