import { ATTR_KEY } from '../constants';
// qreact begin
// import { isString, isFunction } from '../util';
import { isString, isFunction, recycle, loseup } from '../util';
// qreact end
import { isSameNodeType, isNamedNode } from './index';
import { isFunctionalComponent, buildFunctionalComponent } from './functional-component';
import { buildComponentFromVNode } from './component';
import { setAccessor, removeNode } from '../dom/index';
import { createNode, collectNode } from '../dom/recycler';
import { unmountComponent } from './component';
import options from '../options';


/** Queue of components that have been mounted and are awaiting componentDidMount */
export const mounts = [];

/** Diff recursion count, used to track the end of the diff cycle. */
export let diffLevel = 0;

/** Global flag indicating if the diff is currently within an SVG */
let isSvgMode = false;

/** Global flag indicating if the diff is performing hydration */
let hydrating = false;


/** Invoke queued componentDidMount lifecycle methods */
export function flushMounts() {
	let c;
	while ((c=mounts.pop())) {
		if (options.afterMount) options.afterMount(c);
		if (c.componentDidMount) c.componentDidMount();
	}
}


/** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
 *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
 *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
 *	@returns {Element} dom			The created/mutated element
 *	@private
 */

/**
 * vnode
 *
 * export function render(vnode, parent, merge) {
 *	 return diff(merge, vnode, {}, false, parent);
 * }
 */



export function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	// diffLevel having been 0 here indicates initial entry into the diff (not a subdiff)
	if (!diffLevel++) {
		// when first starting the diff, check if we're diffing an SVG or within an SVG
		// 判断是否在 svg 中
		isSvgMode = parent instanceof SVGElement;

		// hydration is inidicated by the existing element to be diffed not having a prop cache
		// 表示是简单节点，不是混合组件
		hydrating = dom && !(ATTR_KEY in dom);
	}

	// 在这里调用 idiff 来进行 diff, 这里面进行了节点的更新，返回的根节点
	let ret = idiff(dom, vnode, context, mountAll);

	// append the element if its a new parent
	if (parent && ret.parentNode!==parent) {
		parent.appendChild(ret);
		// m-start
		loseup(vnode, ret);
		// m-end
	}

	// diffLevel being reduced to 0 means we're exiting the diff
	if (!--diffLevel) {
		hydrating = false;
		// invoke queued componentDidMount lifecycle methods
		// 调用组价的 DidMount 生命周期方法
		if (!componentRoot) flushMounts();
	}

	return ret;
}


