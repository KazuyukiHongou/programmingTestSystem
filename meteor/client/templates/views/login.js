Template.login.events({
  'submit form': (event) => {
    event.preventDefault();
    const email = $('[name=email]').val();
    const password = $('[name=password]').val();
    Meteor.loginWithPassword(email, password, (error) => {
      if (error) {
        console.log(error.reason);
        $('#error').text('Emailまたはパスワードが不正です');
      } else {
        Session.keys = {};
        if (Roles.userIsInRole(Meteor.user()._id, ['admin'])) {
          Router.go('adminHome');
          return;
        }
        Router.go('home');
      }
    });
  },
});
