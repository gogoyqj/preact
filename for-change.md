# changes to support react event system

## 修改内容

修改的地方一律标注为：

```
// qreact begin
xxx
// qreact end

```

+ 注入事件系统需要的 _hostNode, _hostParent, node[internalInstanceKey]
+ 节点销毁、回收时，解除 VNode 和 Node 的循环引用

## change list

+ src/dom/index.js
+ src/vdom/diff.js
+ src/vdom/component.js
+ src/vnode.js
+ src/utils.js