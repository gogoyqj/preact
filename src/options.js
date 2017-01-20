import style from './options/style';
import event from './options/event';


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
