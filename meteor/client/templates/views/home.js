import programTestAccounts from '../../../imports/db/program_test_accounts';

require('date-utils');

Meteor.call('getCurrentTime', (error, result) => {
  Session.set('time', result);
});

Template.home.helpers({
  userName() {
    return Meteor.user().username;
  },
  ended() {
    const email = Meteor.user().emails[0].address;
    const checkAccount = programTestAccounts.findOne({ email });
    // 存在していなかったらエラーを返す
    if (!checkAccount) {
      return false;
    }
    // nullがセットされている＝再受験を可能にされていた場合
    if (!checkAccount.testTimeLimitDt) {
      return false;
    }
    const endtime = new Date(checkAccount.testTimeLimitDt);
    Meteor.call('getCurrentTime', (error, result) => {
      Session.set('time', result);
    });
    return Date.parse(endtime) - Session.get('time') <= 0;
  },
});

Template.home.events({
  'click .start': (event) => {
    event.preventDefault();
    const email = Meteor.user().emails[0].address;
    const checkAccount = programTestAccounts.findOne({ email });
    // 存在していなかったらエラーを返す
    if (!checkAccount) {
      alert('受験用アカウントが存在しませんでした。');
      return;
    }
    $('#programTestStartConfirmModal').modal('show');
  },
  'click .confirm': (event) => {
    event.preventDefault();
    const email = Meteor.user().emails[0].address;
    const checkAccount = programTestAccounts.findOne({ email });

    let endtime = new Date().add({ minutes: 60 });
    if (!checkAccount.testStartedDt) {
      programTestAccounts.update(checkAccount._id, {
        $set: {
          testStartedDt: new Date(),
          testTimeLimitDt: endtime,
        },
      });
    } else {
      endtime = new Date(checkAccount.testTimeLimitDt);
    }
    $('#programTestStartConfirmModal').modal('hide');
    // 別画面を表示する場合は手動でmodal関連のタグ、クラスの削除が必要です
    $('div.modal-backdrop.in').remove();
    $('body').removeClass('modal-open');
    Router.go('programTest');
  },
});
