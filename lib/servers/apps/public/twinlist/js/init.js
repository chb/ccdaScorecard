$(function() {
  // fetch data, prep interface
  model.dataset = utils.getStorageItem("dataset");
  var jsonSource = utils.qs["json_src"];

  $.ajax({
    url: SMART.server + "/patients/"+SMART.patient+"/sections/medications",
    dataType:"json"
  }).success(function(medLists) {
    medLists.sort(function(a,b){
      a = a.medicationsPrescribed.length;
      b = b.medicationsPrescribed,length;
      if (a < b) return -1;
      if (a === b) return 0;
      return 1;
    });

    $.ajax({
      url: "/apps/twinlist/reconcile",
      type: "POST",
      contentType: "application/json",
      dataType:"json",
      data: JSON.stringify(medLists.slice(0,2))
    }).success(function(data) {

      model.loadData(data);
      controller.init();

      // introduce the demo once and only once
      if (!utils.getStorageItem("hide_welcome")) {
        $(".help-modal").addClass("show");
        utils.setStorageItem("hide_welcome", "true", 1);
      } else {
        $(".help-modal").children(".welcome").hide();
      }
      setTimeout(function(){
        $(window).resize();
        },10);
    })
  })
  /*
  $.getJSON(jsonSource, function(data) {
  model.loadData(data);
  controller.init();

  // introduce the demo once and only once
  if (!utils.getStorageItem("hide_welcome")) {
  $(".help-modal").addClass("show");
  utils.setStorageItem("hide_welcome", "true", 1);
  } else {
  $(".help-modal").children(".welcome").hide();
  }
  });
  */
});
