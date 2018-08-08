//菜单的请求bodyhttp:      www.wxeditor.com/emoji

const {url} = require('../config');
module.exports = {
  "button":[
    /*有10种类型的自定义接口的也就是type的类型*/
    /*数组中最外层只有三个对象，因为一级菜单只有三个*/
  {
    "type":"view",
    "name":"影院首页🎬",
    "url": url + "/movie"
  },
    /*这是有二级菜单的一级菜单---二级菜单个数最多为5个*/
  {
    "type":"view",
    "name":"语音识别🎧",
    "url": url + "/search"
  },
    /*第三个一级菜单*/
  {
    "name":"戳戳我么💋",
    "sub_button":[
      {
        "type": "click",
        "name": "帮助⭕",
        "key": "help"
      },
      {
        "type": "view",
        "name": "戳Me官网🚩",
        "url": 'https://fengmaybe.github.io/lyuyablog/'
      },
    ]
  }
]
};