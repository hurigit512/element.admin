import { asyncRouterMap, constantRouterMap } from '@/router'

/**
 * 通过meta.role判断是否与当前用户权限匹配
 * @param roles 角色
 * @param route 每一个路由对象
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * 递归过滤异步路由表，返回符合用户角色权限的路由表
 * @param routes asyncRouterMap 需要权限控制的路由表
 * @param roles 用户角色
 */
function filterAsyncRouter(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRouter(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const permission = {
  state: {
    routers: [],
    addRouters: []
  },
  mutations: {
    SET_ROUTERS: (state, routers) => {
      // 表示动态添加的路由
      state.addRouters = routers
      // 当前用户能够访问到的所有路由
      state.routers = constantRouterMap.concat(routers)
    }
  },
  actions: {
    // 根据用户的角色来动态生成菜单：
    // data： { roles: ['admin'] }
    GenerateRoutes({ commit }, data) {
      return new Promise(resolve => {
        // ['admin']
        const { roles } = data
        let accessedRouters

        // 判断角色中是否包含 admin 也就是管理员
        if (roles.includes('admin')) {
          accessedRouters = asyncRouterMap
        } else {
          // 非管理员角色：
          accessedRouters = filterAsyncRouter(asyncRouterMap, roles)
        }

        commit('SET_ROUTERS', accessedRouters)
        resolve()
      })
    }
  }
}

export default permission
