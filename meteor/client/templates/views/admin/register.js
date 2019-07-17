import settingsJson from '../../../../imports/conf/settings.json';

Template.adminRegister.helpers({
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

Template.adminRegister.events({
  'submit form': (event) => {
    event.preventDefault();
    const email = $('[name=email]').val();
    const password = $('[name=password]').val();
    Accounts.createUser({
      email,
      password,
    }, (error) => {
      if (error) {
        console.log(error);
      } else {
        Meteor.call('setAdminRoles', (err) => {
          if (err) {
            console.log(error);
          }
        });
        Router.go('adminHome');
      }
    });
  },
});
