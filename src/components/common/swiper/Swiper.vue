<template>
  <div class="swiper">
    <div
      class="wrapper"
      ref="wrapper"
      :style="wrapperStyle"
      @touchstart="touchstart"
      @touchmove="touchmove"
      @touchend="touchend"
    >
      <slot></slot>
    </div>
    <div
      class="indicator"
      v-show="count > 1 && showIndicator"
      :style="indicatorStyle"
    >
      <slot name="indicator">
        <div
          class="indicator-icon"
          v-for="num in count - 2"
          :class="{ active: curIndex === num }"
          :key="num"
        ></div>
      </slot>
    </div>
  </div>
</template>

<script>
let methods = {
  touchstart(e) {
    // scrolling表示图片正在滚动 在滚动结束后再touchstart执行
    if (this.scrolling) {
      this.moving = false;
      this.callback = () => {
        this.touchstart(e);
      };
      return;
    }
    this.moving = true;
    this.preX = e.changedTouches[0].clientX;
    this.startLeft = this.left;
    // 这个不能省略 因为在touchmove的时候不能有动画的延迟
    this.dTransTime = 0;
    this.stopTimer();
  },
  touchmove(e) {
    if (!this.moving || this.count === 2) {
      return;
    }
    // 为正表示手指向右 为负表示向左
    const mouseMove = e.changedTouches[0].clientX - this.preX;
    this.preX = e.changedTouches[0].clientX;
    // 实时更新left
    this.left = this.left + mouseMove;
    // 更新index
    this.index = parseInt(parseInt(-this.left) / this.width);
  },
  // check函数是为了检查是否拖动到 left >= 0 处 如果滑到了要秒切 但实际上是不可能发生的 用户最多通过真的第一张往左
  // 滑到假的最后一张
  // check() {
  //   // 在拖动的时候更新index 保留两位小数是因为 当-this.left = -0.00000123时
  //   // -this.left / this.width 的结果为负值 而正确情况下为0
  //   this.index = parseInt(-this.left.toFixed(2) / this.width);
  //   // this.left >= 0
  //   // 表示到了第一张还要往左边拖 因为第一张是实际上的最后一张 所以要返回真正的最后一张

  //   // this.left <= -(this.count - 1) * this.width
  //   // 表示到了最后一张还要往右边拖 因为第一张是实际上的第一张 所以要返回真正的第一张
  //   // 不直接设置为 === 是因为有误差存在
  //   if (this.left >= 0 || this.left <= -(this.count - 1) * this.width) {
  //     this.index = this.index === 0 ? this.count - 2 : 1;
  //     // 在touchstart的时候已经关掉动画效果了 所以这里不会有动画
  //     this.dTransTime = 0;
  //     this.left = -this.index * this.width;
  //   }
  // },

  touchend() {
    if (!this.moving) {
      return;
    }
    this.callback = null;
    // 在move时可能移动了多张图片 而且要看的是最后一张图是否移过了ratio 通过取余拿到最后一张图移动了多少
    let distance = this.left - this.startLeft;
    // left越小表示手指越往左边
    // distance < 0 看是否切下一张图
    // 因为这时候的index为当前图的index 所以如果切就scrollTo(1)切到下一张图 不切就scrollTo(0)回到当前图
    // distance > 0 看是否切上一张图
    // 注意这时候的index为上一张图的index 所以如果且就scroll(0) 不切就scroll(1)返回当前图
    if (Math.abs(distance) >= this.width * this.ratio) {
      distance < 0 ? this.scrollTo(1) : this.scrollTo(0);
    } else {
      distance <= 0 ? this.scrollTo(0) : this.scrollTo(1);
    }
    this.startTimer();
  },
  // 从当前left带动画的移动到index+direction所在left
  scrollTo(direction) {
    this.curIndex = this.index;
    // 最终下标
    this.index += direction;
    // 最终下标的left值
    let end = -this.index * this.width;
    // 设置动画所需时间
    this.dTransTime = (Math.abs(this.left - end) / this.width) * this.transTime;
    // 设置当前在滚动 滚动状态下不能拖动
    this.scrolling = true;
    // 设置left 动画开始
    this.left = end;
    // 当动画结束时执行下列操作
    setTimeout(() => {
      // 设置为不滚动即可以拖动
      this.scrolling = false;
      // index为0        表示到了前面的最后一张 那么就要回到真正的最后一张 下标为 0
      // index为length-1 表示到了后面的第一张 那么就要回到真正的第一张 下标为    length - 2
      if (this.index === 0 || this.index === this.count - 1) {
        this.index = this.index === 0 ? this.count - 2 : 1;
        // 因为要秒切 所以设置动画时间为0
        this.dTransTime = 0;
        // 设置left实现跳转
        this.left = -this.index * this.width;
      }
      // 动画结束后更新index
      this.curIndex = this.index;
      this.callback && this.callback();
    }, this.dTransTime);
  },
  // 删除计时器
  stopTimer() {
    clearInterval(this.timer);
  },
  startTimer() {
    this.timer = setInterval(() => {
      this.scrollTo(1);
    }, this.interval);
  },
  init() {
    // 插入前后两张额外的图片
    let wrapper = this.$refs.wrapper;
    if (wrapper.childElementCount > 1) {
      // 最多展示五张
      for (let i = 0; i < wrapper.children.length; i++) {
        i > 4 && wrapper.removeChild(wrapper.children[i]) && i--;
      }

      let firstChild = wrapper.firstElementChild.cloneNode(true);
      let lastChild = wrapper.lastElementChild.cloneNode(true);
      wrapper.appendChild(firstChild);
      wrapper.insertBefore(lastChild, wrapper.firstElementChild);

      this.count = wrapper.childElementCount;
      this.width = parseInt(getComputedStyle(this.$el).width);
      wrapper.style.width = this.width * this.count + 'px';

      // 第一张图在-width px处
      this.left = -this.width;
      this.startTimer();
      // dTransTime不需要被赋初始值 因为每次用的时候都会提前赋值 而且如果赋值的话上面设置left切第一张的时候会有动画
    }
  },
};
export default {
  methods,
  name: 'Swiper',
  props: {
    // 轮播时间
    interval: {
      type: Number,
      default: 3000,
    },
    // 切换一张图片的时间
    transTime: {
      type: Number,
      default: 300,
    },
    // 是否显示导航按钮
    showIndicator: {
      type: Boolean,
      default: true,
    },
    // 滚动多少切到下一张
    ratio: {
      type: Number,
      default: 0.25,
    },
    indicatorStyle: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      // 整个swiper的宽度同时也是每一张图片的宽度
      width: 0,
      // 用户看到的图片数量
      count: 2,
      // 当前轮播或者拖动到的下标
      index: 1,
      // list的left
      left: 0,
      // 是否正在滚动
      scrolling: false,
      // 当前轮播的下标(不包括拖动) 用于导航按钮
      curIndex: 1,
      dTransTime: 0,
      // 是否可以滑动 用于标识touchstart是否有效
      moving: false,
      // scrollTo切换完成后的回调 用于保存scrolling状态下的touchstart
      callback: null,
    };
  },
  computed: {
    // list样式
    wrapperStyle() {
      return {
        left: this.left + 'px',
        transition: `left ease-in-out ${this.dTransTime}ms`,
      };
    },
  },
};
</script>

<style scoped>
.swiper {
  position: relative;
  overflow: hidden;
}

.wrapper {
  display: flex;
  position: absolute;
}

.indicator {
  position: absolute;
  z-index: 20;
  display: flex;
  left: 5%;
  bottom: 5%;
}

.indicator-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  border: 2px solid transparent;
  background-clip: content-box;
}

.indicator-icon.active {
  background-color: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
}
</style>