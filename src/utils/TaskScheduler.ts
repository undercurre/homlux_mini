interface ITask {
  task: () => void | Promise<any>
  resolve: (value: unknown) => void
  reject: (value: unknown) => void
}

export class TaskScheduler {
  // 并发上限
  concurrentCount = 2

  // 运行中的任务数
  runningTaskCount = 0

  // 任务列表
  tasks = [] as Array<ITask>

  constructor(concurrentCount = 2) {
    this.concurrentCount = concurrentCount
  }

  addTask(task: () => void) {
    return new Promise((resolve, reject) => {
      // 添加任务到队列里
      this.tasks.push({
        task,
        resolve,
        reject,
      })

      // 添加任务之后立即进入执行
      this._run()
    })
  }

  _run() {
    // 当任务列表不为空 且 正在运行的任务不超过并发上限 则继续执行下一个任务
    while (this.tasks.length > 0 && this.runningTaskCount < this.concurrentCount) {
      // 队列拿最新的任务
      const { task, resolve, reject } = this.tasks.shift() as ITask

      // 运行计数 + 1
      this.runningTaskCount++

      console.log('开始任务，并发任务数量：', this.runningTaskCount)

      // 运行任务
      const res = task()

      // 判断任务是异步还是同步任务
      if (res instanceof Promise) {
        res.then(resolve, reject).finally(() => {
          // 执行结束 运行计数 - 1
          this.runningTaskCount--
          console.log('结束Promise任务，并发任务数量：', this.runningTaskCount)
          // 递归调用 run 执行下一个任务
          this._run()
        })
      } else {
        // 执行结束 运行计数 - 1
        this.runningTaskCount--
        console.log('结束同步任务，并发任务数量：', this.runningTaskCount)
        // 递归调用 run 执行下一个任务
        this._run()
      }
    }
  }
}
