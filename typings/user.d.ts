// 业务类型示例
declare namespace User {
  interface UserLoginRes {
    /**
     * 头像
     */
    avatar: null | string
    /**
     * 昵称
     */
    nickname: null | string
    /**
     * 手机号
     */
    phone: null | string
    /**
     * 令牌
     */
    token: string
  }
}
