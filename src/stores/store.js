import { defineStore } from 'pinia'

export const useStore = defineStore('appStore', {
    state: () => ({ 
        count: 0,
        members: [],
        orders: [],
        details: []
    }),
    getters: {
        double: (state) => state.count * 2,
    },
    actions: {
        increment() {
            this.count++
        },
    },
    persist: true
})