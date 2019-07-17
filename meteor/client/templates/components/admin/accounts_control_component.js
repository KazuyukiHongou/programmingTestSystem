import programTestAccounts from '../../../../imports/db/program_test_accounts';
// import settingsJson from '../../../../imports/conf/settings.json';

function inputCheck(controlInfo) {
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (controlInfo.username === '' || controlInfo.email === '' || controlInfo.password === '') {
    Session.set('errorMessage', '名前、メールアドレス、パスワードは必須入力項目です');
    return false;
  }
  if (!emailPattern.test(controlInfo.email)) {
    Session.set('errorMessage', 'メールアドレス以外が入力されています');
    return false;
  }
  return true;
}

function setMessage(message, isError) {
  let msg = message;
  if (isError) {
    msg = `<div style="color:red">${message}</div>`;
  }
  $('#message').html(msg);
}

Template.accountsControlComponent.events({
  click: (event) => {
    // ボタンとチェックボックス以外がクリックされていた場合は何もしない
    if (event.target.type !== 'button' && event.target.nodeName !== 'checkbox') {
      return;
    }
    event.preventDefault();
    const mode = event.target.textContent;

    // 追加,更新,削除,キャンセル以外の場合は何もしない
    if (mode !== '追加' && mode !== '更新' && mode !== '削除' && mode !== 'キャンセル') {
      return;
    }

    const baseEmail = event.target.value;
    const username = $('#username').val();
    const email = $('#email').val();
    const password = $('#password').val();
    const memo = $('#memo').val();
    const reset = $('#reset').is(':checked');

    let condition = { email: baseEmail };
    if (!baseEmail || mode === '追加') {
      condition = { email };
    }

    const controlAccounts = programTestAccounts.findOne(condition);
    // 画面で入力された情報を「controlInfo」オブジェクトに格納
    let controlInfo = {
      username,
      email,
      password,
      memo,
      mode,
      reset,
    };

    switch (mode) {
      case '追加':
        // 既に存在した場合はエラー
        if (controlAccounts) {
          setMessage('既に存在するメールアドレスです', true);
          return;
        }
        break;
      case '更新':
      case '削除':
        // 存在しなかった場合はエラー
        if (!controlAccounts) {
          setMessage('対象の受験者は存在しません', true);
          return;
        }
        controlInfo._id = controlAccounts._id;
        break;
      case 'キャンセル':
        // 「controlInfo」オブジェクトを空にして、追加モードへ移行
        controlInfo = {
          username: '',
          email: '',
          password: '',
          memo: '',
          mode: '追加',
        };
        Session.set('controlInfo', controlInfo);
        setMessage('', false);
        return;
      default:
        break;
    }

    console.log(`inputCheck(controlInfo)${inputCheck(controlInfo)}`);
    Session.set('isError', !inputCheck(controlInfo));
    if (Session.get('isError') === false) {
      Session.set('controlInfo', controlInfo);
      // 確認画面（モーダルウィンドウ）の表示
      $('#accountsControlConfirmModal').modal('show');
    } else {
      alert(Session.get('errorMessage'));
      setMessage(Session.get('errorMessage'), true);
    }
  },
  'click h4': () => {
    $('.panel-body').toggle();
  },
});

Template.accountsControlComponent.helpers({
  mode() {
    let mode = '追加';
    if (Session.get('controlInfo') && Session.get('controlInfo').mode !== '追加') {
      mode = '編集';
    }
    return mode;
  },
  isEdit() {
    let isEdit = false;
    const controlInfo = Session.get('controlInfo');
    if (controlInfo && controlInfo.mode && controlInfo.mode !== '追加') {
      isEdit = true;
    }
    return isEdit;
  },
  disabled() {
    let disabled = '';
    const controlInfo = Session.get('controlInfo');
    if (controlInfo && controlInfo.mode && controlInfo.mode !== '追加') {
      disabled = 'disabled';
    }
    return disabled;
  },
  username() {
    return Session.get('controlInfo').username;
  },
  email() {
    return Session.get('controlInfo').email;
  },
  password() {
    return Session.get('controlInfo').password;
  },
  memo() {
    return Session.get('controlInfo').memo;
  },
});

// 確認画面のヘルパー
Template.accountsControlConfirmModalTemplate.helpers({
  mode() {
    if (Session.get('controlInfo') && Session.get('controlInfo').mode) {
      return Session.get('controlInfo').mode;
    }
    return '追加';
  },
  username() {
    return Session.get('controlInfo').username;
  },
  email() {
    return Session.get('controlInfo').email;
  },
  password() {
    return Session.get('controlInfo').password;
  },
  memo() {
    return Session.get('controlInfo').memo;
  },
  isReset() {
    return Session.get('controlInfo').reset;
  },
});

// 確認画面のイベントリスナー
Template.accountsControlConfirmModalTemplate.events({
  // 確認画面で「Yes」をクリックした場合のイベントハンドラー
  'click #execute': (event) => {
    event.preventDefault();

    let controlInfo = Session.get('controlInfo');
    let condition = { email: controlInfo.email };
    if (controlInfo._id) {
      condition = { _id: controlInfo._id };
    }

    const controlAccounts = programTestAccounts.findOne(condition);
    switch (controlInfo.mode) {
      case '追加':
        // 既に存在した場合はエラー
        if (controlAccounts) {
          setMessage('既に存在するメールアドレスです', true);
          return;
        }
        Meteor.call('createNewUser', controlInfo.username, controlInfo.email, controlInfo.password, (error, result) => {
          if (error) {
            console.log(error);
            setMessage('登録に失敗しました。コンソールログをご確認ください。', true);
          } else {
            console.log(result);
            programTestAccounts.insert({
              username: controlInfo.username,
              email: controlInfo.email,
              password: controlInfo.password,
              memo: controlInfo.memo,
            });
            setMessage('登録に成功しました。', false);
          }
        });
        break;
      case '更新': {
        const updateInfo = { memo: controlInfo.memo };
        if (controlInfo.reset) {
          updateInfo.testStartedDt = null;
          updateInfo.testTimeLimitDt = null;
        }
        programTestAccounts.update({ _id: controlInfo._id }, { $set: updateInfo });
        setMessage('更新しました。', false);
        break;
      }
      case '削除':
        Meteor.call('removeUserFromUsername', controlInfo.username, (error) => {
          if (error) {
            console.log(error);
            setMessage('削除に失敗しました。', true);
          } else {
            programTestAccounts.remove({ _id: controlInfo._id });
            setMessage('削除に成功しました。', false);
            // 「controlInfo」オブジェクトを空にして、追加モードへ移行
            controlInfo = {
              username: '',
              email: '',
              password: '',
              memo: '',
              mode: '追加',
            };
            Session.set('controlInfo', controlInfo);
          }
        });
        break;
      default:
        break;
    }
    $('#accountsControlConfirmModal').modal('hide');
  },
});
