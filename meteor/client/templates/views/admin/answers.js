import programTestAccounts from '../../../../imports/db/program_test_accounts';

Template.adminAnswers.helpers({
  userName() {
    if (Session.get('viewAnswerTarget')) {
      const checkAccount = programTestAccounts.findOne({ email: Session.get('viewAnswerTarget') });
      if (checkAccount) {
        Session.set('viewAnswerTargetName', checkAccount.username);
      } else {
        Session.set('viewAnswerTargetName', '');
        Router.go('adminAccounts');
      }
    } else {
      Router.go('adminAccounts');
    }
    return Session.get('viewAnswerTargetName');
  },
});
