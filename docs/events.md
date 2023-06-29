# 事件列表
### 核心
- [loaded](#loaded)
- [ready](#ready)
- [websocketConnected](#websocketConnected)
- [websocketDisconnected](#websocketDisconnected)
### 訊息
- [palert](#palert)
- [report](#report)
- [eew](#eew)
- [tsunami](#tsunami)
### 測站
- [rtsAlert](#rtsAlert)
- [rtsDetectionStrong](#rtsDetectionStrong)
- [rtsDetectionShake](#rtsDetectionShake)
- [rtsDetectionWeak](#rtsDetectionWeak)
- [rtsPgaHigh](#rtsPgaHigh)
- [rtsPgaLow](#rtsPgaLow)

---

## loaded
#### 當所有插件已加載完畢
### 參數
- plugins_info `所有插件的相關資訊`
> **Warning**  
> 不推薦在此處開始執行插件，可能導致錯誤，更好的選擇為使用 [ready](#ready)

## ready
#### 當軟體已全部初始化完成

## websocketConnected
#### 當軟體和伺服器建立連接

## websocketDisconnected
#### 當軟體和伺服器中斷連接

## palert
#### 當收到 P-Alert 近即時震度
### 參數
- data `palert 資料`
```json
{
    "type": "palert",
    "time": 1687478753000,
    "timestamp": 1687478792771,
    "final": true,
    "link": "https://pbs.twimg.com/media/FzRBc76aMAAlhgM.png",
    "intensity": [
        {
            "loc": "臺南市 麻豆區",
            "intensity": 1
        },
        {
            "loc": "臺南市 六甲區",
            "intensity": 1
        },
        {
            "loc": "臺南市 官田區",
            "intensity": 1
        },
        {
            "loc": "臺南市 大內區",
            "intensity": 1
        },
        {
            "loc": "臺南市 佳里區",
            "intensity": 1
        },
        {
            "loc": "臺南市 西港區",
            "intensity": 1
        },
        {
            "loc": "臺南市 新化區",
            "intensity": 1
        },
        {
            "loc": "臺南市 善化區",
            "intensity": 1
        },
        {
            "loc": "臺南市 新市區",
            "intensity": 1
        },
        {
            "loc": "臺南市 安定區",
            "intensity": 1
        },
        {
            "loc": "臺南市 山上區",
            "intensity": 1
        },
        {
            "loc": "臺南市 玉井區",
            "intensity": 1
        },
        {
            "loc": "臺南市 楠西區",
            "intensity": 1
        },
        {
            "loc": "臺南市 南化區",
            "intensity": 1
        },
        {
            "loc": "臺南市 左鎮區",
            "intensity": 1
        },
        {
            "loc": "臺南市 仁德區",
            "intensity": 1
        },
        {
            "loc": "臺南市 歸仁區",
            "intensity": 1
        },
        {
            "loc": "臺南市 關廟區",
            "intensity": 1
        },
        {
            "loc": "臺南市 龍崎區",
            "intensity": 1
        },
        {
            "loc": "臺南市 永康區",
            "intensity": 1
        },
        {
            "loc": "臺南市 東區",
            "intensity": 1
        },
        {
            "loc": "臺南市 南區",
            "intensity": 1
        },
        {
            "loc": "臺南市 北區",
            "intensity": 1
        },
        {
            "loc": "臺南市 安南區",
            "intensity": 1
        },
        {
            "loc": "臺南市 安平區",
            "intensity": 1
        },
        {
            "loc": "臺南市 中西區",
            "intensity": 1
        },
        {
            "loc": "高雄市 阿蓮區",
            "intensity": 1
        },
        {
            "loc": "高雄市 湖內區",
            "intensity": 1
        },
        {
            "loc": "高雄市 內門區",
            "intensity": 1
        }
    ],
    "tiggered": 10,
    "md5": "d1/60heCFRKQ9efqd6hMirYShxZFFtfSZHKwt8rXOKcduJ6bh7yQkdzO79h5Akg9/VjJb7ygRAbiPWZ4t8C0Ww=="
}
```

## report
#### 當收到 地震報告
### 參數
- data `地震報告 資料`
```json
{
    "type": "report",
    "time": 1687971635000,
    "lon": 121.24,
    "lat": 23.26,
    "depth": 16.1,
    "scale": 3.5,
    "timestamp": 1687971801193,
    "id": 112000,
    "location": "花蓮縣政府南南西方 89.9 公里 (位於花蓮縣卓溪鄉)",
    "cancel": false,
    "max": 2,
    "raw": {
        "identifier": "CWB-EQ112000-2023-0629-010035",
        "earthquakeNo": 112000,
        "epicenterLon": 121.24,
        "epicenterLat": 23.26,
        "location": "花蓮縣政府南南西方 89.9 公里 (位於花蓮縣卓溪鄉)",
        "depth": 16.1,
        "magnitudeValue": 3.5,
        "originTime": "2023/06/29 01:00:35",
        "data": [
            {
                "areaName": "臺東縣",
                "areaIntensity": 2,
                "eqStation": [
                    {
                        "stationName": "海端",
                        "stationLon": 121.21,
                        "stationLat": 23.15,
                        "distance": 12.76,
                        "stationIntensity": 2
                    }
                ]
            }
        ],
        "ID": [],
        "trem": [
            "543"
        ]
    },
    "md5": "iPclZwWvLSZqGDbFG0Jj8PkW/RTDVqBn/CZOZ4L7aYWr9JaFOAKiWu50HFHzyGQ7oUnJ3jVuvyFd82ylDgcyfg=="
}
```

## eew
#### 當收到 地震預警
### 參數
- data `地震預警 資料`
```json
{
    "type": "eew-cwb",
    "time": 1687459534000,
    "lon": 121.57,
    "lat": 24.64,
    "depth": 40,
    "scale": 4.5,
    "timestamp": 1687512403249,
    "number": 1,
    "id": "1120390",
    "location": "宜蘭縣三星鄉",
    "cancel": false,
    "max": 2,
    "alert": false,
    "md5": "Ae/mJ9hHwa9njz9fSA55yZKAtLxxSqyOQ323vSIIvxiTlNbG8w67cHtTLnXjvjiT7aLXguJVoLbLWzFP4s1XOg=="
}
```

## tsunami
#### 當收到 海嘯警報
### 參數
- data `海嘯警報 資料`
```json
{
    "type": "tsunami",
    "time": 1364407980000,
    "lon": "146.800",
    "lat": "20.200",
    "depth": "30.0",
    "scale": "8.3",
    "timestamp": 1687878631410,
    "number": "1",
    "id": "102001",
    "location": "馬里亞那群島",
    "cancel": false,
    "area": [
        {
            "areaDesc": "臺東縣成功鎮至屏東縣滿州鄉沿岸",
            "areaName": "東南沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T05:11:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "宜蘭縣南澳鄉至臺東縣長濱鄉沿岸",
            "areaName": "東部沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T05:12:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "宜蘭縣頭城鎮至蘇澳鎮沿岸",
            "areaName": "東北沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T05:24:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "臺南市至屏東縣恆春鎮沿岸",
            "areaName": "西南沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T05:32:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "新北市及基隆市沿岸",
            "areaName": "北部沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T05:37:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "桃園縣至嘉義縣沿岸，以及澎湖縣、金門縣與連江縣等離島區域",
            "areaName": "海峽沿海地區",
            "waveHeight": "小於1公尺",
            "arrivalTime": "2013-03-28T06:30:00+08:00",
            "areaColor": "黃色",
            "infoStatus": "predict"
        },
        {
            "areaDesc": "預估海嘯波高小於1公尺地區",
            "areaName": "東南沿海地區、東部沿海地區、東北沿海地區、西南沿海地區、北部沿海地區、海峽沿海地區",
            "waveHeight": "小於1公尺",
            "areaColor": "黃色",
            "infoStatus": "predict"
        }
    ],
    "md5": "XEXuDadXFAmNWrtF/V6yIdBoOxNk2oL1KTfH+Xlb6GiYVv5w22jpgpXjZ5QZ+lmK4SiO+2jr7nL5a6kig/JQow=="
}
```

## rtsAlert
#### 當 即時測站 地震檢知

## rtsDetectionStrong
#### 當 即時測站 強震檢測

## rtsDetectionShake
#### 當 即時測站 震動檢測

## rtsDetectionWeak
#### 當 即時測站 弱反應

## rtsPgaHigh
#### 當 即時測站 PGA 大於 `200gal`

## rtsPgaLow
#### 當 即時測站 PGA 大於 `8gal`