import programTestAccounts from '../../../imports/db/program_test_accounts';
import programTestAnswers from '../../../imports/db/program_test_answers';

let timeinterval;

export function sendAnswer(issueNumber, isLanguageUpdate, isForceTimeout, isTemporary) {
  const email = Meteor.user().emails[0].address;
  let isTimeout = true;
  let isTemp = false;
  // タイムアウトと同時に全てセーブする呼び出しが起きた場合、タイムアウト判定が正常に動作しないため強制的にタイムアウトをセット
  if (isForceTimeout) {
    isTimeout = isForceTimeout;
  } else if (Session.get('remainingTime') && Session.get('remainingTime').total > 0) {
    isTimeout = false;
  }

  if (isTemporary) {
    isTemp = isTemporary;
  }

  const checkAnswer = programTestAnswers.findOne({ email, issueNumber, isTemporary: isTemp });
  // 存在していたら更新
  if (checkAnswer) {
    if (isLanguageUpdate !== true) {
      programTestAnswers.update(checkAnswer._id, {
        $set: {
          language: Session.get('answerLanguage'),
          code: Session.get(`answer${issueNumber}Code`),
          testSendedDt: new Date(),
          isTemporary: isTemp,
          isTimeout,
        },
      });
    } else {
      programTestAnswers.update(checkAnswer._id, {
        $set: {
          language: Session.get('answerLanguage'),
        },
      });
    }
  } else {
    programTestAnswers.insert({
      email,
      issueNumber,
      language: Session.get('answerLanguage'),
      code: Session.get(`answer${issueNumber}Code`),
      testSendedDt: new Date(),
      isTemporary: isTemp,
      isTimeout,
    });
  }
}

function sendAllAnswer() {
  for (let i = 1; i <= 2; i += 1) {
    sendAnswer(i, true, true);
  }
}

export function getTimeRemaining(endtime) {
  const t = Date.parse(endtime) - Session.get('time');
  const seconds = (`0${Math.floor((t / 1000) % 60)}`).slice(-2);
  const minutes = (`0${Math.floor((t / 1000 / 60) % 60)}`).slice(-2);
  const hours = (`0${Math.floor((t / (1000 * 60 * 60)) % 24)}`).slice(-2);
  const days = Math.floor(t / (1000 * 60 * 60 * 24));

  if (t <= 0) {
    clearInterval(timeinterval);
    sendAllAnswer();
    $('#programTestFinishModal').modal('show');
    return {
      total: t,
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    };
  }

  return {
    total: t,
    days,
    hours,
    minutes,
    seconds,
  };
}

Tracker.autorun(() => {
  const userId = Meteor.userId();
  if (!userId) {
    console.log('logout!!');
    clearInterval(timeinterval);
    timeinterval = null;
  }
});

Template.programTest.helpers({
  remainingTime() {
    const email = Meteor.user().emails[0].address;
    const checkAccount = programTestAccounts.findOne({ email });
    // 存在していなかったらエラーを返す
    if (!checkAccount) {
      return '';
    }
    const endtime = new Date(checkAccount.testTimeLimitDt);
    if (!timeinterval) {
      timeinterval = setInterval(() => {
        Meteor.call('getCurrentTime', (error, result) => {
          Session.set('time', result);
          Session.set('remainingTime', getTimeRemaining(endtime));
        });
      }, 1000);
    }
    const retValue = `${Session.get('remainingTime').hours}:${Session.get('remainingTime').minutes}:${Session.get('remainingTime').seconds}`;
    return retValue;
  },
  ended() {
    return Session.get('remainingTime').total <= 0;
  },
});

Template.programTestFinishModalTemplate.events({
  click: (event) => {
    event.preventDefault();
    Meteor.logout(() => {
      $('div.modal-backdrop.in').remove();
      $('body').removeClass('modal-open');
      console.log('logout!!');
    });
  },
});

Template.programTestFinishModalTemplate.helpers({
  ended() {
    return Session.get('remainingTime').total <= 0;
  },
});
