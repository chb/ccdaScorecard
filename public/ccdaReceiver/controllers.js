angular.module('ccdaReceiver').controller("MainController", 
  function($rootScope, $route, $routeParams, $location){
    $rootScope.$on("$routeChangeSuccess", function(rc){
    });
    $rootScope.$on("$routeChangeStart", function(rc){
    });
  }
);

angular.module('ccdaReceiver').controller("SelectPatientController",  
  function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
    $scope.onSelected = function(p){
      var pid = patient.id(p),
      loc = "/ui/patient-selected/"+pid;
      if ($scope.searchterm === $routeParams.q){
      $location.url(loc);
      }

      $location.search("q", $scope.searchterm);
      var off = $rootScope.$on("$routeUpdate", function(){
      $location.url(loc);
        off();
      });

    };
  });

  angular.module('ccdaReceiver').controller("PatientSearchController",  
    function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
      $scope.patientHelper = patient;
      $scope.loading = true;
      $scope.patients = [];
      $scope.nPerPage = 10;
      $scope.skip = 0;
      $scope.genderglyph = {"Female" : "&#9792;", "Male": "&#9794;"};
      $scope.searchterm  = typeof $routeParams.q ==="string" && $routeParams.q || "";
      $scope.nextPage = function(){
        if (!$scope.hasNext()) return;
        $scope.skip += $scope.nPerPage;
        $scope.getMore();
      };

      $scope.previousPage = function(){
        if (!$scope.hasPrevious()) return;
        $scope.skip -= $scope.nPerPage;
        $scope.getMore();
      };

      $scope.select = function(i){
        $scope.onSelected($scope.patients[i]);
      };


      $scope.hasPrevious = function(){
        return $scope.skip > 0;
      };

      $scope.hasNext = function(){
        return $scope.patients.length === $scope.nPerPage;
      };

      $scope.$watch("searchterm", function(){
        var tokens = [];
        ($scope.searchterm || "").split(/\s/).forEach(function(t){
          tokens.push(t.toLowerCase());
        });
        $scope.tokens = tokens;
        $scope.skip = 0;
        $scope.getMore();
      });

      $scope.getMore = function(){
        patientSearch.search({
          "tokens": $scope.tokens, 
          "limit": $scope.nPerPage,
        "skip": $scope.skip})
        .success(function(patients){
          $scope.loading = false;
          $scope.patients = patients;
          $scope.blanks = [];
          for (var i = patients.length; i < $scope.nPerPage; i++){
            $scope.blanks.push({});
          }
          $scope.$apply();
        });
      };
    }
  );


  angular.module('ccdaReceiver').controller("PatientViewController",  
    function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
      $scope.patient = {};
      $scope.publicUri = publicUri;
      $scope.patientHelper = patient;
      $scope.patientView = function(){
        return ($scope.patient && angular.toJson($scope.patient, true));
      };

      $scope.givens = function(name){
        return name && name.givens.join(" ");
      };

      patientSearch.getOne($routeParams.pid).success(function(p){
        $scope.patient = p;
        $scope.$apply();
      });
    }
  );

  angular.module('ccdaReceiver').controller("AuthorizeAppController",  
    function($scope, authorization, patient, patientSearch, $routeParams, $rootScope, $location) {
      $scope.patientHelper = patient;
      $scope.patientName = "(choose below)";

      $scope.onSelected = function(p){
        $scope.patient = p;
        $scope.patientName = patient.name(p) ;
      };

      $scope.requestedScope = function(){
        if (!$scope.txn) {
          return null;
        }
        if (!$scope.txn.req.scope) {
          return "patient" // default scope
        }
        if ($scope.txn && $scope.txn.req.scope.indexOf("patient") !== -1){
          return "patient";
        }
        if ($scope.txn && $scope.txn.req.scope.indexOf("user") !== -1){
          return "user";
        }
        throw "Unrecognized scope";
      };

      $scope.needPatient = function(){
        return ($scope.requestedScope() === "patient" && 
        $scope.txn.req.patient === undefined);
      };

      $scope.decide = function(allow){
        var params = {};
        if ($scope.patient){
          params.patient = patient.id($scope.patient);
        }
        authorization.decide($scope.txn, allow, params);
      };

      $scope.allow = function(){
        $scope.decide(true);
      };

      $scope.deny = function(){
        $scope.decide(false);
      };

      authorization.transactionDetails($location.search().transaction_id)
      .success(function(t){
        $scope.txn = t;
        if (t.req.patient) {
          patientSearch.getOne(t.req.patient).success(function(p){
            $scope.patient = p;
            $scope.onSelected(p);
            $scope.$apply();
          });
        };
        $scope.$apply();
      });

    }
  );
