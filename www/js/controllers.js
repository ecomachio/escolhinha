angular.module('starter.controllers', ['firebase'])

.controller('CadastroController', function($scope, $rootScope, $ionicModal, $ionicLoading, $firebaseObject, $firebaseArray, alunoService, periodoService) {
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

  $rootScope.$on("loadAlunos", function(){
     $scope.loadAlunos();
  });

  $scope.loadAlunos = function loadAlunos() {
    $ionicLoading.show();
    console.log(firebase.auth());

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
      $scope.aluno.inadimplente = alunoService.isInadimplente(mensalidades, aluno.contratoVencimento);
    })

    console.log($scope.aluno);

    $scope.modalKid.show();
  }

  $scope.openAdd = function(){
    $scope.modalAdd.show();
  }
})

.controller('eventController', function($scope, $state, $ionicPopup, $firebaseArray, $firebaseObject, $ionicModal, alunoService, $filter, $rootScope) {

  $ionicModal.fromTemplateUrl('templates/addEvent.html', {
    scope: $scope
  }).then(function(modalAddEvent) {
    $scope.modalAddEvent = modalAddEvent;
  });

  $ionicModal.fromTemplateUrl('templates/renewContract.html', {
    scope: $scope
  }).then(function(modalRenewContract) {
    $scope.modalRenewContract = modalRenewContract;
  });

  $scope.closeEvent = function(){
    $scope.modalEvent.hide();
  }

  $scope.addEvent = function(){
    $scope.modalAddEvent.show();
  }

  $scope.openRenewContract = function(){
    $scope.$emit("checkIfCanRenew", {});             
    $scope.modalRenewContract.show();
  }
})

.controller('addEventController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService) {

  $scope.closeAddEvent = function(){
    $scope.modalAddEvent.hide();
  }

  $scope.addEvent = function(event){
    console.log(event);
  }

})

.controller('renewContractController', function($scope, $rootScope, $state, $ionicLoading, $firebaseObject, $firebaseArray, alunoService) {

  $scope.closeRenewContract = function(){
    $scope.modalRenewContract.hide();
  }

  $scope.saveRenewContract = function(renewMensalidade, renewEvent){
    console.log(renewMensalidade, renewEvent, $scope.aluno);

    const idAluno = $scope.aluno.$id;        
    adicionarNovasMensalidades(idAluno, renewMensalidade.contratoVigencia, renewEvent.dataInicio.getTime());
    adcionarEventoRematricula(idAluno, renewEvent).then(() => {
      swal('Tudo pronto', 'Rematricula adicionada aos eventos');
      $scope.modalRenewContract.hide();   
    })
  }

  $scope.checkIfCanRenew = function(){
    alunoService.isTodasMensalidadesPagas($scope.aluno).then((isMensalidadesPagas) => {      
      if(!isMensalidadesPagas){
        swal("Opa!", "Aluno com contrato ativo", "error");
        $scope.modalRenewContract.hide();     
      } 
    })
  }

 $rootScope.$on("checkIfCanRenew", function(){
    $scope.checkIfCanRenew();    
 })  

  function adcionarEventoRematricula(idAluno, renewEvent){

    let eventosRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(idAluno);
    let eventos = $firebaseArray(eventosRef);

    return eventos.$add({      
      aluno: idAluno,
      desc: "rematricula",
      dataInicio: renewEvent.dataInicio.getTime(),
      valor: renewEvent.valor,
      pago: false
    });

  }

  function adicionarNovasMensalidades(idAluno, contratoVigencia, dataInicioRematricula) {
    
    let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(idAluno);
    let mensalidades = $firebaseArray(mensalidadesRef);
    let d = new Date(dataInicioRematricula); // data inicio da rematricula    
    
    mensalidades.$loaded().then((mensalidades) => {
      
      const sortedMensalidades = mensalidades.sort((a,b) => 
        new Date(a.ano, a.mes, 0, 0, 0, 0, 0).getTime() - new Date(b.ano, b.mes, 0, 0, 0, 0, 0).getTime());
      
      const lastMensalidade = sortedMensalidades[sortedMensalidades.length - 1];
      let mes = lastMensalidade.mes + 1;
      let ano = lastMensalidade.ano;

      if(mes > 11){
          mes = 0;
          ano++;
      }

      for (var i = 0; i < contratoVigencia; i++) {
        mensalidades.$add({
          aluno: idAluno,
          ano: ano,
          mes: mes,
          pago: false
        })
        mes++;
        if(mes > 11){
          mes = 0;
          ano++;
        }
      }
    })    
  }
})

