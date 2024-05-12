<template>
    <div class="main-container">
        <div class="header" style="">
            <el-row>
                <el-col :span="2" style="display: flex;align-items: center;">
                    <div class="house-icon" @click="router.push({ name: 'members' })">
                        <el-icon>
                            <House />
                        </el-icon>
                    </div>
                </el-col>
                <el-col :span="20">
                    <div class="title">账单管理</div>
                </el-col>
                <el-col :span="2"></el-col>
            </el-row>

        </div>
        <div class="content" ref="contentContainer">
            <el-empty description="暂无账单数据" v-if="store.orders.length == 0" />
            <div class="order" v-for="(item, index) in store.orders" :key="index">
                <div class="order-head">
                    <div class="order-sn">{{ index + 1 }}</div>
                    <div class="order-title" v-if="item.type == '麻将'" @click="changeOrderVisiblity(index)">
                        麻将流水
                    </div>
                    <div class="order-title" v-else @click="changeOrderVisiblity(index)">
                        <span>{{ store.members[item.payer] }}</span>
                        付款
                        <span>{{ item.money }}</span>元
                        (<span>{{ item.type }}</span>)
                        <span v-if="Object.keys(item.details).length == store.members.length">(All)</span>
                    </div>
                    <div class="order-delete" @click="deleteOrder(index)">
                        <el-icon>
                            <Delete />
                        </el-icon>
                    </div>
                </div>
                <div class="order-body" v-show="item.visible">
                    <div class="order-body-title">成员：</div>
                    <div class="order-members">
                        <div class="member-info" v-for="(value, key) in item.details" :key="key">
                            <div class="member-name">{{ store.members[key] }}</div>
                            <div class="member-money">
                                <span v-if="item.type == '麻将'">{{ value }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="buttons">
                <el-button style="width: 50%; height: 4rem" type="warning" @click="balanceBook">账单结算</el-button>
                <el-button style="width: 50%; height: 4rem" type="primary" @click="drawer = true">添加账单</el-button>
            </div>
        </div>
    </div>
    <el-drawer v-model="drawer" title="账单添加" size="80%" :direction="direction">
        <el-tabs v-model="activeName" class="order-tabs">
            <el-tab-pane label="消费账单" name="first">
                <el-form :model="form" label-width="auto">
                    <el-form-item label="付款人" class="el-form-item">
                        <el-select v-model="form.payer" placeholder="">
                            <el-option v-for="(m, index) in store.members" :key="index" :label="m" :value="index" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="金额" class="el-form-item">
                        <el-input v-model="form.money" />
                    </el-form-item>
                    <el-form-item label="成员" class="el-form-item">
                        <el-select-v2 v-model="form.members" :options="options" multiple clearable
                            placeholder="参与AA的所有人员">
                            <template #header>
                                <el-checkbox v-model="checkAll" :indeterminate="indeterminate" @change="handleCheckAll">
                                    全选
                                </el-checkbox>
                            </template>
                        </el-select-v2>
                    </el-form-item>
                    <el-form-item label="类别" class="el-form-item">
                        <el-select v-model="form.type" allow-create filterable placeholder="可手动输入">
                            <el-option v-for="(m, index) in order_type" :key="index" :label="m" :value="m" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
            <el-tab-pane label="麻将流水" name="second" v-if="store.members.length >= 4">
                <el-form :model="majForm" label-width="auto">
                    <el-form-item :label="'成员' + i" class="el-form-item" v-for="i in 4" :key="i">
                        <el-input v-model="majForm['member' + i]['money']" placeholder="金额，输赢用正负表示" clearable
                            class="input-with-select">
                            <template #prepend>
                                <el-select v-model="majForm['member' + i]['name']" placeholder="" style="width: 100px;">
                                    <el-option v-for="(m, index) in store.members" :key="index" :label="m"
                                        :value="index" />
                                </el-select>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
        </el-tabs>
        <template #footer>
            <div style="flex: auto">
                <el-button @click="clearInput" size="large">清空</el-button>
                <el-button type="primary" @click="addOrder" size="large">确认</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import type { DrawerProps, CheckboxValueType } from 'element-plus'
import { useStore } from '@/stores/store.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { simplifyTransfer } from '@/utils/transfer-core'
import { useRouter } from 'vue-router'
import { House, Delete } from '@element-plus/icons-vue'

const store = useStore()
const router = useRouter()

const contentContainer = ref(null)
const drawer = ref(false)
const activeName = ref('first')
const direction = ref<DrawerProps['direction']>('btt')
const order_type = ['车费', '台费', '吃喝', '娱乐']
const form = ref({
    payer: null,
    money: null,
    members: [],
    type: null
})
const majForm = ref({
    member1: {
        name: null,
        money: null
    },
    member2: {
        name: null,
        money: null
    },
    member3: {
        name: null,
        money: null
    },
    member4: {
        name: null,
        money: null
    }
})
const options = ref(
    store.members.map((item, idx) => ({
        value: idx,
        label: item,
    }))
)
const checkAll = ref(false)
const indeterminate = ref(false)

watch(() => form.value.members, (val) => {
    if (val.length === 0) {
        checkAll.value = false
        indeterminate.value = false
    } else if (val.length === options.value.length) {
        checkAll.value = true
        indeterminate.value = false
    } else {
        indeterminate.value = true
    }
})
const handleCheckAll = (val: CheckboxValueType) => {
    indeterminate.value = false
    if (val) {
        form.value.members = options.value.map((_) => _.value)
    } else {
        form.value.members = []
    }
}

/* 添加账单 */
const addOrder = async () => {
    if (activeName.value == 'first') {
        if (form.value.payer == null || form.value.money == null || form.value.type == null || form.value.members.length == 0) {
            ElMessage({
                message: '存在信息为空',
                grouping: true,
                type: 'warning'
            })
            return
        }
        const order = {}
        order['payer'] = form.value.payer
        order['money'] = form.value.money
        order['type'] = form.value.type
        order['visible'] = form.value.members.length != store.members.length
        order['details'] = {}
        form.value.members.map((item, index) => {
            order['details'][index] = null
        })
        store.orders.push(order)
        ElMessage({
            message: '添加成功',
            grouping: true,
            type: 'success',
        })
        clearInput()
    }
    else if (activeName.value == 'second') {
        const order = {}
        order['payer'] = 9999
        order['money'] = 0
        order['type'] = '麻将'
        order['visible'] = true
        order['details'] = {}
        let money_sum = 0

        for (let key in majForm.value) {
            if (majForm.value[key]['name'] == null || majForm.value[key]['money'] == null) {
                ElMessage({
                    message: '存在信息为空',
                    grouping: true,
                    type: 'warning'
                })
                return
            }
            order['details'][majForm.value[key]['name']] = majForm.value[key]['money']
            money_sum += parseFloat(majForm.value[key]['money'])
        }
        if (money_sum != 0) {
            ElMessage({
                message: '金额总和不为0',
                grouping: true,
                type: 'warning'
            })
            return
        }

        store.orders.push(order)
        ElMessage({
            message: '添加成功',
            grouping: true,
            type: 'success',
        })
        clearInput()
    }

    await nextTick
    contentContainer.value.scrollTop = contentContainer.value.scrollHeight;
}

const clearInput = () => {
    if (activeName.value == 'first') {
        form.value.payer = null
        form.value.money = null
        form.value.members = []
        form.value.type = ''
    }
    else if (activeName.value == 'second') {
        for (let key in majForm.value) {
            majForm.value[key]['name'] = null
            majForm.value[key]['money'] = null
        }
    }
}

const balanceBook = () => {
    if (store.orders.length == 0) {
        ElMessage({
            message: '请先添加账单',
            grouping: true,
            type: 'warning',
        })
        return
    }
    simplifyTransfer()
    router.push({
        name: 'results'
    })
}

const deleteOrder = (index) => {
    ElMessageBox.confirm(
        '是否确认删除',
        '警告',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(() => {
            store.orders.splice(index, 1)
        })
        .catch(() => {

        })

}

const changeOrderVisiblity = (index) => {
    store.orders[index].visible = !store.orders[index].visible
}
</script>

<style>
@import '../assets/main.css';

.house-icon {
    font-size: 30px;
    padding-left: 1rem;
    color: #2891fb;
    display: flex;
    align-items: center;
}

.order-delete {
    font-size: 24px;
    background-color: #f56c6c;
    color: white;
    padding: 0 5px;
    display: flex;
    align-items: center;
}

.order {
    margin-bottom: 6px;
}

.order-head {
    display: flex;
    flex-direction: row;
}

.order-sn,
.order-title {
    padding: 0.6rem;
}

.order-sn {
    background-color: #2090ff;
    color: white;
    min-width: 1.5rem;
    text-align: center;
}

.order-title {
    width: 100%;
    background-color: #58abff;
    color: white
}

.order-body {
    display: flex;
    flex-direction: row;
    margin-left: 3.4rem;
    margin-top: 5px;
}

.order-body-title {
    padding: 0.3rem 0.3rem 0 0;
    text-align: center;
}

.order-members {
    flex: 1;
}

.member-info {
    display: flex;
    flex-direction: row;
    margin-bottom: 5px;
    padding: 0.3rem 0;
    background-color: #f4f7ff;
}

.member-name {
    flex: 1;
    text-align: center;
}

.member-money {
    flex: 0 auto;
    width: 4rem;
    text-align: center;
}

.el-drawer__header {
    margin: 0 !important;
}

.el-form-item {
    min-height: 1rem;
    padding: 5px 0;
    margin-bottom: 4px;
}

.input-with-select .el-input-group__prepend {
    background-color: var(--el-fill-color-blank);
}
</style>