import config from '../config';

const DEFAULT_CACHE_TIME = config.storageExpire[config.env];

export const createStorage = ({ prefixKey = '' } = {}) => {
  const Storage = class {
    prefixKey = prefixKey;

    getKey(key: string) {
      return `${this.prefixKey}${key}`.toUpperCase();
    }

    set(key: string, value: IAnyObject, expire = DEFAULT_CACHE_TIME) {
      const stringData = JSON.stringify({
        value,
        expire: expire !== null ? new Date().getTime() + expire * 1000 : null,
      });
      wx.setStorageSync(this.getKey(key), stringData);
    }

    get(key: string, def = null) {
      const item = wx.getStorageSync(this.getKey(key));
      if (item) {
        try {
          const data = JSON.parse(item);
          const { value, expire } = data;
          // 在有效期内直接返回
          if (expire === null || expire >= Date.now()) {
            return value;
          }
          this.remove(this.getKey(key));
        } catch (e) {
          return def;
        }
      }
      return def;
    }

    remove(key: string) {
      try {
        wx.removeStorageSync(this.getKey(key));
      } catch (e) {}
    }

    clear() {
      wx.clearStorage();
    }
  };
  return new Storage();
};

export const storage = createStorage();

export default storage;
