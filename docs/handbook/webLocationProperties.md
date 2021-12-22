---
title: Web元素位置属性
author: Xavi
date: "2021-12-14"
---

最近在复习过程中看到了位置相关属性（即 client、scroll、offset 以及 window 中的几个位置值），发现这几个随时可能用的属性一直没记牢过。在网上搜索几篇文章看下来后却发现越来越迷糊，主要争论在 clientHeight 上：

- 一些说 clientHeight 是元素的可见高度
- 一些说 clientHeight 是元素的完整高度
  本着实践出真知的原则，干脆自己动手研究，顺便记录分享

## 直接说结论

> 以下的 content，指标准盒模型的 content 部分的宽度或高度(具体范围查看文末图示)；<br>
> padding、border、滚动条，指各自的宽度（厚度），值不对称时将\*2 改为相加；<br>
> 内容，指子元素的总渲染宽度或高度。

1. client 系列（均为只读）
   - `clientHeight`与`clientWidth`
     > content + padding\*2 - 滚动条
     > 即盒模型 border 内矩形的宽高
   - `clientLeft`与`clientTop`
     > border [+ 滚动条]
     > 即 border 的宽度。rtl 模式下左边框挨着垂直滚动条，则需要加上滚动条
2. scroll 系列（scrollTop、scrollLeft 可写）
   - `scrollHeight`与`scrollWidth`
     > padding\*2 + 内容 - 滚动条
     > 即 border 内的宽高，包括溢出不可见部分
   - `scrollLeft`与`scrollTop`值等于
     > 文档流起点方向上被滚动条隐藏的 **内容+padding** 大小
     > rtl 模式下水平滚动条右边为起点 0，滚动后 scrollLeft 为负值。也就是正常模式下，scrollLeft 是被滚动隐藏的左边部分内容+padding；rtl 模式下为右边部分被隐藏的内容+padding，且为负值
3. offset 系列（均为只读）
   - `offsetParent`
     > 指向最近包含该元素的定位元素或者最近的  `table,td,th,body`元素。当元素的  `style.display`  设置为 `none` 时，`offsetParent`  返回  `null`
   - `offsetHeight`与`offsetWidth`
     > border\*2 + padding\*2 + content
     > 即元素被完整撑开后的宽高
   - `offsetLeft`与`offsetTop`
     > 元素 border 外框线，到 offsetParent 的 margin 外框线的距离
     > offsetParent 为 null 时，值为 0
4. window 系列（均为只读）
   - `innerHeight`与`innerWidth`
     > 视口的宽高，包括滚动条
   - `outerHeight`与`outerWidth`
     > 整个浏览器的宽高，包括浏览器的菜单栏、标题栏等
   - `scrollX`（别名`pageXOffset`）与`scrollY`（别名`pageYOffset`）
     > 与 scrollLeft、scrollTop 相似，只是目标是整个窗口，且需要把 margin 计算在内
     > 考虑兼容性，建议使用别名；rtl 模式下同 scroll 系列一样为负值
5. 行内元素的 client 系列与 scroll 系列值均为 0，offset 系列值正常计算
6. 除了`scrollLeft、scrollTop`在使用显示比例缩放的系统上可能会是一个小数，其他属性均为四舍五入的整数。

建议使用`Element.getBoundingClientRect()`获取位置属性，结果为相对于页面文档流起点方向的小数（MDN 中说现代浏览器对于返回结果能够修改，但测试发现修改没有效果）

如果获取元素是否出现在页面中，还可以使用 IntersectionObserver，更方便且性能更佳，在我[另一篇文章](https://juejin.cn/post/7038895741686792206)里有相关介绍

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b95dd5f7e24405893fbe5ff9980f26d~tplv-k3u1fbpfcp-watermark.image?)

## 比较有意思的点

1. 无论是`content-box`还是`border-box`,滚动条始终抢用`content`像素位置。`padding`在滚动条内侧，大小不变；
2. 浏览器计算位置数值会把被溢出隐藏的 padding 部分提到 content 盒子内计算（看下面的图）
3. 谷歌浏览器滚动条默认 17px，body 的 margin 默认 8px

浏览器开发者工具中显示的数值与上述属性得到的值一致，但页面显示中因为被滚动条挤压，`content`实际像素可能小于计算数值

- `box-sizing=content-box`时，`content`等于`width或height - 滚动条`，开发者工具指示区域实际像素等于开发者工具显示数值;
- `box-sizing=border-box`时，`content`等于`width - border*2 - padding*2 - 滚动条`，开发者工具指示区域实际像素小于开发者工具显示数值。

`box-sizing = content-box 时：`

![content-box](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7442e4f658e64bb18a574a473e16734b~tplv-k3u1fbpfcp-watermark.image?)

`boxsizing = border-box 时：`

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4b79202db7bb4cf1b9255c2bd99b2636~tplv-k3u1fbpfcp-watermark.image?)
