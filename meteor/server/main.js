import { Meteor } from 'meteor/meteor';
import programTestAccounts from '../imports/db/program_test_accounts';
import programTestAnswers from '../imports/db/program_test_answers';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  getCurrentTime() {
    return Date.parse(new Date());
  },
  setAdminRoles() {
    Roles.addUsersToRoles(Meteor.user()._id, ['admin']);
  },
  createNewUser(username, email, password) {
    check(username, Match.Any);
    check(email, Match.Any);
    check(password, Match.Any);
    try {
      const result = Accounts.createUser({
        username,
        email,
        password,
      });
      if (result) {
        console.log(result);
      }
      return result;
    } catch (err) {
      return err;
    }
  },
  removeUserFromUsername(username) {
    check(username, Match.Any);
    const user = Meteor.users.findOne({ username });
    Meteor.users.remove({ _id: user._id }, (error, result) => {
      if (error) {
        console.log('Error removing user: ', error);
      } else {
        console.log(`Number of users removed:${result}`);
      }
    });
  },
});

export { programTestAccounts, programTestAnswers };
