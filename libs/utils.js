//工具功能模块

//引入解析XML的模块
const {parseString}=require('xml2js');
//引入简单的读取文件
const {readFile,writeFile} = require('fs');
//引入一个path模块，就是通过这个来写入绝对路径
const {resolve} = require('path');

module.exports = {
  //得到用户的消息方法-异步代码
  getUseDataAsync(req){
    //req对象。
    //这个方法返回一个promise
    //用户数据是通过流的形式发送过来。通过监听data
    return new Promise(((resolve, reject) => {
/*不知道这个流式数据是分几回发送，故使用data拼接*/
      let data='';
      req
        .on('data',(userData)=>{
          //将这些流式文件拼接起来
          console.log(userData);
            data += userData;
        })
        .on('end',()=>{
          //确保所有数据读取完毕
          resolve(data);
        })
    }))

  },

  //得到将XML转换为JS对象方法-异步代码
  parseXmlAsync(xmlData){
    return new Promise(((resolve, reject) => {
        parseString(xmlData,{trim: true},(err,data)=>{
          if(!err){
            //解析成功
            resolve(data);
          }else{
            //解析失败
            reject('parseXmlAsync方法出错了'+err);
          }
        })
    }))
  },

  //将得到的js对象格式化，转为特定的格式。同步代码
  formatMessage(jsData){
    //先把XML那个去掉，因为没有用。
    const data = jsData.xml;
    //初始化一个空的对象，等会把遍历的值插入进来，最后return出去、
    let message={};
    //判断是否是合法的数据》
    if(typeof data === 'object'){
      //遍历其attrNAME。data是一个对象。
      for(let attrName in data){
        //得到属性值是一个数组.[ '66' ]这个就是value
        let value = data[attrName];
        //现在判断是否是空的字符串或者是空数组
        if(Array.isArray(value) && value.length > 0){
          //插入到对象的属性上.attrName本身是变量值string，不用加引号
          message[attrName] = value[0];

        }
      }
    }
    //将格式化的数据返回出去。同步代码。
    return message;
  },

  //封装获取accesstoken和ticket的读写文件.异步的代码
  readFileAsync (fileName) {
    //思考为啥这么做？
    const filePath = resolve(__dirname, fileName);
    return new Promise((resolve, reject) => {
      readFile(filePath,(err,data) =>{
        //读取时，这里就会读取data为buffer数据
        if(!err){
          //读取的Buffer数据---->json字符串
          data = data.toString();
          //json字符串--->对象
          data = JSON.parse(data);
          //读取成功
          resolve(data);
        } else {
          //读取失败
          reject('readFileAsync方法出了问题：' +err);
        }
      })
    });
  },
  writeFileAsync (data,fileName) {
    data = JSON.stringify(data);
    const filePath = resolve(__dirname, fileName);
    return new Promise((resolve, reject) => {
      writeFile(filePath,data,err =>{
        if(!err){
          //写入成功
          resolve();
        } else {
          //写入失败
          reject('writeFileAsync方法出了问题：' +err);
        }
      })
    });
  }
};