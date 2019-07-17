import settingsJson from '../../imports/conf/settings.json';

Template.layout.helpers({
  // ナビゲーションバーのアイテムをハイライトするためのヘルパー関数
  activeIfCurrent: (template) => {
    const currentRoute = Router.current();
    if (currentRoute && template === Router.current().route.getName()) {
      return 'active';
    }
    return '';
  },
  useAdminRegister() {
    return settingsJson.use_admin_tool_register;
  },
  useUserRegister() {
    return settingsJson.use_user_register;
  },
  isAdmin() {
    let isAdmin = false;
    if (Router.current().route.getName().indexOf('admin') >= 0) {
      if (Roles.userIsInRole(Meteor.user()._id, ['admin'])) {
        isAdmin = true;
      }
    }
    return isAdmin;
  },
  remainingTime() {
    if (Session.get('remainingTime') && Session.get('remainingTime').hours) {
      const retValue = `残り時間：${Session.get('remainingTime').hours}:${Session.get('remainingTime').minutes}:${Session.get('remainingTime').seconds}`;
      return retValue;
    }
    return '';
  },
});

Template.layout.events({
  'click .logout': (event) => {
    event.preventDefault();
    // 制限時間の表示を消すために意図的にnullをセット
    Session.set('remainingTime', null);
    Session.keys = {};
    Meteor.logout();
    Router.go('login');
  },
});
