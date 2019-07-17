import programTestAnswers from '../../../imports/db/program_test_answers';
import programTestAccounts from '../../../imports/db/program_test_accounts';
import { sendAnswer, getTimeRemaining } from '../views/program_test';

// 管理ツールで解答を閲覧する場合、対象ユーザーのemailをセッションから取得
function getEmail() {
  let email = Meteor.user().emails[0].address;
  if (Session.get('viewAnswerTarget')) {
    email = Session.get('viewAnswerTarget');
  }
  return email;
}

function setAnswers(issueNumber, isTemp, isForce) {
  let tempStr = '';
  let isTemporary = false;
  if (isTemp !== undefined) {
    isTemporary = isTemp;
  }
  if (isTemporary === true) {
    tempStr = 'Temp';
  }
  if (!Session.get(`answer${issueNumber}${tempStr}Code`) || Session.get('viewAnswerTarget') || isForce) {
    const email = getEmail();
    const condition = { email, issueNumber, isTemporary };
    const checkAnswer = programTestAnswers.findOne(condition);
    if (checkAnswer) {
      Session.set(`answer${issueNumber}${tempStr}Code`, checkAnswer.code);
      if (!tempStr) {
        // 問題１の解答に保存されている言語をセット
        if (issueNumber === 1 && checkAnswer.language) {
          Session.set('answerLanguage', checkAnswer.language);
        }
        if (Session.get('viewAnswerTarget')) {
          Session.set(`answer${issueNumber}Points`, checkAnswer.answerPoints);
          Session.set(`answer${issueNumber}Comment`, checkAnswer.answerComment);
        }
      }
      // 強制的にDBの値で更新する場合、テンポラリコードもDBの値で更新
      if (isForce) {
        sendAnswer(issueNumber, false, false, true);
      }
    } else if (Session.get('viewAnswerTarget')) {
      Session.set(`answer${issueNumber}${tempStr}Code`, '');
      Session.set(`answer${issueNumber}Points`, '');
      Session.set(`answer${issueNumber}Comment`, '');
    }
  }
}

function getAnswerCode(issueNumber) {
  // セッションにコード情報が無い場合(ログイン直後や画面リロード時)はテンポラリコードがあれば、そちらを表示
  if (!Session.get(`answer${issueNumber}Code`)) {
    setAnswers(issueNumber, false);
    setAnswers(issueNumber, true);
    if (!Session.get('viewAnswerTarget') && Session.get(`answer${issueNumber}TempCode`)) {
      Session.set(`answer${issueNumber}Code`, Session.get(`answer${issueNumber}TempCode`));
      return Session.get(`answer${issueNumber}TempCode`);
    }
    return Session.get(`answer${issueNumber}Code`);
  }
  if (Session.get('viewAnswerTarget')) {
    setAnswers(issueNumber, false);
    return Session.get(`answer${issueNumber}Code`);
  }
  return Session.get(`answer${issueNumber}Code`);
}

// 解答の状態をチェックし、セッションへセット
function checkAnswers(issueNumber) {
  const email = getEmail();
  const checkAnswer = programTestAnswers.findOne({ email, issueNumber, isTemporary: false });
  const checkAnswerTemp = programTestAnswers.findOne({ email, issueNumber, isTemporary: true });
  if (checkAnswer && checkAnswerTemp) {
    // 未送信の編集中コードが無い場合
    if (checkAnswer.code === checkAnswerTemp.code) {
      Session.set(`editedAnswer${issueNumber}`, false);
    } else {
      Session.set(`editedAnswer${issueNumber}`, true);
    }
  } else if (!checkAnswer && checkAnswerTemp && checkAnswerTemp.code !== '') {
    Session.set(`editedAnswer${issueNumber}`, true);
  } else {
    Session.set(`editedAnswer${issueNumber}`, false);
  }

  if (!Session.get(`sendedAnswer${issueNumber}`) || Session.get('viewAnswerTarget')) {
    if (checkAnswer) {
      Session.set(`sendedAnswer${issueNumber}`, true);
    } else {
      Session.set(`sendedAnswer${issueNumber}`, false);
    }
  }
}


