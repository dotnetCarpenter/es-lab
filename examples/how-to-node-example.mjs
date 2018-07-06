import Trait from '../src/traits.mjs'

const TEquality = Trait({
  equals: Trait.required,
  differs (x) {
    return !this.equals(x)
  }
})

const TMagnitude = Trait.compose(TEquality, Trait({
  smaller: Trait.required,
  greater (x) {
    return !this.smaller(x) && this.differs(x)
  },
  between (min, max) {
    return min.smaller(this) && this.smaller(max)
  }
}))

function TCircle(center, radius, rgb) {
  return Trait.compose(
    TMagnitude,
    TEquality,
    Trait.resolve({
      equals: 'equalColors'
    }, TColor(rgb)),
    Trait({
      center,
      radius,
      area () {
        return Math.PI * this.radius * this.radius
      },
      equals (c) {
        return c.center.equals(this.center) && // c.center === this.center is always false since two 'new Point()' can never be equal
          c.radius === this.radius
      },
      smaller (c) {
        return this.radius < c.radius
      }
    }))
}

function TColor(rgb) {
  return Trait.compose(TEquality, Trait({
    get rgb () {
      return rgb
    },
    equals (col) {
      return col.rgb.equals(this.rgb)
    }
  }))
}

function Circle(center, radius, rgb) {
  return Trait.create(
    null,
    TCircle(center, radius, rgb)
  )
}

function Color(r, g, b) {
  return Trait.create(
    new.target ? this : Object.prototype,
    Trait.compose(
      TColor(),
      Trait({
        r,
        g,
        b
      })
    )
  )
}

function Point(x, y) {
  return Trait.create(
    new.target ? this : Object.prototype,
    Trait.compose(
      TEquality,
      Trait({
        x,
        y,
        equals (p) {
          return p.x === this.x && p.y === this.y
        }
      })
    )
  )
}


console.log(`Node.js version ${process.version}`)

const c1 = Circle(new Point(0, 0), 1, new Color(255, 0, 0));
const c2 = Circle(new Point(0, 1), 2, new Color(255, 255, 0));

console.log('is c1.center an instance of Point', c1.center instanceof Point)
console.log('is c2.center an instance of Point', c2.center instanceof Point)
console.log('is c1.rgb an instance of Color', c1.rgb instanceof Color)
console.log('is c2.rgb an instance of Color', c2.rgb instanceof Color)

console.log(
  c1.smaller(c2), // true
)
console.log(
  c1.differs(c2), // true
)
console.log(
  c1.equals(c2), // false
)

console.dir(JSON.stringify(c1))
console.dir(JSON.stringify(c1.rgb))
console.dir(JSON.stringify(c2.rgb))
