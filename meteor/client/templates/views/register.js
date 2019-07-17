import settingsJson from '../../../imports/conf/settings.json';
import programTestAccounts from '../../../imports/db/program_test_accounts';

function setMessage(message, isError) {
  let msg = message;
  if (isError) {
    msg = `<div style="color:red">${message}</div>`;
  }
  $('#message').html(msg);
}

Template.register.helpers({
  // ナビゲーションバーのアイテムをハイライトするためのヘルパー関数
  activeIfCurrent: (template) => {
    const currentRoute = Router.current();
    if (currentRoute && template === Router.current().route.getName()) {
      return 'active';
    }
    return '';
  },
  useRegister() {
    return settingsJson.use_admin_tool_register;
  },
});

Template.register.events({
  'submit form': (event) => {
    event.preventDefault();
    const email = $('[name=email]').val();
    const username = $('[name=username]').val();
    const password = $('[name=password]').val();
    const checkAccount = programTestAccounts.findOne({ email });
    // 既に存在していたら失敗を返す
    if (checkAccount) {
      setMessage('既に登録済みです', true);
      return;
    }
    programTestAccounts.insert({
      email,
      username,
      password,
    });
    Accounts.createUser({
      email,
      username,
      password,
    }, (error) => {
      if (error) {
        setMessage('登録に失敗しました。コンソールログをご確認ください。', true);
        console.log(error);
      } else {
        Session.keys = {};
        Router.go('home');
      }
    });
  },
});
