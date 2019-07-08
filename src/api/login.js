// request 就是 axios
import request from '@/utils/request'

// 发送登录请求：
export function loginByUsername(username, password) {
  const data = {
    username,
    password
  }

  // 调用 axios， 发送请求
  return request({
    url: '/login/login',
    method: 'post',
    data
  })
}

// 退出
export function logout() {
  return request({
    url: '/login/logout',
    method: 'post'
  })
}

export function getUserInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}
