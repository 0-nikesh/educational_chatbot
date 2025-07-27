export const storage = {
  save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load(key: string, def: any = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  remove(key: string) {
    localStorage.removeItem(key);
  }
}
