angular.module('ccdaReceiver').directive('focusOnKey', function() {
  var keyToElement = { };
  var listener = function(e){
    if (keyToElement[e.keyCode]){
      keyToElement[e.keyCode].focus();
      e.preventDefault();
      e.stopPropagation();
    }
  };
  angular.element(document).on("keyup", listener);
  return function(scope, elm, attrs) {
    var allowedKeys = scope.$eval(attrs.focusOnKey);
    if (!angular.element.isArray(allowedKeys)){
      allowedKeys = [allowedKeys];
    }
    allowedKeys.forEach(function(k){
      keyToElement[k] = elm;
    });
  };
});

angular.module('ccdaReceiver').directive('clickOnKey', function() {
  var keyToElement = { };
  var listener = function(e){
    if (!e.altKey){return;}
    if (keyToElement[e.keyCode]){ 
      var a = angular.element(document.activeElement);
      /*
      if (-1 !== ["TEXTAREA", "INPUT"].indexOf(a.prop("tagName"))){
      return;
      }
      */
      keyToElement[e.keyCode].click();
      e.preventDefault();
      e.stopPropagation();
    }
  };
  angular.element(document).on("keyup", listener);
  return function(scope, elm, attrs) {
    var allowedKeys = scope.$eval(attrs.clickOnKey);
    if (!angular.element.isArray(allowedKeys)){
      allowedKeys = [allowedKeys];
    }
    allowedKeys.forEach(function(k){
      keyToElement[k] = elm;
    });
  };
});
