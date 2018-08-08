
/*
这里是可以脱离服务器去测试的。
  获取access_token:
    全局唯一的接口调用凭据，今后使用微信的接口基本上都需要携带上这个参数
    2小时需要更新一次，提前5分钟刷新

    请求地址：
      https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
    请求方式：
      GET

    设计思路：
      首先发送请求获取凭据，保存为一个唯一的文件
      然后后面请求先去本地文件读取凭据
        判断凭据是否过期
          如果没有过期，直接使用
          如果过期了，重新发送请求获取凭据，保存下来覆盖之前的文件

    总结：
      先去本地查看有没有指定文件（readAccessToken）
        如果有（之前请求过凭据）
          判断凭据是否过期(isValidAccessToken)
            如果没有过期，直接使用
            如果过期了，重新发送请求获取凭据，保存下来覆盖之前的文件(getAccessToken、saveAccessToken)
        如果没有（之前都没有请求过凭据）
         发送请求获取凭据，保存为一个唯一的文件

 */
//引入配置对象
const {appID,appsecret} = require('../config');
//下载 request-promise-native（引入）  request（不需要引入，被依赖的）为http请求做准备
const rp = require('request-promise-native');
const request  = require('request');
//引入fs模块
const {createReadStream,createWriteStream} = require('fs');
//引入API的模块
const api = require('../libs/api');
//引入util模块
const {readFileAsync,writeFileAsync} = require('../libs/utils');
//引入menu
const menu = require('./menu');



class Wechat {

  /*------------------全局唯一凭据------------------*/
  getAccessToken(){
    //不需要参数，因为没有东西是需要变化的。会变化的数据才需要参数。
    return new Promise((resolve, reject) => {
      //定义URL地址
      const url = `${api.accessToken}&appid=${appID}&secret=${appsecret}`;
      //请求http rp是返回一个promise对象
      rp({method:'GET',json:true , url})
        .then(res=>{
        //请求成功，拿到一个res这个对象{..,access-token..}

        //重新赋值其过期时间,其本身单位为秒
        res.expires_in = Date.now() + (res.expires_in - 300)*1000;
        resolve(res);
      })
        .catch((err)=>{
          reject('getAccessToken方法出了问题： '+ err);
        })
    });


  }
  saveAccessToken(data){
    /*return 一个promise下去*/
    return writeFileAsync(data,'accessToken.txt');
  }
  readAccessToken(){
    return readFileAsync('accessToken.txt');
  }
  isValidAccessToken(data){
    //返回TRUE表示没有过期。返回FALSE表示是过期了。
    //过滤非法参数
    if(!data || !data.access_token || !data.expires_in ){
      return false
    }
    //根据时间判断
    return data.expires_in > Date.now();
  }
  fetchAccessToken(){
    //此函数的功能就是获取到一个{过期..}  this就是可以找到等会将要创建new Wechat()那个对象

    //优化一下，只要其中这个对象this上有这些属性，那么我就直接返回。不执行下面的读取文件
    //this就是{ access_token  exprires_in }
    if(this.access_token && this.exprires_in && this.isValidAccessToken(this)){
      //this有凭据和过期时间，并且凭据未过期
      return Promise.resolve({access_token:this.access_token,exprires_in:this.exprires_in})
    }


    return  this.readAccessToken()
      .then(async res=>{
        //res就是拿到的凭据对象。
        //判断凭据是否过期isValidAccessToken
        if(this.isValidAccessToken(res)){
          //没过期-输出这个凭据
          /*此时也就是在我调用fetchAccessToken()函数时，我要拿到这个凭据中的数据。
          *异步中的return直接是不可以返回的。
          * 方法一：就是在外面一层包裹着一层promise
          * 方法二：then可以返回一个promise，这个promise就会传递到外层。
          *
            */
          return Promise.resolve(res);
        }else{
          //过期了-重新请求
          const data = await this.getAccessToken();
          //保存数据-异步的
          await this.saveAccessToken(data);
          //刚刚检查没有凭据，现在将重新发来的凭据给返回出去。
          return Promise.resolve(res);
        }
      })
      .catch(async err=>{
        console.log(err);
        //过期了-重新请求 -异步操作
        const data = await this.getAccessToken();
        //保存数据-异步的
        await this.saveAccessToken(data);
        return Promise.resolve(data);
      })
      .then( res => {
        //这里的传递过来的promise是前面逻辑走过来的返回出去的promise
        //res就是刚刚Promise.resolve.(res)的过来的res
        //将其中挂在this上。以便后期优化。
        this.exprires_in = res.expires_in;
        this.access_token = res.access_token;
        //fetchAccessToken方法返回值
        return Promise.resolve(res);
      })
  }


