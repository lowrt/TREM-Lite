## 清除地震報告緩存
```js
storage.setItem("report_data", []);
```

## 接收地震資訊
#### 關閉
```js
storage.setItem("show_reportInfo",false)
```
#### 啟用
```js
storage.setItem("show_reportInfo", true)
```

## 語音朗讀功能
#### 關閉
```js
storage.removeItem("speecd_use")
```
#### 啟用
```js
storage.setItem("speecd_use", true)
```

## 自動縮放功能
#### 關閉
```js
storage.setItem("disable_autoZoom", true)
```
#### 啟用
```js
storage.removeItem("disable_autoZoom")
```
