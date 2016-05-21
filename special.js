var u = require('./util')
var compare = require('typewiselite')
var search = require('binary-search')


function is$ (obj) {
  for(var k in obj)
    if(k[0] === '$') return true
  return false
}

module.exports = function (make) {

  return {
    filter: function makeFilter (rule) {
      if(u.isObject(rule) && !is$(rule)) {
        rule = u.map(rule, makeFilter)
        return function (value) {
          for(var k in rule)
            if(!rule[k](value[k])) return false
          return true
        }
      }
      return make(rule)
    },

    map: function makeMap (rule) {
      if(u.isObject(rule) && !is$(rule) && !u.isArray(rule)) {
        var rules = u.map(rule, makeMap)
        return function (value) {
          return u.map(rules, function (fn) { return fn(value) })
        }
      }
      return make(rule)
    },

    reduce: function (rule) {
      function makeReduce (rule) {
        if(u.isObject(rule) && !is$(rule) && !u.isArray(rule))
          return u.map(rule, makeReduce)
        return make(rule)
      }

      //rawpaths, reducedpaths, reduce
      function arrayGroup (set, get, reduce) {

        //we can use a different lookup path on the right hand object
        //is always the "needle"
        //compare(haystay[j], needle)
        function _compare (hay, needle) {
          for(var i in set) {
            var x = u.get(hay, set[i]), y = needle[i]
            console.log('Cmp', x, y)
            if(x !== y) return compare(x, y) // < y ? -1 : 1
          }
          return 0
        }

        return function (a, b) {
          if(a && !Array.isArray(a)) a = reduce([], a)
          var A = a = a || []
          var i = search(A, get.map(function (fn) { return fn(b) }), _compare)

          console.log('ary', A)
          console.log('INDEX', i, A[i], b)
          if(i >= 0) A[i] = reduce(A[i], b)
          else       {
            A.splice(~i, 0, reduce(undefined, b))
          }
          return a
        }
      }

      if(u.isObject(rule) && !is$(rule) && !u.isArray(rule)) {
        var rules =  u.map(rule, makeReduce)
        console.log('reduce rule', rules)

        var getPaths = []
        var setPaths = u.paths(rules, function (maybeMap) {
          if(u.isFunction(maybeMap) && maybeMap.length === 1) {
            return getPaths.push(maybeMap), true
          }
        })

        console.log('paths', getPaths, setPaths)

        function reduce (a, b) {
          return u.map(rules, function (reduce, key) {
            //handle maps as reduces (skip aggregator arg)
            return reduce.length === 1 ? reduce(b) : reduce(a && a[key], b)
          })
        }

        if(getPaths.length) return arrayGroup(setPaths, getPaths, reduce)

        return reduce
      }
      else
        return make(rule)
    }
  }
}








