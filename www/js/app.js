/* Autor: Luis Bahamonde */

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'ion-gallery', 'jett.ionic.scroll.sista', 'ngIOS9UIWebViewPatch', 'ion-affix', 'firebase'])

.run(function($ionicPlatform, alunoService, $firebaseArray) {
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

  this.isInadimplenteByAluno = (aluno, mensalidades) => {        
    let eventsRef = firebase.database().ref().child('events').orderByChild('aluno').equalTo(aluno.$id);
    let events = $firebaseArray(eventsRef);
    return self.isInadimplente(mensalidades, events, aluno);
  }

  //verifica inadimplendia de uma unica mensalidade 
  this.isInadimplenteByMonth = (mensalidade) =>  
      (!mensalidade.pago) && (new Date(mensalidade.ano, mensalidade.mes, vencimento, 0, 0, 0, 0) < new Date())

  //se a mensalidade do aluno nao esta paga e é menor que o dia do vencimento
  //o aluno esta inadimplente
  this.isInadimplente = (mensalidades, events, aluno) => {    
    console.log("mensalidades", mensalidades);
    let hasMensalidadesNaoPagas = mensalidades.filter((mensalidade) =>  
      (!mensalidade.pago) && (new Date(mensalidade.ano, mensalidade.mes, aluno.contratoVencimento, 0, 0, 0, 0) < new Date())).length > 0
      
    let hasEventsNaoPagos = events.filter((event) => 
      (!event.pago) && (new Date(event.dataInicio) < new Date())).length > 0       

    if(hasEventsNaoPagos || hasMensalidadesNaoPagas)
      return true;
    else return false;
  }

  this.isTodasMensalidadesPagas = (aluno) => {
    let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
    let mensalidades = $firebaseArray(mensalidadesRef);
    
    return mensalidades.$loaded().then(() => mensalidades.filter((mensalidade) => (!mensalidade.pago)).length == 0);
  }

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
