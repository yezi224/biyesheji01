# 乡村公益体育赛事平台 (Rural Charity Sports Platform)

本项目是一个专为乡村设计的体育赛事管理与公益物资捐赠平台。本文件包含了后端的数据库设计方案。

## 1. 数据库概览

数据库名称：`village_sports`
数据库服务器:localhost
用户名:root
密码:123456
数据库类型:mysql
字符集：`utf8mb4`
排序规则：`utf8mb4_unicode_ci`

### 核心模块
- **用户管理**: 区分村民、组织者与管理员。
- **赛事中心**: 记录赛事规则、时间、地点及状态。
- **物资捐赠**: 追踪公益物资的捐赠状态与流向。
- **报名系统**: 记录用户参与赛事的健康申报与时间。
- **互动社区**: 实现用户间的评论、咨询与留言。

---

## 2. 数据库 SQL 脚本

你可以直接复制以下脚本在 MySQL 数据库中运行：

```sql
/*
 Navicat Premium Data Transfer
 Target Server Type    : MySQL
 Project              : Rural Charity Sports Platform
 Date                 : 2024-05-20
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(50) NOT NULL COMMENT '用户名/登录账号',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `role` enum('VILLAGER','ORGANIZER','ADMIN') NOT NULL DEFAULT 'VILLAGER' COMMENT '角色: VILLAGER-村民, ORGANIZER-组织者, ADMIN-管理员',
  `village_name` varchar(100) DEFAULT NULL COMMENT '所属村庄',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `exercise_pref` text COMMENT '运动偏好 (逗号分隔)',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '状态: 0-待审核, 1-已启用, 2-已禁用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- ----------------------------
-- 2. Table structure for events
-- ----------------------------
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '赛事标题',
  `organizer_id` int(11) NOT NULL COMMENT '发布者ID (关联users)',
  `rule` text NOT NULL COMMENT '比赛规则',
  `time` datetime NOT NULL COMMENT '开赛时间',
  `location` varchar(200) NOT NULL COMMENT '比赛地点',
  `theme` varchar(100) DEFAULT NULL COMMENT '公益主题',
  `status` enum('OPEN','PROGRESS','END') NOT NULL DEFAULT 'OPEN' COMMENT '状态: OPEN-报名中, PROGRESS-进行中, END-已结束',
  `img_url` varchar(500) DEFAULT NULL COMMENT '宣传图URL',
  `participants_count` int(11) DEFAULT '0' COMMENT '当前报名人数',
  PRIMARY KEY (`id`),
  KEY `fk_event_organizer` (`organizer_id`),
  CONSTRAINT `fk_event_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='赛事信息表';

