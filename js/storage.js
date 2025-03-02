export const storage = {
  get(key, parse = true) {
    const value = localStorage.getItem(key);
    return parse && value ? JSON.parse(value) : value;
  },
  set(key, value, stringify = true) {
    localStorage.setItem(key, stringify ? JSON.stringify(value) : value);
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear(keys) {
    keys.forEach((key) => this.remove(key));
  },
};
