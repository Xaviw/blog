---
title: 懒加载优化+定位未加载元素
author: Xavi
date: "2021-12-8"
---

> 本文涉及知识点包括：
>
> 1. 使用 `IntersectionObserver` 快速实现懒加载
> 2. 使用 `getBoundingClientRect` 判断元素是否出现在页面中
> 3. 使用 `scrollIntoView` 滚动页面至指定元素
> 4. 同步化异步任务解决懒加载首次加载过多问题
> 5. 定位懒加载界面中未加载元素

## 背景

最近有个需求是在页面中展示多个信息集，由于数量多，直接一股脑的发一大堆请求速度较慢，要求优化成懒加载的形式，且能通过点击目录跳转。页面左边为信息集目录，右边为垂直排列的信息集，信息集默认有标题，数据异步加载

懒加载通常使用监听页面 scroll 事件，再计算元素的位置实现。但 scroll 事件为同步执行，会阻塞页面，性能较低，且计算复杂，不是一个良好的方案，这里推荐使用 [Intersection Observer](https://www.ruanyifeng.com/blog/2016/11/intersectionobserver_api.html) API 实现

## Intersection Observer

Intersection Observer 使用非常简单，上面链接的阮一峰教程中对该 API 介绍的很清楚。

简单说就是新建一个实例，传入监听的回调函数与选项参数，再调用实例监听 DOM 元素即可

```javascript
// 创建实例
let observer = new IntersectionObserver(
  (entries) => {
    // callback
  },
  { threshold: 0.5 }
);

// 监听DOM元素，可以监听多个
observer.observe(element);
```

需要注意的是，回调参数为所有触发回调的元素组成的 IntersectionObserverEntry 数组，其中的属性包括：

> - `time`：可见性发生变化的时间，是一个高精度时间戳，单位为毫秒
> - `target`：被观察的目标元素，是一个 DOM 节点对象
> - `rootBounds`：根元素的矩形区域的信息，`getBoundingClientRect()`方法的返回值，如果没有根元素（即直接相对于视口滚动），则返回`null`
> - `boundingClientRect`：目标元素的矩形区域的信息
> - `intersectionRect`：目标元素与视口（或根元素）的交叉区域的信息
> - `intersectionRatio`：目标元素的可见比例，即`intersectionRect`占`boundingClientRect`的比例，完全可见时为`1`，完全不可见时小于等于`0`

选项参数中的 `threshold` 为监听的门槛值，表示监听的元素在页面中出现百分之多少时触发回调，可以传入一个数值或数值数组

## 实现懒加载

这里以 Angular 为例，实现步骤非常简单：

1. 在生命周期函数中获取需要监听的 DOM
2. 在回调函数中遍历 entries，根据需求调用方法。我这里为元素可见时加载数据
3. 遍历需要监听的 DOM 元素，添加监听

```javascript
// 标记已经加载数据的DOM
cache = {};
// 将observer声明在方法外，用于组件销毁时取消监听
observer;

// 生命周期函数
ngAfterViewInit() {
    // 监听ngFor变化，得到DOM（Angular中For循环渲染的DOM没法及时在生命周期中获取）
    this.tableItemEL.changes.pipe(first()).subscribe(list => {
        if (list.length > 0) {
            // 元素在窗口中出现大于0.5时（标题部分，在窗口中显示一半时），触发回调
            this.observer = new IntersectionObserver(
                entries => {
                    for (let item of entries) {
                        // 出现在屏幕中且未加载
                        if (item.intersectionRatio > 0 && !this.cache[item.target.id]) {
                            // 执行加载方法
                            this.build(item);
                        }
                    }
                },
                { threshold: 0.5 }
            );
            // 遍历节点，添加监听
            list._results.forEach(item => {
                this.observer.observe(item.nativeElement);
            });
        }
    });
}

// 组件销毁的生命周期中取消监听，避免内存泄漏
ngOnDestroy() {
    this.observer.disconnect();
}

// 加载数据方法
build(item){
    // 加载完成后标记该DOM
    xxx.then(() => {
        this.cache[item.TABLE_CODE] = true;
    })
}
```

这就实现了最基础的懒加载，但还有问题。在数据未加载时，由于元素仅有标题的高度，出现在屏幕中的元素会超过实际一屏能显示的数据.我这里一屏本来只能显示 3 个信息集，但加载了 7 个

![问题演示](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/df471a6a09214a238f430c2f769bfd95~tplv-k3u1fbpfcp-watermark.image?)

## 解决首次加载过多问题

因为 JS 的单线程特性，所以可以在加载数据前再次判断元素是否在可视范围内，可以使用 [Element.getBoundingClientRect()](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect) 方法判断。该方法均已窗口左上角为起点，所以当`bottom>0（底在屏幕内或屏幕下方）`、`top<=window.innerHeight（顶在屏幕内或屏幕上方）`时即为可视

这里还要考虑到因为加载数据是异步的，所以单纯加上判断位置的话，实际上是先判断了 DOM 位置（均在可视范围内），再加载了数据，与之前没有变化。

可以使用`async await`的形式,将加载数据变成同步运行，这时候再判断位置应该就没问题了

但这里还需要注意一个点，理解`await`的运行方式。运行到 await 时，JS 是在当前函数内卡在 await 处，等异步完成再回到 await 继续运行；但函数外的同步代码不会等待该异步完成。所以如果仅修改了加载数据的方法，实际运行效果没有变化，需要在回调函数中为加载数据的方法也添加`await`就解决了该问题

```javascript
// 标记已经加载数据的DOM
cache = {};
// 将observer声明在方法外，用于组件销毁时取消监听
observer;

// 生命周期函数
ngAfterViewInit() {
    // 监听ngFor变化，得到DOM（Angular中For循环渲染的DOM没法及时在生命周期中获取）
    this.tableItemEL.changes.pipe(first()).subscribe(list => {
        if (list.length > 0) {
            // 元素在窗口中出现大于0.5时（标题部分，在窗口中显示一半时），触发回调
            this.observer = new IntersectionObserver(
                // 以同步的方式执行加载数据
                async entries => {
                    for (let item of entries) {
                        // 出现在屏幕中且未加载
                        if (item.intersectionRatio > 0 && !this.cache[item.target.id]) {
                            // 执行加载方法
                            await this.build(item);
                        }
                    }
                },
                { threshold: 0.5 }
            );
            // 遍历节点，添加监听
            list._results.forEach(item => {
                this.observer.observe(item.nativeElement);
            });
        }
    });
}

// 组件销毁的生命周期中取消监听，避免内存泄漏
ngOnDestroy() {
    this.observer.disconnect();
}

// 加载数据方法---使用同步方式，添加DOM参数，判断位置
async build(item, target){
    // 判断是否在窗口范围内，是才加载
    let rect = target.getBoundingClientRect();
    let isShow = rect.bottom > 0 && rect.top <= window.innerHeight;
    if(isShow) {
        // 加载完成后标记该DOM
        await xxx.then(() => {
            this.cache[item.TABLE_CODE] = true;
        })
    }
}
```

## 实现点击目录定位

上面已经实现了懒加载的功能，最后需要实现点击左侧的目录定位到对应 DOM

这里我有两种想法

- 一是点击后把目标之前的 DOM 数据全部加载，再跳转到目标元素。首次跳转会比较慢，往上滚动或跳转不需要再加载数据
- 二是先加载目标数据，然后跳转到目标元素，再根据可见性懒加载其他 DOM 数据，上下滚动都还是懒加载的形式

看起来第二种方案比较好，但尝试写了一下发现定位目标元素都会触发上面元素的 callback，导致目标元素被挤出屏幕外，无法准确定位（如有解决方案，望告知）

最后采用了第一种方案，定位用到的 API 为`Element.scrollIntoView()`,默认为定位到窗口顶部，传入 false 为定位到窗口底部。因为是加载完数据后才定位，所以这里不需要同步执行，可以在加载数据方法中返回 Promise，然后通过 Promise.all 实现该功能

## 最终代码

```javascript
// 标记已经加载数据的DOM
cache = {};
// 将observer声明在方法外，用于组件销毁时取消监听
observer;

// 生命周期函数
ngAfterViewInit() {
    // 监听ngFor变化，得到DOM（Angular中For循环渲染的DOM没法及时在生命周期中获取）
    this.tableItemEL.changes.pipe(first()).subscribe(list => {
        if (list.length > 0) {
            // 元素在窗口中出现大于0.5时（标题部分，在窗口中显示一半时），触发回调
            this.observer = new IntersectionObserver(
                // 以同步的方式执行加载数据
                async entries => {
                    for (let item of entries) {
                        // 出现在屏幕中且未加载
                        if (item.intersectionRatio > 0 && !this.cache[item.target.id]) {
                            // 执行加载方法
                            await this.build(item);
                        }
                    }
                },
                { threshold: 0.5 }
            );
            // 遍历节点，添加监听
            list._results.forEach(item => {
                this.observer.observe(item.nativeElement);
            });
        }
    });
}

// 组件销毁的生命周期中取消监听，避免内存泄漏
ngOnDestroy() {
    this.observer.disconnect();
}

// 目录单击事件
onTabCLick(tab){
    if(!this.cache[tab.TABLE_CODE]){
        // 未加载，同步方式按顺序渲染至目标元素
        // tableList为所有信息集的数组
        let reqArr = [];
        let i=0;
        do {
            if(!this.cache[this.tableList[i].TABLE_CODE]){
                // 执行加载，并添加Promise进数组
                reqArr.push(this.build(this.tableList[i]));
            }
        } while (this.tableList[i].TABLE_CODE !== tab.TABLE_CODE && ++i);
        // 全部完成后跳转
        Promise.all(reqArr).then(() => {
            document.querySelector(`#${item.TABLE_CODE}`).scrollIntoView();
        }
    } else {
        // 已加载，直接跳转
        document.querySelector(`#${item.TABLE_CODE}`).scrollIntoView();
    }
}

// 加载数据方法---使用同步方式，增加DOM参数用于判断位置
async build(item, target){
    // 判断是否在窗口范围内，是才加载
    let rect = target.getBoundingClientRect();
    let isShow = rect.bottom > 0 && rect.top <= window.innerHeight;
    if(isShow) {
        // 返回请求promise，加载完成后标记该DOM
        return await xxx.then(() => {
            this.cache[item.TABLE_CODE] = true;
        })
    }
}
```
