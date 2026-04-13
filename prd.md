# 📝 猜数字 PvP 联机对战游戏 (NumDecode) - 产品需求文档 (PRD)

> **文档状态**：待开发阶段
> **文档版本**：v1.2 (AI 优化版)
> **技术基准**：Nuxt 4 (Vue 3) 全栈架构

---

## 1. 项目概述与核心定位

- **项目名称**：NumDecode (数字破译)
- **游戏类型**：逻辑博弈、休闲局域网/在线联机游戏
- **视觉风格**：二次元手绘风格，水彩卡通晕染 + 复古纸张纹理 + 铅笔线条手绘感
- **核心玩法**：
  - 玩家 1V1 博弈。每局开始时，双方各自设定一个 4 位数的“秘密数字”（支持数字重复，例如 1123，0000）。
  - 进入对战阶段后，双方轮流猜测对方的数字。
  - **反馈规则**：系统根据猜测数字，返回位置和数字**完全正确**的个数（该设定区别于传统"几A几B"，难度更高，仅反馈精准命中数量。例如：对方是 1234，猜 1004，则提示 2 个对）。
  - **获胜条件**：先猜中对方 4 位秘密数字的一方获得胜利。

---

## 2. 状态机与核心业务逻辑 (AI 开发指南)

为了让 AI 或后端能准确控制对局状态，基于状态机（State Machine）定义房间及对局的生命周期：

### 2.1 房间状态枚举 (`RoomStatus`)
1. `WAITING`：等待中。房间已创建，房主在等待第二个玩家加入。
2. `SETTING`：准备阶段。双方玩家均已进入房间，正在各自设置自己的 4 位秘密数字。
3. `PLAYING`：对战阶段。双方数字设置完毕，系统随机或指定（如：房主先手）赋予 `currentTurn` 给其中一方，双方开始轮流猜测。
4. `FINISHED`：对局结束。某方猜中，展示结算画面。

### 2.2 角色与权限 (`Role`)
- `Player - Host` (房主)：创建房间的人，首位加入者。
- `Player - Guest` (对战方)：第二位加入该房间的人，触发状态从 WAITING 进入 SETTING。
- `Spectator` (观众)：房间人数满 2 人后，后续通过房间号进入的用户，只能被动接收 WebSocket 广播状态，无法进行交互（设置数字/提交猜测）。

---

## 3. 数据模型设计 (Data Models)

*建议使用 TypeScript 接口进行实体定义。*

### 3.1 玩家实体 (`Player`)
```typescript
interface Player {
  userId: string;        // 唯一ID (UUID)
  nickname: string;      // 玩家昵称
  role: 'host' | 'guest' | 'spectator';
  isReady: boolean;      // 此阶段是否已设定完秘密数字
  // secret: string;     // [注意] 仅服务端保存，禁止下发给客户端
}
```

### 3.2 猜测行动记录 (`GuessRecord`)
```typescript
interface GuessRecord {
  userId: string;        // 猜测者的ID
  guessNumber: string;   // 猜的数字 "1234"
  correctCount: number;  // 猜对的个数 (0-4)
  timestamp: string;     // 猜测时间戳
}
```

### 3.3 房间实体 (`Room`)
```typescript
interface Room {
  roomId: string;             // 4位随机房间码
  status: RoomStatus;         // 当前状态
  players: Player[];          // 参与者列表
  spectators: Player[];       // 观众列表
  currentTurnUserId: string | null;  // 当前轮到谁进行猜测（仅 PLAYING 状态有效）
  winnerUserId: string | null;       // 获胜者ID
  logs: GuessRecord[];        // 全局对局记录日志
}
```

---

## 4. 核心页面交互链路 (Frontend)

项目页面基于 Nuxt 动态路由。

### 4.1 游戏大厅页面 (`/`)
- **UI 布局**：手绘画布中央为登录及入口控制台。
- **登录逻辑**：
  - 输入框填写 `昵称`。
  - 自动向 `localStorage` 同步及回显历史昵称，避免刷新丢失。
- **建房 / 加入逻辑**：
  - **创建房间**：点击“新建对局”，客户端向服务端请求 `roomId`，并路由跳转到 `/room/[roomId]`。
  - **加入房间**：展示 4 位输入框，提交后校验：存在 & 状态允许则跳入 `/room/[roomId]`；否则报错（如：“房间不存在”、“房间已满”）。

### 4.2 游戏房间页面 (`/room/[id]`)
根据当前的 `RoomStatus` 展示不同视图：

- **等待视图 (`WAITING`)**：
  - 显示当前房间码，居中显示“等待对手加入...”，提供复制房间码功能。
  - 观众不可见此视图（最多允许两位玩家，此时无观众）。
- **准备视图 (`SETTING`)**：
  - 显示当前对局双方参与者信息卡片。
  - 己方卡片提供 4 位数字密码输入盘。输入 4 位数字后点击“锁定”（加密上传给服务端）。
  - 锁定数字的玩家状态变更为“已就绪”，等待对方就绪。
- **对战视图 (`PLAYING`)**：
  - **HUD 分区**：
    - **左侧**：战术日志 (Battle Log)，按事件流展示双方的猜测记录（例：*玩家 A 猜了 5678，对了 1 个位置*）。
    - **右侧/中央**：操作台 (Console)。己方回合时高亮数字键盘（0-9）并允许点击提交；对方回合时键盘灰显并增加锁定遮罩，提示“等待对方操作...”
    - **底部**：观众席列表展示处于该房间的吃瓜群众。
