//开发者服务器和微信服务器是否连接成功

//整体逻辑：
//1.验证服务器的有效性--微信服务器get请求
//2.微信服务器会将用户消息发给开发者服务器--微信服务器的post请求

/*第一部分的逻辑
  验证服务器的有效性:
    1、填写服务器配置(测试号管理页面)
      - URL 开发者服务器地址（保证能在互联网中能访问）
        通过ngrok http 端口号就得到一个网址
      - Token  参与微信签名的加密
    2、验证服务器地址的有效性
      - 将timestamp、nonce、token三个参数按照字典序排序
      - 将三个参数拼接在一起，进行sha1加密
      - 将加密后生成字符串和微信签名进行对比，
            如果相同说明成功，返回一个echostr给微信服务器，
            如果不相同，说明签名算法出了问题，配置不成功
 */

//引入配置对象
const config = require('../config/index');
const sha1 = require('sha1');

//引入工具
const {getUseDataAsync,parseXmlAsync,formatMessage} = require('../libs/utils');

//引入reply模块
const reply = require('./reply');
module.exports = ()=>{
  return async (req,res,next)=>{
    // console.log(req.query);

    /*{ signature: 'ed594c3d1fb505da191befc767a60fd20ecdaef4',
      echostr: '7065073166744796093',
      timestamp: '1529980937',
      nonce: '2610022891' }
      -----------------------
     signature: 微信的加密签名，结合你的token，timestamp和nonce经过某种算法生成的
     echostr: 随机字符串，微信后台随机生成的
     timestamp: 时间戳，对应当前时间
     nonce: 随机数，微信后台随机生成的

      */
    //获取到一些参数，微信服务器发到我们开发者的一些数据（进行一些加密的参数）
    const {signature,echostr,timestamp,nonce}=req.query;
    //加入一个token参数
    const {token} = config;

    /*// - 将timestamp、nonce、token三个参数按照字典序排序
    const arr = [timestamp,nonce,token].sort();
    //加三个参数拼接
    const str = arr.join('');
    //加密
    const shaStr = sha1(str);*/
    //简写方式
    const shaStr = sha1([timestamp,nonce,token].sort().join(''));

    /*微信服务器发送两种请求，在这里处理
    *get请求--验证服务器有效性
    *post请求--接受微信服务器给开发者的服务器的用户数据。
    *通过
    * */
    if(req.method==='GET'){
      //匹配-将加密后生成字符串和微信签名进行对比
      if(shaStr === signature){
        //像微信服务器发送一个echostr说明已经成功连接了。微信服务器就靠这个参数等待着。
        res.send(echostr);
      }else{
        res.send('');
      }
    }else if(req.method === 'POST'){
      //去处理微信服务器发过来的用户信息
      // console.log(req.query);
      /*这是req.query返回的东西：与之前相比少了nonce: 随机数，多了用户的ID
      * { signature: '282c2671c67f9b16e07f9577dc3d2582161a1fa8',
          timestamp: '1530008981',
          nonce: '358827354',
          openid: 'oDpPB0nzEd0au9OCafh1ycFEr3tU' } //用户的id
      * */
      //处理一些额外的非法请求（非微信服务器发来的请求）
      if(shaStr !== signature){
        res.send('error');
        return;
      }

      //处理是微信服务器发送过来的请求
      //获取用户的信息，返回一个xml数据
      const xmlData = await getUseDataAsync(req);
      // console.log(xmlData);
      /*
      <xml><ToUserName><![CDATA[gh_2d960e4eb010]]></ToUserName>  开发者的ID
      <FromUserName><![CDATA[oDpPB0nzEd0au9OCafh1ycFEr3tU]]></FromUserName>  用户ID
      <CreateTime>1530011490</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[99]]></Content>  发送的内容
      <MsgId>6571349312478521696</MsgId>  消息的ID
      </xml>
      * */

      //将XML转为JS对象
      const jsData = await  parseXmlAsync(xmlData);
      // console.log(jsData);
      /*
      * { xml:
       { ToUserName: [ 'gh_2d960e4eb010' ],
         FromUserName: [ 'oDpPB0nzEd0au9OCafh1ycFEr3tU' ],
         CreateTime: [ '1530012725' ],
         MsgType: [ 'text' ],
         Content: [ '66' ],
         MsgId: [ '6571354616763135108' ] } }
      * */
      //将JS对象格式化好，成为一个对象，然后就可以用对象.属性的方式去做。
      const message = formatMessage(jsData);
      console.log(message);
    /*
    * { ToUserName: 'gh_2d960e4eb010',  开发者ID
        FromUserName: 'oDpPB0nzEd0au9OCafh1ycFEr3tU',  用户ID
        CreateTime: '1530014009',
        MsgType: 'text',
        Content: '55',
        MsgId: '6571360131501146141' }
    * */


    //----------------前面是得到的用户数据--经过了三步骤。---------------
      /*1.得到用户信息。通过监听data和end去读到拼字符串到一个用户的数据，这个是xml对象（异步，外层封装promise）
      *2.将req.query返回的用户xml信息转为js对象（异步，外层封装promise）
      * 3.将js对象转换为一个纯对象并且把属性值的数组形式转换为字符串的形式用forin（同步的）
      * 4.我们将得到的数据来处理我们返回的用户消息（以下）
      * */

    //----------------------------------------------------------
      //返回用户消息
      /*
        1. 假如服务器无法保证在五秒内处理并回复
        2. 回复xml数据中有多余的空格 *****
        如果有以上现象，就会导致微信客户端中的报错：
          '该公众号暂时无法提供服务，请稍后再试'
       */
     /* //设置回复用户的消息内容
      let content = '';
      //对简单文本进行处理
      if(message.MsgType === 'text' ){
        if(message.Content === '1'){
          content='我很稀罕你哦~'
        }else if(message.Content === '2'){
          content='恩，其实你长得很好看。';
        }else if(message.Content === '3'){
          content='你看，我在看你。';
        }else if(message.Content.match('爱')){
          //模糊查询，match有这个爱的字就是返回一个数组[0]就是爱字哦。而如果没有爱字那就是null
          content='我爱你~';
        }else{
          content='你在说啥，我没听懂耶。';
        }
      }else{
        content='你在说啥，我没听懂耶。';
      }

      //回复消息的设置
      let replyMessage = '<xml>' +
        '<ToUserName><![CDATA[' + message.FromUserName +']]></ToUserName>' +
        '<FromUserName><![CDATA[' + message.ToUserName +']]></FromUserName>' +
        '<CreateTime>'+ Date.now() +'</CreateTime>' +
        '<MsgType><![CDATA[text]]></MsgType>' +
        '<Content><![CDATA[' +  content +']]></Content>' +
        '</xml>';*/
      // let replyMessage ='<xml>' +
      //   '<ToUserName><![CDATA[' + message.FromUserName + ']]></ToUserName>' +
      //   '<FromUserName><![CDATA[' + message.ToUserName + ']]></FromUserName>' +
      //   '<CreateTime>' + Date.now() + '</CreateTime>' +
      //   '<MsgType><![CDATA[text]]></MsgType>' +
      //   '<Content><![CDATA[' + content + ']]></Content>' +
      //   '</xml>';

      //用reply模块返回回来的xml
      const replyMessage = await reply(message);
      //在这里可以找bug，最终确定发送给微信服务器数据的正确XML格式

      //相应用户的回复信息--给微信服务器o
      res.send(replyMessage);
      // res.send('');
    }


  }
}