import { NON_DIMENSION_PROPS } from '../constants';
import { isString } from '../util';

// m-start
// 设置style
function processStyle(node,name,old,value){
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
			if (!value.hasOwnProperty(i)){
				continue;
			}
			let styleValue = transStyleValue(i,value[i]);
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
// m-end


export default processStyle;
