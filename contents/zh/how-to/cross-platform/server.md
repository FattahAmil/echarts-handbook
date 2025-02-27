# 服务端渲染 ECharts 图表

通常情况下，Apache ECharts<sup>TM</sup> 会在浏览器中动态的渲染图表，并且根据用户的交互来更新渲染。但是在下面这些比较特殊的场景，我们也需要在服务端中渲染图表并且输出到浏览器中：

- 需要缩短前端的渲染时间，保证第一时间显示图表
- 需要在 Markdown, PDF 等不支持动态运行脚本的环境中嵌入图表

在这些场景下，ECharts 也提供了两种服务端渲染（server-side rendering，SSR）的方案：SVG 渲染或 Canvas 渲染。

| 渲染方案           | 渲染结果的形式  | 优点              |
| ----------------- | ----------------- | ----------------- |
| 服务端 SVG 渲染     | SVG 字符串 | 比 Canvas 图片体积更小；<br>矢量 SVG 图片不会模糊；<br>支持初始动画 |
| 服务端 Canvas 渲染  | 图片       | 图片形式适用场景更广泛，对不支持 SVG 的场景可选择 |

通常情况下，应优先考虑使用服务端 SVG 渲染方案，如果 SVG 不适用，也可以考虑 Canvas 渲染方案。

使用服务端渲染也有一定的局限性，尤其是和交互相关的一些操作无法支持。因此，如果有交互需求，可参考下文的“服务端渲染 Hydration”。

## 服务端 SVG 渲染

如果你在使用 5.3.0 以及更新的版本，我们强烈推荐你使用 5.3.0 里新引入的零依赖的服务端 SVG 字符串渲染方案：

```ts
const echarts = require('echarts');

// 在 SSR 模式下第一个参数不需要再传入 DOM 对象
const chart = echarts.init(null, null, {
  renderer: 'svg', // 必须使用 SVG 模式
  ssr: true, // 开启 SSR
  width: 400, // 需要指明高和宽
  height: 300
});

// 像正常使用一样 setOption
chart.setOption({
  //...
});

// 输出字符串
const svgStr = chart.renderToSVGString();

// 如果不再需要图表，调用 dispose 以释放内存
chart.dispose();
chart = null;
```

整体使用的代码结构跟在浏览器中使用一样，首先是`init`初始化一个图表实例，然后通过`setOption`设置图表的配置项。但是`init`传入的参数会跟在跟浏览器中使用有所不同：

- 首先因为在服务端会采用字符串拼接的方式来渲染得到 SVG，我们并不需要容器来展示渲染的内容，所以我们可以在`init`的时候第一个`container`参数传入`null`或者`undefined`。
- 然后我们在`init`的第三个参数中，我们需要通过显示指定`ssr: true`来告诉 ECharts 我们需要开启服务端渲染的模式，该模式下 ECharts 会关闭动画循环的模块以及事件交互的模块。
- 在服务端渲染中我们也必须要通过`width`和`height`显示的指定图表的高和宽，因此如果你的图表是需要根据容器大小自适应的话，可能需要思考一下服务端渲染是否适合你的场景了。

在浏览器中我们在`setOption`完之后 ECharts 就会自动进行渲染将结果绘制到页面中，后续也会在每一帧判断是否有动画需要进行重绘。NodeJS 中我们在设置了`ssr: true`后则没有这个过程。取而代之我们使用了`renderToSVGString`，将当前的图表渲染到 SVG 字符串，进一步得再通过 HTTP Response 返回给前端或者缓存到本地。

HTTP Response 返回给前端：

```ts
res.writeHead(200, {
  'Content-Type': 'application/xml'
});
res.write(chart.renderToSVGString());
res.end();
```

或者保存到本地：

```ts
fs.writeFile('bar.svg', chart.renderToSVGString(), 'utf-8');
```

下面是一个完整的在 CodeSandbox 中搭建一个最简单的 NodeJS 服务器然后使用 ECharts 服务端 SVG 渲染的效果：

<iframe src="https://codesandbox.io/embed/heuristic-leftpad-oq23t?autoresize=1&codemirror=1&fontsize=12&hidenavigation=1&&theme=dark"
     style="width:100%; height:400px; border:0; border-radius: 4px; overflow:hidden;"
     title="heuristic-leftpad-oq23t"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

### 服务端渲染中的动画效果

上面的例子中可以看到，就算是服务端渲染 ECharts 也可以提供动画效果，这个动画效果是通过在输出的 SVG 字符串中嵌入 CSS 动画实现的。并不需要额外的 JavaScript 再去控制动画。

