/** Copy own-properties from `props` onto `obj`.
 *	@returns obj
 *	@private
 */

/* global ReactEventBridge:false, internalInstanceKey:false */

// m-start
import options from './options';
import { ATTR_KEY } from './constants';
function getInternalInstanceKey() {
	if (typeof internalInstanceKey !== 'undefined') {
		return internalInstanceKey;
	}
}

export function loseup(inst, node) {
	let key = getInternalInstanceKey();
	if (key) {
		ReactEventBridge.precacheNode(inst, node);
	}
}

export function recycle(node) {
	let key = getInternalInstanceKey();
	if (node[key]) {
		ReactEventBridge.recycle(node, key);
	}
}

export function resetNode(node) {
	if (node && node.style) {
	    options.processStyle(node, 'name', '', node[ATTR_KEY].style || '') // reset style 
		// node.className = '' // only reset style
	}
}
// m-end

export function extend(obj, props) {
	if (props) {
		for (let i in props) obj[i] = props[i];
	}
	return obj;
}


/** Fast clone. Note: does not filter out non-own properties.
 *	@see https://esbench.com/bench/56baa34f45df6895002e03b6
 */
export function clone(obj) {
	return extend({}, obj);
}


/** Get a deep property value from the given object, expressed in dot-notation.
 *	@private
 */
export function delve(obj, key) {
	for (let p=key.split('.'), i=0; i<p.length && obj; i++) {
		obj = obj[p[i]];
	}
	return obj;
}


/** @private is the given object a Function? */
export function isFunction(obj) {
	return 'function'===typeof obj;
}


/** @private is the given object a String? */
export function isString(obj) {
	return 'string'===typeof obj;
}


/** Convert a hashmap of CSS classes to a space-delimited className string
 *	@private
 */
export function hashToClassName(c) {
	let str = '';
	for (let prop in c) {
		if (c[prop]) {
			if (str) str += ' ';
			str += prop;
		}
	}
	return str;
}


/** Just a memoized String#toLowerCase */
let lcCache = {};
export const toLowerCase = s => lcCache[s] || (lcCache[s] = s.toLowerCase());


/** Call a function asynchronously, as soon as possible.
 *	@param {Function} callback
 */
let resolved = typeof Promise!=='undefined' && Promise.resolve();
export const defer = resolved ? (f => { resolved.then(f); }) : setTimeout;
