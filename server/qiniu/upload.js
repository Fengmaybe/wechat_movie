//引入qiniu库
const qiniu = require('qiniu');
//在个人中心/密匙管理定义你qiniu账号的accessKey secretKey
const accessKey = 'YZa_a88TfaOhVwcDnJ15U334HN9XelnZbz9Ggzaj';
const secretKey = 'XR-1SO6m_9By3K0BqFHmolOr0VTgEWFdyYZ-l8-x';
//对象存储空间的名称（你的个人存储管理中心有空间名称）
const bucket = 'lyuyamovie';
//生成鉴权对象
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
//生成配置对象
const config = new qiniu.conf.Config();
//生成实例对象，有使用方法
const bucketManager = new qiniu.rs.BucketManager(mac, config);

//暴露到外面一个函数（异步的-封装成promise）
module.exports = (resUrl, key) => {
  //抓取网络资源到七牛空间中
  return new Promise((resolve, reject) => {
    bucketManager.fetch(resUrl, bucket, key, function(err, respBody, respInfo) {
      /*
        resUrl： 网络资源的地址/位置
        bucket： 对象储存空间的名称
        key：    对网络资源的重命名（保存在七牛云空间中的名称）用一个库来解决nonaid
       */
      if (err) {
        reject('文件upload到七牛的方法出了问题：' + err);
      } else {
        if (respInfo.statusCode === 200) {
          resolve();
        }
      }
    });
  })
}