---
title: 云函数实现自动打卡
author: Xavi
date: "2020-07-11"
---

&emsp;&emsp;今年因为疫情原因估计大部分大学生都得每日健康打卡，早就想写一个自动打卡的小程序，之前因为了解的不够多感觉必须得要台服务器才能实现所以就放弃了。最近学校都放假了结果还要求每日打卡，又才大费周章的去找办法，了解到腾讯云云函数这玩意。于是果断写了这个自动打卡程序，主要做个记录和分享思路，各个打卡系统的细节和复杂程度会不一样。
@[TOC](目录)

## 云函数

&emsp;&emsp;腾讯云函数简单说就是腾讯给你出服务器，让你可以跑你自己的程序，目前支持 python、node、php、java、golang，写这种小程序就用 python 再舒服不过了。使用直接在腾讯云中注册然后产品中找到云函数，每月能够免费运行 100 万次，自己用也是绰绰有余。

## 程序原理

&emsp;&emsp;我学校每日打卡就是一个自建的简单网站，通过登录和提交表单打卡，所以用 python 的 requests 库模拟登录和模拟 post 提交表单能够快速完成，唯一的难点在于分析不同网站的请求方式与细节

## 模拟登录

&emsp;&emsp;用开发者工具分析网络请求能看出来登录就是简单的 post 方法提交账号和密码，所以用 requests 的 post 方法，再带上 data 表单数据和基本的 headers 请求头就能实现。（复杂点的可能会密码加密，解密出加密方式就能解决）
![登录分析](https://img-blog.csdnimg.cn/20200711152505876.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjYxMDI2MA==,size_16,color_FFFFFF,t_70)
&emsp;&emsp;模拟登录后还需要提交表单所以要保持网站的会话连接，相当于记住 cookie 并传递给后面访问的页面，所以使用 requests 的 session 方法就能达到在同一 cookie 下访问的目的。

```python
s = requests.session()
url = 'http://vote.abtu.edu.cn/fy/app/login'
data = {
        'username': 'xxx',
        'password': 'xxx'
    }
headers = {
        'Referer': 'http://vote.abtu.edu.cn/fy/applogin.jsp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36'
    }
    s.post(url, data=data, headers=headers)
```

## 模拟提交表单

&emsp;&emsp;登录后有个打卡按钮，点击按钮跳转到表单页面，表单页面又是个按钮把数据提交到验证页面，按钮都是用于触发提交表单所以不用理会，直接通过开发者工具中的 network 查看请求，或分析源码找到请求地址、方式，再模拟提交表单就能完成。
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020071115444259.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjYxMDI2MA==,size_16,color_FFFFFF,t_70)
&emsp;&emsp;表单最后一项 code 是个时间戳，python 也有时间戳的函数就没管这个什么用，直接加上去就完事(python 的时间戳是小数，默认位数刚好跟 js 时间戳除 1000 的位数一样，所以直接转整型使用。

```python
import time
data = {
	...
	'code': int(time.time())
	}
```

&emsp;&emsp;通过程序源码和模拟提交表单后的请求查看里可以看到表单提交的目标位置，以及提交参数的格式，这下就变得容易了。
![在这里插入图片描述](https://img-blog.csdnimg.cn/2020071116430537.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjYxMDI2MA==,size_16,color_FFFFFF,t_70)
&emsp;&emsp;这里需要分辨请求是直接传输还是通过 json 格式传输（简单说就是 accept 是希望接收的数据格式，content-type 是发出去的数据格式，是 json 就得先把数据转 json 格式，如图划线的就直接使用 python 字典格式就行），请求头中还有其他数据，把感觉有用的添加到 headers 中去就行（是否必要可以测试）。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200711155614896.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjYxMDI2MA==,size_16,color_FFFFFF,t_70)

```python
url2 = 'http://vote.abtu.edu.cn/fy/student_epidemic/addStudentEpidemicRecord'
data2 = {
        'addr': 'xx省 xx市 xx县',
        'isMeetingEpidemicPeople': '否',
        'meetingTime': '',
        'isReportingLocal': '',
        'recentActionPath': '',
        'symptom': '否',
        'temperature': '36.5',
        'isChecking': '否',
        'checkingResult': '',
        'isIsolating': '否',
        'isolatingType': '',
        'isWorking': '否',
        'workingAddr': '',
        'realationHealthState': '是',
        'goneToEpidemicArea': '否',
        'currentMeetingEpidemicPeople': '否',
        'travel': '无',
        'telephone': 'xxxxxxxxxxx',
        'description': '',
        'workingProvinceInorOut': '',
        'code': int(time.time())
    }
headers2 = {
        'Host': 'vote.abtu.edu.cn',
        'Origin': 'http://vote.abtu.edu.cn',
        'Referer': 'http://vote.abtu.edu.cn/fy/pages/app/student_main1.jsp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36'
    }
response = s.post(url=url2, headers=headers2, data=data2)
```

## 云函数部署

&emsp;&emsp;注册腾讯云再使用云函数创建一个 python3.6 的空白函数，再写入代码就行，需要注意的是云函数的触发方式，我设置的自定义每天 8：30 定时触发，按他给的 cron 格式也就是“0 30 8 \* \* \* \*”

## 完整代码

&emsp;&emsp;考虑到学校服务器经常不稳，连这个打卡系统之前都崩过，而云函数的触发方式好像没有函数出错后多久再次运行的方式，所以我用 [server 酱](http://sc.ftqq.com/3.version) 添加了一个打卡失败自动微信提示的功能。
&emsp;&emsp;程序完整代码如下，直接使用需要修改账号、密码、表单内容、server 酱地址：

```python
# -*- coding: utf8 -*-
import json
import time
import requests
def main_handler(event, context):
    url = 'http://vote.abtu.edu.cn/fy/app/login'
    url2 = 'http://vote.abtu.edu.cn/fy/student_epidemic/addStudentEpidemicRecord'
    data = {
        'username': '账号',
        'password': '密码'
    }
    data2 = {
        'addr': '四川省 **市 **县',
        'isMeetingEpidemicPeople': '否',
        'meetingTime': '',
        'isReportingLocal': '',
        'recentActionPath': '',
        'symptom': '否',
        'temperature': '36.5',
        'isChecking': '否',
        'checkingResult': '',
        'isIsolating': '否',
        'isolatingType': '',
        'isWorking': '否',
        'workingAddr': '',
        'realationHealthState': '是',
        'goneToEpidemicArea': '否',
        'currentMeetingEpidemicPeople': '否',
        'travel': '无',
        'telephone': '电话号',
        'description': '',
        'workingProvinceInorOut': '',
        'code': int(time.time())
    }
    headers = {
        'Referer': 'http://vote.abtu.edu.cn/fy/applogin.jsp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36'
    }
    headers2 = {
        'Host': 'vote.abtu.edu.cn',
        'Origin': 'http://vote.abtu.edu.cn',
        'Referer': 'http://vote.abtu.edu.cn/fy/pages/app/student_main1.jsp',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36'
    }
    s = requests.session()
    try:
        s.post(url, data=data, headers=headers, timeout=5)
        response = s.post(url=url2, headers=headers2, data=data2, timeout=5)
    except:
        requests.get('server酱地址?text=登录页访问超时，打卡失败')
        return 'timeout'
    if json.loads(response.text)['msg'] == '提交成功':
        return 'success'
    else:
        requests.get('server酱地址?text=自动打卡失败')
        return 'fail'

    #return信息能在云函数日志中查看
```
