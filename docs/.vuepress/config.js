module.exports = {
  head: [
    [
      "link", // 设置 favicon.ico，注意图片放在 public 文件夹下
      { rel: "icon", href: "favicon.ico" },
    ],
  ],
  base: "/blog/",
  title: "Xavi的博客",
  description: "前端博客",
  theme: "reco",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  themeConfig: {
    subSidebar: "auto",
    nav: [
      { text: "首页", link: "/" },
      {
        text: "Xavi的博客",
        items: [
          { text: "Github", link: "https://github.com/Xaviw" },
          { text: "掘金", link: "https://juejin.cn/user/3192637500426840" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Javascript",
        path: "/",
        collapsable: false,
        children: [
          { title: "通俗易懂的原型链", path: "/handbook/prototypeChain" },
          { title: "优化使用懒加载", path: "/handbook/optimizeLazyLoad" },
          { title: "Web常用位置属性", path: "/handbook/webLocationProperties" },
          { title: "min-width解决元素撑大容器", path: "/handbook/minWidth" },
          {
            title: "使用指令快速实现元素空状态",
            path: "/handbook/emptyByDirective",
          },
          { title: "ngZorro表格联动", path: "/handbook/ngZorroLinkageTable" },
          { title: "云函数实现自动打卡", path: "/handbook/cloudFunction" },
        ],
      },
    ],
  },
};
