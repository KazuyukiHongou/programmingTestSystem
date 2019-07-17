import moment from 'moment';
import programTestAccounts from '../../../../imports/db/program_test_accounts';
import programTestAnswers from '../../../../imports/db/program_test_answers';

moment.locale('ja');

Template.accountsListComponent.helpers({
  // アカウント情報の取得
  accounts() {
    const searchCondition = Session.get('search.conditon');
    const condition = {};
    if (searchCondition) {
      if (searchCondition.username.length > 0) {
        // 曖昧検索にするため正規表現で検索条件をセット
        condition.username = { $in: searchCondition.username.map(v => new RegExp(v, 'i')) };
      }
      if (searchCondition.email.length > 0) {
        // 曖昧検索にするため正規表現で検索条件をセット
        condition.email = { $in: searchCondition.email.map(v => new RegExp(v, 'i')) };
      }
    }
    // constにした理由はeslintでerrorが出たため
    // 「const宣言は、値への読み取り専用の参照を作ります。その値が不変ということではなく、その変数識別子が再代入できないというだけ」とのこと
    // 参考: https://teratail.com/questions/121164
    const searchResultScored = [];
    const searchResultNotScored = [];
    const searchResultCursor = programTestAccounts.find(condition, { sort: { email: 1 } }).fetch();
    searchResultCursor.forEach((data) => {
      const checkAnswer = programTestAnswers.findOne(
        { email: data.email, isTemporary: false }, { sort: { testSendedDt: -1 } },
      );
      let testStartedDt;
      let testEndedDt;
      if (data.testStartedDt) {
        testStartedDt = moment(data.testStartedDt).format('YYYY-MM-DD HH:mm:ss');
      } else {
        testStartedDt = '';
      }
      // 解答が存在した場合は最終解答送信時間をテスト終了時間とする
      if (checkAnswer) {
        testEndedDt = moment(checkAnswer.testSendedDt).format('YYYY-MM-DD HH:mm:ss');
      } else if (data.testTimeLimitDt) {
        testEndedDt = moment(data.testTimeLimitDt).format('YYYY-MM-DD HH:mm:ss');
      }

      const checkAnswers = programTestAnswers.find({ email: data.email, isTemporary: false });
      let answer1Points, answer2Points;
      let answer1PointsNum, answer2PointsNum;
      checkAnswers.forEach((answer) => {
        if (answer.answerPoints) {
          if (answer.issueNumber === 1) {
            answer1Points = answer.answerPoints;
            answer1PointsNum = Integer(answer1Points.replace(/[^0-9]/g, ''));
            console.log(`answer1PointsNum: ${answer1PointsNum}`);
          }
          if (answer.issueNumber === 2) {
            answer2Points = answer.answerPoints;
            answer2PointsNum = Integer(answer2Points.replace(/[^0-9]/g, ''));
            console.log(`answer2PointsNum: ${answer2PointsNum}`);
          }
        }
      });
      const row = {
        username: data.username,
        emailaddress: data.email,
        password: data.password,
        memo: data.memo,
        testStartedDt,
        testEndedDt,
        answer1Points,
        answer2Points,
        totalPoint: answer1PointsNum + answer2PointsNum,
      };
      if (answer1Points === '' || answer2Points === '') {
        searchResultNotScored.push(row);
      } else {
        searchResultScored.push(row);
      }
    });
    searchResultScored.sort(function(a,b) {
      if(a.totalPoint > b.totalPoint) return -1;
      if(a.totalPoint < b.totalPoint) return 1;
      return 0;
    });
    return searchResultNotScored.concat(searchResultScored);
  },
});

Template.accountsListItem.events({
  'click .answer': (event) => {
    event.preventDefault();
    Session.set('viewAnswerTarget', event.currentTarget.value);
    Router.go('adminAnswers');
  },
  'click .edit': (event) => {
    event.preventDefault();
    const baseEmail = event.target.value;
    const controlAccounts = programTestAccounts.findOne({ email: baseEmail });
    // 既に存在しなかった場合はエラー
    if (!controlAccounts) {
      return;
    }

    const controlInfo = {
      username: controlAccounts.username,
      email: controlAccounts.email,
      password: controlAccounts.password,
      memo: controlAccounts.memo,
      mode: '編集',
    };
    Session.set('controlInfo', controlInfo);
  },
});
