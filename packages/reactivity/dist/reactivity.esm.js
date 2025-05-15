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
  run() {
    const prevSub = activeSub;
    activeSub = this;
    this.depsTail = void 0;
    try {
      return this.fn();
    } finally {
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

// packages/reactivity/src/system.ts
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    console.log("\u76F8\u540C\u7684\u4F9D\u8D56\u76F4\u63A5\u590D\u7528");
    sub.depsTail = nextDep;
    return;
  }
  const newLink = {
    sub,
    dep,
    nextDep: void 0,
    nextSub: void 0,
    prevSub: void 0,
  };
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
    queueEffect.push(link2.sub);
    link2 = link2.nextSub;
  }
  queueEffect.forEach((effect2) => effect2.notify());
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
  }
  get value() {
    trackRef(this);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
export { activeSub, effect, isRef, ref };
//# sourceMappingURL=reactivity.esm.js.map
