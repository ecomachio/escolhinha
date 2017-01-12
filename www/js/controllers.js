angular.module('starter.controllers', [])

.controller('CadastroController', function($scope) {
  console.log("CadastroController");

  const dbAluno = firebase.database().ref().child('aluno');

  dbAluno.on('value', function(snapshot) {
    console.log(snapshot.val());
  });


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

.controller('FotosController', function($scope, Locales,$ionicFilterBar) {
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        $scope.locales = Locales.all();
        $scope.remove = function(local) {
            Locales.remove(local);
        };

        $scope.favorito = function(local){

        };

        $scope.showFilterBar = function () {
            filterBarInstance = $ionicFilterBar.show({
                items: $scope.locales,
                update: function (filteredItems, filterText) {
                    $scope.locales = filteredItems;
                    if (filterText) {
                        console.log(filterText);
                    }
                }
            });
        };

})

.controller('AlbunesController', function($scope, $stateParams, Locales) {
        var local_id = $stateParams.fotosId;
        $scope.local = Locales.get($stateParams.fotosId);

        $scope.items = [
            {
                src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_000.jpg',
                sub: ''
            },
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_001.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_002.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_003.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_004.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_005.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_006.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_007.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_008.jpg'},
            {src:'http://zonadeclubs.com/imagenes/Albumes/7041/foto_009.jpg'},
          ]

})

.controller('FavoritosController', function($scope) {})

.controller('LoginController', function($scope, $state) {

  $scope.login = function(user){

    var email = "";
    var password = "";

    email = user.email;
    password = user.password;

    console.log(email);
    console.log(password);

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {

      var errorCode = error.code;
      var errorMessage = error.message;

      console.log(errorCode);

    });

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
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
