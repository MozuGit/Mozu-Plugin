import Redis from "#Redis"
import { Config } from "./Config/Config.js"

const realms = Config.Realm.Realms

export default new class {
    async getRealmName(realm) {
        for (let item of realms) {
            if (item.id === realm) {
                return item.name
            }
        }
        return '无'
    }

    async getNextExp(cult, realm) {
        for (let item of realms) {
            if (item.id === realm + 1) {
                if (item.value - cult <= 0) {
                    return 0
                } else {
                    return item.value - cult
                }
            }
        }
    }

    async realmUp(id) {
        const cult = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '修为'), 10)
        const realm = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '境界'), 10)
        if (realm === 44) {
            return false
        } else {
            for (let item of realms) {
                if (item.id === realm + 1) {
                    if (cult >= item.value) {
                        if (randomInt(1, 100) <= item.success) {
                            Redis.hset('Mozu:xiuxian:playerInfo:' + id, '境界', realm + 1)
                            return true
                        } else {
                            const cultFailed = cult - item.failed
                            Redis.hset('Mozu:xiuxian:playerInfo:' + id, '修为', cultFailed)
                            return cultFailed
                        }
                    } else {
                        return false
                    }
                }
            }
        }
    }
}

function randomInt(min, max, id) {
    let random = (Date.now() * id * 9301 + 49297) % 233280
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(random / 233280 * (max - min + 1)) + min
}