.controller('kidController', function($scope, $state, $ionicPopup, $firebaseArray, $firebaseObject, $ionicModal, alunoService, $filter, $rootScope) {
  console.log('kidController');

  $ionicModal.fromTemplateUrl('templates/editKid.html', {
    scope: $scope
  }).then(function(modalEditKid) {
    $scope.modalEditKid = modalEditKid;
  });

  $ionicModal.fromTemplateUrl('templates/event.html', {
    scope: $scope
  }).then(function(modalEvent) {
    $scope.modalEvent = modalEvent;
  });

  $scope.openEditKid = function(aluno){
    $scope.editAluno = angular.copy(aluno);
    console.log(aluno.dataNascimento)
    $scope.editAluno.dataNascimentoAux = new Date(aluno.dataNascimento);
    console.log("openEditKid;");
    $scope.modalEditKid.show();
  }

  $scope.openEvent = function(aluno){
    console.log("openEvent;");
    $scope.modalEvent.show();
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
          aluno.inadimplente = alunoService.isInadimplente(mensalidades, aluno.contratoVencimento);
          aluno.$save();
        })
      })
    });
  }

  $scope.showComprovantePopup = function(mensalidade, aluno) {

    $rootScope.aluno = aluno;
    $rootScope.mensalidade = mensalidade;

    // An elaborate, custom popup
    var comprovantePopup = $ionicPopup.show({
      templateUrl: "templates/comprovantePopup.html",
      title: 'Comprovante',
      scope: $scope,
      buttons: [
        { text: 'Voltar' }
      ]
    })

    comprovantePopup.then(function(res) {
      console.log('Tapped!', res);
    });
  }

  $scope.share = function(t, yy, img, link){

    let msg = "Diprima recebeu de "
              + $rootScope.aluno.responsavel +
              " a quantia de "
              + $filter('currency')($rootScope.aluno.valorMensalidade) +
              " refenre a mensalidade "
              + ($rootScope.mensalidade.mes + 1) + "/" + $rootScope.mensalidade.ano +
              " Código de segurança: " + $rootScope.mensalidade.$id;

     console.log(msg);

     if(t == 'w')
         window.plugins.socialsharing
         .shareViaWhatsApp(msg, '', link);
     else if(t == 'f')
         window.plugins.socialsharing
         .shareViaFacebook(msg, img, link);
     else if(t == 't')
         window.plugins.socialsharing
         .shareViaTwitter(msg, img, link);
     else if(t == 'sms')
         window.plugins.socialsharing
         .shareViaSMS(msg+' '+img+' '+link);
     else
     {
         var sub = 'Beautiful images inside ..';
         window.plugins.socialsharing
         .shareViaEmail(msg, sub, '');
     }
  }

  $scope.gerarComprovante = function(mensalidade){

  }

  $scope.closeKid = function(){
    $scope.modalKid.hide();
  }

})

