// 业务类型示例
declare namespace User {
  interface UserLoginRes {
    /**
     * 头像
     */
    headImageUrl?: string
    /**
     * 昵称
     */
    nickName?: string
    /**
     * 手机号
     */
    mobilePhone: string
    /**
     * 令牌
     */
    token: string
  }
  interface UserInfo {
    /**
     * 头像
     */
    avatar: string
    /**
     * 昵称
     */
    nickname: string
    /**
     * 手机号
     */
    phone: string
    /**
     * 用户id
     */
    id: string
  }
}
