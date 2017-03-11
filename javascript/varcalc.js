$(function() {

  var period_map = {
    "annual": 1,
    "semi-annual": 2,
    "quarterly": 4,
    "monthly": 12,
    "daily": 252
  };

  function changeInputDataText(str) {
    $("#input_data h2").text("Enter " + str +":");
  }

  function printInputError(msg) {

    var $output = $("#output");
    var $p1 = $("#output_p1");
    var $p2 = $("#output_p2");

    $p1.text("Error: " + msg);
    $p1.css("color", "#ff0000");
    $output.css("font-size", "14px");

    $p2.hide();
    $output.show();
  }

  function printResults(variance, sd) {

    var $output = $("#output");
    var $p1 = $("#output_p1");
    var $p2 = $("#output_p2");

    var result = Number(Math.round(sd + 'e8') + 'e-8');
    $p1.html("Standard deviation (<em>\u03C3</em>): " + result);
    $p1.css("color", "#333");

    result = Number(Math.round(variance + 'e8') + 'e-8');
    $p2.html("Variance (<em>\u03C3<sup>2</sup></em>): " + result);
    $p2.css("color", "#333");

    $output.css("font-size", "18px");

    $p1.show();
    $p2.show();
    $output.show();
  }

  function parseList(lst) {

    if (lst === "") { return ""; }

    var arr = (lst.trim()).replace(/,\s/g, ",").split(/[\s,]/);

    var allNumeric = arr.every(function(element) {
      return $.isNumeric(element);
    });

    if (!allNumeric) { return; }

    for (var i = 0; i < arr.length; i++) {
      arr[i] = Number(arr[i]);
    }

    return arr;
  }

  function parseMatrix(mat) {

    if (mat === "") { return ""; }

    var arr = mat.split("\n");
    var row;
    var matrix = [];

    for (var i = 0; i < arr.length; i++) {

      row = parseList(arr[i]);

      if (!row) { return; }

      matrix.push(row);
    }

    return matrix;
  }

  function valsBoundedBy(data, lower, upper) {

    var bounded = data.every(function(element) {
      return ((element >= lower) && (element <= upper));
    });

    return bounded;
  }

  function weightsSumToOne(weights) {

    var sum = weights.reduce(function(acc, val) {
      return acc + val;
    });

    return (sum >= 0.99999999) && (sum <= 1.00000001);
  }

  function allRowsEqualLength(matrix) {

    var firstRowLength;
    var allRowsEqual;

    firstRowLength = matrix[0].length;

    allRowsEqual = matrix.every(function(element) {
      return element.length === firstRowLength;
    });

    return allRowsEqual;
  }

  function matrixSquareAndComplete(matrix) {

    var matLength;
    var firstRowLength;
    var matrixSquareAndComplete;

    matLength = matrix.length;
    firstRowLength = matrix[0].length;

    matrixSquareAndComplete = matrix.every(function(element) {
      return (element.length === matLength) && (element.length === firstRowLength);
    });

    return matrixSquareAndComplete;
  }

  function sameCountOfWeightsAndVariables(data, weights) {
    return data[0].length === weights.length;
  }

  function printBlankError(name) {
    printInputError(name + " cannot be blank.  Please enter data.");
  }

  function checkBlanks(dataType) {

    var input_data = $("#input_data textarea").val();
    var input_weights = $("#input_weights textarea").val();
    var input_vols;
    var name;

    if (dataType === "series") {
      name = "Data series";
    } else if (dataType === "covariance") {
      name = "Covariance matrix";
    } else if (dataType === "correlation") {
      name = "Correlation matrix";
    } else {
      return false;
    }

    if (input_data === "") {

      printBlankError(name);
      return false;
    }

    if (input_weights === "") {

      printBlankError("Weights");
      return false;
    }

    if (dataType === "correlation") {

      input_vols = $("#input_vols textarea").val();

      if (input_vols === "") {

        printBlankError("Standard deviations (volatilities)");
        return false;
      }
    }

    return true;
  }

  function printFormatError(name) {
    printInputError("Incorrect format for " + name + ".  Please check data format.");
  }

  function checkErrorShort(data, name) {

    if (!data) {

      printFormatError(name);
      return true;
    }

    return false;
  }

  function checkErrorLong(func, data, msg) {

    if (!func.apply(this, data)) {

      printInputError(msg);
      return true;
    }

    return false;
  }

  function validWeights() {

    var weights = parseList($("#input_weights textarea").val());
    var data;
    var msg;

    if (checkErrorShort(weights, "weights")) { return false; }

    msg = "All weights are not between 0 and 1.  Please check data.";
    if (checkErrorLong(valsBoundedBy, [weights, 0, 1], msg)) { return false; }

    msg = "Weights do not sum to 1.  Please check data.";
    if (checkErrorLong(weightsSumToOne, [weights], msg)) { return false; }

    data = parseMatrix($("#input_data textarea").val());

    msg = "Count of weights must match count of data series.";
    if (checkErrorLong(sameCountOfWeightsAndVariables, [data, weights], msg)) { return false; }

    return true;
  }

  function validSeries() {

    var series = parseMatrix($("#input_data textarea").val());
    var msg;

    if (checkErrorShort(series, "data series")) { return false; }

    msg = "At least one data series is incomplete.  Ensure there is no missing data and that all data series are of the same length.";
    if (checkErrorLong(allRowsEqualLength, [series], msg)) { return false; }

    if (!validWeights()) { return false; }

    return true;
  }

  function validCovar() {

    var covar = parseMatrix($("#input_data textarea").val());
    var msg;

    if (checkErrorShort(covar, "covariance matrix")) { return false; }

    msg = "Covariance matrix is incomplete.  Ensure there is no missing data and that matrix is square.";
    if (checkErrorLong(matrixSquareAndComplete, [covar], msg)) { return false; }

    if (!validWeights()) { return false; }

    return true;
  }

  function validCorr() {

    var corr = parseMatrix($("#input_data textarea").val());
    var msg;
    var corrLst;
    var vols;

    if (checkErrorShort(corr, "correlation matrix")) { return false; }

    msg = "Correlation matrix is incomplete.  Ensure there is no missing data and that matrix is square.";
    if (checkErrorLong(matrixSquareAndComplete, [corr], msg)) { return false; }

    corrLst = parseList($("#input_data textarea").val());

    msg = "All values in correlation matrix must be between -1 and 1, inclusive.";
    if (checkErrorLong(valsBoundedBy, [corrLst, -1, 1], msg)) { return false; }

    if (!validWeights()) { return false; }

    vols = parseList($("#input_vols textarea").val());

    if (checkErrorShort(vols, "standard deviations")) { return false; }

    msg = "All standard deviations (volatilities) must be greater than or equal to 0.";
    if (checkErrorLong(valsBoundedBy, [vols, 0, Infinity], msg)) { return false; }

    msg = "Count of standard deviations (volatilities) must match count of data series.";
    if (checkErrorLong(sameCountOfWeightsAndVariables, [corr, vols], msg)) { return false; }

    return true;
  }

  function validData(dataType) {

    if (!checkBlanks(dataType)) { return false; }

    if (dataType === "series") {
      if (!validSeries()) { return false; }
    } else if (dataType === "covariance") {
      if (!validCovar()) { return false; }
    } else if(dataType === "correlation") {
      if (!validCorr()) { return false; }
    } else {
      return false;
    }

    return true;
  }

  function annualizeVariance(variance) {

    var annualize = $("input[name='input_annualize']:checked").val();
    var period;

    if (annualize === "not_annualized") {
      return variance;
    }

    period = period_map[$("select#periodicity option:checked").val()];
    variance *= period;

    return variance;
  }

  function calcMean(data, i) {

    var n = data.length;
    var sum = 0;

    for (var k = 0; k < n; k++) {
      sum += data[k][i];
    }

    return sum / n;
  }

  function calcCovar(data, i ,j) {

    var covar = 0;
    var n = data.length;
    var mean_i = calcMean(data, i);
    var mean_j = calcMean(data, j);

    for (var k = 0; k < n; k++) {
      covar += (data[k][i] - mean_i) * (data[k][j] - mean_j);
    }

    covar *= 1 / (n - 1);

    return covar;
  }

  function calcCovarMatrix(data) {

    var matrix = [];
    var row;
    var variableCount = data[0].length;

    for (var i = 0; i < variableCount; i++) {

      row = [];

      for (var j = 0; j < variableCount; j++) {
        row.push(calcCovar(data, i ,j));
      }

      matrix.push(row);
    }

    return matrix;
  }

  function calcVol(dataType) {

    var data = parseMatrix($("#input_data textarea").val());
    var weights = parseList($("#input_weights textarea").val());
    var covar;
    var vols;
    var variance = 0;
    var sd;

    if (dataType === "series") {

      covar = calcCovarMatrix(data);

      for (var i = 0; i < covar.length; i++) {

        for (var j = 0; j < covar[0].length; j++) {
          variance += weights[i] * weights[j] * covar[i][j];
        }
      }

    } else if (dataType === "covariance") {

      for (var i = 0; i < data.length; i++) {

        for (var j = 0; j < data[0].length; j++) {
          variance += weights[i] * weights[j] * data[i][j];
        }
      }

    } else if (dataType === "correlation") {

      vols = parseList($("#input_vols textarea").val());

      for (var i = 0; i < data.length; i++) {

        for (var j = 0; j < data[0].length; j++) {
          variance += weights[i] * weights[j] * data[i][j] * vols[i] * vols[j];
        }
      }
    }

    variance = annualizeVariance(variance);
    sd = Math.sqrt(variance);

    printResults(variance, sd);
  }

  $("input[type='radio']").on("click", function() {

    var val = $(this).attr("value");

    if (val === "series") {

      changeInputDataText("data series");
      $("#input_vols").hide();

    } else if (val === "covariance") {

      changeInputDataText("covariance matrix");
      $("#input_vols").hide();

    } else if (val === "correlation") {

      changeInputDataText("correlation matrix");;
      $("#input_vols").css("display", "inline-block");
    }
  });

  $("input[type='radio'][name='input_type']").on("change", function() {
    $("#reset").trigger("click");
  });

  $("form a").on("click", function(e) {

    e.preventDefault();

    $("#modal_layer").fadeIn(100);
    $("#modal").fadeIn(100);
  });

  $("#modal span, #modal_layer").on("click", function() {

    $("#modal_layer").hide();
    $("#modal").hide();
  });

  $("input[name='input_annualize']").on("click", function() {

    var val = $(this).val();

    if (val === "not_annualized") {
      $("#period_div").hide();
    }

    if (val === "annualized") {
      $("#period_div").show();
    }
  });

  $("#reset").on("click", function(e) {

    e.preventDefault();

    $("textarea").val("");
    $("#output").hide();
    $(this).blur();
  });

  $("#submit").on("click", function(e) {

    e.preventDefault();

    var dataType = $("input[name='input_type']:checked").val();

    $("#output").hide();

    if (validData(dataType)) {
      calcVol(dataType);
    }

    $(this).blur();
  });
});
