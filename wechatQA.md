## 该公众号暂时无法提供服务，请稍后再试。这个问题你一般要检查哪些方面？
* 微信服务器无法保证在5s内处理并回复，但一般这种情况很少发生。
* 回复给微信服务器的xml数据的格式中有多余的空格。解决方式就是仔细检查呗。
* 回复的文本内容时，options.content = '' 。解决方式可以在文本内容回复的模块中，在其最后判断一下，若为空，就强行设计一个字段内容给content，以免出现此类错误，亦可定位一些问题的源头。一举多得。




## 微信公众号开发过程中你是如何操作微信功能接口管理的？
在开发者文档中可以看到，大致会有全局唯一凭据，ticket票据，素材管理（永久/临时的上传更新删除），菜单管理，标签管理，群发消息管理的一系列接口的操作。我会将以上的这些接口统一放在一个wechat的模块中去定义。
在具体定义接口的过程中，我一般是根据开发者文档的说明去设计接口。大概的思路就是看三个部分信息：接口调用请求说明，通过它我一般可以知道请求地址URL；调用示例，通过它我就知道我应该在请求方式中加入什么样的参数和使用怎样的请求方式；返回说明，通过它可以知道返回的信息格式，已进行下一步的处理。

在调用示例中，看看请求方式应该怎么设计。一般有三种。

* 第一，一般直接给个URL即可，不需要其他请求参数。就如，rp({method: 'GET', json: true, url})。具体的接口如获取素材总数，查询菜单接口，获取公众号已创建的标签等等。这些只要设计URL直接请求即可。
* 第二，一般是加个请求参数body。看调用示例，如果有一个对象需要传参的话那么一般就是加上body。rp({method: 'POST', json: true, url, body})。
* 第三，就是看调用示例，有说使用curl命令，那么就是使用formDate的形式。这种情况是一种流式的读写操作了，那么我们不用rp请求方式（request-promise-native）而是用request请求方式，这样可以通过pipe管道的形式去读写文件。

在我印象中，上传新增永久素材的接口定义是相对比较复杂的。上传永久素材接口的逻辑大致为：

* 1.他有三种请求地址（news，pic[图文中的图片素材] ,others[视频，音频，缩略图，普通图片]）,可以根据type来决定请求地址
* 2.他们的请求参数也不一样，news的话是直接对象放在一个请求体body中去请求的。这个body就是存放图文列表的json对象即可。
* 2.而pic和others就是通过formData去设置。所以用一个optation配置对象把他们直接处理，在formDate上直接添加body，formDate的属性。直接设计以formDate形式去请求地址，因为是上传素材，故用可读流即可，options.formData = {media: createReadStream(material[本地上传素材地址])}
* 3.另外注意一个问题咯，在文档中可以看出如果这个是others类型中的video素材那么就要去在body上带一个对象参数去请求。
* 4.最后只要rp(options).then().catch()

通过以上呢，大概也可知道微信开发中请求方式一般有三种：

* 请求查询字符串的形式
* {}调用，其包含描述信息，如图文素材的列表描述信息。以请求体body用rp去请求。
* formDate的流式的读写形式，那么就一般用require去请求。



## 在请求资源URL有中文时，会被解析转义成%&@-·*这样的字符，你是如何处理？
我们在微信开发中，会有根据用户的文本信息或语音识别的结果文本信息去一些公用的豆瓣API去动态请求一些数据，在这种情景下，URL上会有我们拼串中有中文，这个时候就会被解析成各种不规则的字符，我一般会用queryString（qs）去处理，使其不被转义。

```
//1.去豆瓣请求资源，获取数据(用户文本信息)
      const url = 'https://api.douban.com/v2/movie/search';
      const {subjects} = await rp({method: 'GET',json:true,url,qs:{count:8,q:message.Content}});
//1.去豆瓣请求资源，获取数据(用户语音识别)
    const url = 'https://api.douban.com/v2/movie/search';
    const {subjects} = await rp({method: 'GET',json:true,url,qs:{count:8,q:message.Recognition}});
```


## 爬取数据的一些开发经验
之前有了解过爬取数据，我用的是puppeteer这个Google开发的插件。无头浏览器，就是在后台打开一个浏览器，然后去通过URL去爬取相应的数据。一般而言有五个步骤。