但是，也因为 CSS 动画的局限性，我们没法在服务端渲染中实现一些更灵活的动画功能，诸如柱状图排序动画，标签动画，路径图的特效动画等。部分系列诸如饼图的动画效果也为服务端渲染做了特殊的优化。

如果你不希望有这个动画效果，可以在`setOption`的时候通过`animation: false`关闭动画。

```ts
setOption({
  animation: false
});
```

## 服务端 Canvas 渲染

如果你希望输出的是一张图片而非 SVG 字符串，或者你还在使用更老的版本，我们会推荐使用 [node-canvas](https://github.com/Automattic/node-canvas) 来实现 ECharts 的服务渲染，[node-canvas](https://github.com/Automattic/node-canvas) 是在 NodeJS 上的一套 Canvas 实现，它提供了跟浏览器中 Canvas 几乎一致的接口。

下面是一个简单的例子

```ts
var echarts = require('echarts');
const { createCanvas } = require('canvas');

// 在 5.3.0 之前的版本中，你必须要通过该接口注册 canvas 实例创建方法。
// 从 5.3.0 开始就不需要了
echarts.setCanvasCreator(() => {
  return createCanvas();
});

const canvas = createCanvas(800, 600);
// ECharts 可以直接使用 node-canvas 创建的 Canvas 实例作为容器
const chart = echarts.init(canvas);

// 像正常使用一样 setOption
chart.setOption({
  //...
});

const buffer = renderChart().toBuffer('image/png');

// 如果不再需要图表，调用 dispose 以释放内存
chart.dispose();
chart = null;

// 通过 Response 输出 PNG 图片
res.writeHead(200, {
  'Content-Type': 'image/png'
});
res.write(buffer);
res.end();
```

下面是一个完整的在 CodeSandbox 中搭建一个最简单的 NodeJS 服务器然后使用 ECharts 服务端 Canvas 渲染的效果：

<iframe src="https://codesandbox.io/embed/apache-echarts-canvas-ssr-demo-e340rt?autoresize=1&codemirror=1&fontsize=12&hidenavigation=1&&theme=dark"
     style="width:100%; height:400px; border:0; border-radius: 4px; overflow:hidden;"
     title="heuristic-leftpad-oq23t"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

### 图片的加载

[node-canvas](https://github.com/Automattic/node-canvas) 提供了图片加载的`Image`实现，如果你在图表中使用了到了图片，我们可以使用`5.3.0`新增的`setPlatformAPI`接口来适配。

```ts
echarts.setPlatformAPI({
  // 同老版本的 setCanvasCreator
  createCanvas() {
    return createCanvas();
  },
  loadImage(src, onload, onerror) {
    const img = new Image();
    // 必须要绑定 this context.
    img.onload = onload.bind(img);
    img.onerror = onerror.bind(img);
    img.src = src;
    return img;
  }
});
```

如果你的图片是需要远程获取的，我们建议你通过 http 请求先预取该图片得到`base64`之后再作为图片的 URL 传入，这样可以保证在 Response 输出的时候图片是加载完成的。

## 服务端渲染 Hydration

服务端渲染无法支持的功能包括：

- 动态改变数据
- 高亮鼠标所在的数据项
- 点击图例切换系列是否显示
- 移动鼠标显示提示框
- 其他交互相关的功能

如果有相关需求，可以考虑先使用服务端渲染快速输出首屏图表，然后等待 `echarts.js` 加载完后，重新在客户端渲染同样的图表（称为 Hydration），这样就可以实现正常的交互效果和动态改变数据了。需要注意的是，在客户端渲染的时候，应开启 `tooltip: { show: true }` 之类的交互组件，并且用 `animation: 0` 关闭初始动画（初始动画应由服务端渲染结果的 SVG 动画完成）。

下面是一个在 CodeSandbox 中搭建一个例子，先用 SVG 做服务端渲染，再用 Canvas 做客户端渲染的效果。建议点击“Open Sandbox”学习具体实现的代码。

> 如果希望使用 Canvas 做服务端渲染，或使用 SVG 做客户端也是类似的，不再赘述。

<iframe src="https://codesandbox.io/embed/apache-echarts-5-3-ssr-csr-0jvsdu?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:400px; border:0; border-radius: 4px; overflow:hidden;"
     title="Apache ECharts 5.3 SSR + CSR"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

我们可以看到，从用户体验的角度，几乎感受不到二次渲染的过程，整个切换效果是非常无缝衔接的。你也可以像上面的例子中一样，在加载 `echarts.js` 的过程中使用 [pace-js](https://www.npmjs.com/package/pace-js) 之类的库实现显示加载进度条的效果，来解决 ECharts 尚未完全加载完之前没有交互反馈的问题。
