import style from './options/style';
import event from './options/event';


/** Global options
 *	@public
 *	@namespace options {Object}
 */

function recomputeKey (vnode) {
	var children = vnode.children || [], keyMap = {}, cnt = 0, keyArr = [], last = children.length - 1

	children.forEach(function(child, i) {
		var props = child.attributes || {},
			key = props.key,
			invalidKey = key === recomputeKey.x && ++cnt
		if (invalidKey || key in keyMap || i === last) {
			if (keyArr.length) {
				keyArr.forEach(function(info) {
					info[2].key = info[0].key = '.' + cnt + ':$' + String(info[1]).replace(/^\.[\S]+:\$/g, '')
				})
				keyMap = {}
				keyArr = []
				cnt++
			}
		}
		!invalidKey && keyArr.push([props, keyMap[key] = key, child])
	})
	keyMap = keyArr = null
}

export default {

	/** If `true`, `prop` changes trigger synchronous component updates.
	 *	@name syncComponentUpdates
	 *	@type Boolean
	 *	@default true
	 */
	//syncComponentUpdates: true,

	/** Processes all created VNodes.
	 *	@param {VNode} vnode	A newly-created VNode to normalize/process
	 */
	vnode(vnode) {
		// fork add to support react event sys
		vnode._hostParent = null;
		vnode._hostNode = null;
		vnode._rootNodeID = null;
		recomputeKey(vnode)
	},

	/** Hook for style process */
	style,

	/** Hook for event handle */
	_event: event

	/** Hook invoked after a component is mounted. */
	// afterMount(component) { }

	/** Hook invoked after the DOM is updated with a component's latest render. */
	// afterUpdate(component) { }

	/** Hook invoked immediately before a component is unmounted. */
	// beforeUnmount(component) { }
};
