// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  let newLink;
  if (linkPool) {
    console.log("\u590D\u7528\u4E86linkPool");
    newLink = linkPool;
    linkPool = newLink.nextDep;
    newLink.sub = sub;
    newLink.dep = dep;
    newLink.nextDep = nextDep;
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: void 0,
      prevSub: void 0
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps = newLink;
    sub.depsTail = newLink;
  }
}
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function triggerRef(dep) {
  if (dep.subs) {
    propagete(dep.subs);
  }
}
function propagete(subs) {
  let link2 = subs;
  const queueEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking) {
      queueEffect.push(link2.sub);
    }
    link2 = link2.nextSub;
  }
  queueEffect.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTrack(sub) {
  sub.tracking = false;
  const depsTail = sub.depsTail;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else if (sub.deps) {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { sub, prevSub, nextSub, nextDep, dep } = link2;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link2.nextDep = void 0;
    } else {
      dep.subs = nextSub;
    }
    if (nextSub) {
      nextSub.prevSub = prevSub;
      link2.prevSub = void 0;
    } else {
      dep.subsTail = prevSub;
    }
    link2.dep = link2.sub = void 0;
    link2.nextDep = linkPool;
    linkPool = link2;
    console.log("\u4E0D\u8981\u4E86\u4FDD\u5B58\u8D77\u6765", linkPool);
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  // 依赖项列表的头节点
  deps;
  // 依赖项列表的尾节点
  depsTail;
  // 解决递归 是否开始追踪
  tracking = false;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      activeSub = prevSub;
    }
  }
  // 依赖的数据发生了变化 会调用notify
  notify() {
    this.scheduler();
  }
  // scheduler 有可能会被外部传入的options覆盖
  scheduler() {
    this.run();
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  Object.assign(e, options);
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value === "object";
}
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}

// packages/reactivity/src/baseHandlers.ts
var mutablaHandlers = {
  get(target, key, receiver) {
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    return res;
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChanged(oldValue, newValue)) {
      trigger(target, key);
      return res;
    }
  }
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = new Dep());
  }
  link(dep, activeSub);
  console.log("dep :>> ", dep);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  propagete(dep.subs);
}
var Dep = class {
  subs;
  subsTail;
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
var reactiveSet = /* @__PURE__ */ new WeakSet();
function reactive(target) {
  return createReactiveObject(target);
}
function createReactiveObject(target) {
  if (!isObject) {
    return target;
  }
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  if (reactiveSet.has(target)) {
    return target;
  }
  const proxy = new Proxy(target, mutablaHandlers);
  reactiveMap.set(target, proxy);
  reactiveSet.add(proxy);
  return proxy;
}
function isReactive(target) {
  return reactiveSet.has(target);
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  ["__v_isRef" /* IS_REF */] = true;
  // 标识
  subs;
  //subscribers(订阅者) 此处存储当前依赖的副作用函数effect
  // 尾节点
  subsTail;
  constructor(value) {
    this._value = value;
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    trackRef(this);
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(this._value, newValue)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      triggerRef(this);
    }
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
export {
  activeSub,
  effect,
  isReactive,
  isRef,
  reactive,
  ref
};
//# sourceMappingURL=reactivity.esm.js.map
