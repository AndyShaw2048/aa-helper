<template>
    <div class="main-container">
        <div class="header">
            <div class="title">成员管理</div>
            <div class="tips">*请一次性添加所有成员</div>
        </div>
        <div class="content" ref="contentContainer">
            <el-empty description="暂无成员数据" v-if="store.members.length == 0" />
            <div class="member" v-for="(m, index) in store.members" :key="index">
                <div class="member-sn">{{ index + 1 }}</div>
                <div class="member-name">{{ m }}</div>
                <div class="member-delete" @click="removeMember(index)">删除</div>
            </div>
        </div>
        <div class="footer">
            <div class="member-add-container">
                <div class="member-add">
                    <el-input v-model="memberName" style="height: 3rem;" placeholder="请输入姓名(可用回车键)" clearable
                        maxlength="10" show-word-limit ref="memberNameInput" @keyup.enter="addMember">
                        <template #append>
                            <el-button @click="addMember">添加</el-button>
                        </template>
                    </el-input>
                </div>
                <div class="buttons">
                    <el-button style="width: 30%; height: 4rem" @click="resetAppStore">重置</el-button>
                    <el-button style="width: 100%; height: 4rem" type="primary" @click="jumpToOrders">下一步</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useStore } from '@/stores/store.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'

const store = useStore()
const router = useRouter()

const memberName = ref('')
const memberNameInput = ref(null)
const contentContainer = ref(null)

const addMember = async () => {
    memberNameInput.value.focus()

    if (memberName.value.trim() == "") return
    if (store.members.includes(memberName.value)) {
        ElMessage({
            message: '名字不能重复',
            grouping: true,
            type: 'error',
        })
        return
    }
    store.members.push(memberName.value)
    memberName.value = ''
    await nextTick
    contentContainer.value.scrollTop = contentContainer.value.scrollHeight;
}

const removeMember = (index) => {
    store.members.splice(index, 1)
}

const resetAppStore = () => {
    ElMessageBox.confirm(
        '重置将删除系统内的所有数据，是否继续？',
        '警告',
        {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(() => {
            memberName.value = ''
            store.$reset()
        })
        .catch(() => {

        })
}

const jumpToOrders = () => {
    if (store.members.length == 0) {
        ElMessage({
            message: '请先添加成员',
            grouping: true,
            type: 'warning',
        })
        return
    }
    if (memberName.value.trim() != "") {
        ElMessage({
            message: '姓名输入框不为空',
            grouping: true,
            type: 'warning',
        })
        return
    }

    router.push({
        name: 'orders'
    })
}

</script>

<style scoped>
.member {
    display: flex;
    flex-direction: row;
    margin: 0.5rem 0;
    border-radius: 10px;
}

.member-sn,
.member-name,
.member-delete {
    padding: 1rem 0;
}

.member-sn {
    color: white;
    background-color: #409eff;
    width: 50px;
    text-align: center;
}

.member-name {
    flex: 1;
    text-align: center;
    background-color: #f2f8ff;
}

.member-delete {
    color: white;
    background-color: #f56c6c;
    width: 50px;
    text-align: center;
}

.el-input-group__append {
    background-color: #e6a23c !important;
    color: white !important;
}
</style>@/store.js