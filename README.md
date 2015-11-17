# Introduction #

[traits.js](http://code.google.com/p/es-lab/source/browse/trunk/src/traits/traits.js) is a Javascript library for Trait composition, as originally proposed in [[1](#References.md)] but closer to the object-based, lexically nestable traits defined in [[2](#References.md)]. The library has been designed for [Ecmascript 5](http://www.ecma-international.org/publications/standards/Ecma-262.htm), but should be backwards-compatible with existing Ecmascript 3 implementations.

See also: **[API](http://www.traitsjs.org/api.html)** | **[Tutorial](http://www.traitsjs.org/tutorial.html)** | **[howtonode article](http://howtonode.org/traitsjs)** | **[Paper](http://es-lab.googlecode.com/files/traitsJS_PLASTIC2011_final.pdf)**

# Background: Traits #

Traits were originally defined as 'composable units of behavior' [[1](#References.md)]: reusable groups of methods that can be composed together to form a class. Their purpose is to enable _reuse_ of methods across class hierarchies. Single-inheritance class hierarchies often suffer from methods being duplicated across the hierarchy, because a class cannot inherit methods from two separate sources.

Traits may _provide_ and _require_ a number of methods. Required methods are like abstract methods in OO class hierarchies: their implementation should be provided by another trait or class. For example, "enumerability" of a collection object can be encoded as a trait providing all kinds of higher-order methods on collections based on a single method `each` that returns successive elements of the collection (cf. Ruby's [Enumerable module](http://ruby-doc.org/core/classes/Enumerable.html)) (in pseudo-code for clarity):

```
trait Enumerable {
  provide {
    map: function(fun) { var r = []; this.each(function (e) { r.push(fun(e)); }); return r; },
    inject: function(init, accum) { var r = init; this.each(function (e) { r = accum(r,e); }); return r; },
    ...
  }
  require {
    each: function(fun);
  }
}

class Range(from, to) extends Object uses Enumerable {
  function each(fun) { for (var i = from; i < to; i++) { fun(i); } }
}

var r = new Range(0,5);
r.inject(0,function(a,b){return a+b;}); // 10
```

In a language with both traits and classes, traits cannot be instantiated directly into objects. Rather, they are used to factor out and compose reusable sets of methods into a class. Traits can be recursively composed into larger, but possibly still incomplete, traits. Classes can be composed from zero or more traits. Classes, unlike traits, must be complete (or remain abstract). Traits cannot be composed by means of inheritance, but a class composed of one or more traits can take part in single inheritance. Methods provided by traits then override methods inherited from its superclass.

The main difference between traits and alternative composition techniques such as multiple inheritance and mixins is that upon trait composition, name conflicts (a.k.a. name clashes) should be explicitly resolved by the composer. This is in contrast to mixins and multiple inheritance, which define various kinds of linearization schemes that impose an implicit precedence on the composed entities, with one entity overriding all of the methods of another entity. While such systems often work well in small reuse scenarios, they are not robust: small changes in the ordering of mixins/classes somewhere high up in the inheritance/mixin chain may impact the way name clashes are resolved further down the inheritance/mixin chain. In addition, the linearization imposed by mixins/multiple inheritance precludes a composer to give precedence to both a method m1 from one mixin/class A and a method m2 from another mixin/class B: either all of A's methods take precedence over B, or all of B's methods take precedence over A.

Traits allow a composing entity to resolve name clashes in the individual components by either **excluding** a method from one of the components or by having one trait explicitly **override** the methods of another one. In addition, the composer may define an **alias** for a method, allowing the composer to refer to the original method even if its original name was excluded or overridden.

Name clashes that are never explicitly resolved will eventually lead to a composition error when traits are composed with a class. Depending on the language, this composition error may be a compile-time error, a runtime error when the class is composed, or a runtime error when a conflicting name is invoked on a class instance.

Trait composition is declarative in the sense that the ordering of composed traits does not matter. In other words, unlike mixins/multiple inheritance, trait composition is commutative and associative. This tremendously reduces the cognitive burden of reasoning about deeply nested levels of trait composition. In languages that support traits as a compile-time entity (similar to classes), trait composition can be entirely performed at compile-time, effectively "flattening" the composition and eliminating any composition overhead at runtime.

Since their publication in 2003, traits have received widespread adoption in the PL community, although the details of the many traits implementations differ significantly from the original implementation defined for Smalltalk. Traits have been adopted in Perl (see e.g. the [Class::Trait module](http://search.cpan.org/~ovid/Class-Trait-0.31/lib/Class/Trait.pm)), Fortress, PLT Scheme [[4](#References.md)], Slate, ... Scala supports ["traits"](http://www.scala-lang.org/node/126), although these should have been called [mixins](http://www.scala-lang.org/node/117) (there is no explicit conflict resolution). Traits are also considered for inclusion in [PHP](http://wiki.php.net/rfc/horizontalreuse).
# Traits for Javascript #

The above `Enumerable` example can be encoded using `traits.js` as follows:

```
var EnumerableTrait = Trait({
  each: Trait.required, // should be provided by the composite
  map: function(fun) { var r = []; this.each(function (e) { r.push(fun(e)); }); return r; },
  inject: function(init, accum) { var r = init; this.each(function (e) { r = accum(r,e); }); return r; },
  ...
});

function Range(from, to) {
  return Trait.create(
    Object.prototype,
    Trait.compose(
      EnumerableTrait,
      Trait({
        each: function(fun) { for (var i = from; i < to; i++) { fun(i); } }
      })));
}

var r = Range(0,5);
r.inject(0,function(a,b){return a+b;}); // 10
```

### Traits as Property Maps ###

`traits.js` represents traits as "property descriptor maps": objects whose keys represent property names and whose values are Ecmascript 5 "property descriptors" (this is the same data format as the one accepted by the standard ES5 functions `Object.create` and `Object.defineProperties`). Like classes, traits _describe_ object structure and can be _instantiated_ into runtime objects.

Basic traits can be created from simple object descriptions (usually Javascript object literals) and further composed into 'composite' traits using a small set of composition functions (explained below). In order to use a (composite) trait, it must be "instantiated" into an object. When a trait is instantiated into an object `o`, the binding of the `this` pseudovariable within the trait's methods will refer to `o`. If a trait `T` defines a method `m` that requires (depends on) the method `r`, `m` should call this method using `this.r(...)`, and if that method was provided by some other trait, it will be found in the composite object `o`. The lexical scope of composed trait methods remains unaffected by trait composition.

As mentioned in the background, trait composition is orthogonal to inheritance. `traits.js` does not expect traits to take part in object-inheritance (i.e. prototype delegation) and should only be composed via trait composition. Traits do not have a "prototype", but the objects they instantiate do, and these objects may take part in object-inheritance.

### API ###

`traits.js` exports a single variable, named `Trait`, bound to a function object. Calling `Trait({...})` creates and returns a new trait. Furthermore, `Trait` defines the following properties:
  * `required`
  * `compose(trait1, trait2, ..., traitN) -> trait`
  * `resolve({ oldName: 'newName', nameToExclude: undefined, ... }, trait) -> trait`
  * `override(trait1, trait2, ... , traitN) -> trait`
  * `eqv(trait1, trait2) -> boolean`
  * `create(proto, trait) -> object`
  * `object(record) -> object`

`Trait.required` is a special singleton value that is used to denote missing required properties (see later). All of the methods defined on `Trait` are pure: they never modify their argument values and they do not depend on mutable state across invocations.

The function `Trait.eqv(t1,t2)` returns `true` if and only if t1 and t2 are equivalent. Two traits are equivalent if they describe the same set of property names, and the property descriptors bound to these names have identical attributes.

The following figure depicts the operations exported by the library:
<p><img src='http://es-lab.googlecode.com/svn/trunk/src/traits/Traits.png' alt='Traits' align='center' width='80%'>
<p>Both the circles and the rounded squares are Javascript objects, but they are intended to be used in very different ways.<br>
<br>
<h4>Simple (non-composite) Traits</h4>

The <code>Trait</code> function acts as a constructor for simple (non-composite) traits. It essentially turns an object describing a record of properties into a trait. For example:<br>
<br>
<pre><code>var T = Trait({<br>
    a: Trait.required,<br>
    b: function() { ... this.a() ... },<br>
    c: function() { ... }<br>
});<br>
</code></pre>

In <code>traits.js</code>, required properties are defined as data properties bound to a distinguished singleton <code>Trait.required</code> object. <code>traits.js</code> recognizes such data properties as required properties and they are treated specially by <code>Trait.create</code> and by <code>Trait.compose</code> (see later). Traits are not required to state their required properties explicitly.<br>
<br>
The trait <code>T</code> <i>provides</i> the properties <code>b</code> and <code>c</code> and <i>requires</i> the property <code>a</code>. The <code>Trait</code> constructor converts the object literal into the following property descriptor map representing the trait:<br>
<br>
<pre><code>{ 'a' : {<br>
    value: undefined,<br>
    required: true,<br>
    enumerable: false<br>
  },<br>
  'b' : {<br>
    value: function() { ... }, // note: value.prototype is frozen<br>
    method: true,<br>
    enumerable: true<br>
  },<br>
  'c' : {<br>
    value: function() { ... }, // note: value.prototype is frozen<br>
    method: true,<br>
    enumerable: true<br>
  }<br>
}<br>
</code></pre>

The attributes <code>required</code> and <code>method</code> are not standard ES5 attributes, but are interpreted by the <code>traits.js</code> library.<br>
<br>
The objects passed to <code>Trait</code> should normally only serve as plain records that describe a simple trait's properties. We expect them to be used mostly in conjunction with Javascript's excellent object literal syntax. The <code>Trait</code> function turns an object into a property descriptor map with the following constraints:<br>
<ul><li>Only the object's own properties are turned into trait properties (its prototype is not significant).<br>
</li><li>Data properties in the object record bound to the special <code>Trait.required</code> singleton are bound to a distinct "required" property descriptor (as shown above).<br>
</li><li>Data properties in the object record bound to functions are interpreted as "methods". In order to ensure integrity, methods are distinguished from plain Javascript functions by <code>traits.js</code> in the following ways:<br>
<ul><li>The methods and the value of their <code>.prototype</code> property are frozen.<br>
</li><li>Methods are 'bound' to an object at instantiation time (see later). The binding of <code>this</code> in the method's body is bound to the instantiated object.<br>
</li></ul></li><li><code>Trait</code> is a pure function if no other code has a reference to any of the object record's methods. If <code>Trait</code> is applied to an object literal whose methods are represented as anonymous in-place functions as recommended, this should be the case.</li></ul>

<h4>Composing Traits</h4>

The function <code>Trait.compose</code> is the workhorse of <code>traits.js</code>. It composes zero or more traits into a single composite trait. For example:<br>
<br>
<pre><code>var T1 = Trait({ a: 0, b: 1});<br>
var T2 = Trait({ a: 1, c: 2});<br>
var Tc = Trait.compose(T1,T2);<br>
</code></pre>

The composite trait contains all of the own properties of all of the argument traits (including non-enumerable properties). For properties that appear in multiple argument traits, a distinct "conflicting" property is defined in the composite trait. <code>Tc</code> will have the following structure:<br>
<br>
<pre><code>{ 'a' : {<br>
    get: &lt;conflict&gt;,<br>
    set: &lt;conflict&gt;,<br>
    conflict: true<br>
  },<br>
  'b' : { value: 1 },<br>
  'c' : { value: 2 } }<br>
</code></pre>

When <code>compose</code> encounters a property name that is defined by two or more argument traits, it marks the resulting property in the composite trait as a "conflicting property" by means of the <code>conflict: true</code> atrribute (again, this is not a standard ES5 attribute). Conflicting properties are accessor properties whose <code>get</code> and <code>set</code> methods (denoted using <code>&lt;conflict&gt;</code> above) raise an appropriate runtime exception when invoked.<br>
<br>
Two properties <code>p1</code> and <code>p2</code> with the same name are <b>not</b> in conflict if:<br>
<ul><li><code>p1</code> or <code>p2</code> is a <code>required</code> property. If either <code>p1</code> or <code>p2</code> is a non-required property, the <code>required</code> property is overridden by the non-required property.<br>
</li><li><code>p1</code> and <code>p2</code> denote the "same" property. Two properties are considered to be the same if they refer to the same values and have the same attributes. This implies that it is OK for properties to be "inherited" via multiple composition paths from the same trait (cf. diamond inheritance: <code>T1 = Trait.compose(T2,T3)</code> where <code>T2 = Trait.compose(T4,...)</code> and <code>T3 = Trait.compose(T4, ...)</code>.</li></ul>

<code>compose</code> is a commutative and associative operation: the ordering of its arguments does not matter, and <code>compose(t1,t2,t3)</code> is equivalent to, for example, <code>compose(t1,compose(t2,t3))</code> or <code>compose(compose(t2,t1),t3)</code>.<br>
<br>
<h4>Resolving Conflicts</h4>

The <code>Trait.resolve</code> "operator" can be used to resolve conflicts created by <code>Trait.compose</code>. The function takes as its first argument an object that can avoid conflicts either by <i>renaming</i> or by <i>excluding</i> property names. The object serves as a map, mapping a property name to either a string (indicating that the property should be renamed) or to undefined (indicating that the property should be excluded). For example, if we wanted to avoid the conflict in the <code>Tc</code> trait from the previous example, we could have composed <code>T1</code> and <code>T2</code> as follows:<br>
<br>
<pre><code>var Trenamed = Trait.compose(T1, Trait.resolve({ a: 'd' }, T2); <br>
var Texclude = Trait.compose(T1, Trait.resolve({ a: undefined }, T2);<br>
</code></pre>

<code>Trenamed</code> now has the following structure:<br>
<pre><code>{ 'a' : { value: 0 },<br>
  'b' : { value: 1 },<br>
  'c' : { value: 2 },<br>
  'd' : { value: 1 } } // T2.a renamed to 'd'<br>
</code></pre>

<code>Texclude</code> has the structure:<br>
<pre><code>{ 'a' : { value: 0 },<br>
  'b' : { value: 1 },<br>
  'c' : { value: 2 } }<br>
  // T2.a is excluded<br>
</code></pre>

The <code>Trait.resolve</code> operator is neutral with respect to required properties: renaming or excluding a required property has no effect.<br>
<br>
When a property <code>foo</code> is renamed or excluded, <code>foo</code> is bound to <code>Trait.required</code>, to attest that the trait is not valid unless the composer provides a property for the old name. This is because methods in the renamed trait may internally still contain <code>this.foo</code> expressions. The renaming performed by <code>resolve</code> is shallow: it only changes the name property name, it will not change references to the original property name within other methods. This is analogous to the way method overriding works in standard inheritance schemes: overriding a method does not affect calls to the overridden method.<br>
<br>
<code>resolve</code> subsumes the "alias" and "exclude" operators from the original traits model. However, whereas aliasing adds an additional name for the same method in a trait, the <code>resolve</code> operator renames the property, implicitly removing the old binding for the name and turning it into a required property. We have found this to be a more useful operator to resolve conflicts. If you really want to introduce an alias for a property, that can still be done as follows:<br>
<br>
<pre><code>var Talias = Trait.compose(T1,<br>
  Trait.resolve({ a: 'd' }, T2),<br>
  Trait({ a: this.d }));<br>
</code></pre>

In this case, <code>a</code> is renamed to <code>d</code> by <code>Trait.resolve</code> and a new property <code>a</code> is added that refers to the renamed property.<br>
<br>
Conflicts can also be resolved by means of overriding. The <code>Trait.override</code> function takes any number of traits and returns a composite trait containing all properties of its argument traits. In contrast to <code>compose</code>, <code>override</code> does not generate conflicts upon name clashes, but rather overrides the conflicting property with that of a trait with higher precedence. Trait precedence is from left to right, i.e. the properties of the first argument to <code>override</code> are never overridden. For example:<br>
<br>
<pre><code>var Toverride = Trait.override(T1, T2);<br>
</code></pre>

<code>Toverride</code> is equivalent to:<br>
<pre><code>{ 'a' : { value: 0 }, // T1.a overrides T2.a<br>
  'b' : { value: 1 },<br>
  'c' : { value: 2 } }<br>
</code></pre>

<code>override</code> is obviously not commutative, but it is associative, i.e. <code>override(t1,t2,t3)</code> is equivalent to <code>override(t1,override(t2,t3))</code> or to <code>override(override(t1,t2),t3)</code>. Composition via <code>override</code> most closely resembles the kind of composition provided by single-inheritance subclassing.<br>
<br>
<h4>Instantiating Traits</h4>

Since traits are just property maps, they can simply be instantiated by calling the ES5 built-in function <code>Object.create</code>. Of course, this built-in function does not know about the semantics of "required", "conflicting" and "method" properties. Required properties will be present in the instantiated object as non-enumerable data properties bound to <code>undefined</code>. Conflicting properties will be present as accessor properties that throw when accessed. Method properties will be present as plain data properties bound to functions.<br>
<br>
The <code>traits.js</code> library additionally provides a function <code>Trait.create</code>, analogous to the built-in <code>Object.create</code>, to instantiate a trait into an object. The call <code>Trait.create(proto, trait)</code> creates and returns a new object <code>o</code> that inherits from <code>proto</code> and that has all of the properties described by the argument trait. Additionally:<br>
<ul><li>an exception is thrown if 'trait' contains <code>required</code> properties.<br>
</li><li>an exception is thrown if 'trait' contains <code>conflict</code> properties.<br>
</li><li>the instantiated object and all of its accessor and method properties are frozen.<br>
</li><li>the <code>this</code> pseudovariable in all accessors and methods of the object is bound to the instantiated object.</li></ul>

For example, calling <code>Trait.create(Object.prototype, Toverride)</code> results in an object that inherits from <code>Object.prototype</code> and has a structure as if defined by:<br>
<br>
<pre><code>Object.freeze({<br>
  a: 0,<br>
  b: 1,<br>
  c: 2<br>
})<br>
</code></pre>

Use <code>Trait.create</code> to instantiate objects that should be considered "final" and complete. Use <code>Object.create</code> to instantiate objects that can remain "abstract" or otherwise extensible. For "final" objects, as generated by <code>Trait.create</code>, keep in mind that the <code>this</code> pseudovariable within their methods is bound at instantiation time to the instantiated object. This implies that final objects don't play nice with objects that delegate to them (<code>this</code> is no longer late bound for such objects). That's why we call them final: such objects should not serve as the prototype of other objects.<br>
<br>
<h4>Trait object literals</h4>

The method <code>Trait.object</code> is a convenient shorthand for writing "object literals" described by a trait. The call <code>Trait.object({...})</code> is equivalent to the call <code>Trait.create(Object.prototype, Trait({...}))</code>. Since <code>Trait.create</code> generates high-integrity objects, <code>Trait.object({...})</code> can be thought of as "high-integrity-object-literal" syntax. Such objects are frozen, their methods are frozen, their methods' prototypes are frozen, and their <code>this</code> pseudovariable cannot be rebound by clients.<br>
<br>
<h3>Stateful traits</h3>

Traits were originally defined as stateless collections of methods only. <code>traits.js</code> allows stateful traits and allows traits to describe any Javascript property, regardless of whether it contains a function and regardless of whether it is a data or accessor property. If a trait property depends on mutable state, one should always "instantiate" such traits via 'maker' functions, to prevent a stateful trait from being composed multiple times with different objects:<br>
<br>
<pre><code>// don't do:<br>
var x = 5;<br>
var StatefulTrait = Trait({<br>
  m: function() { return x; },<br>
  n: function(i) { x = i; }<br>
});<br>
// but rather:<br>
var makeStatefulTrait(x) {<br>
  return Trait({<br>
    m: function() { return x },<br>
    n: function(i) { x = i; }<br>
  });<br>
}<br>
</code></pre>

In the case of <code>StatefulTrait</code>, if this trait is used to instantiate multiple objects, those objects will implicitly share the mutable variable <code>x</code>:<br>
<pre><code>// bad: invoking o1.n(0) will cause o2.m() to return '0', implicit shared state<br>
var o1 = Trait.create(Object.prototype, StatefulTrait);<br>
var o2 = Trait.create(Object.prototype, StatefulTrait);<br>
</code></pre>

In the case of <code>makeStatefulTrait</code>, that state can be made local to each trait instance if a new trait is created for each separate instantiation:<br>
<pre><code>// good: invoking o1.n(0) will not affect the result of o2.m()<br>
var o1 = Trait.create(Object.prototype, makeStatefulTrait(5));<br>
var o2 = Trait.create(Object.prototype, makeStatefulTrait(5));<br>
</code></pre>

<h2>Examples</h2>

This <a href='http://code.google.com/p/es-lab/source/browse/trunk/src/traits/examples.js'>example code</a> demonstrates how <code>traits.js</code> is used to build reusable "enumerable" and "comparable" abstractions as traits. It also shows how a concrete collection-like object (in this case an interval data type) can make use of such traits. For an in-depth discussion of how traits can be used to build a real Collections API, see [<a href='#References.md'>3</a>].<br>
<br>
The <a href='http://code.google.com/p/es-lab/source/browse/trunk/src/traits/trait-example.js'>animationtrait example</a> is a direct translation of the same example from [<a href='#References.md'>2</a>], showcasing stateful traits.<br>
<br>
The <a href='http://code.google.com/p/es-lab/source/browse/trunk/tests/traits/traitstests.js'>unit tests</a> are a valuable resource for understanding the detailed semantics of the composition operators.<br>
<br>
<h2>Performance</h2>

Because trait composition is essentially flattened out when a trait is instantiated into an object, method lookup of trait methods is confined only to the constructed object itself. There is no inheritance chain to traverse in order to look up trait methods.<br>
<br>
The downside of trait composition by flattening is that the number of methods per object is larger. To reduce the memory footprint, an efficient implementation should share the property structure resulting from a trait instantiation between all objects instantiated from the same <code>create</code> callsite. That is, it should be able to construct a single vtable to be shared by all objects returned from a single <code>create</code> callsite.<br>
<br>
While designing this library, great care has been taken to allow a Javascript engine to partially evaluate trait composition at "compile-time". In order for the partial evaluation scheme to work, programmers should use the library with some restrictions:<br>
<ul><li>The argument to <code>Trait</code> should be an object literal.<br>
</li><li>The first argument to <code>Trait.resolve</code> should be an object literal whose properties are either string literals or the literal <code>undefined</code>.<br>
</li><li>The arguments to all composition functions should be statically resolvable to a trait.</li></ul>

At first sight, these restrictions may look severe. However, recall that traits should be thought of more as classes than as objects: they are meant to describe the structure of objects, and the above constraints are trivially satisfied if you use traits as the declarative entities they are meant to be. Now, the cool thing about <code>traits.js</code> is that it does not preclude programmers from violating these restrictions, enabling programmers to easily write generic trait composition code, traits generated at runtime, etc. These traits won't be able to make use of optimized trait composition and instantiation, but that's a fair tradeoff to be made. It's like generating a Java class at runtime.<br>
<br>
Partial evaluation would enable a smart implementation to transform the composition functions as follows:<br>
<br>
<pre><code>Trait({ a: 1, ... }) =&gt; literal-property-map<br>
Trait.compose(trait({ a: 1 }), Trait({ b: 2})) =&gt; Trait({ a:1, b:2 })<br>
Trait.resolve({ a: 'x' , ... } , Trait({ a: 1, b: 2, ... })) =&gt; Trait({ a: Trait.required, x: 1, b:2, ... })<br>
Trait.resolve({ a: undefined, ... }, Trait({ a: 1, b: 2, ...})) =&gt; Trait({ b: 2, ... })<br>
Trait.override(Trait({a: 1, b: 2}), Trait({ a: 3, b: 4, c: 5 })) =&gt; Trait({ a: 1, b:2, c: 5})<br>
Trait.create(proto, literal-property-map) =&gt; native-create<br>
Trait.object(object-literal) =&gt; Trait.create(Object.prototype, Trait(object-literal))<br>
</code></pre>

A <code>literal-property-map</code> is a property map defined as an object literal, with all of the required structural information available "at compile time". The key idea of the partial evaluation is that calls to <code>Trait.create</code> with a literal property map can be transformed into a fast native implementation of <code>Trait.create</code>, specialized for that property map. All objects generated by this native implementation can share the same v-table when they are created.<br>
<br>
<h2>Traits and type tests</h2>

<code>traits.js</code> does not provide an operator to test whether an object was instantiated from a particular trait. In principle, traits are not meant to be used as a type/classification mechanism. This is better left to separate, orthogonal concepts such as interfaces.<br>
<br>
If Javascript would at some point have the notion of interfaces or "brands" to classify objects, the API of the <code>create</code> function could be extended to allow for objects to be "branded" as follows:<br>
<br>
<pre><code>var o = Trait.create(proto, trait, { implements: [ brand1, brand2, ... ] });<br>
</code></pre>

<h2>Open issues</h2>

Trait composers cannot make methods "inherited" from a trait private.<br>
<br>
Required methods of a trait must, by design, be provided by other traits as part of their public interface, and thus also become part of the public interface of instantiated objects. If a trait really requires a method that ought to be private in the final composition, it can use lexical encapsulation to hide such required methods:<br>
<pre><code>function makeTrait(privateRequiredFoo) {<br>
  return Trait({<br>
    m: function() { privateRequiredFoo() }<br>
  })<br>
}<br>
<br>
var t1 = makeTraitProvidingFoo();<br>
var t2 = makeTrait(t1.foo);<br>
var o = Trait.create(<br>
  Trait.compose(<br>
    Trait.resolve({foo: undefined},t1),<br>
    t2));<br>
// foo is now a private method of the composition<br>
</code></pre>

<h2>References</h2>

<ul><li>[<a href='1.md'>1</a>] "Traits: Composable units of Behavior" (Scharli et al., ECOOP 2003) (<a href='http://scg.unibe.ch/archive/papers/Scha03aTraits.pdf'>paper</a>): <i>the original presentation of traits, including a deep discussion on the advantages of traits over mixins and multiple inheritance.</i>
</li><li>[<a href='2.md'>2</a>] "Adding State and Visibility Control to Traits using Lexical Nesting" (Van Cutsem et. al, ECOOP 2009) (<a href='http://prog.vub.ac.be/Publications/2009/vub-prog-tr-09-04.pdf'>paper</a>): <i>describes a trait system in a lexically-scoped, object-based language similar in style to Javascript.</i>
</li><li>[<a href='3.md'>3</a>] "Applying Traits to the Smalltalk Collection Classes" (Black et al., OOPSLA 2003) (<a href='http://scg.unibe.ch/archive/papers/Blac03aTraitsHierarchy.pdf'>paper</a>): <i>describes a concrete experiment in which traits were used to refactor the Smalltalk Collections hierarchy.</i>
</li><li>[<a href='4.md'>4</a>] "Scheme with Classes, Mixins and Traits" (Flatt et al., APLAS 2006) (<a href='http://www.cs.utah.edu/plt/publications/aplas06-fff.pdf'>paper</a> ): <i>section 7, related work provides a very comprehensive discussion on the overloaded meaning of the words mixins and traits in various programming languages</i>