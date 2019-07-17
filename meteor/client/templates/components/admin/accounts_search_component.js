Template.accountsSearchComponent.events({
  'submit form': (event) => {
    event.preventDefault(); // ボタン押下時のブラウザでのデフォルト動作の禁止

    const mail = $(event.target).find('[name=mail]').val();
    const username = $(event.target).find('[name=username]').val();
    let mailConditon = '';
    let usernameConditon = '';
    if (mail) {
      mailConditon = mail.split('\n');
    }
    if (username) {
      usernameConditon = username.split('\n');
    }
    const searchCondition = {
      username: usernameConditon,
      email: mailConditon,
    };
    Session.set('search.conditon', searchCondition);
  },
  'click h4': () => {
    $('.panel-body').toggle();
  },
});

Template.accountsSearchComponent.helpers({
});
