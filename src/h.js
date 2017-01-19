import { VNode } from './vnode';
import options from './options';


const stack = [];

const EMPTY_CHILDREN = [];

/** JSX/hyperscript reviver
*	Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
 *	@see http://jasonformat.com/wtf-is-jsx
 *	@public
 *  @example
 *  /** @jsx h *\/
 *  import { render, h } from 'preact';
 *  render(<span>foo</span>, document.body);
 */
export function h(nodeName, attributes) {
	let children, lastSimple, child, simple, i;
	// 收集所有的 child
	for (i=arguments.length; i-- > 2; ) {
		stack.push(arguments[i]);
	}
	// 从 props 中收集 children
	if (attributes && attributes.children) {
		if (!stack.length) stack.push(attributes.children);
		delete attributes.children;
	}
	while (stack.length) {
		// 处理 child 是数组的情况
		if ((child = stack.pop()) instanceof Array) {
			for (i=child.length; i--; ) stack.push(child[i]);
		}
		else if (child!=null && child!==true && child!==false) {
			if (typeof child=='number') child = String(child);
			simple = typeof child=='string';
			// 这一步感觉没啥必要，最后两个如果是字符串就合并字符串
			if (simple && lastSimple) {
				children[children.length-1] += child;
			}
			else {
				(children || (children = [])).push(child);
				lastSimple = simple;
			}
		}
	}

	// 创建虚拟 Node
	// VNode 只是一个简单的对象，包含参数中的这三个属性，和一个 key 属性
	let p = new VNode(nodeName, attributes || undefined, children || EMPTY_CHILDREN);

	// if a "vnode hook" is defined, pass every created VNode to it
	if (options.vnode) options.vnode(p);

	return p;
}
