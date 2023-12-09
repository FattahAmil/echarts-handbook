(window.webpackJsonp=window.webpackJsonp||[]).push([[48],{346:function(n,t,e){"use strict";e.r(t),t.default="# Dynamic Sorting Bar Chart\n\n## Related Options\n\nBar race is a chart that shows changes in the ranking of data over time and it is supported by default since ECharts 5.\n\n> Bar race charts usually use horizontal bars. If you want to use vertical bars, just take the X axis and Y axis in this tutorial to the opposite.\n\n1. Set `realtimeSort` of the bar series to be `true` to enable bar race\n2. Set `yAxis.inverse` to be `true` to display longer bars at top\n3. `yAxis.animationDuration` is suggested to be set to be `300` for bar reordering animation for the first time\n4. `yAxis.animationDurationUpdate` is suggested to be set to be `300` for bar reordering animation for later times\n5. Set `yAxis.max` to be _n - 1_ where _n_ is the number of bars to be displayed; otherwise, all bars are displayed\n6. `xAxis.max` is suggested to be set to be `'dataMax'` so that the maximum of data is used as X maximum.\n7. If realtime label changing is required, set `series.label.valueAnimation` to be `true`\n8. Set `animationDuration` to be `0` so that the first animation doesn't start from 0; if you wish otherwise, set it to be the same value as `animationDurationUpdate`\n9. `animationDurationUpdate` is suggested to be set to be `3000` for animation update duration, which should be the same as the frequency of calling `setOption`\n10. Call `setOption` to update data to be of next time with `setInterval` at the frequency of `animationDurationUpdate`\n\n## Demo\n\nA complete demo:\n\n```js live\nvar data = [];\nfor (let i = 0; i < 5; ++i) {\n  data.push(Math.round(Math.random() * 200));\n}\n\noption = {\n  xAxis: {\n    max: 'dataMax'\n  },\n  yAxis: {\n    type: 'category',\n    data: ['A', 'B', 'C', 'D', 'E'],\n    inverse: true,\n    animationDuration: 300,\n    animationDurationUpdate: 300,\n    max: 2 // only the largest 3 bars will be displayed\n  },\n  series: [\n    {\n      realtimeSort: true,\n      name: 'X',\n      type: 'bar',\n      data: data,\n      label: {\n        show: true,\n        position: 'right',\n        valueAnimation: true\n      }\n    }\n  ],\n  legend: {\n    show: true\n  },\n  animationDuration: 0,\n  animationDurationUpdate: 3000,\n  animationEasing: 'linear',\n  animationEasingUpdate: 'linear'\n};\n\nfunction run() {\n  var data = option.series[0].data;\n  for (var i = 0; i < data.length; ++i) {\n    if (Math.random() > 0.9) {\n      data[i] += Math.round(Math.random() * 2000);\n    } else {\n      data[i] += Math.round(Math.random() * 200);\n    }\n  }\n  myChart.setOption(option);\n}\n\nsetTimeout(function() {\n  run();\n}, 0);\nsetInterval(function() {\n  run();\n}, 3000);\n```\n"}}]);