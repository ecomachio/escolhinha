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

    alunoService.loadAlunos().$loaded().then(function(alunos){
      $scope.alunos = alunos;
      periodoService.loadPeriod();
      $ionicLoading.hide();
    })

  }
  /*
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
  } */

  $scope.openKid = function(aluno){

    $scope.aluno = aluno;
    var mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
    mensalidades = $firebaseArray(mensalidadesRef);
    mensalidades.$loaded().then(function() {
      $scope.mensalidades = mensalidades;
      for (var i = 0; i < mensalidades.length; i++) {
        mensalidades[i].data = new Date(mensalidades[i].ano, mensalidades[i].mes, 01, 0, 0, 0, 0);
      }
    })
    console.log($scope.aluno);

    $scope.modalKid.show();
  }

  $scope.openAdd = function(){
    $scope.modalAdd.show();
  }
})

.controller('kidController', function($scope, $state, $firebaseArray, $firebaseObject, $ionicModal) {
  console.log('kidController');

  $ionicModal.fromTemplateUrl('templates/editKid.html', {
    scope: $scope
  }).then(function(modalEditKid) {
    $scope.modalEditKid = modalEditKid;
  });

  $scope.openEditKid = function(){
    console.log("openEditKid;");
    $scope.modalEditKid.show();
  }

  $scope.pagaMensalidade = function(mensalidade){

    mensalidades.$save(mensalidade).then(function(){
      const idAluno = mensalidade.aluno;
      let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(idAluno);
      let mensalidades = $firebaseArray(mensalidadesRef);

      mensalidades.$loaded().then(function(){
        let alunoRef = firebase.database().ref().child('aluno').child(idAluno);
        let aluno = $firebaseObject(alunoRef);

        aluno.$loaded().then(function(){
          aluno.inadimplente = isInadimplente(mensalidades);
          aluno.$save();
        })
      })
    });
  }

  function isInadimplente(mensalidades, done){

    let mensalidadesPendentes = mensalidades.filter((mensalidade) => (!mensalidade.pago))

    if(mensalidadesPendentes.length)
       return true;
    else return false;
  }

  $scope.closeKid = function(){
    $scope.modalKid.hide();
  }

})

.controller('editKidController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService) {

  $scope.closeEditKid = function(){
    $scope.modalEditKid.hide();
  }

  function getAluno(_aluno){
    let ref = firebase.database().ref().child('aluno').child(_aluno.$id);
    let res = $firebaseObject(ref);
    return res.$loaded();
  }

  $scope.save = function(aluno){
    getAluno(aluno).then(function(aluno){
      aluno.$save()
      .then(function(){
        console.log("Aluno alterado");
        $scope.modalEditKid.hide();
      })
      .catch(function(err){
        console.log("Erro ao alterar MSG", err);
      })
    })
  }

  $scope.remove = function(aluno){
    getAluno(aluno).then(function(aluno){
      aluno.$remove()
      .then(function(){
        console.log("Aluno removido");
        aluno = {};
        $scope.modalEditKid.hide();
        $scope.modalKid.hide();
      })
      .catch(function(err){
        console.log("Erro ao remover MSG", err);
      })
    })
  }

})

.controller('addController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService) {

  $scope.add = function(addAluno){

    $ionicLoading.show();

    var ref = firebase.database().ref().child('aluno');
    alunos = $firebaseArray(ref);

    addAluno.idade = _calculateAge(addAluno.idadeDate);

    console.log(alunos);

      alunos.$add({
        nome: addAluno.nome,
        idade: addAluno.idade,
        responsavel: addAluno.responsavel,
        email: addAluno.email,
        inadimplente: true,
        dataNascimento: addAluno.idadeDate,
        contratoVigencia: addAluno.contratoVigencia,
        contratoVencimento: addAluno.contratoVencimento
      }).then(function(ref){
        console.log("Aluno adicionado");

        addAluno = limparAluno(addAluno);

        adicionarMensalidade(ref.key);
        $scope.modalAdd.hide();
        $ionicLoading.hide();
      }).catch(function(error){
        console.log(error);
      });
  }

  function limparAluno(addAluno) {
    addAluno.nome = "";
    addAluno.idade = "";
    addAluno.responsavel = "";
    addAluno.email = "";
    addAluno.dataNascimento = "";
    addAluno.idadeDate = "";
    addAluno.contratoVigencia = null;
    return addAluno;
  }

  function _calculateAge(birthday) { // birthday is a date
    let ageDifMs = Date.now() - birthday.getTime();
    let ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  $scope.closeAdd = function(addAluno){
    if(addAluno){
      addAluno = limparAluno(addAluno);
    }
    $scope.modalAdd.hide();
  }

  function adicionarMensalidade(key) {
    console.log("adicionarMensalidade");
    mensalidadesRef = firebase.database().ref().child('mensalidades');
    mensalidades = $firebaseArray(mensalidadesRef);

    per = periodoService.currentPeriodo();
    var mes = per.substring(0,per.indexOf("/"));
    var ano = per.substring(per.indexOf("/")+1, per.length)

    console.log(per.substring(0,per.indexOf("\\")));
    mensalidades.$add({
      aluno: key,
      periodo: per,
      ano: ano,
      mes: mes,
      pago: false
    })

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
      $ionicLoading.show();
      alunoService.loadAlunos().$loaded().then(function(){
        $scope.alunos = alunoService.loadAlunos();
        $scope.inadimplentes = $scope.countInadimplentes();
        $ionicLoading.hide();
      })
    }

    $scope.countInadimplentes = function(){
      var cont = 0
      var alunos = $scope.alunos;

      $scope.inadimplentes = "...";

      //todos os alunos
      alunos.$loaded().then(function(){
        console.log(alunos);
        for (var i = 0; i < alunos.length; i++) {
          if(alunos[i].inadimplente)
            cont++;
        }
        console.log(cont);
        $scope.inadimplentes = cont;
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