  /*--------------------ticket临时票据---------------*/
  getTicket(){
    //不需要参数，因为没有东西是需要变化的。会变化的数据才需要参数。
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res=>{
          //定义URL地址
          const url = `${api.ticket}access_token=${res.access_token}`;
          //请求http rp是返回一个promise对象
          rp({method:'GET',json:true , url})
            .then(res=>{
              resolve({
                /*微信服务器返回回来的ticket*/
                ticket :res.ticket,
                expires_in : Date.now() + (res.expires_in - 300)*1000
              });
            })
            .catch((err)=>{
              reject('getAccessToken方法出了问题： '+ err);
            })
        })

    });
  }
  saveTicket(data){
  return writeFileAsync(data,'ticket.txt');
  }
  readTicket(){
  return readFileAsync('ticket.txt');
  }
  isValidTicket(data){
    if(!data || !data.ticket || !data.expires_in ){
      return false
    }
    //根据时间判断
    return data.expires_in > Date.now();
  }
  fetchTicket(){
    //此函数的功能就是获取到一个{过期..}  this就是可以找到等会将要创建new Wechat()那个对象

    //优化一下，只要其中这个对象this上有这些属性，那么我就直接返回。不执行下面的读取文件
    //this就是{ access_token  exprires_in }
    if(this.ticket && this.exprires_in && this.isValidTicket(this)){
      //this有凭据和过期时间，并且凭据未过期
      return Promise.resolve({ticket:this.ticket,exprires_in:this.exprires_in})
    }


    return  this.readTicket()
      .then(async res=>{
        //res就是拿到的凭据对象。
        //判断凭据是否过期isValidAccessToken
        if(this.isValidTicket(res)){
          //没过期-输出这个凭据
          /*此时也就是在我调用fetchAccessToken()函数时，我要拿到这个凭据中的数据。
          *异步中的return直接是不可以返回的。
          * 方法一：就是在外面一层包裹着一层promise
          * 方法二：then可以返回一个promise，这个promise就会传递到外层。
          *
            */
          return Promise.resolve(res);
        }else{
          //过期了-重新请求
          const data = await this.getTicket();
          //保存数据-异步的
          await this.saveTicket(data);
          //刚刚检查没有凭据，现在将重新发来的凭据给返回出去。
          return Promise.resolve(res);
        }
      })
      .catch(async err=>{
        console.log(err);
        //过期了-重新请求 -异步操作
        const data = await this.getTicket();
        //保存数据-异步的
        await this.saveTicket(data);
        return Promise.resolve(data);
      })
      .then( res => {
        //这里的传递过来的promise是前面逻辑走过来的返回出去的promise
        //res就是刚刚Promise.resolve.(res)的过来的res
        //将其中挂在this上。以便后期优化。
        this.exprires_in = res.expires_in;
        this.ticket = res.ticket;
        //fetchAccessToken方法返回值
        return Promise.resolve(res);
      })
  }

  /*-------------------素材管理--------------------*/
  /*注意点：

1、临时素材media_id是可复用的。

2、媒体文件在微信后台保存时间为3天，即3天后media_id失效。

3、上传临时素材的格式、大小限制与公众平台官网一致。

图片（image）: 2M，支持PNG\JPEG\JPG\GIF格式

语音（voice）：2M，播放长度不超过60s，支持AMR\MP3格式

视频（video）：10MB，支持MP4格式

缩略图（thumb）：64KB，支持JPG格式

4、需使用https调用本接口。*/
  //上传临时素材
  uploadTemporaryMaterial (type,filePath){
    /*
    * type:有四种类型-image-voice-video-thumb
    * filePath: 上传文件的路径
    * */
    //套路：要深入理解其内部逻辑
    return new Promise((resolve, reject) => {
      //获取access_token--返回一个带参数res的promise
      this.fetchAccessToken()
        .then(res=>{
          //1.定义请求的地址
          const url = `${api.temporary.upload}access_token=${res.access_token}&type=${type}`;
          //2.用FORM表单方式上传一个多媒体文件定义一个传输的媒体数据
          const formData = {
            //可读流
            media: createReadStream(filePath)
          }
          //发送请求，这个请求是有开发中服务器发给微信服务器的。
          //rp返回的是一个promise
          rp({method: 'POST', json: true, url, formData})
            .then(res=>{
              //将请求回来的数据返回出去.可以使用resolve（外层包一层）去返回res。
              resolve(res);
            })
            .catch(err=>{
              reject(err);
            })

        })
        .catch(err=>{
          reject('uploadTemporaryMaterial方法出了问题：' + err);
        })


    });


  }
  //获取临时素材
  getTemporaryMaterial (mediaId, filePath, isVideo = false){
    /*mediaId:你想要从微信服务器中获取的素材的mediaId值，一般是从数据库中查找的。
    * filePath: 需要下载到的文件的位置
    * 因为获取的临时素材返回值是有差别的。如果是视频素材的话那就是{"video_url":DOWN_URL}
    * 所以用isvideo去判断是否是获取视频素材,默认是FALSE
    * 如果是视频，获取一个视频，那么在使用时就要去使用第三个参数，写上TRUE。
    * */
    //外层包装一层promise是为了返回数据
    return new Promise((resolve, reject) => {
      //为了获取access_token，this是指的是new Wechat的实例。
        this.fetchAccessToken()
          .then(res => {
            //1.定义请求地址
            const url = `${api.temporary.get}access_token=${res.access_token}&media_id=${mediaId}`;
            //2.分类讨论---发送请求的方式有差异--也是开发者服务器到微信开发者服务器。
            if (isVideo) {
              //如果是视频消息素材，就返回一个url地址
              rp({method: 'GET', json: true, url})
                .then(res => resolve(res))
                .catch(err => reject('getTemporaryMaterial方法出了问题：' + err))
            } else {
              //如果不是视频消息素材，那么就是可写流床送的。就返回一个文件接收
              //为什么可以看出是可写流的形式呢？返回信息中有curl -G "https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID"

              request
                .get(url)
                .pipe(createWriteStream(filePath))
                .once('close', () => {
                  //说明文件下载到本地成功了。
                  resolve();
                })
            }
          })
          /*.catch(err=>{
            console.log('getTemporayMaterrial方法出了问题： ' + err);
          })*/
    })
  }

  //上传永久素材
  /*上传永久素材的逻辑思路：
  * 1.有三种请求地址（news，pic ,others）,可以根据type来决定请求地址
  * 2.他们的请求参数也不一样，news的话是直接对象放在一个请求体body中去请求的。
  * 2.而pic和others就是通过formData去设置。所以用一个optation配置对象把他们直接处理，而不是通过三个方法解决。
  * 3.另外注意一个问题咯，在文档中可以看出如果这个是others类型中的video素材那么就要去在body上带一个对象参数去请求。
  *
  * */
  uploadPermanentMaterial (type, material, description){
    /*
      type: 可以区分我通过什么方式上传素材
      material: 上传素材的路径/请求体中的内容
      description: 针对于others类型的视频素材上传
     */
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        //这里的res是返回一个带有accesstoken的promise
        .then(res=>{
          //1.请求地址
          let url = '';
          //去配置对象，为了请求的时候带上各自所需的请求体或formdata
          let options = {
            method: 'POST',
            json: true
          };
          if(type === 'news'){
            //类型一：图文消息news
            url = `${api.permanent.uploadNews}access_token=${res.access_token}`;
            options.body = material; //因为这个时候要带上这个调用的对象放到请求体body中

          }else if(type === 'pic'){
            //类型二：上传图文消息的所需图片（就是图文中要用的图片）
            url = `${api.permanent.uploadImg}access_token=${res.access_token}`;
            options.formData = {
              media: createReadStream(material)  //以formData的形式去请求地址
            }

          } else {
            //类型三：上传其他素材（音频视频图片····）
            url = `${api.permanent.uploadOthers}access_token=${res.access_token}&type=${type}`;
            options.formData = {
              media: createReadStream(material)  //以formData的形式去请求地址
            };
            if (type === 'video') {
              options.body = description;  //特别的是要注意，如果是视频地址，我也要有一个类似的描述文件{"media_id":MEDIA_ID,"url":URL}
            }
          }
          //将请求地址放到配置对象中，放在外面可以少些两行。
          options.url = url;
          //发送请求--这里就可以自动的根据前面的逻辑去放在options。

          rp(options)
            .then(res => resolve(res))
            .catch(err => reject('uploadPermanentMaterial方法出了问题:' + err))
        })
        /*.catch(err=>{
          console.log('uploadPermanentMaterial方法出了问题： ' + err);
        })*/
    });

  }

  //获取永久素材
  getPermanentMaterial (type,mediaId,filePath){
    /*type: 区分其接收数据的类型。请求后有三种返回形式。
    * mediaId: 获取的媒体素材id
    *filePath: 只针对最后一种若是视除了图文素材和视频的素材意外的素材的话，有一个路径去保存获取到的素材。
    * */
    /*{  图文素材：：：
         "news_item":
         [
             {
             "title":TITLE,
             "thumb_media_id"::THUMB_MEDIA_ID,
             "show_cover_pic":SHOW_COVER_PIC(0/1),
             "author":AUTHOR,
             "digest":DIGEST,
             "content":CONTENT,
             "url":URL,
             "content_source_url":CONTENT_SOURCE_URL
             },
             //多图文消息有多篇文章
          ]
        }
        视频素材：：：
              {
        "title":TITLE,
        "description":DESCRIPTION,
        "down_url":DOWN_URL,
      }
      //其他类型的素材以流的形式获得到。故接收响应的也应该是request
    *
    * */
      return new Promise((resolve, reject) => {
          this.fetchAccessToken()
            .then(res=>{
              //1.获取请求地址-由开发者服务器向微信公众号发起请求，微信公众号回复请求。
              const url = `${api.permanent.get}access_token=${res.access_token}`;
              //2.定义请求体中的数据--请求体都是一个的。{。。。。mediaid}
              const body = {
                media_id: mediaId
              }
              //3.由type去决定请求的数据是怎样进行处理的
              if( type  === 'news' ||  'video'){
                rp({method: 'POST', json: true, url, body})
                  .then(res => resolve(res))
                  .catch(err => reject('getPermanentMaterial方法出了问题:' + err))
              } else {
                //.get(url)为什么不写成这种形式呢？因为不好写啊。我要很多参数对不。要body请求体
                request({method: 'POST', json: true, url, body})
                  .pipe(createWriteStream(filePath))
                  .once('close',()=>{
                    resolve();
                  })
              }
            })

  })
}
  //删除永久素材
  deletePermanentMaterial (mediaId){
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res=>{
          //1.请求地址
          const url = `${api.permanent.delete}access_token=${res.access_token}`;
          const body = {
            media_id: mediaId
          }
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('deletePermanentMaterial方法出了问题：' + err))
        })
    })
  }
  //修改永久图文素材
  updatePermanentNews (body){
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res=>{
          const url = `${api.permanent.updateNews}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('updatePermanentNews方法出了问题：' + err))
        })
    })
  }
  //获取素材总数
  getPermanentCount () {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.getCounts}access_token=${res.access_token}`;
          rp({method: 'GET', json: true, url})
            .then(res => resolve(res))
            .catch(err => reject('getPermanentCount方法出了问题：' + err))
        })
    })
  }
  //获取永久素材列表
  getPermanentList (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.getMaterialList}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('getPermanentList方法出了问题：' + err))
        })
    })
  }


  /*--------------自定义菜单接口和个性化菜单接口-----------------*/

  //创建菜单接口要请求体--（menu的一个请求体）
  createMenu (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.create}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('createMenu方法出了问题：' + err))
        })
    })
  }
  //查询菜单接口
  getMenu () {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.get}access_token=${res.access_token}`;
          rp({method: 'GET', json: true, url})
            .then(res => resolve(res))
            .catch(err => reject('getMenu方法出了问题：' + err))
        })
    })
  }
  //删除菜单接口
  deleteMenu () {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.delete}access_token=${res.access_token}`;
          rp({method: 'GET', json: true, url})
            .then(res => resolve(res))
            .catch(err => reject('deleteMenu方法出了问题：' + err))
        })
    })
  }
  //创建--个性化菜单--接口-要请求体（mymenu的一个请求体）
  createMyMenu (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myCreate}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('createMyMenu方法出了问题：' + err))
        })
    })
  }
  //删除--个性化菜单--接口请求示例-{"menuid":"208379533"}
  deleteMyMenu (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myDelete}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('deleteMyMenu方法出了问题：' + err))
        })
    })
  }
  //测试个性化菜单匹配结果
  testMyMenu (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myTest}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject(' testMyMenu方法出了问题：' + err))
        })
    })
  }


  /*--------------标签管理----------------*/
  //创建标签--调用body{   "tag" : {     "name" : "广东"//标签名   } }
  createTag (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.tag.create}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('createTag方法出了问题：' + err))
        })
    })
  }
  //获取公众号已创建的标签--不需要参数，get请求-默认有个星标组
  getTag () {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.tag.get}access_token=${res.access_token}`;
          rp({method: 'GET', json: true, url})
            .then(res => resolve(res))
            .catch(err => reject('getTag方法出了问题：' + err))
        })
    })
  }
  //编辑更新标签--body的调用实例{   "tag" : {     "id" : 134,     "name" : "广东人"   } }
  updateTag (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.tag.update}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('updateTag方法出了问题：' + err))
        })
    })
  }
  //删除标签--body调用{   "tag":{        "id" : 134   } }
  deleteTag (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.tag.delete}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('deleteTag方法出了问题：' + err))
        })
    })
  }
  //获取标签下的粉丝列表-调用body实例{   "tagid" : 134,   "next_openid":""//第一个拉取的OPENID，不填默认从头开始拉取 }
  getTagUsers (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.tag.getUsers}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('getTagUsers方法出了问题：' + err))
        })
    })
  }
  //批量为用户打标签
  /*{   "openid_list" : [//粉丝列表    （数组）
          "ocYxcuAEy30bX0NXmGn4ypqx3tI0",
          "ocYxcuBt0mRugKZ7tGAHPnUaOW7Y"   ],
          "tagid" : 134  打标签的tagid }*/
  batchUserTags (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.user.batchTag}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('batchUserTags方法出了问题：' + err))
        })
    })
  }
  //批量为用户取消标签
  unBatchUserTags (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.user.unBatchTag}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('unBatchUserTags方法出了问题：' + err))
        })
    })
  }
  //获取用户下所有的标签--{   "openid" : "ocYxcuBt0mRugKZ7tGAHPnUaOW7Y" }
  getUserTags (body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.user.getTags}access_token=${res.access_token}`;
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('getUserTags方法出了问题：' + err))
        })
    })
  }
  //获取所有用户列表--需要请求地址中有nextopenID参数
  getUsers (next_openid) {
    /*http请求方式: GET（请使用https协议）
      https://api.weixin.qq.com/cgi-bin/user/get?access_token=ACCESS_TOKEN&next_openid=NEXT_OPENID*/
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          let url = `${api.user.get}access_token=${res.access_token}`;
          if (next_openid) {
            url += '&next_openid=' + next_openid;
          }
          rp({method: 'GET', json: true, url})
            .then(res => resolve(res))
            .catch(err => reject('getUsers方法出了问题：' + err))
        })
    })
  }

  /*-------------------群发消息的两种方式（tag/openID）-------------------------*/
  //根据其标签名来确定群发消息
  sendAllByTag (type,tag_id, content, is_to_all = false,send_ignore_reprint = 0) {
    /*type 类型会有很多种，比如 text image video （注意区别） mpnews 卡卷消息
    * tag_id 标签的ID，根据其来群发消息
    * content 文本内容或者是mediaID
    * is_to_all  默认是FALSE。若是TRUE则是会在历史记录上生成，也就是每天只能发一条、
    * send_ignore_reprint: 	图文消息被判定为转载时，是否继续群发。 1为继续群发（转载），0为停止群发。
    * */
    return new Promise((resolve, reject) => {
       this.fetchAccessToken()
         .then(res=>{
           const url = `${api.sendAll.tag}access_token=${res.access_token}`;
           //公共的body的内容，非公共的去再插入
           let body = {
             filter:{
               is_to_all,
               tag_id
             }
           };

           //判断群发的消息类型
           if (type === 'text') {
             body[type] = {
               content
             }
           } else if (type === 'mpnews') {
             //注意咯，如要是群发mpnews(可能会不行无认证把)，另外传进来直接记住传mpnews
             body.send_ignore_reprint = send_ignore_reprint;
             body[type] = {
               media_id: content
             }
           } else {
             /*其他类型度差不多，一起处理呗*/
             body[type] = {
               media_id: content
             }
           }
           /*这句代码的优化，吕某经常想不到啊····你说似不似傻*/
           body.msgtype = type;
           //发送请求
           rp({method:'POST',json:true,url,body})
             .then(res=>resolve(res))
             .catch(err=>reject('sendAllByTag方法出了问题'+err))

         })

    })
  }

  //根据用户列表openid群发消息
  sendAllByUsers (type, openid_list, content, send_ignore_reprint = 0, title, description) {
    /*
      type: 媒体数据类型
      openid_list: 指定用户列表----数组
      content: 媒体消息内容
      send_ignore_reprint: 	图文消息被判定为转载时，是否继续群发。 1为继续群发（转载），0为停止群发。 该参数默认为0。
      title: 视频文件的标题
      description: 视频文件的描述
     */
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.sendAll.users}access_token=${res.access_token}`;
          let body = {
            touser: openid_list
          }
          //判断群发的消息类型
          if (type === 'text') {
            body.text = {
              content
            }
          } else if (type === 'mpnews') {
            body.send_ignore_reprint = send_ignore_reprint;
            body[type] = {
              media_id: content
            }
          } else if (type === 'mpvideo') {
            body[type] = {
              media_id: content,
              title: title,
              description: description
            }
          } else {
            body[type] = {
              media_id: content
            }
          }
          body.msgtype = type;
          // console.log(body);
          //发送请求
          rp({method: 'POST', json: true, url, body})
            .then(res => resolve(res))
            .catch(err => reject('sendAllByUsers方法出了问题：' + err))
        })
    })
  }


}

//测试
(async ()=>{
  const wechatApi = new Wechat();
  //注意这个是异步的。要await  等到fetch数据后再来输出。否则直接输出就是Promise { <pending> }
  /*console.log(await wechatApi.fetchAccessToken());*/
  let data = await wechatApi.deleteMenu();
  console.log('删除菜单之前的，不需要传参数');
  console.log(data);
  data = await wechatApi.createMenu(menu);
  console.log('创建我指定的参数，我把参数请求体给接口');
  console.log(data);

})();

//在reply逻辑中要使用wechat的各个方法，所以要暴露出去。
module.exports = Wechat;

/*
* 总结一下在素材管理中的API的接口定义分类：
*1
*2
*3
*4
*
* */
