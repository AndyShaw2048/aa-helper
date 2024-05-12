import { useStore } from '@/stores/store.js'

export const simplifyTransfer = () => {
    const store = useStore()

    const transfers = new Array(store.members.length)
    for (let i = 0; i < store.members.length; i++) {
        transfers[i] = new Array(store.members.length).fill(0)
    }

    for (let i = 0; i < store.orders.length; i++) {
        const order = store.orders[i]
        const people = Object.keys(order.details).length
        // 计算AA金额
        let payerId = null
        let payeeId = null
        if (order.type != '麻将') {
            let AAAmount = calculateAA(order.money, people)

            payeeId = order.payer
            // 记录转账细节
            for (let key in order.details) {
                payerId = key
                if (payerId == payeeId) {
                    order.details[key] = -AAAmount[0]
                    continue
                }
                transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(AAAmount[1])).toNumber()
                transfers[payeeId][payerId] = -transfers[payerId][payeeId]
                order.details[key] = -AAAmount[1]
            }
        }
        else if (order.type == '麻将') {
            let majDetails = []
            for (let key in order.details) {
                majDetails.push([key, order.details[key]])
            }
            majDetails.sort(function (a, b) {
                return a[1] - b[1]; // 如果需要降序排序，则将'a[1] - b[1]'改为'b[1] - a[1]'
            });

            let count = 0;
            for (let i = 0; i < majDetails.length; i++) {
                if (majDetails[i][1] < 0) count++;
            }

            if (count == 1) {
                let payerId = majDetails[0][0];
                for (let i = 1; i < majDetails.length; i++) {
                    let payeeId = majDetails[i][0];
                    let money = majDetails[i][1];
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];
                }
            }
            if (count == 3) {
                let payeeId = majDetails[3][0];
                for (let i = 0; i < majDetails.length - 1; i++) {
                    let payerId = majDetails[i][0];
                    let money = majDetails[i][1];
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).add(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];
                }
            }
            if (count == 2) {
                if (Math.abs(majDetails[1][1]) >= Math.abs(majDetails[2][1])) {
                    let payerId = majDetails[1][0];
                    let payeeId = majDetails[2][0];
                    let money = majDetails[2][1];
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];
                    majDetails[1][1] += money;
                    if (majDetails[1][1] != 0) {
                        payeeId = majDetails[3][0];
                        money = Math.abs(majDetails[1][1]);
                        transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                        transfers[payeeId][payerId] = -transfers[payerId][payeeId]
                        majDetails[3][1] -= money;
                    }
                    payerId = majDetails[0][0];
                    payeeId = majDetails[3][0];
                    money = majDetails[3][1];
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId]
                }
                else {
                    let payerId = majDetails[1][0];
                    let payeeId = majDetails[2][0];
                    let money = Math.abs(majDetails[1][1]);
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];
                    majDetails[2][1] -= money;

                    payerId = majDetails[0][0];
                    payeeId = majDetails[2][0];
                    money = Math.abs(majDetails[2][1]);
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];

                    payerId = majDetails[0][0];
                    payeeId = majDetails[3][0];
                    money = Math.abs(majDetails[3][1]);
                    transfers[payerId][payeeId] = Decimal(transfers[payerId][payeeId]).sub(Decimal(money)).toNumber()
                    transfers[payeeId][payerId] = -transfers[payerId][payeeId];
                }
            }
        }
    }

    let done = true
    do {
        done = true
        for (let i = 0; i < transfers.length; i++) {
            for (let j = 0; j < transfers[i].length; j++) {
                if (transfers[i][j] < 0) {
                    for (let k = 0; k < transfers[j].length; k++) {
                        if (transfers[j][k] < 0) {
                            done = false
                            let pre = -transfers[i][j]
                            let next = -transfers[j][k]
                            if (pre >= next) {
                                transfers[j][k] = 0
                                transfers[k][j] = 0
                                // transfers[i][j] += next
                                // transfers[j][i] = -transfers[i][j]
                                // transfers[i][k] -= next
                                // transfers[k][i] = -transfers[i][k]

                                transfers[i][j] = Decimal(transfers[i][j]).add(Decimal(next)).toNumber()
                                transfers[j][i] = -transfers[i][j]
                                transfers[i][k] = Decimal(transfers[i][k]).sub(Decimal(next)).toNumber()
                                transfers[k][i] = -transfers[i][k]
                            }
                            else {
                                transfers[i][j] = 0
                                transfers[j][i] = 0
                                // transfers[j][k] += pre
                                // transfers[k][j] = -transfers[j][k]
                                // transfers[i][k] -= pre
                                // transfers[k][i] = -transfers[i][k]

                                transfers[j][k] = Decimal(transfers[j][k]).add(Decimal(pre)).toNumber()
                                transfers[k][j] = -transfers[j][k]
                                transfers[i][k] = Decimal(transfers[i][k]).sub(Decimal(pre)).toNumber()
                                transfers[k][i] = -transfers[i][k]
                            }
                        }
                    }
                }
            }
        }
    } while (!done)

    // console.log(transfers)
    store.details = transfers
    store.orders.sort(function (a, b) {
        return a.payer - b.payer; // 如果需要降序排序，则将'a[1] - b[1]'改为'b[1] - a[1]'
    });
}

const calculateAA = (amount, people) => {
    let average = amount / people;
    average = Math.round(average * 100) / 100;

    let remainMoney = Decimal(amount).sub(Decimal(average).mul(Decimal(people))).toNumber()
    if (remainMoney == 0) return [average, average]
    if (remainMoney > 0) {
        let subMoney = Decimal(people - remainMoney * 100 - 1).div(Decimal(100)).toNumber()
        let AMoney = Decimal(average).sub(Decimal(subMoney)).toNumber()
        let BMoney = Decimal(average).add(Decimal(0.01)).toNumber()
        return [AMoney, BMoney]
    }
    else {
        let AMoney = Decimal(average).add(Decimal(remainMoney)).toNumber()
        let BMoney = Decimal(average).toNumber()
        return [AMoney, BMoney]
    }
}