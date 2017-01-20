import style from './options/style';
import event from './options/event';

/* 
 * @private
 * @description ensure each vnode has a stable and unique key
 */
function recomputeKey (children) {
	children = children || []
	var keyMap = {}, outerKey = 0, keyArr = [], varUndefined

	// set key and reset keyMap, keyArr
	function setKey() {
		keyArr.splice(0).forEach(function (info) {
	        info[2].key = info[0].key = '.' + outerKey + ':$' + String(info[1]).replace(/^\.[\S]+:\$/g, '');
	    });
		keyMap = {}
	}
	children.forEach(function(vnode) {
		var props = vnode && vnode.attributes || {},
			key = props.key,
			invalidKey = key === varUndefined && ++outerKey
		// duplicate key
		if (key in keyMap) ++outerKey && setKey()
		// vnode has no key
		if (invalidKey) {
			setKey()
		// props, origin key, vnode
		} else {
			keyArr.push([props, keyMap[key] = key, vnode])
		}
	})
	// last !! outerKey++ NOT ++outerKey
    outerKey++ && setKey();
}

/** Global options
 *	@public
 *	@namespace options {Object}
 */
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
		recomputeKey(vnode.children)
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