Template.programTestIssue1Component.events({
  'submit form': (event) => {
    event.preventDefault(); // ボタン押下時のブラウザでのデフォルト動作の禁止

    const answerLanguage = $(event.target).find('[name=answerLanguage]').val();
    const answer1Code = $(event.target).find('[name=answer1Code]').val();

    if (answerLanguage === '') {
      alert('使用言語を記載してください');
      return;
    }
    if (answer1Code === '') {
      alert('解答コードを記載してください');
      return;
    }

    Session.set('answerLanguage', answerLanguage);
    // 制限時間を超えていた場合はコードを更新しない
    if (Session.get('remainingTime').total > 0) {
      Session.set('answer1Code', answer1Code);
    }
    Session.set('sendIssueNumber', 1);
    Session.set('sendIssueTitle', 'ブラックジャック');
    $('#programTestSendConfirmModal').modal('show');
  },
  'change input': (event) => {
    Session.set(event.target.name, event.target.value);
  },
  'keydown textarea': (event) => {
    // Tab以外の場合は何もしない
    if (event.key !== 'Tab') {
      return;
    }
    event.preventDefault();
    // 現在のカーソルの位置と、カーソルの左右の文字列を取得しておく
    const cursorPosition = event.target.selectionStart;
    const cursorLeft = event.target.value.substr(0, cursorPosition);
    const cursorRight = event.target.value.substr(cursorPosition, event.target.value.length);

    const textareaObject = $(`#${event.target.id}`)[0];
    // テキストエリアの中身を、
    // 「取得しておいたカーソルの左側」+「タブ」+「取得しておいたカーソルの右側」
    // という状態にする。
    textareaObject.value = `${cursorLeft}\t${cursorRight}`;
    // カーソルの位置を入力したタブの後ろにする
    textareaObject.selectionEnd = cursorPosition + 1;
  },
  'keyup textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    // 改行、バックスペース、delete以外の場合は何もしない
    if (event.key !== 'Enter' && event.key !== 'Backspace' && event.key !== 'Delete') {
      return;
    }
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(1, false, false, true);

      const line = event.target.value.split('\n');
      const textareaObject = $(`#${event.target.id}`)[0];
      if (line.length >= 15) {
        textareaObject.rows = line.length + 1;
      } else if (line.length <= 15) {
        textareaObject.rows = 15;
      }
    }
  },
  'click textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(1, false, false, true);
    }
    const line = event.target.value.split('\n');
    if (line.length >= 15) {
      $(`#${event.target.id}`)[0].rows = line.length + 1;
    }
  },
  'focusout textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    $(`#${event.target.id}`)[0].rows = 15;
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(1, false, false, true);
    }
  },
  'click .toggle': () => {
    $('.well').toggle();
    const targets = $('.toggle');
    for (let i = 0; i < targets.length; i += 1) {
      if (targets[i].innerText === '隠す') {
        targets[i].innerText = '表示';
      } else {
        targets[i].innerText = '隠す';
      }
    }
  },
  'click .comment': (event) => {
    const baseEmail = event.target.value;
    const answerPoints = $('#answer1Points').val();
    const answerComment = $('#answer1Comment').val();

    const controlAnswers = programTestAnswers.findOne(
      { email: baseEmail, issueNumber: 1, isTemporary: false },
    );
    if (!controlAnswers) {
      alert('まだ解答がないため採点できません');
      return;
    }
    // 画面で入力された情報を「controlInfo」オブジェクトに格納
    const controlInfo = {
      answerPoints,
      answerComment,
    };
    programTestAnswers.update({ _id: controlAnswers._id }, { $set: controlInfo });
    alert('保存しました');
  },
  'click .reloadSended': () => {
    setAnswers(1, false, true);
  },
});

Template.programTestIssue1Component.helpers({
  answerCode() {
    return getAnswerCode(1);
  },
  answerTempCode() {
    setAnswers(1, true);
    return Session.get('answer1TempCode');
  },
  isSended() {
    checkAnswers(1);
    return Session.get('sendedAnswer1');
  },
  isEdited() { // 未送信の編集中コードがあるか否かを返す
    return Session.get('editedAnswer1');
  },
  answerLanguage() {
    return Session.get('answerLanguage');
  },
  answerPoints() {
    return Session.get('answer1Points');
  },
  answerComment() {
    return Session.get('answer1Comment');
  },
  isAdminViewReadonly() {
    let readonly = '';
    if (Session.get('viewAnswerTarget')) {
      readonly = 'readonly';
    }
    return readonly;
  },
  isTempCodeDisplay() {
    let display = 'display:none';
    if (Session.get('viewAnswerTarget')) {
      if (Session.get('answer1Code') !== Session.get('answer1TempCode')) {
        display = '';
      }
    }
    return display;
  },
  isAdmin() {
    if (Roles.userIsInRole(Meteor.user()._id, ['admin'])) {
      return true;
    }
    return false;
  },
  viewTargetEmail() {
    return Session.get('viewAnswerTarget');
  },
});

