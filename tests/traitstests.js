// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// See http://code.google.com/p/es-lab/wiki/Traits
// for background on traits and a description of this library

this.runTraitsTests = function() {
    
  // == ancillary functions to compare the structure of two traits ==
  
  function testEqv(trait1, trait2, id) {
    test(id, function() {
      var names1 = getOwnPropertyNames(trait1);
      var names2 = getOwnPropertyNames(trait2);
      var name;
      strictEqual(names1.length, names2.length,
                  id+': traits declare same amount of properties')
      if (names1.length === names2.length) {
         for (var i = 0; i < names1.length; i++) {
           name = names1[i];
           ok(trait2[name] !== undefined, "trait2 contains "+name);
           ok(isSameDesc(name, trait1[name], trait2[name], id),
             "same descriptions: "+trait1[name]+' versus: '+trait2[name]);
         }
      }
    });
  };
  
  function getOwnPropertyNames(obj) {
    var props = [];
    for (var p in obj) { if (Object.prototype.hasOwnProperty.call(obj,p)) { props.push(p); } }
    return props;
  };
  
  function isSameDesc(name, desc1, desc2, id) {
    // for conflicting properties, don't compare values because the conflicting props
    // are never equal
    if (desc1.conflict && desc2.conflict) {
      return true;
    } else {
      function cmp(v1, v2, id) {
        strictEqual(v1, v2, id);
        return v1 === v2;
      }
      return ( cmp(desc1.get, desc2.get, id+": "+name+".get")
            && cmp(desc1.set, desc2.set, id+": "+name+".set")
            && identical(name, desc1.value, desc2.value, id)
            && cmp(desc1.enumerable, desc2.enumerable, id+": "+name+".enumerable")
            && cmp(desc1.required, desc2.required, id+": "+name+".required")
            && cmp(desc1.conflict, desc2.conflict, id+": "+name+".conflict")); 
    }
  }
  
  function identical(name, x, y, id) {
    function check(b, id) {
      ok(b, id);
      return b;
    }
    if (x === y) {
      // 0 === -0, but they are not identical
      return check(x !== 0 || 1/x === 1/y, id+": "+name+".value "+x+" equals "+y);
    } else {
      // NaN !== NaN, but they are identical.
      // NaNs are the only non-reflexive value, i.e., if x !== x,
      // then x is a NaN.
      return check(x !== x && y !== y, id+": "+name+".value "+x+" equals "+y);
    }
  }
  
  function dataP(value) {
    return {
      value: value,
      enumerable: true
    };
  }
  
  function methodP(fun) {
    return {
      value: fun,
      method: true,
      enumerable: true
    };
  }
  
  function accessorP(get, set) {
    return {
      get: get,
      set: set,
      enumerable: true
    };
  }
  
  function requiredP() {
    return {
      value: undefined,
      required: true,
      enumerable: false    
    };
  }
  
  function conflictP(name) {
    var conflict = function(var_args) {
      throw new Error("Conflicting property: "+name);
    };
    if (Object.defineProperty) {
      return {
       get: conflict,
       set: conflict,
       enumerable: false,
       conflict: true
      }; 
    } else {
      return {
        value: conflict,
        enumerable: false,
        conflict: true
      };
    }
  }
  
  // == the unit tests ==
  
  function testMethod() {};
  
  // test eqv
  test('test eqv', function() {
    var T1 = Trait({a:0,  b:Trait.required, c:testMethod});
    var T2 = Trait({b: Trait.required, a:0, c:testMethod});
    var T3 = Trait({a: 0, b:Trait.required, c:testMethod, d:'foo'});
    var T4 = Trait({a: 0, b:Trait.required, d:'foo' });
    ok(Trait.eqv(T1,T1), "eqv is reflexive");
    ok(Trait.eqv(T1,T2) , "T1 eqv T2");
    ok(Trait.eqv(T1,T2) && Trait.eqv(T2,T1), "eqv is symmetric");
    ok(!Trait.eqv(T1,T3), "T1 ! eqv T3");
    ok(!Trait.eqv(T1,T4), "T1 ! eqv T4");
  });
  
  testEqv(Trait({}), {}, "empty trait");
  
  testEqv(Trait(
          { a: 0,
            b: testMethod }),
          { a: dataP(0),
            b: methodP(testMethod) },
          "simple trait");
  
  testEqv(Trait(
          { a: Trait.required,
            b: 1 }),
          { a: requiredP(),
            b: dataP(1) },
          "simple trait with required prop");
  
  testEqv(Trait({a: 0, b: 1, c: Trait.required}),
          Trait({b: 1, c: Trait.required, a: 0}),
          "ordering of trait properties is irrelevant");
  
  (function() {
    if (Object.getOwnPropertyDescriptor) {
      try {
        // syntax only parses on ES5 or ES3 implementations that support
        // accessors. We therefore eval it, and skip the test if eval fails
        var record = eval("({get a() {}, set a(v) {} })");
        var get = Object.getOwnPropertyDescriptor(record,'a').get;
        var set = Object.getOwnPropertyDescriptor(record,'a').set;
        testEqv(Trait(record),
                { a: accessorP(get,set) },
                "trait with accessor property");
      } catch (e) { /* browser does not support getter/setter syntax, ignore */ }
    }
  })();
  
  testEqv(Trait.compose(
            Trait({ a: 0,
                    b: 1 }),
            Trait({ c: 2,
                    d: testMethod })),
          { a: dataP(0),
            b: dataP(1),
            c: dataP(2),
            d: methodP(testMethod) },
          "simple composition");
  
  testEqv(Trait.compose(
            Trait({ a: 0,
                    b: 1 }),
            Trait({ a: 2,
                    c: testMethod })),
          { a: conflictP('a'),
            b: dataP(1),
            c: methodP(testMethod) },
          "composition with conflict");
  
  testEqv(Trait.compose(
            Trait({ a: 0,
                    b: 1 }),
            Trait({ a: 0,
                    c: testMethod })),
          { a: dataP(0),
            b: dataP(1),
            c: methodP(testMethod) },
          "composition of identical props does not cause conflict");
  
  testEqv(Trait.compose(
            Trait({ a: Trait.required,
                    b: 1 }),
            Trait({ a: Trait.required,
                    c: testMethod })),
          { a: requiredP(),
            b: dataP(1),
            c: methodP(testMethod) },
          "composition with identical required props");
  
  testEqv(Trait.compose(
            Trait({ a: Trait.required,
                    b: 1 }),
            Trait({ a: testMethod })),
          { a: methodP(testMethod),
            b: dataP(1) },
          "composition satisfying a required prop");
  
  testEqv(Trait.compose(
            Trait.compose(Trait({ a: 1 }), Trait({ a: 2 })),
            Trait({ b: 0 })),
          { a: conflictP('a'),
            b: dataP(0) },
          "compose is neutral wrt conflicts");

  testEqv(Trait.compose(
            Trait.compose(Trait({ a: 1 }), Trait({ a: 2 })),
            Trait({ a: Trait.required })),
          { a: conflictP('a') },
          "conflicting prop overrides required prop");

  testEqv(Trait.compose(
            Trait({ a: 0, b: 1 }),
            Trait({ c: 2, d: testMethod })),
          Trait.compose(
            Trait({ c: 2, d: testMethod}),
            Trait({ a: 0, b: 1 })),
          "compose is commutative");

  testEqv(Trait.compose(
            Trait({ a: 0, b: 1, c: 3, e: Trait.required }),
            Trait({ c: 2, d: testMethod })),
          Trait.compose(
            Trait({ c: 2, d: testMethod}),
            Trait({ a: 0, b: 1, c: 3, e: Trait.required })),
          "compose is commutative, also for required/conflicting props");
            
  testEqv(Trait.compose(
            Trait({ a: 0, b: 1, c: 3, d: Trait.required }),
            Trait.compose(
              Trait({ c: 3, d: Trait.required }),
              Trait({ c: 2, d: testMethod, e: 'foo' }))),
          Trait.compose(
            Trait.compose(
              Trait({ a: 0, b: 1, c: 3, d: Trait.required }),
              Trait({ c: 3, d: Trait.required })),
            Trait({ c: 2, d: testMethod, e: 'foo' })),
          "compose is associative");
  
  testEqv(Trait.compose(
            Trait.compose(Trait({ b: 2 }), Trait({ a: 1 })),
            Trait.compose(Trait({ c: 3 }), Trait({ a: 1 })),
            Trait({ d: 4 })),
          { a: dataP(1),
            b: dataP(2),
            c: dataP(3),
            d: dataP(4) },
          "diamond import of same prop does not generate conflict");
  
  testEqv(Trait.resolve({},
            Trait({ a: 1, b: Trait.required, c: testMethod })),
          { a: dataP(1),
            b: requiredP(),
            c: methodP(testMethod) },
          "resolve with empty resolutions has no effect");
  
  testEqv(Trait.resolve({ a: 'A', c: 'C' },
            Trait({ a: 1, b: Trait.required, c: testMethod })),
          { A: dataP(1),
            b: requiredP(),
            C: methodP(testMethod),
            a: requiredP(),
            c: requiredP() },
          "resolve: renaming");

  testEqv(Trait.resolve({ a: 'b' },
            Trait({ a: 1, b: 2 })),
          { b: conflictP('b'),
            a: requiredP() },
          "resolve: renaming to conflicting name causes conflict, ordering 1");
  
  testEqv(Trait.resolve({ a: 'b' },
            Trait({ b: 2, a: 1 })),
          { b: conflictP('b'),
            a: requiredP() },
          "resolve: renaming to conflicting name causes conflict, ordering 2");
  
  testEqv(Trait.resolve({ a: undefined },
            Trait({ a: 1, b: 2 })),
          { a: requiredP(),
            b: dataP(2) },
          "resolve: simple exclusion");
  
  testEqv(Trait.resolve({ a: undefined, b: undefined },
            Trait({ a: 1, b: 2 })),
          { a: requiredP(),
            b: requiredP() },
          "resolve: exclusion to 'empty' trait");

  testEqv(Trait.resolve({ a: undefined, b: 'c' },
            Trait({ a: 1, b: 2 })),
          { a: requiredP(),
            c: dataP(2),
            b: requiredP() },
          "resolve: exclusion and renaming of disjoint props");

  testEqv(Trait.resolve({ a: undefined, b: 'a' },
            Trait({ a: 1, b: 2 })),
          { a: dataP(2),
            b: requiredP() },
          "resolve: exclusion and renaming of overlapping props");

  testEqv(Trait.resolve({ a: 'c', b: 'c' },
            Trait({ a: 1, b: 2 })),
          { c: conflictP('c'),
            a: requiredP(),
            b: requiredP() },
          "resolve: renaming to a common alias causes conflict");

  testEqv(Trait.resolve({ b: 'a' },
            Trait({ a: Trait.required, b: 2 })),
          { a: dataP(2),
            b: requiredP() },
          "resolve: renaming overrides required target");

  testEqv(Trait.resolve({ b: 'a' },
            Trait({ a: 2, b: Trait.required })),
          { a: dataP(2),
            b: requiredP() },
          "resolve: renaming required properties has no effect");

  testEqv(Trait.resolve({ a: 'c', d: 'c' },
            Trait({ a: 1, b: 2 })),
          { c: dataP(1),
            b: dataP(2),
            a: requiredP() },
          "resolve: renaming of non-existent props has no effect");

  testEqv(Trait.resolve({ b: undefined },
            Trait({ a: 1 })),
          { a: dataP(1) },
          "resolve: exclusion of non-existent props has no effect");
            
  testEqv(Trait.resolve({ a: 'c', b: undefined },
            Trait({ a: Trait.required, b: Trait.required, c:'foo', d:1 })),
          { a: requiredP(),
            b: requiredP(),
            c: dataP('foo'),
            d: dataP(1) },
          "resolve is neutral w.r.t. required properties");
  
  testEqv(Trait.resolve({a: 'b', b: 'a'},
            Trait({ a: 1, b: 2 })),
          { a: dataP(2),
            b: dataP(1) },
          "resolve supports swapping of property names, ordering 1");
  
  testEqv(Trait.resolve({b: 'a', a: 'b'},
            Trait({ a: 1, b: 2 })),
          { a: dataP(2),
            b: dataP(1) },
          "resolve supports swapping of property names, ordering 2");
  
  testEqv(Trait.resolve({b: 'a', a: 'b'},
            Trait({ b: 2, a: 1 })),
          { a: dataP(2),
            b: dataP(1) },
          "resolve supports swapping of property names, ordering 3");

  testEqv(Trait.resolve({a: 'b', b: 'a'},
            Trait({ b: 2, a: 1 })),
          { a: dataP(2),
            b: dataP(1) },
          "resolve supports swapping of property names, ordering 4");
  
  testEqv(Trait.override(
            Trait({a: 1, b: 2 }),
            Trait({c: 3, d: testMethod })),
          { a: dataP(1),
            b: dataP(2),
            c: dataP(3),
            d: methodP(testMethod) },
          "override of mutually exclusive traits");

  testEqv(Trait.override(
            Trait({a: 1, b: 2 }),
            Trait({c: 3, d: testMethod })),
          Trait.compose(
            Trait({d: testMethod, c: 3 }),
            Trait({b: 2, a: 1 })),
          "override of mutually exclusive traits is compose");
            
  testEqv(Trait.override(
            Trait({a: 1, b: 2 }),
            Trait({a: 3, c: testMethod })),
          { a: dataP(1),
            b: dataP(2),
            c: methodP(testMethod) },
          "override of overlapping traits");
          
  testEqv(Trait.override(
            Trait({a: 1, b: 2 }),
            Trait({b: 4, c: 3 }),
            Trait({a: 3, c: testMethod, d: 5 })),
          { a: dataP(1),
            b: dataP(2),
            c: dataP(3),
            d: dataP(5) },
          "three-way override of overlapping traits");

  testEqv(Trait.override(
            Trait({a: Trait.required, b: 2 }),
            Trait({a: 1, c: testMethod })),
          { a: dataP(1),
            b: dataP(2),
            c: methodP(testMethod) },
          "override replaces required properties");
  
  test("override is not commutative",
    function() {
      ok(!Trait.eqv(
           Trait.override(
             Trait({a: 1, b: 2}),
             Trait({a: 3, c: 4})),
           Trait.override(
             Trait({a: 3, c: 4}),
             Trait({a: 1, b: 2}))),
        "override is not commutative");
    });
  
  testEqv(Trait.override(
            Trait.override(
              Trait({a: 1, b: 2}),
              Trait({a: 3, c: 4, d: 5})),
            Trait({a: 6, c: 7, e: 8})),
          Trait.override(
            Trait({a: 1, b: 2}),
            Trait.override(
              Trait({a: 3, c: 4, d: 5}),
              Trait({a: 6, c: 7, e: 8}))),
          "override is associative");
  
  test('create', function(){
    var o1 = Trait.create(Object.prototype,
                          Trait({a:1, b:function() {return this.a; }}));
    if (Object.getPrototypeOf) {
      strictEqual(Object.prototype, Object.getPrototypeOf(o1), "o1 prototype");
    }
    strictEqual(1, o1.a, 'o1.a');
    strictEqual(1, o1.b(), 'o1.b()');
    strictEqual(2, getOwnPropertyNames(o1).length, 'Object.keys(o1).length === 2');
  });
  
  test('create with prototype', function(){
    var o2 = Trait.create(Array.prototype, Trait({}));
    if (Object.getPrototypeOf) {
      strictEqual(Array.prototype, Object.getPrototypeOf(o2), "o2 prototype");
    }
  });
  
  // - Trait.create -
  
  test('exception for incomplete required properties', function() {
    try {
      Trait.create(Object.prototype,
                   Trait({ foo: Trait.required }));
      ok(false, 'expected create to complain about missing required props');
    } catch(e) {
      strictEqual('Error: Missing required property: foo', e.toString(), 'required prop error');
    }
  });
  
  test('exception for unresolved conflicts', function() {
    try {
      Trait.create(Object.prototype,
                   Trait.compose(Trait({ a: 0 }), Trait({ a: 1 })));
      ok(false, 'expected create to complain about unresolved conflicts');
    } catch(e) {
      strictEqual('Error: Remaining conflicting property: a', e.toString(), 'conflicting prop error');
    }
  });
  
  test('Trait.create creates frozen objects', function(){
    var o3 = Trait.create(Object.prototype, Trait({ m: function() { return this; } }));
    // verify object and methods frozen in ES5
    if (Object.freeze) {
      ok(Object.isFrozen(o3), 'closed create freezes object');
      // TODO: Object.isFrozen is broken on Rhino, reports 'false' on frozen function objects,
      // even though the function is effectively frozen (can't add new properties)
      // ok(Object.isFrozen(o3.m), 'closed create freezes methods');
    }
    strictEqual(o3, o3.m(), 'this refers to composite object');
    // verify 'this' bound in ES5
    if (Function.prototype.bind) {
      strictEqual(o3, o3.m.call({}), 'this bound to composite object');
    }
  });
  
  // - Object.create -
  
  // verify that required properties are present but undefined
  test('required props are present but undefined', function(){
    try {
      var o4 = Object.create(Object.prototype,
                   Trait({ foo: Trait.required }));
      ok(('foo' in o4), 'required property present');
      ok(!(o4.foo), 'required property undefined');
    } catch(e) {
      ok(false, 'did not expect create to complain about required props');
    }
  });
  
  // verify that conflicting properties are present
  test('conflicting props are present', function(){
    try {
      var o5 = Object.create(Object.prototype,
                   Trait.compose(Trait({ a: 0 }), Trait({ a: 1 })));
      ok('a' in o5, 'conflicting property present');
      try {
        (o5.a, o5.a()); // accessor or data prop
        ok(false, 'expected conflicting prop to cause exception');
      } catch (e) {
        strictEqual('Error: Conflicting property: a', e.toString(), 'conflicting prop access error');
      }
    } catch(e) {
      ok(false, 'did not expect create to complain about conflicting props');
    }
  });
  
  test('Object.create creates unfrozen objects', function(){
    var o6 = Object.create(Object.prototype, Trait({ m: function() { return this; } }));
    // verify that object and methods are not frozen in ES5
    if (Object.freeze) {
      ok(!(Object.isFrozen(o6)), 'open create does not freeze object');
      ok(!(Object.isFrozen(o6.m)), 'open create does not freeze methods');
    }
    strictEqual(o6, o6.m(), 'this refers to composite object');
    // verify 'this' unbound in ES5
    if (Function.prototype.bind) {
      var fakethis = {};
      strictEqual(fakethis, o6.m.call(fakethis), 'this not bound to composite object');
    }
  });
    
  test('diamond with conflicts', function() {
    function makeT1(x) {
      return Trait({ m: function() { return x; } });
    }
    function makeT2(x) { return Trait.compose(Trait({t2:'foo'}), makeT1(x)); }
    function makeT3(x) { return Trait.compose(Trait({t3:'bar'}), makeT1(x)); }
    var T4 = Trait.compose(makeT2(5), makeT3(5));
    try {
      var o = Trait.create(Object.prototype, T4);
      ok(false, 'expected diamond prop to cause exception');
    } catch(e) {
      strictEqual('Error: Remaining conflicting property: m', e.toString(), 'diamond prop conflict');
    }
  });
    
  // return unit.testDone();
  
};