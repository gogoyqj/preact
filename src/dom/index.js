import { NON_DIMENSION_PROPS, NON_BUBBLING_EVENTS } from '../constants';
import options from '../options';
// qreact begin
// import { toLowerCase, isString, isFunction, hashToClassName } from '../util';
import { toLowerCase, isString, isFunction, hashToClassName, garbage } from '../util';
// qreact end




/** Removes a given DOM Node from its parent. */
export function removeNode(node) {
	let p = node.parentNode;
	// qreact begin
	garbage(node)
	// qreact end
	if (p) p.removeChild(node);
}


/** Set a named attribute on the given Node, with special behavior for some names and event handlers.
 *	If `value` is `null`, the attribute/handler will be removed.
 *	@param {Element} node	An element to mutate
 *	@param {string} name	The name/key to set, such as an event or attribute name
 *	@param {any} old	The last value that was set for this name/node pair
 *	@param {any} value	An attribute value, such as a function to be used as an event handler
 *	@param {Boolean} isSvg	Are we currently diffing inside an svg?
 *	@param {Object} inst VNode instance
 *	@private
 */
export function setAccessor(node, name, old, value, isSvg, inst) {

	if (name==='className') name = 'class';

	if (name==='class' && value && typeof value==='object') {
		value = hashToClassName(value);
	}

	if (name==='key') {
		// ignore
	}
	else if (name==='class' && !isSvg) {
		node.className = value || '';
	}
	else if (name==='style') {
		// qreact begin
		setStyleAccessor(node, name, old, value);
		// qreact end
	}
	else if (name==='dangerouslySetInnerHTML') {
		if (value) node.innerHTML = value.__html || '';
	}
	else if (name[0]=='o' && name[1]=='n') {
		// qreact begin
		if (typeof qreact_event !== 'undefined') {
			qreact_event(node, name, value, inst)
        } else {
			let l = node._listeners || (node._listeners = {});
			name = toLowerCase(name.substring(2));
			// @TODO: this might be worth it later, un-breaks focus/blur bubbling in IE9:
			// if (node.attachEvent) name = name=='focus'?'focusin':name=='blur'?'focusout':name;
			if (value) {
				if (!l[name]) node.addEventListener(name, eventProxy, !!NON_BUBBLING_EVENTS[name]);
			}
			else if (l[name]) {
				node.removeEventListener(name, eventProxy, !!NON_BUBBLING_EVENTS[name]);
			}
			l[name] = value;
        }
 		// let l = node._listeners || (node._listeners = {});
		// name = toLowerCase(name.substring(2));
		// // @TODO: this might be worth it later, un-breaks focus/blur bubbling in IE9:
		// // if (node.attachEvent) name = name=='focus'?'focusin':name=='blur'?'focusout':name;
		// if (value) {
		// 	if (!l[name]) node.addEventListener(name, eventProxy, !!NON_BUBBLING_EVENTS[name]);
		// }
		// else if (l[name]) {
		// 	node.removeEventListener(name, eventProxy, !!NON_BUBBLING_EVENTS[name]);
		// }
		// l[name] = value;
        // qreact end
	}
	else if (name!=='list' && name!=='type' && !isSvg && name in node) {
		setProperty(node, name, value==null ? '' : value);
		if (value==null || value===false) node.removeAttribute(name);
	}
	else {
		let ns = isSvg && name.match(/^xlink\:?(.+)/);
		if (value==null || value===false) {
			if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', toLowerCase(ns[1]));
			else node.removeAttribute(name);
		}
		else if (typeof value!=='object' && !isFunction(value)) {
			if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', toLowerCase(ns[1]), value);
			else node.setAttribute(name, value);
		}
	}
}

// qreact begin
// 设置style
function setStyleAccessor(node,name,old,value){
	// value是string的，直接赋值 ？ react是怎么处理的？
	if (!value || isString(value) || isString(old)) {
		node.style.cssText = value || '';
	}
	// value是对象的
	if (value && typeof value==='object') {
		// todo 判断styles.hasOwnProperty?
		//如果上一个style存在且为对象的，循环，有属性是上次有而此次style没有的，置空
		if (!isString(old)) {
			for (let i in old) if (!(i in value)) node.style[i] = '';
		}
		// 添加css
		// todo 增加默认的样式等等
		for (let i in value) {
			if(!value.hasOwnProperty(i)){
					continue;
			}
			var styleValue = transStyleValue(i,value[i]);
			// mobile不用考虑IE8，直接转换为cssFloat，也不用做细拆分
			if (i === 'float') {
        i = 'cssFloat';
      }
			node.style[i] = styleValue || '';
		}
	}
}


function transStyleValue(name,value){
     // 考虑空值，布尔值等
     if (value == null || typeof value === 'boolean' || value === '') {
         return '';
     }

     // 只接受正值的呢？

     // 转换单位,更细致的转换方法，包括borderWidth:'1'也会转化为1px，而width:0 就不用转化了
     if (isNaN(value) || value === 0 || NON_DIMENSION_PROPS.hasOwnProperty(name) && NON_DIMENSION_PROPS[name]) {
         return '' + value;
     }
     if (typeof value === 'string') {
       value = value.trim();
     }
     return value + 'px';
}
// qreact end

/** Attempt to set a DOM property to the given value.
 *	IE & FF throw for certain property-value combinations.
 */
function setProperty(node, name, value) {
	try {
		node[name] = value;
	} catch (e) { }
}


/** Proxy an event to hooked event handlers
 *	@private
 */
function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}
