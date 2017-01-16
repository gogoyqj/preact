/** Virtual DOM Node */
export function VNode(nodeName, attributes, children) {
	/** @type {string|function} */
	this.nodeName = nodeName;

	/** @type {object<string>|undefined} */
	this.attributes = attributes;

	/** @type {array<VNode>|undefined} */
	this.children = children;

	/** Reference to the given key. */
	this.key = attributes && attributes.key;
    
    // qreact begin
    // fork add to support react event sys
    this._hostParent = this._hostNode = this._rootNodeID = null;
    // qreact end
}
