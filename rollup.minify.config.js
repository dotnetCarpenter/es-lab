import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: 'src/traits.js',
  plugins: [
    uglify({}, minify)
  ]
}
