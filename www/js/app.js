/* Autor: Luis Bahamonde */

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'ion-gallery', 'jett.ionic.scroll.sista', 'ngIOS9UIWebViewPatch', 'ion-affix', 'firebase'])

.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {

    setTimeout(function () {
        navigator.splashscreen.hide();
    }, 2000);

    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
        //StatusBar.styleDefault();
        StatusBar.styleLightContent();
    }

  });
})

.service('alunoService', function($ionicLoading, $firebaseArray){
  let self = this;

  this.loadAlunos = function loadAlunos() {

    var alunosRef = firebase.database().ref().child('aluno');
    var alunos = $firebaseArray(alunosRef);
    return alunos;

  }

  this.isInadimplenteByAluno = (aluno) => {
    let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
    let mensalidades = $firebaseArray(mensalidadesRef);
    return mensalidades.$loaded().then((mensalidades) => self.isInadimplente(mensalidades, aluno.contratoVencimento));

  }
  //se a mensalidade nao esta paga e é menor que o dia do vencimento
  //o aluno esta inadimplente
  this.isInadimplente = (mensalidades, vencimento) =>
    mensalidades.filter((mensalidade) =>
      (!mensalidade.pago) && (new Date(mensalidade.ano, mensalidade.mes, vencimento, 0, 0, 0, 0) < new Date())).length > 0

})

.service('periodoService', function($ionicLoading, $firebaseArray, $firebaseObject){
  var self = this;
  this.getMensalidades = function(id){
    var mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(id);
    mensalidades = $firebaseArray(mensalidadesRef);

    return mensalidades;
  }

  this.loadPeriod = function() {

    var periodosRef = firebase.database().ref().child('periodo');
    periodos = $firebaseArray(periodosRef);
    periodos.$loaded().then(function() {
      self.checkNewPeriod(periodos);
    })
  }

  this.currentPeriodo = function currentPeriodo() {
    var d = new Date();
    var mes = d.getMonth();
    var ano = d.getFullYear();

    var per = mes.toString() + "/" + ano.toString();

    return per;
  }

  this.checkNewPeriod = function checkNewPeriod(periodos) {
    var flagJaExistePer = false;
    var per = self.currentPeriodo();
    //console.log(periodos);

    // periodo ainda nao existe
    for (var i = 0; i < periodos.length; i++) {
      console.log("periodos[i].periodo ");
      console.log(periodos[i].periodo);
      console.log(per);
      if(periodos[i].periodo == per)
        flagJaExistePer = true;
    }
    var mes = per.substring(0,per.indexOf("/"));
    var ano = per.substring(per.indexOf("/")+1, per.length)
    if(!flagJaExistePer){
      periodos.$add({
        periodo: per,
        mes: self.converteMes(parseInt(mes)),
        ano: ano
      }).then(function(ref){
        console.log("periodo incluido");

        var alunosRef = firebase.database().ref().child('aluno');
        var alunos = $firebaseArray(alunosRef);
        alunos.$loaded().then(function(){
          for (var i = 0; i < alunos.length; i++) {
            var mensalidadesRef = firebase.database().ref().child('mensalidades');
            var mensalidades = $firebaseArray(mensalidadesRef);
            mensalidades.$add({
              aluno: alunos[i].$id,
              periodo: per,
              ano: ano,
              mes: mes,
              pago: false
            })
          }
          for (var i = 0; i < alunos.length; i++) {
            let alunoRef = firebase.database().ref().child('aluno').child(alunos[i].$id);
            let aluno = $firebaseObject(alunoRef);

            aluno.$loaded().then(function(){
              aluno.inadimplente = self.isInadimplente(mensalidades);
              aluno.$save();
            })
          }
        })
      })
    }
  }

  this.isInadimplente = function(mensalidades, done){

    let mensalidadesPendentes = mensalidades.filter((mensalidade) => (!mensalidade.pago))

    if(mensalidadesPendentes.length)
       return true;
    else return false;
  }

  this.converteMes = function converteMes(n) {

      switch (parseInt(n)) {
        case 0:
            mes = "Janeiro";
            break;
        case 1:
            mes ="Fevereiro"
            break;
        case 2:
            mes ="Março"
            break;
        case 3:
            mes ="Abril"
            break;
        case 4:
            mes ="Maio"
            break;
        case 5:
            mes ="Junho"
            break;
        case 6:
            mes ="Julho"
            break;
        case 7:
            mes ="Agosto"
            break;
        case 8:
            mes ="Setembro"
            break;
        case 9:
            mes ="Outubro"
            break;
        case 10:
            mes ="Novembro"
            break;
        default:
          mes ="Dezembro"
      }
      console.log(n, mes);
      return mes;

    }
})

.filter('converteMes', function(periodoService) {
  return function(n) {
    return periodoService.converteMes(n);
  };
})

.config(function($stateProvider, $urlRouterProvider, $ionicFilterBarConfigProvider, $ionicConfigProvider) {

        $ionicFilterBarConfigProvider.theme('light');
        $ionicFilterBarConfigProvider.clear('ion-close');
        $ionicFilterBarConfigProvider.search('ion-search');
        $ionicFilterBarConfigProvider.backdrop(true);
        $ionicFilterBarConfigProvider.transition('vertical');
        $ionicFilterBarConfigProvider.placeholder('Search...');

        $ionicConfigProvider.backButton.previousTitleText(false);
        $ionicConfigProvider.backButton.text('');



    $stateProvider

  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })
  .state('tab.cadastro', {
    url: '/cadastro',
    views: {
      'tab-cadastro': {
        templateUrl: 'templates/tab-cadastro.html',
        controller: 'CadastroController'
      }
    }
  })
  .state('tab.fotos', {
      url: '/fotos',
      views: {
        'tab-fotos': {
          templateUrl: 'templates/tab-fotos.html',
          controller: 'FotosController'
        }
      }
    })
    .state('tab.fotos-detail', {
      url: '/fotos/:fotosId',
      views: {
        'tab-fotos': {
          templateUrl: 'templates/fotos-detail.html',
          controller: 'AlbunesController'
        }
      }
    })
    .state('tab.favoritos', {
        url: '/favoritos',
        views: {
            'tab-favoritos': {
                templateUrl: 'templates/tab-love.html',
                controller: 'FavoritosController'
            }
        }
    })
  .state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'SettingsController'
            }
        }
  })
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginController'
  });
  /*Si ninguno de los siguientes estados esta activo reenviar a /tab/cadastro */
  $urlRouterProvider.otherwise('/login');

});
