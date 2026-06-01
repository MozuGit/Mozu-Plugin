import Redis from "#Redis"
import randomInt from "#randomInt"
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
    let [cult, realm] = await Redis.hmget('Mozu:xiuxian:playerInfo:' + id, '修为', '境界')
    cult = parseInt(cult, 10)
    realm = parseInt(realm, 10)
    if (realm === 44) {
      return {
        event: "update"
      }
    } else {
      for (let item of realms) {
        if (item.id === realm + 1) {
          if (cult >= item.value) {
            if (randomInt(1, 100, id) <= item.success) {
              Redis.hset('Mozu:xiuxian:playerInfo:' + id, '境界', realm + 1)
              return {
                event: "realm_up",
                data: {
                  state: "success",
                  rate: item.success,
                  cult: item.failed
                }
              }
            } else {
              const cultFailed = cult - item.failed
              Redis.hset('Mozu:xiuxian:playerInfo:' + id, '修为', cultFailed)
              return {
                event: "realm_up",
                data: {
                  state: "failed",
                  rate: item.success,
                  cult: item.failed
                }
              }
            }
          } else {
            return {
              event: "cult_lack"
            }
          }
        }
      }
    }
  }
}