-- ----------------------------
-- 3. Table structure for materials
-- ----------------------------
DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '物资名称',
  `type` varchar(50) NOT NULL COMMENT '分类 (器材/服装/配件)',
  `condition_level` tinyint(1) NOT NULL DEFAULT '5' COMMENT '成色 (1-5星)',
  `donor_id` int(11) NOT NULL COMMENT '捐赠者ID',
  `status` enum('PENDING','IN_STOCK','BORROWED','LOST') NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `current_holder_id` int(11) DEFAULT NULL COMMENT '当前持有人/借用人ID',
  PRIMARY KEY (`id`),
  KEY `fk_material_donor` (`donor_id`),
  KEY `fk_material_holder` (`current_holder_id`),
  CONSTRAINT `fk_material_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_material_holder` FOREIGN KEY (`current_holder_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公益物资表';

-- ----------------------------
-- 4. Table structure for interactions
-- ----------------------------
DROP TABLE IF EXISTS `interactions`;
CREATE TABLE `interactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_id` int(11) NOT NULL COMMENT '目标ID (如赛事ID)',
  `user_id` int(11) NOT NULL COMMENT '互动发起者ID',
  `type` enum('COMMENT','LIKE','CONSULT','BOARD') NOT NULL COMMENT '互动类型',
  `content` text NOT NULL COMMENT '互动内容',
  `reply_content` text COMMENT '回复内容 (针对咨询)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `fk_interact_user` (`user_id`),
  CONSTRAINT `fk_interact_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='互动社区表';

-- ----------------------------
-- 5. Table structure for event_registrations
-- ----------------------------
DROP TABLE IF EXISTS `event_registrations`;
CREATE TABLE `event_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL COMMENT '赛事ID',
  `user_id` int(11) NOT NULL COMMENT '报名用户ID',
  `health_declare` varchar(500) DEFAULT NULL COMMENT '健康声明',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  PRIMARY KEY (`id`),
  KEY `fk_reg_event` (`event_id`),
  KEY `fk_reg_user` (`user_id`),
  CONSTRAINT `fk_reg_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='赛事报名表';

-- ----------------------------
-- 初始数据导入 (与 Mock 数据同步)
-- ----------------------------
INSERT INTO `users` (`id`, `username`, `real_name`, `role`, `village_name`, `phone`, `exercise_pref`, `status`) VALUES 
(1, 'admin', '超级管理员', 'ADMIN', NULL, '13000000000', NULL, 1),
(2, 'org_zhang', '张三体育协会', 'ORGANIZER', '柳林村', '13800138000', NULL, 1),
(3, 'villager_li', '李大壮', 'VILLAGER', '柳林村', '13900001111', '篮球,跑步', 1),
(4, 'villager_wang', '王翠花', 'VILLAGER', '青山镇', '13700002222', '羽毛球,跳舞', 1),
(5, 'villager_zhao', '赵铁柱', 'VILLAGER', '柳林村', '13600003333', '篮球,乒乓球', 1);

INSERT INTO `events` (`id`, `title`, `organizer_id`, `rule`, `time`, `location`, `theme`, `status`, `img_url`, `participants_count`) VALUES 
(1, '柳林村夏季篮球友谊赛', 2, '5对5全场，单场淘汰制', '2024-08-15 09:00:00', '村委会广场篮球场', '强身健体，共建和谐', 'OPEN', 'https://picsum.photos/seed/basketball/800/400', 15),
(2, '青山镇全民健步走', 2, '环绕青山湖一周，约5公里', '2024-08-20 07:30:00', '青山湖公园入口', '绿色生活，健康同行', 'OPEN', 'https://picsum.photos/seed/walking/800/400', 45);

INSERT INTO `materials` (`id`, `name`, `type`, `condition_level`, `donor_id`, `status`, `current_holder_id`) VALUES 
(1, '专业篮球', '器材', 4, 3, 'IN_STOCK', NULL),
(2, '运动套装', '服装', 5, 4, 'PENDING', NULL),
(3, '羽毛球拍(副)', '器材', 3, 5, 'BORROWED', 3);

SET FOREIGN_KEY_CHECKS = 1;
```

## 3. 核心表结构说明

### users (用户表)
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | INT | 主键，自增 |
| role | ENUM | 角色枚举：VILLAGER (村民), ORGANIZER (组织者), ADMIN (管理员) |
| status | TINYINT | 账号状态：0 待审, 1 正常, 2 禁用 |

### events (赛事表)
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| status | ENUM | 赛事状态：OPEN (报名中), PROGRESS (进行中), END (已结束) |
| participants_count | INT | 冗余字段，记录报名总人数以优化查询 |

### materials (物资表)
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| condition_level | TINYINT | 成色，前端展示为星级（1-5） |
| donor_id | INT | 外键，关联 users.id |

---

## 4. 开发说明

- **推荐算法建议**: 后端可采用 `Pearson 相关系数` 或 `Jaccard 相似系数` 对 `exercise_pref` 字段进行计算，从而实现针对村民的个性化赛事推荐。
- **安全性**: 建议对 `phone` 字段进行脱敏处理，并在生产环境中使用 `bcrypt` 加密用户密码。
```