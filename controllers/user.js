const {
  signup,
  isExit,
  getAccount,
  findList,
  modifyUserInfoById,
  deleteUserById,
  checkUserAuth,
  updateEmailByAccount
} = require("../models/users.js")
const dateFormat = require("../utils/format/date")
const { checkPassword } = require("../utils/encryptTool/encrypt.js")
const { sign } = require("../utils/token.js")
/**
 * To deal with the user register logic
 * 
 */
const userRegister = async (req, res, next) => {
  let { account, password } = req.body
  const isAlreadyExit = !! await isExit(account)
  console.log(`${account}:是否存在 ${isAlreadyExit} `);
  // 用户名存在
  if (isAlreadyExit) {
    res.setHeader("content-type", "application/json;charset='utf8'")
    res.render("errorSignup", {
      data: JSON.stringify({
        isExit: isAlreadyExit,
        date: dateFormat(),
        msg: JSON.stringify("account has exitted"),
      })
    })
  } else {
    // 将密码加密存到数据库中
    console.log(password);
    let isSuccess = await signup({ account, password })
    const token = sign(account);
    console.log(`${account}:是否保存成功 ${isSuccess} `);
    res.setHeader("X-Token", token);
    res.setHeader("content-type", "application/json;charset='utf8'")
    res.render("success", {
      data: JSON.stringify({
        msg: `用户${account}已注册成功`,
        token: token,
        username: account,
        roles: ['editor'],
        introduction: 'I am an editor',
        avatar:
          'https://wpimg.wallstcn.com/007ef517-bafd-4066-aae4-6883632d9646',
        date: dateFormat()
      })
    })
  }
}


/**
 * To handle user login logic
 * 1. 用户名/邮件是否存在
 * 2. 看密码是否正确
 * 3. 返回不同的结果
 */

const userLogin = async (req, res, next) => {
  const { account, password } = req.body
  let isAlreadyExit;
  try {
    isAlreadyExit = await isExit(account);
  } catch (error) {
    sendMsg('isExit function occured error!')
  }
  // 用户名存在，则匹配账号密码
  if (isAlreadyExit) {
    const { password: passwordInDB } = await getAccount(account);
    // console.log('userLogin',passwordInDB,email)
    // 2. 看密码是否正确
    const allowLogin = !! await checkPassword(password, passwordInDB)
    if (allowLogin) {
      // token 方案
      const token = sign(account);
      res.setHeader("X-Token", token);
      //3. 看是否為admin
      // const { isExit , isAdmin} = await checkUserAuth(account);
      // console.log('userLogin',isExit,isAdmin);
      // let data = {};
      // if(isExit && isAdmin){
      //   data = {
      //     emailIsExist: !!email, 
      //     msg: "userLogin成功！",
      //     roles: ['admin'],
      //     introduction: 'I am a super administrator',
      //     avatar:
      //       'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      //     username: account,
      //     token: token,
      //     date: dateFormat()
      //   }
      // }else{
      //   data = {
      //     emailIsExist: !!email, 
      //     msg: "userLogin成功！",
      //     roles: ['editor'],
      //     introduction: 'I am an editor',
      //     avatar:
      //       'https://wpimg.wallstcn.com/007ef517-bafd-4066-aae4-6883632d9646',
      //     username: account,
      //     token: token,
      //     date: dateFormat()
      //   }
      // }
      res.setHeader("content-type", "application/json;charset='utf8'")
      res.render("success", {
        msg: "userLogin成功！",
        data: JSON.stringify({
          token:token,
          date: dateFormat()
        })
      })
    } else {
      console.log('password error!')
      sendMsg('Password error!')
    }
  } else {
    sendMsg('Account is not exited')
  }
function sendMsg(msg) {
  res.setHeader("content-type", "application/json; charset=utf-8")
  res.render("errorLogin", {
    msg:msg,
    data: JSON.stringify({
      date: dateFormat()
    })
  })
}
}

const setEmail = async (req, res, next) => {
  let { email, account } = req.body;
  updateEmailByAccount(account,email).then(()=>{
    res.setHeader("content-type", "application/json; charset=utf-8")
    res.json({
      "code": 20000,
      "msg": "Success",
      "data": {
        'email': email
      }
    })
  }).catch(()=>{
    res.setHeader("content-type", "application/json; charset=utf-8")
    res.json({
      "code": 40100,
      "msg": "Error"
    })
  })
}

/**
 *  To handle user singout logic
 *  1. 判断是否存在用户？
 *  2.1 存在？   2.2 不存在？ 直接返回
 *  2.1.1 已经登录？ 去除一登录标志 2.1.2 未登录  直接返回
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const userSignout = async (req, res, next) => {
  req.session = null;
  res.setHeader("content-type", "application/json;charset='utf8'")
  res.render("success", {
    msg: "已退出登录！",
    data: JSON.stringify({
      date: dateFormat()
    })
  })
}

/**
 * 用来获取用户列表
 */
const userList = async (req, res, next) => {
  const list = await findList();
  // res.setHeader("content-type", "application/json;charset='utf8'")
  res.render("success", {
    data: JSON.stringify({
      list,
      date: dateFormat(),
      msg: JSON.stringify("get list successfully"),
      total: list.length
    })
  })
}


const modifyUserInfo = async (req, res, next) => {
  const { username, email, _id } = req.body;
  console.log(username, email, _id);
  const result = await modifyUserInfoById(_id, { username, email })
  console.log("result:", result);
  // res.setHeader("content-type", "application/json;charset='utf8'")
  if (result) {
    res.render("success", {
      data: JSON.stringify({
        date: dateFormat(),
        msg: `the information of ${username} has been modified successfully`,
      })
    })
  } else {
    res.render("success", {
      data: JSON.stringify({
        date: dateFormat(),
        msg: `modify failed`,
      })
    })
  }
}


const deleteUser = async (req, res) => {
  const { _id } = req.body;
  const result = await deleteUserById(_id)
  console.log("result:", result);
  // res.setHeader("content-type", "application/json;charset='utf8'")
  if (result) {
    res.render("success", {
      data: JSON.stringify({
        date: dateFormat(),
        msg: `deleted successfully`,
        isSuccess: true
      })
    })
  } else {
    res.render("success", {
      data: JSON.stringify({
        date: dateFormat(),
        msg: `deleted failed`,
        isSuccess: false
      })
    })
  }
}
const getUserInfo = async (req, res) => {
  const { account } = req.body;
  const { email , isAdmin} = await getAccount(account);
  let data = {};
  if(isAdmin){
    data = {
      roles: ['admin'],
      introduction: 'I am a super administrator',
      avatar:
        'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      username: account,
      date: dateFormat(),
      emailIsExist:!!email
    }
  }else{
    data = {
      roles: ['editor'],
      introduction: 'I am an editor',
      avatar:
        'https://wpimg.wallstcn.com/007ef517-bafd-4066-aae4-6883632d9646',
      username: account,
      date: dateFormat(),
      emailIsExist:!!email
    }
  }
  res.render("success", {
    msg: "getUserAuth成功！",
    data: JSON.stringify(data)
  })
}

module.exports = {
  userRegister,
  userLogin,
  userSignout,
  userList,
  modifyUserInfo,
  deleteUser,
  getUserInfo,
  setEmail
}