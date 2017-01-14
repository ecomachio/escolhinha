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
  this.loadAlunos = function loadAlunos() {

    var alunosRef = firebase.database().ref().child('aluno');
    var alunos = $firebaseArray(alunosRef);
    return alunos;

  }
})

.service('periodoService', function($ionicLoading, $firebaseArray){

    this.currentPeriodo = function functionName() {
        return;
    }

    this.loadPeriod = function() {

      var periodosRef = firebase.database().ref().child('periodo');
      periodos = $firebaseArray(periodosRef);
      periodos.$loaded().then(function() {
        checkNewPeriod(periodos);

        $scope.periodos = [];

        for (var i = 0; i < periodos.length; i++) {
          var per = {
            mes: periodos[i].periodo.substring(0,1),
            ano: periodos[i].periodo.substring(2,6)
          }
          $scope.periodos.push(per);
        }

        $scope.periodos = converteData.converteMes($scope.periodos);
      })
    }

    function checkNewPeriod(periodos) {
      var d = new Date();
      var mes = d.getMonth();
      var ano = d.getFullYear();
      var flagJaExistePer;
      if(mes < 10){
        mes = "0" + mes;
      }

      var per = mes.toString() + ano.toString();
      console.log(periodos);

      // periodo ainda nao existe
      for (var i = 0; i < periodos.length; i++) {
        if(periodos[i].periodo == per)
          flagJaExistePer = true;
      }

      if(!flagJaExistePer){
        periodos.$add({
          periodo: per
        }).then(function(){
          console.log("periodo incluido");
          var alunosRef = firebase.database().ref().child('aluno');
          var alunos = $firebaseArray(alunosRef);
          alunos.$loaded().then(function(){
            for (var i = 0; i < alunos.length; i++) {
              //adcionar mensalidade
            }
          })

        })
      }
    }

    this.converteMes = function (periodos) {
        for (var i = 0; i < periodos.length; i++) {
          console.log(periodos[i].mes);
          switch (parseInt(periodos[i].mes)) {
            case 0:
              periodos[i].desc = "Janeiro";
              break;
            case 1:
                periodos[i].desc ="Fevereiro"
                break;
            case 2:
                periodos[i].desc ="Março"
                break;
            case 3:
                periodos[i].desc ="Abril"
                break;
            case 4:
                periodos[i].desc ="Maio"
                break;
            case 5:
                periodos[i].desc ="Junho"
                break;
            case 6:
                periodos[i].desc ="Julho"
                break;
            case 7:
                periodos[i].desc ="Agosto"
                break;
            case 8:
                periodos[i].desc ="Setembro"
                break;
            case 9:
                periodos[i].desc ="Outubro"
                break;
            case 10:
                periodos[i].desc ="Novembro"
                break;
            default:
              periodos[i].desc ="Dezembro"
          }
        }
        return periodos;
      }
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
