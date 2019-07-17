Template.adminHome.events({
  'click .logout': (event) => {
    event.preventDefault();
    Meteor.logout();
    Router.go('login');
  },
});
