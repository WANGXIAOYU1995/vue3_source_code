// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    const prevSub = activeSub;
    activeSub = this;
    try {
      return this.fn();
    } finally {
      activeSub = prevSub;
    }
  }
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
function track(dep) {
  const newLink = {
    sub: activeSub,
    nextSub: void 0,
    prevSub: void 0
  };
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
}
function triggerRef(dep) {
  let link = dep.subs;
  const queueEffect = [];
  while (link) {
    queueEffect.push(link.sub);
    link = link.nextSub;
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
    if (activeSub) {
      track(this);
    }
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
export {
  activeSub,
  effect,
  isRef,
  ref
};
//# sourceMappingURL=reactivity.esm.js.map