- **结算视图 (`FINISHED`)**：
  - 全屏半透明遮罩，展示胜利/失败印章动效，揭晓双方底牌数字。
  - 提供“再来一局”按钮（点击后向服务端发送重置请求，清空对局 log、重置 secret，状态退回 SETTING）。

---

## 5. 通信协议与接口定义 (API & WebSocket)

### 5.1 HTTP REST API (基于 `/server/api` 或 Server Routes)
| 路径 | 方法 | 描述 | 入参 | 返回值 |
|---|---|---|---|---|
| `/api/room/create` | `POST` | 创建房间 | `{ nickname: string }` | `{ roomId: string, userId: string }` |
| `/api/room/check/:id` | `GET` | 检查房间状态 | `-` | `{ exists: boolean, status: string, playerCount: number }` |

### 5.2 WebSocket 事件约定
实施实时通讯管理双向操作及状态推送。推荐使用 Socket.io 或 Nuxt 生态组件。

**A. 客户端发起 (Client Emit)**
1. `join_room`
   - payload: `{ roomId, userId, nickname }`
   - 用途：加入长链接，服务端负责身份识别（房主/客人/观众）并广播房间更新。
2. `set_secret`
   - payload: `{ roomId, userId, secret: string }`
   - 用途：提交自身设定的密码。服务端将等待双方均设好后，广播切换状态到 `PLAYING`。
3. `submit_guess`
   - payload: `{ roomId, userId, guess: string }`
   - 用途：提交猜测。服务端校验必须是此人的回合，对比对方密码进行校验，并在完成后广播。
4. `restart_game`
   - payload: `{ roomId, userId }`
   - 用途：对局结束后，任一玩家发起“再来一局”。

**B. 服务端广播 (Server Broadcast/Emit)**
1. `room_state_update`
   - payload: `Room` (禁止包含对手的 `secret`)
   - 用途：每次房间数据发生实质变更时触发出发，客户端基于此流全量接管重新渲染（响应式更新）。
2. `turn_changed`
   - payload: `{ currentTurnUserId }`
   - 用途：告知客户端目前控制权（也可合并在 `room_state_update` 中下发）。
3. `guess_result`
   - payload: `GuessRecord`
   - 用途：推送一次竞猜动作的结果，触发前端对战日志及音效/动画渲染。
4. `game_over`
   - payload: `{ winnerUserId, player1Secret, player2Secret }`
   - 用途：下发结算及揭晓底牌数字。

---

## 6. 异常规则控制机制 (Edge Cases / 防作弊)

- **断线重连**：
  - 基于浏览器的 `userId` 保存，刷新页面或是网络抖动时，重新调用 `join_room`，服务端感知到原 ID 则直接推送 `room_state_update` 获取当前对局快照（Snapshot）以重现现场。
- **并发作弊抵抗**：
  - 前端只是渲染终端，包括“对错计算”、“当前是谁的回合”这些判断强制**必须由服务端处理**。避免被拦截 WS 发包直接窃听密码或违规多发。
- **掉线判负机制**：
  - 服务器维护 Player 的心跳，如若在 PLAYING 阶段有玩家掉线超过规定时间（如1分钟），强制对局变更为 FINISHED 并判定还在场玩家胜利。

---

## 7. 视觉与 UI/UX 规范详解

为了确保 AI 生成代码在审美和前端排版上的统一性：

- **背景与底纹**：
  - 需要使用米白或泛黄基色（例如 `#F4EFE6`），通过 CSS 或 SVG noise 滤镜覆盖伪纸张纹理。
- **边框与高亮**：
  - 弃用横平竖直的规矩边框，UI 弹窗、模块框体应当加入微弱的歪斜变形 (`transform: rotate(-0.5deg)`) 或是采用 CSS border-image（引入笔刷）。
  - 使用深铅笔灰 (`#3B3A36`) 勾勒。
- **色系分布**：
  - 己方：采用柔蓝色水彩透明度 `rgba(56, 189, 248, 0.4)` 作为高光或选中的晕染底色。
  - 对手：采用暖橙色水彩透明度 `rgba(251, 146, 60, 0.4)`。
  - 通行/成功反馈：复古风格的淡青绿或酒红。
- **字体与动画**：
  - 请引入类似于「演示悠然小楷」或「ZCOOL快乐体」等开源免费、带有一点手作灵动感的字体。
  - 所有核心交互（进房、结算、选数字）加上 `0.2s - 0.4s` 左右缓动函数 (如 ease-in-out) 控制不透明度和形变缩放的水彩漫开效果，增加沉浸感。

---

## 8. 技术选型建议 (Tech Stack)

- 通用框架：Nuxt 4 / Vue 3 Composition API
- 快速样式：Tailwind CSS v3+
- 客户端状态：Pinia (存储 Player 自身状态与房间对齐数据)
- 实时互联：socket.io (Server) + socket.io-client (Client / Composable)
- 动画库推荐：无需重型库，Tailwind 内置 Transition / Animation 或搭配 @vueuse/core 足矣。

## 9. 后续扩展方向 (V2.0+)
- 个人战绩排行及密码破解胜率统计。
- 对战房间内带有即时反馈系统（如发送手绘风格表情）。
- 加入难度梯队选择（例如传统的 几A几B，即包含数字对但位置错反馈选项）。
