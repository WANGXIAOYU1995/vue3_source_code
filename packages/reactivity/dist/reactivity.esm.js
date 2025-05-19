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
function startTrack(sub) {
  sub.depsTail = void 0;
}
function endTrack(sub) {
  const depsTail = sub.depsTail;
  if (depsTail) {
    if (depsTail.nextDep) {
      console.log("\u5982\u679C\u5C3E\u8282\u70B9\u8FD8\u6709\u4E0B\u4E00\u4E2A\u8282\u70B9\uFF0C\u8BF4\u660E\u7B2C\u4E8C\u6B21effect\u6267\u884C\u65F6 \u6709\u7684ref\u5C1D\u8BD5\u590D\u7528\u6536\u96C6\u8FC7\u7684\u8282\u70B9\u3002\u590D\u7528\u5931\u8D25\u4E86 \u6B64\u65F6\u8FD9\u4E2A\u5931\u8D25\u7684\u5C31\u662F\u6CA1\u88AB\u4E8C\u6B21\u4F9D\u8D56\u6536\u96C6\u7684\u8282\u70B9\u6240\u4EE5\u8981\u6E05\u7406");
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
    link2.nextDep = void 0;
    link2 = nextDep;
  }
}
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
    sub.depsTail = nextDep;
    return;
  }
  const newLink = {
    sub,
    dep,
    nextDep,
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
export {
  activeSub,
  effect,
  isRef,
  ref
};
//# sourceMappingURL=reactivity.esm.js.map
