import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // getToken from cookie

NProgress.configure({ showSpinner: false }) // NProgress Configuration

// permission judge function
function hasPermission(roles, permissionRoles) {
  if (roles.indexOf('admin') >= 0) return true // admin permission passed directly
  if (!permissionRoles) return true
  return roles.some(role => permissionRoles.indexOf(role) >= 0)
}

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

// 导航守卫
router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  if (getToken()) {
    // 登录，已经有 token
    // determine if there has token
    /* has token*/
    // 如果登录了，又访问 登录页面 直接重定向到 / 也就是首页
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done() // if current page is dashboard will not trigger	afterEach hook, so manually handle it
    } else {
      // 判断当前用户是否已拉取完user_info信息
      // 如果还没有获取 user_info 那么 store.getters.roles.length 为 0
      // 如果已经获取 user_info 那么 store.getters.roles.length 不为0
      // 所以，下面 if 判断中的代码逻辑只会执行一次
      // 接口：
      //  1 登录接口（只获取到的了token）
      //  2 用户信息 作为一个单独的接口，这个接口获取到到了 用户角色 等信息
      if (store.getters.roles.length === 0) {
        store
          .dispatch('GetUserInfo')
          .then(res => {
            // 拉取user_info
            const roles = res.data.roles // note: roles must be a array! such as: ['editor','develop']
            console.log('permission 获取用户信息接口：', roles)

            // 根据当前用户的角色来动态生成菜单（路由）
            store.dispatch('GenerateRoutes', { roles }).then(() => {
              // 根据roles权限生成可访问的路由表
              router.addRoutes(store.getters.addRouters) // 动态添加可访问路由表
              next({ ...to, replace: true }) // hack方法 确保addRoutes已完成 ,set the replace: true so the navigation will not leave a history record
            })
          })
          .catch(err => {
            store.dispatch('FedLogOut').then(() => {
              Message.error(err)
              next({ path: '/' })
            })
          })
      } else {
        // 没有动态改变权限的需求可直接next() 删除下方权限判断 ↓
        if (hasPermission(store.getters.roles, to.meta.roles)) {
          next()
        } else {
          next({ path: '/401', replace: true, query: { noGoBack: true }})
        }
        // 可删 ↑
      }
    }
  } else {
    // 没有登录，没有token
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      // 否则全部重定向到登录页
      next(`/login?redirect=${to.path}`)
      NProgress.done() // if current page is login will not trigger afterEach hook, so manually handle it
    }
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