function idiff(dom, vnode, context, mountAll) {
	let originalAttributes = vnode && vnode.attributes;


	// Resolve ephemeral Pure Functional Components
	// 如果 vnode 是一个函数就执行函数得到结果，函数返回的可能还是一个纯函数组件
	// 这里需要不断执行，直到结果不是函数
	while (isFunctionalComponent(vnode)) {
		vnode = buildFunctionalComponent(vnode, context);
	}


	// empty values (null & undefined) render as empty Text nodes
	if (vnode==null) vnode = '';


	// Fast case: Strings create/update Text nodes.
	if (isString(vnode)) {
		// update if it's already a Text node
		if (dom && dom instanceof Text) {
			if (dom.nodeValue!=vnode) {
				dom.nodeValue = vnode;
			}
		}
		else {
			// it wasn't a Text node: replace it with one and recycle the old Element
			// 如果不是文本节点，对节点进行回收
			if (dom) recollectNodeTree(dom);
			dom = document.createTextNode(vnode);
		}

		// Mark for non-hydration updates
		dom[ATTR_KEY] = true;
		return dom;
	}


	// If the VNode represents a Component, perform a component diff.
	// 如果节点是一个普通的 Component
	// 注意 isFunctionalComponent 检验是不是纯函数组件
	if (isFunction(vnode.nodeName)) {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}


	let out = dom,
		nodeName = String(vnode.nodeName),	// @TODO this masks undefined component errors as `<undefined>`
		prevSvgMode = isSvgMode,
		vchildren = vnode.children;


	// SVGs have special namespace stuff.
	// This tracks entering and exiting that namespace when descending through the tree.
	isSvgMode = nodeName==='svg' ? true : nodeName==='foreignObject' ? false : isSvgMode;


	if (!dom) {
		// case: we had no element to begin with
		// - create an element with the nodeName from VNode
		// 调用 createElement(NS) 来创建 DOM 节点
		out = createNode(nodeName, isSvgMode);
		// m-start
		vnode && loseup(vnode, out);
		// m_end
	}
	// 如果 DOM 节点的类型和虚拟 Node 不符
	else if (!isNamedNode(dom, nodeName)) {
		// case: Element and VNode had different nodeNames
		// - need to create the correct Element to match VNode
		// - then migrate children from old to new

		// 调用 createElement(NS) 来创建 DOM 节点
		out = createNode(nodeName, isSvgMode);
		// m-start
		vnode && loseup(vnode, out);
		// m_end

		// move children into the replacement node
		// 将子节点全部移入到新的节点中去
		while (dom.firstChild) out.appendChild(dom.firstChild);

		// if the previous Element was mounted into the DOM, replace it inline
		// 替换节点
		if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

		// recycle the old element (skips non-Element node types)
		// 回收原节点
		recollectNodeTree(dom);
	}


	let fc = out.firstChild,
		props = out[ATTR_KEY];

	// Attribute Hydration: if there is no prop cache on the element,
	// ...create it and populate it with the element's attributes.
	if (!props) {
		out[ATTR_KEY] = props = {};
		for (let a=out.attributes, i=a.length; i--; ) props[a[i].name] = a[i].value;
	}


	// Optimization: fast-path for elements containing a single TextNode:
	// 以字符串为内容的节点
	if (!hydrating && vchildren && vchildren.length===1 && typeof vchildren[0]==='string' && fc && fc instanceof Text && !fc.nextSibling) {
		if (fc.nodeValue!=vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	}
	// otherwise, if there are existing or new children, diff them:
	else if (vchildren && vchildren.length || fc) {
		// 对子节点进行 diff
		// 一个深度优先的遍历
		innerDiffNode(out, vchildren, context, mountAll, !!props.dangerouslySetInnerHTML);
	}


	// Apply attributes/props from VNode to the DOM Element:
	// 对属性进行 diff
	diffAttributes(out, vnode.attributes, props, vnode);


	// invoke original ref (from before resolving Pure Functional Components):

	/**
	 * 如果原来的 ref 是一个函数，就在新的节点上调用 ref
	 * <div
	 * 	ref={(ref) => this.div = ref}
	 * >
	 * </div>
	 * 可见这里 ref 就已经是 dom 节点了
	 */
	if (originalAttributes && typeof originalAttributes.ref==='function') {
		(props.ref = originalAttributes.ref)(out);
	}

	isSvgMode = prevSvgMode;

	return out;
}


/** Apply child and attribute changes between a VNode and a DOM Node to the DOM.
 *	@param {Element} dom		Element whose children should be compared & mutated
 *	@param {Array} vchildren	Array of VNodes to compare to `dom.childNodes`
 *	@param {Object} context		Implicitly descendant context object (from most recent `getChildContext()`)
 *	@param {Boolean} mountAll
 *	@param {Boolean} absorb		If `true`, consumes externally created elements similar to hydration
 */
function innerDiffNode(dom, vchildren, context, mountAll, absorb) {
	// 原 DOM 节点
	let originalChildren = dom.childNodes,
		children = [],
		keyed = {},
		keyedLen = 0,
		min = 0,
		len = originalChildren.length,
		childrenLen = 0,
		vlen = vchildren && vchildren.length,
		j, c, vchild, child;

	// 如果有子 dom 节点
	if (len) {
		for (let i=0; i<len; i++) {
			let child = originalChildren[i],
				props = child[ATTR_KEY],
				key = vlen ? ((c = child._component) ? c.__key : props ? props.key : null) : null;
			// 通过 key 来记录下 child 节点
			if (key!=null) {
				keyedLen++;
				keyed[key] = child;
			}
			// 这几个单词太诡异，不太懂
			else if (hydrating || absorb || props) {
				children[childrenLen++] = child;
			}
		}
	}

	// 如果有 vnode children
	if (vlen) {
		for (let i=0; i<vlen; i++) {
			vchild = vchildren[i];
			child = null;

			// if (isFunctionalComponent(vchild)) {
			// 	vchild = buildFunctionalComponent(vchild);
			// }

			// attempt to find a node based on key matching
			// 拿到 key
			let key = vchild.key;
			if (key!=null) {
				// 使用 key 从 keyed 这个 map 中寻找 DOM 节点
				if (keyedLen && key in keyed) {
					// 找到后，将 key 对应的值置空
					child = keyed[key];
					keyed[key] = undefined;
					// 减小 map 记录的长度
					keyedLen--;
				}
			}
			// attempt to pluck a node of the same type from the existing children

			// 如果 key 是空的，从回收的子节点中找一个同类的
			else if (!child && min<childrenLen) {
				for (j=min; j<childrenLen; j++) {
					c = children[j];
					// 找一个同类的节点
					if (c && isSameNodeType(c, vchild)) {
						child = c;
						children[j] = undefined;
						if (j===childrenLen-1) childrenLen--;
						// min 记录了原位置和 diff 后位置开始错乱的起始点
						if (j===min) min++;
						break;
					}
				}
			}

			// morph the matched/found/created DOM child to match vchild (deep)
			// 在对 child 进行 diff
			child = idiff(child, vchild, context, mountAll);

			// 如果得出的 child 不同
			if (child && child!==dom) {
				// 虚拟 Node 表示的 child 比真实 child 多
				// 追加之
				if (i>=len) {
					dom.appendChild(child);
				}
				// diff 出来的 DOM 和原来不同
				else if (child!==originalChildren[i]) {
					// 如果和原来位置的后一个相同，说明需要移除原位置的 DOM 节点
					// if (child===originalChildren[i+1]) {
					// 	removeNode(originalChildren[i]);
					// }
					if (dom === child.parentNode) {
	                	var originalChild = originalChildren[i],
	                		nextChild = originalChild && originalChild.nextSibling
	                	while(nextChild) {
	                		if (key in originalChild[ATTR_KEY]) {
	                			recollectNodeTree(originalChild)
	                		} else {
	                			break
	                		}
	                		if (nextChild === child) break
	                		originalChild = nextChild
	                		nextChild = originalChild.nextSibling
	                	}
					} else {
						dom.insertBefore(child, originalChildren[i] || null);
					}
				}
			}
		}
	}

	// 如果还有没有用完的 child 回收之
	if (keyedLen) {
		for (let i in keyed) if (keyed[i]) recollectNodeTree(keyed[i]);
	}

	// remove orphaned children
	while (min<=childrenLen) {
		child = children[childrenLen--];
		if (child) recollectNodeTree(child);
	}
	document.body.scrollTop
}



/** Recursively recycle (or just unmount) a node an its descendants.
 *	@param {Node} node						DOM node to start unmount/removal from
 *	@param {Boolean} [unmountOnly=false]	If `true`, only triggers unmount lifecycle, skips removal
 */
export function recollectNodeTree(node, unmountOnly) {
	let component = node._component;
	// m-start
	recycle(node);
	// m-end
	if (component) {
		// if node is owned by a Component, unmount that component (ends up recursing back here)
		unmountComponent(component, !unmountOnly);
	}
	else {
		// If the node's VNode had a ref function, invoke it with null here.
		// (this is part of the React spec, and smart for unsetting references)
		// 置空 ref 函数
		if (node[ATTR_KEY] && node[ATTR_KEY].ref) node[ATTR_KEY].ref(null);

		if (!unmountOnly) {
			collectNode(node);
		}

		// Recollect/unmount all children.
		// - we use .lastChild here because it causes less reflow than .firstChild
		// - it's also cheaper than accessing the .childNodes Live NodeList
		// 递归地回收所有子节点
		let c;
		while ((c=node.lastChild)) recollectNodeTree(c, unmountOnly);
	}
}



/** Apply differences in attributes from a VNode to the given DOM Element.
 *	@param {Element} dom		Element with attributes to diff `attrs` against
 *	@param {Object} attrs		The desired end-state key-value attribute pairs
 *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
 */
function diffAttributes(dom, attrs, old, inst) {
	// remove attributes no longer present on the vnode by setting them to undefined
	let name;
	for (name in old) {
		if (!(attrs && name in attrs) && old[name]!=null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode, inst);
		}
	}

	// add new & update changed attributes
	if (attrs) {
		for (name in attrs) {
			if (name!=='children' && name!=='innerHTML' && (!(name in old) || attrs[name]!==(name==='value' || name==='checked' ? dom[name] : old[name]))) {
				setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode, inst);
			}
		}
	}
}
