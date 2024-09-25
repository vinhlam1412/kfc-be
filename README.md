<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.



## Cấu hình database ( đang sử dụng supabase )
- Cần setup supabase self-hosted hoặc mua cloud của supabase: [Supabase Sefl Hosting](https://supabase.com/docs/guides/self-hosting)
- Sau đó restore database dùng file database.sql.

## Cần cấu hình bảng events và games trước khi chạy event
- Khi restore file database.sql sẽ có data mẫu setup trước đó.

## Cần cấu hình bảng game_configs
- Data mẫu
  - combos: Dùng định nghĩa các tên combo tương ứng với nhiêu lượt chơi.
  - commoms: Dùng để định nghĩa thời gian block hoặc số lượng max scan bill trong 1 ngày.
  - rewards: Là 1 array object gồm các định nghĩa: area ( Khu vực là gì ), total ( Số lượng quà đó có thể trong 1 ngày ), started_at và ended_at ( Là thời gian qua đó được trao ), reward_id là ( id của phần quà đặc biệt đươc lưu trong bảng rewards ).
  - tickets: Có thể config theo <b>2 kiểu</b>, config theo số lượng vé xem phim được trao trong 1 khoảng thời gian hoặc config 1 khu vực được trao bao nhiêu vé trong 1 khoảng thời gian.
  - vouchers: Config theo số lượng voucher có thể được trao thong 1 khoảng thời gian nào đó.
  - ### `json`
    - ```json
      { 
        "combos": 
        [ 
          { 
            "code": "CBO O QUAN_81K",
            "number_of_plays": 1
          },
          {
            "code": "CBO DO GANG_81K",
            "number_of_plays": 1
          },
          {
            "code": "CBO BANH DUA_161K",
            "number_of_plays": 2
          },
          {
            "code": "HD_CBO NHAY DAY_81K",
            "number_of_plays": 1
          },
          {
            "code": "HD_CBO THA DIEU_161K",
            "number_of_plays": 2
          }
        ],
        "commoms": {
          "time_block": "10",
          "max_scan_bill": "100",
        },
        "rewards": [
          {
            "area": "HP",
            "total": 1,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "reward_id": 2,
            "started_at": "2024-08-07T17:00:00.000Z"
          }
        ],
        "tickets": [
          {
            "total": 0,
            "ended_at": "2024-07-07T16:59:59.999Z",
            "started_at": "2024-07-04T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-11T16:59:59.999Z",
            "started_at": "2024-07-07T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-14T16:59:59.999Z",
            "started_at": "2024-07-11T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-18T16:59:59.999Z",
            "started_at": "2024-07-14T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-21T16:59:59.999Z",
            "started_at": "2024-07-18T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-25T16:59:59.999Z",
            "started_at": "2024-07-21T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-07-28T16:59:59.999Z",
            "started_at": "2024-07-25T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-08-01T16:59:59.999Z",
            "started_at": "2024-07-28T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-08-04T16:59:59.999Z",
            "started_at": "2024-08-01T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-04T17:00:00.000Z"
          },
          {
            "total": 0,
            "ended_at": "2024-08-11T16:59:59.999Z",
            "started_at": "2024-08-08T17:00:00.000Z"
          },
          {
            "area": "HCM",
            "total": 1,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "DNG",
            "total": 1,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "HN",
            "total": 0,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "HP",
            "total": 1,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "NP",
            "total": 0,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "SEP",
            "total": 0,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          },
          {
            "area": "SWP",
            "total": 0,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-07T17:00:00.000Z"
          }
        ],
        "vouchers": [
          {
            "total": 68000,
            "ended_at": "2024-07-07T16:59:59.999Z",
            "started_at": "2024-07-04T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-11T16:59:59.999Z",
            "started_at": "2024-07-07T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-14T16:59:59.999Z",
            "started_at": "2024-07-11T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-18T16:59:59.999Z",
            "started_at": "2024-07-14T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-21T16:59:59.999Z",
            "started_at": "2024-07-18T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-25T16:59:59.999Z",
            "started_at": "2024-07-21T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-07-28T16:59:59.999Z",
            "started_at": "2024-07-25T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-08-01T16:59:59.999Z",
            "started_at": "2024-07-28T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-08-04T16:59:59.999Z",
            "started_at": "2024-08-01T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-08-08T16:59:59.999Z",
            "started_at": "2024-08-04T17:00:00.000Z"
          },
          {
            "total": 68000,
            "ended_at": "2024-08-11T16:59:59.999Z",
            "started_at": "2024-08-08T17:00:00.000Z"
          }
        ],
        "locations": [
          {
            "code": "DNG",
            "rate": 100
          },
          {
            "code": "HCM",
            "rate": 100
          },
          {
            "code": "HP",
            "rate": 100
          },
          {
            "code": "NP",
            "rate": 100
          },
          {
            "code": "HN",
            "rate": 100
          },
          {
            "code": "SWP",
            "rate": 100
          },
          {
            "code": "SEP",
            "rate": 100
          }
        ]
      }

## Installation

```bash
$ yarn install
```

## Cần cấu hình env trước khi chạy
- Lưu ý: WHITE_LIST là dùng để lọc ra danh sách những user có thể scan bill để test không bị ban ( dùng cho nội bộ )

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```