Template.programTestIssue2Component.events({
  'submit form': (event) => {
    event.preventDefault(); // ボタン押下時のブラウザでのデフォルト動作の禁止
    const answer2Code = $(event.target).find('[name=answer2Code]').val();

    if (answer2Code === '') {
      alert('解答コードを記載してください');
      return;
    }
    // 制限時間を超えていた場合はコードを更新しない
    if (Session.get('remainingTime').total > 0) {
      Session.set('answer2Code', answer2Code);
    }
    Session.set('sendIssueNumber', 2);
    Session.set('sendIssueTitle', 'ページネーション');
    $('#programTestSendConfirmModal').modal('show');
  },
  'keydown textarea': (event) => {
    // Tab以外の場合は何もしない
    if (event.key !== 'Tab') {
      return;
    }
    event.preventDefault();
    // 現在のカーソルの位置と、カーソルの左右の文字列を取得しておく
    const cursorPosition = event.target.selectionStart;
    const cursorLeft = event.target.value.substr(0, cursorPosition);
    const cursorRight = event.target.value.substr(cursorPosition, event.target.value.length);

    const textareaObject = $(`#${event.target.id}`)[0];
    // テキストエリアの中身を、
    // 「取得しておいたカーソルの左側」+「タブ」+「取得しておいたカーソルの右側」
    // という状態にする。
    textareaObject.value = `${cursorLeft}\t${cursorRight}`;
    // カーソルの位置を入力したタブの後ろにする
    textareaObject.selectionEnd = cursorPosition + 1;
  },
  'keyup textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    // 改行、バックスペース、delete以外の場合は何もしない
    if (event.key !== 'Enter' && event.key !== 'Backspace' && event.key !== 'Delete') {
      return;
    }
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(2, false, false, true);

      const line = event.target.value.split('\n');
      const textareaObject = $(`#${event.target.id}`)[0];
      if (line.length >= 15) {
        textareaObject.rows = line.length + 1;
      } else if (line.length <= 15) {
        textareaObject.rows = 15;
      }
    }
  },
  'click textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(2, false, false, true);
    }
    const line = event.target.value.split('\n');
    if (line.length >= 15) {
      $(`#${event.target.id}`)[0].rows = line.length + 1;
    }
  },
  'focusout textarea': (event) => {
    // コード入力欄以外の場合は何もしない
    if (event.target.name.indexOf('Code') < 0) {
      return;
    }
    $(`#${event.target.id}`)[0].rows = 15;
    if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
      Session.set(event.target.name, event.target.value);
      sendAnswer(2, false, false, true);
    }
  },
  'click .toggle': () => {
    $('.well').toggle();
    const targets = $('.toggle');
    for (let i = 0; i < targets.length; i += 1) {
      if (targets[i].innerText === '隠す') {
        targets[i].innerText = '表示';
      } else {
        targets[i].innerText = '隠す';
      }
    }
  },
  'click .comment': (event) => {
    const baseEmail = event.target.value;
    const answerPoints = $('#answer2Points').val();
    const answerComment = $('#answer2Comment').val();

    const controlAnswers = programTestAnswers.findOne(
      { email: baseEmail, issueNumber: 2, isTemporary: false },
    );
    if (!controlAnswers) {
      alert('まだ解答がないため採点できません');
      return;
    }
    // 画面で入力された情報を「controlInfo」オブジェクトに格納
    const controlInfo = {
      answerPoints,
      answerComment,
    };
    programTestAnswers.update({ _id: controlAnswers._id }, { $set: controlInfo });
    alert('保存しました');
  },
  'click .reloadSended': () => {
    setAnswers(2, false, true);
  },
});

Template.programTestIssue2Component.helpers({
  answerCode() {
    return getAnswerCode(2);
  },
  answerTempCode() {
    setAnswers(2, true);
    return Session.get('answer2TempCode');
  },
  answerPoints() {
    return Session.get('answer2Points');
  },
  answerComment() {
    return Session.get('answer2Comment');
  },
  isSended() {
    checkAnswers(2);
    return Session.get('sendedAnswer2');
  },
  isEdited() { // 未送信の編集中コードがあるか否かを返す
    return Session.get('editedAnswer2');
  },
  isAdminViewReadonly() {
    let readonly = '';
    if (Session.get('viewAnswerTarget')) {
      readonly = 'readonly';
    }
    return readonly;
  },
  isTempCodeDisplay() {
    let display = 'display:none';
    if (Session.get('viewAnswerTarget')) {
      if (Session.get('answer2Code') !== Session.get('answer2TempCode')) {
        display = '';
      }
    }
    return display;
  },
  isAdmin() {
    if (Roles.userIsInRole(Meteor.user()._id, ['admin'])) {
      return true;
    }
    return false;
  },
  viewTargetEmail() {
    return Session.get('viewAnswerTarget');
  },
});

Template.programTestSendConfirmModalTemplate.helpers({
  issueNumber() {
    return Session.get('sendIssueNumber');
  },
  issueTitle() {
    return Session.get('sendIssueTitle');
  },
  ended() {
    return Session.get('remainingTime').total <= 0;
  },
});

Template.programTestSendConfirmModalTemplate.events({
  'click .confirm': (event) => {
    event.preventDefault();
    const checkAccount = programTestAccounts.findOne({ email: Meteor.user().emails[0].address });
    // 存在していなかったらエラーを返す
    if (!checkAccount) {
      return;
    }
    // DB上の制限時間を超えていないかチェック
    const endtime = new Date(checkAccount.testTimeLimitDt);
    Meteor.call('getCurrentTime', (error, result) => {
      Session.set('time', result);
      Session.set('remainingTime', getTimeRemaining(endtime));
      if (Session.get('remainingTime').total > 0) {
        sendAnswer(Session.get('sendIssueNumber'), false, false, false);
        Session.set(`sendedAnswer${Session.get('sendIssueNumber')}`, true);
        Session.set(`editedAnswer${Session.get('sendIssueNumber')}`, false);
        $('#programTestSendConfirmModal').modal('hide');
        alert('送信しました');
      } else {
        alert('制限時間を過ぎているため、解答の送信はできません');
      }
    });
  },
});
