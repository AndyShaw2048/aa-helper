<template>
    <div class="main-container" :style="{ 'display': mainContainerDisplay }">
        <div class="content" ref="contentContainer">
            <div class="result-title">AA助手-账单详情</div>
            <div class="create-time">创建于：{{ currentDate }}</div>
            <div class="balance-details">
                <div class="section-title">清账步骤 <span style="font-size: 12px;color: gray;">*结果仅供参考</span></div>
                <div class="balance-detail" v-for="(item, index) in balanceDetails" :key="index">
                    <div class="payer-name">{{ item.payer_name }}</div>
                    向
                    <div class="payee-name">{{ item.payee_name }}</div>
                    转账
                    <div class="payer-money">{{ roundToSpecial(item.pay_money) }} <span style="text-decoration: line-through;color: lightgray;" v-if="roundToSpecial(item.pay_money) != item.pay_money">{{ item.pay_money }}</span></div>
                    元
                </div>
            </div>
            <div class="bills-sum">
                <div class="section-title">账单合计</div>
                <div class="bills-sum-detail" v-for="(item, index) in billsSum" :key="index">
                    <div class="user-name">{{ item.user_name }}</div>
                    合计
                    <div class="user-money">{{ item.money > 0 ? "+" + item.money : item.money }}</div>
                    元
                </div>
            </div>
            <div class="bill-details">
                <div class="section-title">账单详情</div>
                <div class="bill-detail" v-for="(item, index) in store.orders" :key="index">
                    <div class="bill-title">
                        <span>- </span>
                        <span v-if="item.type == '麻将'">麻将流水</span>
                        <span v-else>{{ store.members[item.payer] }} 支付 {{ item.money }} 元 ({{ item.type }})</span>
                    </div>
                    <div class="member-details">
                        <div class="member-title">成员：</div>
                        <div class="bill-members">
                            <div class="bill-member" v-for="(value, key) in item.details" :key="key">
                                <div class="bill-member-name">{{ store.members[key] }}</div>
                                <div class="bill-member-money" style="color: lightgray;" v-if="item.payer == key">{{ value > 0 ? "+" + value : value }} 元</div>
                                <div class="bill-member-money" v-else>{{ value > 0 ? "+" + value : value }} 元</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="member-add-container">
                <div class="buttons">
                    <el-dropdown @click="" style="width: 100%; height: 4rem;text-align: center;">
                        <el-button style="width: 94%; height: 4rem;" type="primary">菜单列表</el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="router.push({name:'members'})">成员管理</el-dropdown-item>
                                <el-dropdown-item @click="router.push({name:'orders'})">账单管理</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-button style="width: 90%; height: 4rem;" type="primary" @click="exportToImg">生成图片</el-button>
                </div>
            </div>
        </div>
    </div>

    <el-dialog v-model="printImgDialog" title="长按保存图片" width="100%">
        <div style="text-align: center;">
            <img :src="printImgSrc" style="width: 40%;">
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from '@/stores/store'
import html2canvas from 'html2canvas'
import router from '@/routers/router';

const store = useStore()
const balanceDetails = ref([])
const billsSum = ref([])
const contentContainer = ref(null)
const mainContainerDisplay = ref('flex')
const printImgDialog = ref(false)
const printImgSrc = ref('')
const currentDate = computed(() => {
    const date = new Date();
    const formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}
    ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return formatted;
})

const computeBalanceDetails = () => {
    for (let i = 0; i < store.details.length; i++) {
        for (let j = 0; j < store.details[i].length; j++) {
            let d = {}
            if (store.details[i][j] < 0) {
                d['payer_name'] = store.members[i]
                d['payee_name'] = store.members[j]
                d['pay_money'] = Math.abs(store.details[i][j])
                balanceDetails.value.push(d)
            }
        }
    }
}

const computeBillsSum = () => {
    for (let i = 0; i < store.details.length; i++) {
        let sum = 0
        for (let j = 0; j < store.details[i].length; j++) {
            sum = Decimal(sum).add(Decimal(store.details[i][j])).toNumber()
        }
        let d = {}
        d['user_name'] = store.members[i]
        d['money'] = sum
        billsSum.value.push(d)
    }
}

const exportToImg = async () => {
    mainContainerDisplay.value = 'block'
    await nextTick
    html2canvas(contentContainer.value).then((canvas) => {
        const img_url = canvas.toDataURL('image/png')
        printImgSrc.value = img_url
        printImgDialog.value = true
        // const a_tag = document.createElement('a')
        // a_tag.href = img_url
        // a_tag.download = 'test.png'
        // a_tag.click()
    })
    mainContainerDisplay.value = 'flex'
}

const roundToSpecial = (number) => {
    // 将小数部分提取出来
    var decimal = number - Math.floor(number);

    if (decimal <= 0.33) {
        // 当小数在0-0.33之间时，舍去小数位
        return Math.floor(number);
    } else if (decimal <= 0.66) {
        // 当小数在0.33-0.66之间时，小数位变为0.5
        return Math.floor(number) + 0.5;
    } else {
        // 当小数大于0.66时，该数字进1
        return Math.ceil(number);
    }
}

onMounted(() => {
    computeBalanceDetails()
    computeBillsSum()
})


</script>

<style>
.example-showcase .el-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
}

.result-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    padding: 1rem 0;
}

.create-time {
    font-size: 14px;
    font-family: monospace;
}

.section-title {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-weight: bold;
    font-size: 16px;
    border-bottom: 2px dashed black;
    padding-bottom: 5px;
}

.balance-detail {
    display: flex;
    flex-direction: row;
    padding-bottom: 6px;
    font-family: monospace;
}

.payer-name {
    width: 5rem;
    padding-right: 0.5rem;
}

.payee-name {
    width: 5rem;
    padding-left: 0.5rem;
}

.payer-money {
    flex: 1;
    text-align: center;
}

.bills-sum-detail {
    display: flex;
    padding-bottom: 6px;
    font-family: monospace;
}

.user-name {
    width: 5rem;
}

.user-money {
    width: 5rem;
    padding-left: 2rem;
}

.member-details {
    display: flex;
    flex-direction: row;
    margin-bottom: 6px;
}

.bill-title {
    padding-bottom: 6px;
    font-weight: bold;
}

.bill-detail {
    font-family: monospace;
}

.bill-members {
    flex: 1;
}

.bill-member {
    display: flex;
    flex-direction: row;
    margin-bottom: 6px;
}

.member-title {
    margin-left: 1rem;
}

.bill-member-name {
    flex: 1;
    text-align: center;
}

.bill-member-money {
    width: 5rem;
    text-align: right;
}
</style>