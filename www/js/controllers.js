angular.module('starter.controllers', ['firebase'])

.controller('CadastroController', function($scope, $rootScope, $ionicModal, $ionicLoading, $firebaseObject, $firebaseArray, alunoService, periodoService) {

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

  function getAluno(_aluno){
    let ref = firebase.database().ref().child('aluno').child(_aluno.$id);
    let res = $firebaseObject(ref);
    return res.$loaded();
  }

  $scope.loadAlunos = function loadAlunos() {
    $ionicLoading.show();

    alunoService.loadAlunos().$loaded().then(function(alunos){
      $scope.alunos = alunos;
      let mensalidadesRef = firebase.database().ref().child('mensalidades');
      let mensalidades = $firebaseArray(mensalidadesRef);      

      var alunoPromises = alunos.map(a => getAluno(a));
      Promise.all(alunoPromises).then(todosAlunos => {        
        let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('ano').equalTo(2020);
        $firebaseArray(mensalidadesRef).$loaded().then(todasMensalidades => {        
          
          Promise.all(todosAlunos.map(aluno => getAluno(aluno))).then((res) => {
            res.forEach(a => {
              a.inadimplente = alunoService.isInadimplenteByAluno(a, todasMensalidades.filter(m => m.aluno == a.$id))  ;
              a.$save();
              $scope.alunos = alunos;                              
            });            
            $ionicLoading.hide();    
          })            
        });
        console.timeEnd();          
      });
    });  
  }

  function getM(_m){
    let ref = firebase.database().ref().child('mensalidades').child(_m.$id);
    let res = $firebaseObject(ref);
    return res.$loaded();
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
      let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
      let mensalidades = $firebaseArray(mensalidadesRef);
      let eventsRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(aluno.$id);
      let events = $firebaseArray(eventsRef);

      Promise.all([mensalidades.$loaded(), events.$loaded()]).then((resolved) => {
        let mensalidades = resolved[0];
        let events = resolved[1];
        $scope.mensalidades = mensalidades;
        $scope.events = events;
        $scope.aluno.inadimplente = alunoService.isInadimplente(mensalidades, events, aluno);
        $scope.modalKid.show();
    })
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

  $ionicModal.fromTemplateUrl('templates/updateEvent.html', {
    scope: $scope
  }).then(function(modalEditEvent) {
    $scope.modalEditEvent = modalEditEvent;
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

  $scope.openUpdateEvent = function(event){
    $scope.editEvent = angular.copy(event);
    $scope.editEvent.dataInicio = new Date(event.dataInicio);
    $scope.modalEditEvent.show();
  }

})

.controller('editEventController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService) {

  $scope.closeEditEvent = function(){
    $scope.modalEditEvent.hide();
  }

  $scope.updateEvent = function(editEvent){
    const idAluno = $scope.aluno.$id;
    let eventsRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(idAluno);
    $firebaseArray(eventsRef).$loaded().then((events) => {
      let rec = events.$getRecord(editEvent.$id);
      rec.desc = editEvent.desc;
      rec.valor = editEvent.valor;
      rec.dataInicio = new Date(editEvent.dataInicio.getTime()).getTime();
      events.$save(rec)
      .then((event) => {
        swal('Tudo pronto!', 'Evento atualizado', 'success');
        $scope.modalEditEvent.hide();
      }).catch((err) => {
        swal('Opa!', 'Erro ao alterar evento', 'error');
        $scope.modalEditEvent.hide();
      });
    })

  }
})

.controller('addEventController', function($scope, $state, $ionicLoading, $firebaseObject, $firebaseArray, periodoService) {

  $scope.closeAddEvent = function(){
    $scope.modalAddEvent.hide();
  }

  $scope.addEvent = function(event){
    const idAluno = $scope.aluno.$id;
    let eventsRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(idAluno);
    let events = $firebaseArray(eventsRef);

    events.$add({
      aluno: idAluno,
      valor: event.valor,
      dataInicio: event.dataInicio.getTime(),
      desc: event.desc
    }).then(() => {
      swal(event.desc, 'Evento adicionado ao aluno', 'success');
      $scope.modalAddEvent.hide();
    }).catch((err) => {
      console.log("Erro ao adcionar evento ", err);
      swal(event.desc, 'Erro ao adcionar evento', 'error');
      $scope.modalAddEvent.hide();
    })
  }
})

.controller('renewContractController', function($scope, $rootScope, $state, $ionicLoading, $firebaseObject, $firebaseArray, alunoService) {

  $scope.closeRenewContract = function(){
    $scope.modalRenewContract.hide();
  }

  $scope.saveRenewContract = function(renewMensalidade, renewEvent){

    const idAluno = $scope.aluno.$id;
    adicionarNovasMensalidades(idAluno, renewMensalidade.contratoVigencia, renewEvent.dataInicio.getTime());

    Promise.all([alterarValorMensalidadeAluno(idAluno, renewMensalidade.valorMensalidade),
                 adcionarEventoRematricula(idAluno, renewEvent)])
    .then(() => {
      swal('Tudo pronto', 'Rematricula adicionada aos eventos', 'success');
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

 function alterarValorMensalidadeAluno(idAluno, newValue) {

   let alunoRef = firebase.database().ref().child('aluno').child(idAluno);
   $firebaseObject(alunoRef).$loaded().then((aluno) => {
      aluno.valorMensalidade = newValue;
      return aluno.$save();
   })



 }

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
    $scope.editAluno.dataNascimentoAux = new Date(aluno.dataNascimento);    
    $scope.modalEditKid.show();
  }

  $scope.getAlunoClass = alunoService.getAlunoClass;

  $scope.openEvent = function(aluno){
    $scope.modalEvent.show();
  }

  $scope.pagaMensalidade = function(mensalidade){
    const idAluno = mensalidade.aluno;
    let eventsRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(idAluno);
    let events = $firebaseArray(eventsRef);
    let alunoRef = firebase.database().ref().child('aluno').child(idAluno);
    let aluno = $firebaseObject(alunoRef);

    Promise.all([aluno.$loaded(), events.$loaded()]).then((resolved) => {
      let aluno = resolved[0];
      let events = resolved[1];
      let mensalidades = $scope.mensalidades;

      mensalidades.$save(mensalidade).then(() => {
        aluno.inadimplente = alunoService.isInadimplente(mensalidades, events, aluno);
        aluno.$save();
      }).catch((err) => console.log(err));

    })
  }

  $scope.pagaEvento = function(event){
    const idAluno = event.aluno;
    let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(idAluno);
    let mensalidades = $firebaseArray(mensalidadesRef);
    let alunoRef = firebase.database().ref().child('aluno').child(idAluno);
    let aluno = $firebaseObject(alunoRef);

    Promise.all([aluno.$loaded(), mensalidades.$loaded()]).then((resolved) => {
      let aluno = resolved[0];
      let mensalidades = resolved[1];
      let events = $scope.events;

      events.$save(event).then(() => {
        aluno.inadimplente = alunoService.isInadimplente(mensalidades, events, aluno);
        aluno.$save();
      }).catch((err) => console.log(err));

    })
  }

  $scope.showComprovantePopup = function(mensalidade, aluno) {

    $rootScope.aluno = aluno;
    $rootScope.mensalidade = mensalidade;

    let popupTittle;

    if(aluno.inadimplente)
      popupTittle = "Cobrança";
    else popupTittle = "Comprovante";

    // An elaborate, custom popup
    var comprovantePopup = $ionicPopup.show({
      templateUrl: "templates/comprovantePopup.html",
      title: popupTittle,
      scope: $scope,
      buttons: [
        { text: 'Voltar' }
      ]
    })

    comprovantePopup.then(function(res) {

    });
  }

  $scope.share = function(t, yy, img, link){

    if(!$rootScope.aluno.inadimplente){

      let msg = "Diprima recebeu de "
                + $rootScope.aluno.responsavel +
                " a quantia de "
                + $filter('currency')($rootScope.aluno.valorMensalidade) +
                " referente a mensalidade "
                + ($rootScope.mensalidade.mes + 1) + "/" + $rootScope.mensalidade.ano +
                " Código de segurança: " + $rootScope.mensalidade.$id;

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
          var sub = 'Comprovante Diprima';
          window.plugins.socialsharing
          .shareViaEmail(msg, sub, '');
      }
    }else{
      let msg = "Prezado cliente "
      + $rootScope.aluno.responsavel +
      " Identificamos um debito de "
      + $filter('currency')($rootScope.aluno.valorMensalidade) +
      " referente a mensalidade "
      + ($rootScope.mensalidade.mes + 1) + "/" + $rootScope.mensalidade.ano +
      " Aguardamos contato para regularizar a sua situação "
      " Código de segurança: " + $rootScope.mensalidade.$id;

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
      var sub = 'Comprovante Diprima';
      window.plugins.socialsharing
      .shareViaEmail(msg, sub, '');
      }
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

      let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
      let mensalidades = $firebaseArray(mensalidadesRef);
      mensalidades.$loaded().then(mensalidades => {        
          aluno.inadimplente = alunoService.isInadimplenteByAluno(editAluno, mensalidades);
          aluno.nome = editAluno.nome;
          aluno.idade = editAluno.idade;
          aluno.responsavel = editAluno.responsavel;
          aluno.email = editAluno.email;
          aluno.dataNascimento = editAluno.dataNascimento;
          aluno.contratoVigencia = editAluno.contratoVigencia;
          aluno.contratoVencimento = parseInt(editAluno.contratoVencimento);
          aluno.telefone = editAluno.telefone;
          aluno.valorMensalidade = editAluno.valorMensalidade;
          aluno.matriculaPausada = editAluno.matriculaPausada;
  
          aluno.$save()
          .then(function(){
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

      alunos.$add({
        nome: addAluno.nome,
        idade: addAluno.idade,
        responsavel: addAluno.responsavel,
        email: addAluno.email |! "",
        inadimplente: true,
        dataNascimento: addAluno.dataNascimento.getTime(),
        contratoVigencia: addAluno.contratoVigencia,
        contratoVencimento: addAluno.contratoVencimento,
        telefone: addAluno.telefone || 0,
        valorMensalidade: addAluno.valorMensalidade
      }).then(function(ref){

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

    let mensalidadesRef = firebase.database().ref().child('mensalidades');
    let mensalidades = $firebaseArray(mensalidadesRef);
    let d = new Date();
    let mes = d.getMonth();
    let ano = d.getFullYear();

    for (var i = 0; i < contratoVigencia; i++) {
      mensalidades.$add({
        aluno: key,
        ano: ano,
        mes: mes,
        pago: false
      }).then(function(){})
      mes++;
      if(mes > 11){
        mes = 0;
        ano++;
      }
    }
  }
})

.controller('SettingsController', function($scope, $state) {

  $scope.signOut = function(){
    firebase.auth().signOut().then(function() {
      $state.go('login');
    }, function(error) {
      console.log("An error happened", error);
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

.controller('FotosController', function($scope, $rootScope, $q, $timeout, $ionicModal, $ionicLoading, $firebaseObject, $firebaseArray, $ionicLoading, alunoService) {

    $ionicModal.fromTemplateUrl('templates/kid.html', {
      scope: $scope
    }).then(function(modalKid) {
      $scope.modalKid = modalKid;
    });

    $scope.loadAlunos = function loadAlunos() {
      $ionicLoading.show();

      alunoService.loadAlunos().$loaded().then(function(alunos){
        //buildFinancePeriods($scope.alunos);

        $scope.countInadimplentes(alunos);
        $scope.alunos = alunos;
        $ionicLoading.hide();

      })
    }

    function getAluno(_aluno){
      let ref = firebase.database().ref().child('aluno').child(_aluno.$id);
      let res = $firebaseObject(ref);
      return res.$loaded();
    }

    $scope.openKid = function(aluno){

      $scope.aluno = aluno;
      let mensalidadesRef = firebase.database().ref().child('mensalidades').orderByChild('aluno').equalTo(aluno.$id);
      let mensalidades = $firebaseArray(mensalidadesRef);
      let eventsRef = firebase.database().ref().child('eventos').orderByChild('aluno').equalTo(aluno.$id);
      let events = $firebaseArray(eventsRef);

      Promise.all([mensalidades.$loaded(), events.$loaded()]).then((resolved) => {
        let mensalidades = resolved[0];
        let events = resolved[1];
        $scope.mensalidades = mensalidades;
        $scope.events = events;
        $scope.aluno.inadimplente = alunoService.isInadimplente(mensalidades, events, aluno);
        $scope.modalKid.show();
      })
    }


    $scope.countInadimplentes = function(alunos){

      let mensalidadesRef = firebase.database().ref().child('mensalidades');
      let mensalidades = $firebaseArray(mensalidadesRef);
      let eventsRef = firebase.database().ref().child('eventos');
      let events = $firebaseArray(eventsRef);

      //count alunos inadimplentes
      $scope.inadimplentes = "...";
      $scope.inadimplentes = alunos.filter((aluno) => aluno.inadimplente).length;

      //count matriculas pausadas
      $scope.pausados = "...";
      $scope.pausados = alunos.filter((aluno) => aluno.matriculaPausada).length;

      //count alunos adimplentes
      $scope.adimplentes = "...";
      $scope.adimplentes = alunos.filter((aluno) => !aluno.inadimplente).length;

      $scope.isLoading = true;
      $q.all([mensalidades.$loaded(), events.$loaded()]).then((resolved) => {
        $scope.overdueAmounts = parseFloat(alunos.reduce((amount, aluno) =>{

          let todasMensalidades = resolved[0];
          let todosEventos = resolved[1];
          
          if(aluno.matriculaPausada) 
            return amount
          
          if(aluno.inadimplente){

            let valorMensalidadePendente = todasMensalidades
            .filter((tm) => tm.aluno == aluno.$id)
            .reduce((ma, tm) =>
              ((!tm.pago) && (new Date(tm.ano, tm.mes, aluno.contratoVencimento, 0, 0, 0, 0) < new Date())) ? ma + aluno.valorMensalidade : ma, 0);

            let valorEventosPendentes = todosEventos
            .filter((te) => te.aluno == aluno.$id)
            .reduce((amount, event) =>
              ((!event.pago) && (new Date(event.dataInicio) < new Date())) ? amount + event.valor : amount, 0);

            return amount + valorEventosPendentes + valorMensalidadePendente;

          } else return amount;
        }, 0));
        $scope.isLoading = false;
      })

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

    $scope.getAlunoClass = alunoService.getAlunoClass;
})

.controller('FavoritosController', function($scope) {})

.controller('LoginController', function($scope, $firebaseArray, $rootScope, $state, $ionicLoading, alunoService) {

  $scope.user = {};

  $scope.checkUser = function(){

    var user = firebase.auth().currentUser;

    firebase.auth().onAuthStateChanged(function(user) {
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

    });
  }

});

