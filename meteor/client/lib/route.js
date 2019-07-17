Router.configure({
  // Layoutテンプレートの指定
  layoutTemplate: 'layout',
});

Router.route('/', () => {
  // リダイレクト設定
  this.redirect('/login');
});


// URLとRouteテンプレートのマッピングを指定
// Router.route('/admin/dashboard', {name: 'admin_dashboard'});
Router.route('/register', { name: 'register' });
Router.route('/login', { name: 'login' });
Router.route('/home', { name: 'home' });
Router.route('/programTest', { name: 'programTest' });
Router.route('/admin/register', { name: 'adminRegister' });
Router.route('/admin/login', { name: 'adminLogin' });
Router.route('/admin/home', { name: 'adminHome' });
Router.route('/admin/accounts', { name: 'adminAccounts' });
Router.route('/admin/answers', { name: 'adminAnswers' });
