# Programming Test System
* 採用活動で実施するプログラミングテストをWeb上で受けられるようにするためのシステム

# Overview
* フルスタックWebフレームワーク「Meteor」によるシングルページアプリケーションです

# Description

# Requirement
* [Meteor](https://github.com/meteor/meteor)

### Meteorのインストール
```
curl https://install.meteor.com/ | sh
```

# Usage
## Install
```
git clone git clone git@gitlab.i-call.co.jp:laboratory/programmingTestSystem.git
cd programmingTestSystem
npm install
```
## Settings(Meteor)
### 必要モジュールのインストール
```
yum install -y gcc
yum install -y gcc-c++
npm install -g node-gyp
cd app/meteor
npm install
```

### Meteorアプリケーションの設定ファイルの設置、更新
```
cd app/meteor/imports/conf/
cp settings.json.sample settings.json
# ganache-cliで動作させる場合はws_porの設定は8545に変更
vi settings.json
{
"domain":"192.168.33.10","port":"8545",
"ws_domain":"localhost","ws_port":"8546"
}

```

### Meteorの起動
```
cd app/meteor
meteor [--allow-superuser]
```

### 動作確認
