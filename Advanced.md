## 清除地震報告緩存
```js
storage.setItem("report_data", []);
```

## 地震資訊彈窗
#### 關閉
```js
storage.getItem("show_reportInfo",false)
```
#### 啟用
```js
storage.getItem("show_reportInfo",true)
```