```

//无头浏览器：可以后台运行浏览器（没有界面显示）
//puppeteer需要下载（Google）很棒的.五个步骤
/*这个模块式专门用来爬取文件的，传递一个URL，就去捕获其相应的数据并且调用时返回这个函数值*/

//一般是下载到开发者Dev依赖关系上
const puppeteer = require('puppeteer');

function timeout() {
  return new Promise(resolve => setTimeout(resolve, 2000));
}

//暴露给外头一个函数，传递参数URL，去打开这个URL
module.exports = async (url) => {
  //1.打开浏览器（异步）
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']  //不要打开界面，在后台运行-沙盒
  });
  //2.打开一个页面
  const page = await browser.newPage();
  //3.跳转到指定网址的页面
  await page.goto(url, {
    waitUntil: 'networkidle0'  //等待网络空闲时，再访问
  });

  //延时两秒操作
  await timeout();


  //4.对页面进行操作（爬取数据-进行DOM操作-我们可以知道豆瓣使用jQuery）
  const result = await page.evaluate(() => {
    //获取片长
    const runtime = $('[property="v:runtime"]').text();
    //获取上映时间
    const releaseDate = $('[property="v:initialReleaseDate"]').text();
    //获取电影简介
    const summary = $('[property="v:summary"]').text().replace(/\s/g, '');
    //将数据返回出去
    return {
      runtime,
      releaseDate,
      summary
    }
  });
  //5.关闭浏览器
  await browser.close();
  
  console.log(result);
  //将爬取的结果返回出去
  return result;
};

```

## 你有用过微信JS-SDK么，详细说明下你的项目中的使用？
微信JS-SDK是微信公众平台 面向网页开发者提供的基于微信内的网页开发工具包。

通过使用微信JS-SDK，网页开发者可借助微信高效地使用拍照、选图、语音、位置等手机系统的能力，同时可以直接使用微信分享、扫一扫、卡券、支付等微信特有的能力，为微信用户提供更优质的网页体验。

一般分为三个步骤：

* 步骤一：绑定域名
	* 先登录微信公众平台进入“公众号设置”的“功能设置”里填写“JS接口安全域名”。

* 步骤二：引入JS文件
  ```<!--JS-SDK-->
  <script type="text/javascript" src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>```
  ```
* 步骤三：通过config接口注入权限验证配置 会多出来一个wx的对象。

在项目中使用过智能音频识别接口wx.translateVoice。根据开始录音wx.startRecord();结束录音wx.stopRecord 会去返回一个localId音频的ID，这个时候调用wx.translateVoice这个接口就去智能识别语音，将结果放在URL中去请求数据。然后通过` var url = 'https://api.douban.com/v2/movie/search?q=' + res.translateResult + '&callback=?'`去请求数据：$.getJSON(URL,function(data){})来获取json数据。
当时我在处理这个search.ejs模板的时候遇到一个问题，就是跨域。最后在后面加上&callback=？解决跨域问题。

## 微信服务器和开发者服务器之间的数据处理你是怎么完成的？
* 在验证了服务器的有效性之后（req.method==='GET'）
* 然后去处理微信服务器发过来的用户信息（req.method === 'POST'）
* 获取用户的信息，返回一个xml数据：const xmlData = await getUseDataAsync(req);
  * req这个对象，流式数据。通过req.on(data ,userdate=>{})  req.on(end)。这个过程是异步的，外面包裹着一层promise。
* 将XML转为JS对象 const jsData = await  parseXmlAsync(xmlData);'
	* 这里引入了一个解析XML的模块，const {parseString}=require('xml2js');parseString(xmlData,{trim: true},(err,data)=>{} 这个过程也是异步的，外面包裹着一层promise。
* 将JS对象格式化好，成为一个好处理的对象，然后就可以用对象.属性的方式去做。const message = formatMessage(jsData);
	* 去掉XML，去掉非法的数据（空字符串或空数组的一些数据），转为对象.属性的方式保存。使用forin去遍历这个对象里的属性，每个属性值是一个数组。这个过程是同步的代码。
* 然后将给reply模块去处理。const replyMessage = await reply(message);reply模块里面再去调用template(options)模块，去返回一个XML数据给微信服务器。




##如何验证微信服务器的有效性？

首先，微信服务器发送两种请求，在这里处理get请求-->验证服务器有效性   post请求--接受微信服务器给开发者的服务器的用户数据。

在get请求的判断下，可以验证服务器的有效性：

   1.将**token**、**timestamp**、**nonce**三个参数按字典序排序

2. 将三个参数拼接成**1**个字符串，然后用**sha1**进行加密

   3.将加密后的字符串与**signature**进行对比，如果正确无误返回**echostr**给微信后台

```
const shaStr = sha1([timestamp,nonce,token].sort().join(''));
 if(shaStr === signature){
        //像微信服务器发送一个echostr说明已经成功连接了。微信服务器就靠这个参数等待着。
        res.send(echostr);
      }else{
        res.send('');
        
        
     signature: 微信的加密签名，结合你的token，timestamp和nonce经过某种算法生成的
     echostr: 随机字符串，微信后台随机生成的
     timestamp: 时间戳，对应当前时间
     nonce: 随机数，微信后台随机生成的
```



## 你认为在微信开发中最难的是啥？遇到过什么问题呢？

在微信开发过程中，主要是获取唯一凭据最难。



