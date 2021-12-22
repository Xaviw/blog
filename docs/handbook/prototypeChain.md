---
title: 通俗易懂的原型链
author: Xavi
date: "2021-12-18"
---

## 什么是原型

JS 没有类的概念，所以设计了构造函数用于模拟类，生成具有相同属性、方法的对象。但如果只是生成，每一个新对象都需要分配一块新的内存存储对象中的方法`object.assign、object.create、object.keys等等等...`，极大的浪费资源。所以 JS 又为构造函数设计了一个`prototype`属性，它指向一个对象，用于存储实例对象的共享属性和方法。

规范的构造函数以大写字母开头，但实际上任何函数都可以当作构造函数（箭头函数除外）。所以我们知道了第一点:

> **函数都有一个**`prototype`**属性，指向一个对象，这个对象就是原型**

通过在浏览器控制台打印，可以验证上面的说法：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c2b9865e827b448ba7a7d72239510b2e~tplv-k3u1fbpfcp-watermark.image?)

## constructor

同时我们还能看出原型对象中有一个`constructor`属性，从函数的名字我们就能看出`constructor`函数指向的就是构造函数自身，我们可以继续验证：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ec870d9f0b81444ea4ecea62c183b33f~tplv-k3u1fbpfcp-zoom-1.image)

验证的同时我们还新生成了一个`a`构造函数的实例。可以发现实例`e`中是没有`constructor`属性的，但能够访问到，且同样指向构造函数本身，这也证实了实例对象能够共享原型对象中的属性和方法。我们得出第二点：

> **原型对象都有一个**`constructor`**属性，指向构造函数**

## 什么是原型链

上面知道了实例对象能够共享构造函数原型对象的数据，这里称作儿子能够访问爸爸的数据。如果原型对象也是由另一个构造函数生成的，那理应能够访问另一个构造函数原型的数据，也就是爸爸能够访问爷爷的数据，所以爸爸理所当然也能把爷爷给他的数据再传给儿子。

> **构造函数的原型对象可能是另一个构造函数的实例，所以实例对象能够通过**`prototype`**属性逐层获取每一个原型对象的属性和方法，这就形成了原型链**

通过观察上面打印的实例对象`e`，可以看到对象内只有一个`[[prototype]]`属性，以`[[]]`包裹的是 JS 的内置属性，不能手动操作。那我们该如何获取并操作原型链呢，JS 给我们提供了`__proto__`属性

## **proto**

> **对象的**`__proto__`**指向其构造函数的原型对象**<br> > `Object.create(null)`除外，这样创建的对象没有原型(什么都没有)

打印构造函数`Object`的原型`Object.protptype`可以看到有一个`__proto__`属性，它是一个`getter、setter`。因为 JS 中所有对象都是`Object`的实例（后面会讲到），所以普通对象能够通过原型链访问到`__proto__`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c2f8a1fa8c6d4a5b8694cd6fe9e17618~tplv-k3u1fbpfcp-zoom-1.image)

`__proto__`的实际操作就是：

- 读取时调用`Object.getPrototypeOf()`
- 修改时调用`Object.setPrototypeOf()`

因为构造函数的属性和方法都是定义在原型对象上的，所以就能通过链的形式层层获取数据。虽然构造函数说到底也是对象，也能添加属性，但构造函数上的属性，实例是获取不到的，可以测试一下：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f023546bc22a4442a979ec8e3758c686~tplv-k3u1fbpfcp-zoom-1.image)

所以我们也可以说：

> **原型链就是**`__proto__`**获取到的对象链**

对象链的源头是`null`，即`Object`原型对象的`__proto__`指向`null`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/84c3015c49544204b298df196d68cf2c~tplv-k3u1fbpfcp-zoom-1.image)

有了上面的知识，我们对原型链的认识就已经比较深刻了，下面我们再来深入一下

## JS 对象

大家应该都听过，JS 中万物皆对象。这是因为 JS 中一切类型（`null、undefined`除外）都是通过`Object`派生而来的（即`Object`的子类），我们可以通过`__proto__`验证：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/42b00cd44d36455b985c243f024f16ed~tplv-k3u1fbpfcp-zoom-1.image)

即使是基础类型也能通过`new Number()`、`new String()`的方式创建。实际中我们使用例如`'abc'.toUpperCase()`其实也是语言内部将字符串转换为对象，再调用`String`原型上的方法。

> 这里我们可以通过面向对象的方式思考下： JS 首先开发了一个`Object`的父类，然后通过`class String extends Object(){ toUpperCase(){...} }`的方式生成了一个`String`子类。当我们声明一个字符串的时候，其实就是用`String`生成一个了一个实例，调用方法时就是通过实例的原型链找到`String`的原型对象，或者`Object`的原型对象中的方法并执行

**但 JS 中的类型也不都是这么简单的，下面我们来看一段三角关系**

`Object`和`Function`都是构造函数，按理来说是`Function`的实例（即用`Function`构造函数生成`Object`）；而 Object 又是所有对象的父类，按理来说`Function`的原型应该是由`Object`生成的。这看起来有种先有鸡还是先有蛋的感觉

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e07f19a6d84e44d385ad4aa7905b6346~tplv-k3u1fbpfcp-zoom-1.image)

实际中 JS 也确实是按上面的道理设计的，我们不必纠结这混乱的关系，就当作为达成目的做的设计就行了。上面的关系参照下图：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9a580ab37f714c85a8aee086abbe77f8~tplv-k3u1fbpfcp-zoom-1.image)

## 模拟构造函数生成实例

1.  声明函数

    - 用`Function`构造函数生成一个构造函数实例`Foo`

1.  为构造函数添加原型对象

    - 用`Object`构造函数生成一个对象实例`obj1`
    - 将构造函数`Foo`的`prototype`属性指向新对象实例`obj1`

1.  通过`new`生成构造函数`Foo`的实例对象`obj2`

    - 用`Object`构造函数生成`obj2`
    - 将`obj2`的`__proto__`指向`obj1`
    - 将`Foo`函数中的`this`绑定至`obj2`
    - 执行函数，为`obj2`添加自身属性（`this.xxx = xxx;`）
    - 将`obj2`的`prototype`指向`Foo`的原型对象`obj1`
    - 返回`obj2`（构造函数显示的返回对象的话，忽略`obj2`，因为没有变量引用`obj2`，下次垃圾回收时会被回收）

1.  实例创建完成，现在`obj2`就能够访问`obj1`中的数据以及`object`原型对象中的数据

第三步其实就是`new`的内部逻辑，相信你现在稍加思考就能实现手写`new`操作符了。

## 总结

1.  原型的目的是为了共享属性和方法，节约内存
1.  原型就是为构造函数开辟的一个对象空间`prototype`，这些空间通过`__proto__`联接起来就形成了原型链，原型链的尽头是`null`
1.  `__proto__`是通过原型链从`Object`原型中读取的，本质是`getter、setter`
1.  原型对象中有个`constructor`属性，指向构造函数；实例读取`constructor`就是读取实例原型中的属性
