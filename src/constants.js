// render modes

export const NO_RENDER = 0;
export const SYNC_RENDER = 1;
export const FORCE_RENDER = 2;
export const ASYNC_RENDER = 3;

export const EMPTY = {};

export const ATTR_KEY = typeof Symbol!=='undefined' ? Symbol.for('preactattr') : '__preactattr_';

// 对照react补齐isUnitlessNumber的属性
var not_dimension_props_without_profixes = {
	animationIterationCount: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
	boxFlex:1,
	boxFlexGroup:1,
	boxOrdinalGroup: 1,
	columnCount:1,
	fillOpacity:1,
	flex:1,
	flexGrow:1,
	flexPositive:1,
	flexShrink:1,
	flexNegative:1,
	flexOrder: 1,
	gridRow: 1,
  gridColumn: 1,
	fontWeight:1,
	lineClamp:1,
	lineHeight:1,
	opacity:1,
	order:1,
	orphans:1,
	strokeOpacity:1,
	tabSize: 1,
	widows:1,
	zIndex:1,
	zoom:1,
  // fillOpacity: 1,
  // floodOpacity: 1,
  // stopOpacity: 1,
  // strokeDasharray: 1,
  // strokeDashoffset: 1,
  // strokeMiterlimit: 1,
  // strokeOpacity: 1,
  // strokeWidth: 1
};

// 补齐前缀
function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1)
}

let prefixes = ['Webkit', 'ms', 'Moz', 'O']


Object.keys(not_dimension_props_without_profixes).forEach(function(prop) {
    prefixes.forEach(function(prefix) {
        not_dimension_props_without_profixes[prefixKey(prefix, prop)] = 1
    })
})


// DOM properties that should NOT have "px" added when numeric
export const NON_DIMENSION_PROPS = not_dimension_props_without_profixes;

// DOM event types that do not bubble and should be attached via useCapture
export const NON_BUBBLING_EVENTS = { blur:1, error:1, focus:1, load:1, resize:1, scroll:1 };
