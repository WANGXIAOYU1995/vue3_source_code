export function isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object';
}
// 判断对象是否发生了变化
export function hasChanged(newValue, oldValue) {
    return !Object.is(newValue, oldValue)
}