.controller('editKidController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService, alunoService) {

  $scope.closeEditKid = function(){
    $scope.modalEditKid.hide();
  }

  function getAluno(_aluno){
    let ref = firebase.database().ref().child('aluno').child(_aluno.$id);
    let res = $firebaseObject(ref);
    return res.$loaded();
  }

  $scope.save = function(editAluno){

    getAluno(editAluno).then(function(aluno){
      alunoService.isInadimplenteByAluno(editAluno).then((isInadimplenteResolved) => {
        aluno.inadimplente = isInadimplenteResolved;
        aluno.nome = editAluno.nome;
        aluno.idade = editAluno.idade;
        aluno.responsavel = editAluno.responsavel;
        aluno.email = editAluno.email;
        aluno.dataNascimento = editAluno.dataNascimento;
        aluno.contratoVigencia = editAluno.contratoVigencia;        
        aluno.contratoVencimento = parseInt(editAluno.contratoVencimento);
        aluno.telefone = editAluno.telefone;
        aluno.valorMensalidade = editAluno.valorMensalidade;

        aluno.$save()
        .then(function(){
          console.log(aluno);
          console.log("Aluno alterado");
          $scope.aluno = aluno;
          $scope.modalEditKid.hide();
        })
        .catch(function(err){
          console.log("Erro ao alterar MSG", err);
        })
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

    addAluno.idade = _calculateAge(addAluno.dataNascimento);

    console.log(alunos);

      alunos.$add({
        nome: addAluno.nome,
        idade: addAluno.idade,
        responsavel: addAluno.responsavel,
        email: addAluno.email,
        inadimplente: true,
        dataNascimento: addAluno.dataNascimento.getTime(),
        contratoVigencia: addAluno.contratoVigencia,
        contratoVencimento: addAluno.contratoVencimento,
        telefone: addAluno.telefone,
        valorMensalidade: addAluno.valorMensalidade
      }).then(function(ref){
        console.log("Aluno adicionado");

        adicionarMensalidade(ref.key, addAluno.contratoVigencia);

        addAluno = limparAluno(addAluno);

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
    addAluno.contratoVigencia = null;
    addAluno.contratoVencimento = null;
    addAluno.telefone = "";
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

  function adicionarMensalidade(key, contratoVigencia) {
    console.log("adicionarMensalidade");
    let mensalidadesRef = firebase.database().ref().child('mensalidades');
    let mensalidades = $firebaseArray(mensalidadesRef);
    let d = new Date();
    let mes = d.getMonth();
    let ano = d.getFullYear();

    console.log("contratoVigencia", contratoVigencia);
    for (var i = 0; i < contratoVigencia; i++) {
      mensalidades.$add({
        aluno: key,
        ano: ano,
        mes: mes,
        pago: false
      }).then(function(){
        console.log(i);
      })
      mes++;
      if(mes > 11){
        mes = 0;
        ano++;
      }
    }
  }
})

.controller('SettingsController', function($scope, $state) {
  console.log("SettingsController");
  $scope.signOut = function(){
    console.log('aqui');
    firebase.auth().signOut().then(function() {
      $state.go('login');
    }, function(error) {
      console.log("An error happened");
    });
  }
  /*
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $state.go('tab.cadastro');
    }else{
      $state.go('login');
    }
  })*/
})

.controller('FotosController', function($scope, $ionicModal, $ionicLoading, $firebaseObject, $firebaseArray, $ionicLoading, alunoService) {

    $ionicModal.fromTemplateUrl('templates/kid.html', {
      scope: $scope
    }).then(function(modalKid) {
      $scope.modalKid = modalKid;
    });

    $scope.loadAlunos = function loadAlunos() {
      $ionicLoading.show();

      alunoService.loadAlunos().$loaded().then(function(alunos){        
        //buildFinancePeriods($scope.alunos);
        
        //$scope.overdueAmounts = alunos.map(aluno.valorMensalidade);
        $scope.alunos = alunoService.loadAlunos();
        console.log($scope.alunos);        
        console.log($scope.overdueAmounts);
        $scope.countInadimplentes(alunos);
        $ionicLoading.hide();
      })
    }

    $scope.openKid = function(aluno){

      $scope.aluno = aluno;
      var mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
      mensalidades = $firebaseArray(mensalidadesRef);
      mensalidades.$loaded().then(function() {
        $scope.mensalidades = mensalidades;
        $scope.aluno.inadimplente = alunoService.isInadimplente(mensalidades, aluno.contratoVencimento);
      })

      console.log($scope.aluno);

      $scope.modalKid.show();
    }


    $scope.countInadimplentes = function(alunos){            
      $scope.inadimplentes = "...";      
      $scope.inadimplentes = alunos.filter((aluno) => aluno.inadimplente).length;            
      $scope.overdueAmounts = alunos.reduce((amount, aluno) => 
        (aluno.inadimplente) ? amount + aluno.valorMensalidade : amount + 0, 0);
    }

    /*
     * Metodo nao utilizado
     */
    function buildFinancePeriods(alunos){

      let mensalidadesRef = firebase.database().ref().child('mensalidades');
      let mensalidades = $firebaseArray(mensalidadesRef);
      mensalidades.$loaded().then(function() {      

        let financePeriodHeader = mensalidades.reduce((f, mensalidade, currentIndex) => {         

          if(f.length == 0)
            f.push({
                ano: mensalidade.ano,
                mes: mensalidade.mes,
                alunos: []
              });

          else if(f.filter((item) => ((item.mes == mensalidade.mes)&&(item.ano == mensalidade.ano))).length == 0){            

            f.push({
              ano: mensalidade.ano,
              mes: mensalidade.mes,
              alunos: []
            });
          }

          return f;
        }, [])        
      })
    }
})

.controller('FavoritosController', function($scope) {})

.controller('LoginController', function($scope, $rootScope, $state, $ionicLoading, alunoService) {

  $scope.user = {};

  $scope.checkUser = function(){

    var user = firebase.auth().currentUser;

    firebase.auth().onAuthStateChanged(function(user) {
      console.log(user);
      if (user) {
        $rootScope.$emit("loadAlunos", {});

        $state.go('tab.cadastro');
        $ionicLoading.hide();
      }else{
        $state.go('login');
      }
    });

  }

  $scope.login = function(user){

    $ionicLoading.show();

    var email = "";
    var password = "";

    if((!user.email)||(!user.password)){
      $ionicLoading.hide();
      swal("Desculpe", "Login inválido", "error");
      return;
    }

    email = user.email;
    password = user.password;
    //cadastrar novo usuario
    //$scope.signUp(user);

    firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(function(error) {
      $ionicLoading.hide();
      swal("Desculpe", "Login inválido", "error")

      var errorCode = error.code;
      var errorMessage = error.message;

      console.log(errorCode);

    }).then(() => {
      $ionicLoading.hide();

      alunoService.loadAlunos().$loaded().then(function(alunos){
        $rootScope.$emit("loadAlunos", {});

        $state.go('tab.cadastro');
        $ionicLoading.hide();
      })

    });

  }

  $scope.signUp = function(user){

    firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      // ...
    });
  }

});

