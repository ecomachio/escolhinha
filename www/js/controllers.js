angular.module('starter.controllers', ['firebase'])

.controller('CadastroController', function($scope, $ionicModal, $ionicLoading, $firebaseObject, $firebaseArray, alunoService, periodoService) {
  console.log("CadastroController");
  $ionicModal.fromTemplateUrl('templates/kid.html', {
    scope: $scope
  }).then(function(modalKid) {
    $scope.modalKid = modalKid;
  });

  $ionicModal.fromTemplateUrl('templates/add.html', {
    scope: $scope
  }).then(function(modalAdd) {
    $scope.modalAdd = modalAdd;
  });

  $scope.loadAlunos = function loadAlunos() {
    $ionicLoading.show();
    alunoService.loadAlunos().$loaded().then(function(){
      $scope.alunos = alunoService.loadAlunos();
      loadPeriod();
      $ionicLoading.hide();
    })

  }

  function loadPeriod() {

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

      $scope.periodos = periodoService.converteMes($scope.periodos);
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

      })
    }
  }

  $scope.openKid = function(aluno){

    $scope.aluno = aluno;
    console.log($scope.aluno);

    $scope.modalKid.show();
  }

  $scope.openAdd = function(){
    $scope.modalAdd.show();
  }
})

.controller('kidController', function($scope, $state) {
  console.log('kidController');

  $scope.closeKid = function(){
    $scope.modalKid.hide();
  }

})

.controller('addController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray) {

  $scope.add = function(aluno){

    $ionicLoading.show();

    var ref = firebase.database().ref().child('aluno');
    alunos = $firebaseArray(ref);

    console.log(alunos);

    alunos.$add({
      nome: aluno.nome,
      idade: aluno.idade,
      responsavel: aluno.responsavel,
      email: aluno.email,
      dataNascimento: "31/12/9999",
      mensalidade: {
        periodo: periodo,
        pago: false
      }
    }).then(function(ref){
      console.log("aluno adicionado");
      aluno.nome = "";
      aluno.idade = "";
      aluno.responsavel = "";
      aluno.email = "";
      aluno.dataNascimento = "";
      $ionicLoading.hide();
    }).catch(function(error){
      console.log(error);
    });

  }

  $scope.closeAdd = function(){
    $scope.modalAdd.hide();
  }

})

.controller('SettingsController', function($scope, $state) {
  console.log("SettingsController");
  $scope.signOut = function(){
    console.log('aqui');
    firebase.auth().signOut().then(function() {
      console.log("Sign-out successful");
    }, function(error) {
      console.log("An error happened");
    });
  }

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $state.go('tab.cadastro');
    }else{
      $state.go('login');
    }
  })
})

.controller('FotosController', function($scope, $ionicLoading, $firebaseObject, $firebaseArray, $ionicLoading, alunoService) {

    $scope.loadAlunos = function loadAlunos() {
      alunoService.loadAlunos().$loaded().then(function(){
        $scope.alunos = alunoService.loadAlunos();
        $ionicLoading.hide();
      })
    }

})

.controller('FavoritosController', function($scope) {})

.controller('LoginController', function($scope, $state, $ionicLoading) {

  $scope.user = {};

  $scope.checkUser = function(){

    var user = firebase.auth().currentUser;

    firebase.auth().onAuthStateChanged(function(user) {
      console.log(user);
      if (user) {
        $state.go('tab.cadastro');
      }else{
        $state.go('login');
      }
    });
  }

  $scope.login = function(user){

    var email = "";
    var password = "";

    email = user.email;
    password = user.password;

    $ionicLoading.show();

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {

      var errorCode = error.code;
      var errorMessage = error.message;

      console.log(errorCode);
      $ionicLoading.hide();

    });

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $ionicLoading.hide();
        $state.go('tab.cadastro');
      }else{
        $state.go('login');
      }
    });

  }

  $scope.signUp = function(user){

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      // ...
    });
  }

});
