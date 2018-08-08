/*
* 主要是为了封装那些请求地址
* 请求地址：开发者服务器到微信服务器的请求方式
* 返回的数据啊之类的是微信服务器到开发者服务器中
* */

//公共的API前缀
const prefix = 'https://api.weixin.qq.com/cgi-bin/';
module.exports = {
  accessToken : prefix  + 'token?grant_type=client_credential',
  ticket : prefix + 'ticket/getticket?type=jsapi&',//type=jsapi是固定写法。
  temporary : {
    upload : prefix + 'media/upload?',
    get : prefix + 'media/get?'
  },
  permanent : {
    uploadNews : prefix + 'material/add_news?',
    uploadImg : prefix + 'media/uploadimg?',
    uploadOthers : prefix + 'material/add_material?',
    get : prefix + 'material/get_material?',
    delete : prefix + 'material/del_material?',
    updateNews : prefix + 'material/update_news?',
    getCounts : prefix + 'material/get_materialcount?',
    getMaterialList : prefix + 'material/batchget_material?'
  },
  menu:{
    create : prefix + 'menu/create?',
    get: prefix + 'menu/get?',
    delete: prefix + 'menu/delete?',

    myCreate: prefix + 'menu/addconditional?',
    myDelete: prefix + 'menu/delconditional?',
    myTest: prefix + 'menu/trymatch?'
  },
  /*标签管理-创建-获取已创建的标签-编辑更新-删除-获取标签下粉丝列表*/
  tag: {
    create: prefix + 'tags/create?',
    get: prefix + 'tags/get?',
    update: prefix + 'tags/update?',
    delete: prefix + 'tags/delete?',
    getUsers: prefix + 'user/tag/get?'
  },
  /*用户管理--批量为用户打标签-批量为用户取消标签-获取用户身上的标签列表-获取用户列表*/
  user: {
    batchTag: prefix + 'tags/members/batchtagging?',
    unBatchTag: prefix + 'tags/members/batchuntagging?',
    getTags: prefix + 'tags/getidlist?',
    get: prefix + 'user/get?'
  },
  /*群发的两种类型*/
  sendAll: {
    tag: prefix + 'message/mass/sendall?',
    users: prefix + 'message/mass/send?'
  }
};