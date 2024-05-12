import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import Orders from '@/views/Orders.vue'
import Members from '@/views/Members.vue'
import Results from '@/views/Results.vue'

const router = createRouter({
    history: createWebHashHistory(),  // hash 模式
    //   history: createWebHistory(),  // history 模式
    routes: [
        {
            path: '/',
            name: 'members',
            component: Members,
            meta: {
                title: '成员管理',
            },
        },
        {
            path: '/orders',
            name: 'orders',
            component: Orders,
            meta: {
                title: '账单管理',
            },
        },
        {
            path: '/results',
            name: 'results',
            component: Results,
            meta: {
                title: '账单详情',
            },
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ]
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
    // console.log(to, from)
    if (to.meta.title) {
        document.title = `${to.meta.title}`;
    }
    next()
})

// router.afterEach((to, from)=>{
//   console.log(to, from)
//   console.log('afterEach')
// })

export default router