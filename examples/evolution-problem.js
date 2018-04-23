// Copyright (C) 2010, Vrije Universiteit Brussel
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

// This example demonstrates how traits deal with the "evolution problem"
// where previously composed traits are modified later, such that a
// previously successful composition could become broken in a later
// version of the code
//
// @author Tom Van Cutsem

load('traits.js'); // provides Trait

// original code:
(function() {
  var T1 = Trait({
    x: 1,
    y: 2
  });

  var T2 = Trait({
    z: 3
  });

  var obj = Trait.create(Object.prototype,
                         Trait.compose(T1,T2));

  print([obj.x, obj.y, obj.z].join(' ')); // prints 1 2 3
})();

// now someone comes along and adds an x property to T2, what happens?
(function() {
  var T1 = Trait({
    x: 1,
    y: 2
  });

  var T2 = Trait({
    z: 3,
    x: 4
  });

  var obj = Trait.create(Object.prototype,
                         Trait.compose(T1,T2));
  // Error: remaining conflicting property: x
  
  print([obj.x, obj.y, obj.z].join(' '));
})();