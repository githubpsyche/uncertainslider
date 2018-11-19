/**
 * jspsych-multirange-slider
 * a jspsych plugin for multirange sliders. 
 *
 * Jordan Gunn
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins["multirange-slider"] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    // set default values for parameters
    trial.prompt = trial.prompt || "";
    trial.is_html = (typeof trial.is_html == 'undefined') ? false : trial.is_html;
    trial.max = trial.max || 10;
    trial.min = trial.min || 0;
    trial.step = trial.step || 0.1;

    // allow variables as functions
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);
    
    // other global variables
    var choice = 0;
    var sliderActivated = false;
    var uncertaintyDirected = false;
    var directedLeft = false;
    var left = 5;
    var center = 5;
    var right = 5;
    var start = [trial.min-trial.step, trial.min-trial.step, trial.min-trial.step, trial.max+trial.step, trial.max+trial.step];
    var prev =  [trial.min-trial.step, trial.min-trial.step, trial.min-trial.step, trial.max+trial.step, trial.max+trial.step];
    var tooltips = [true, true, true, true, true];
    var connect = true;
    
    // display stimulus
    if (!trial.is_html) {
      display_element.append($('<img>', {
        src: trial.stimulus,
        id: 'jspsych-multirange-stimulus'
      }));
    } else {
      display_element.append($('<div>', {
        html: trial.stimulus,
        id: 'jspsych-multirange-stimulus'
      }));
    }
    
    //show prompt if there is one
    if (trial.prompt !== "") {
      display_element.append(trial.prompt);
    }
    
    // slider
    display_element.append('<div class="sliders" id="slider"></div>');
    var slider = document.getElementById('slider');

    noUiSlider.create(slider, {
      start: start,
      step: trial.step,
      margin: 0,
      connect: connect,
      behaviour: 'snap',
      tooltips: tooltips,
      range: {
        'min': [   trial.min-trial.step ],
        'max': [ trial.max+trial.step ]
      },
      animate: false,
      pips: {
        mode: 'count',
        values: trial.max+1
      }
    });
    
    // toggle all but the middle handle off
    slidervals = slider.getElementsByClassName('noUi-origin');
    for (i=0; i<5; i++){
      if (i!=2) {
        slidervals[i].setAttribute('disabled', true);
      }
    }
    
    // hide all the sliders
    slidervis = slider.getElementsByClassName('noUi-handle');
    for (i=0; i<5; i++){
      slidervis[i].style.display = 'none';
    }
    
    // hide all the connect bars
    sliderconnect = slider.getElementsByClassName('noUi-connect');
    for (i=0; i<3; i++){
      sliderconnect[i].style.background = '#FAFAFA';
    }
    
    // bind the "choice" setting function to the "set" event
    // bind the "uncertainty" setting function to the "slide" event
    slider.noUiSlider.on('set', activateSlider);
    slider.noUiSlider.on('slide', updateSlider);
    
    // function to activate slider and set initial "choice" value
    // Should work only on initial click of slider.
    // It stores the position of that first click and reveals its location on the slider.
    function activateSlider(){
      if (!sliderActivated){
        sliderActivated = true;
        choice = slider.noUiSlider.get()[2];
        slidervis[2].style.display = 'block';
        prev = slider.noUiSlider.get();
      }
    }
    
    // function to set and dynamically update "uncertainty" and "choice" value s
    function updateSlider(){
      // function should only operate after slider has been activated
      if (!sliderActivated) { return; }
      
      // if this is the first time updateSlider is called,
      // must first clarify which of the five active slider handles
      // will be involved in computing/visualizing choice/uncertainty
      if (!uncertaintyDirected) {
        uncertaintyDirected = true;
        
        // If the handle was initially moved left after slider activation, then the handle to its right is now the centered, "choice" handle
        // If it was moved right after slider activation, then the handle to its LEFT is now the centered, choice handle.
        // Furthermore, other differences in which/how connect bars are visualized and values are updated must be configured.
        slidervis[2].style.display = 'none';
        if (slider.noUiSlider.get()[2] < choice) { directedLeft = true; }
        
        if (directedLeft) {
          left = 2;
          right = 4;
          center = 3;
          slidervis[3].style.display = 'block';
          slidervals[4].removeAttribute('disabled');
          slidervals[3].removeAttribute('disabled');
          sliderconnect[2].style.background = '#3FB8AF';
        } else {
          right = 2;
          left = 0;
          center = 1;
          slidervis[1].style.display = 'block';
          slidervals[0].removeAttribute('disabled');
          slidervals[1].removeAttribute('disabled');
          for (i=0; i<3; i++){
            sliderconnect[i].style.background = '#3FB8AF';
          }
          sliderconnect[2].style.background = '#FAFAFA';
        }
        
        // now that these things are set we can call updateSlider again to actually update values
        updateSlider();
        return;
      } else {
        // if the value of left changed during the slide, 
        if (Math.round(slider.noUiSlider.get()[left]/trial.step) != Math.round(prev[left]/trial.step)) {
          prev[left] = slider.noUiSlider.get()[left];
          
          // if left is the same as center, make it not the same as center
           if (slider.noUiSlider.get()[left] == slider.noUiSlider.get()[center]) {
            prev[left] = parseFloat(prev[left]) - parseFloat(trial.step);
           }
           
          prev[center] = choice;
          prev[right] = parseFloat(prev[center]) + (parseFloat(prev[center]) - parseFloat(prev[left]));
          slider.noUiSlider.set(prev);
          prev = slider.noUiSlider.get();
          
        // if the value of right changed during the slide,
        } else if (Math.round(slider.noUiSlider.get()[right]/trial.step) != Math.round(prev[right]/trial.step)) {
          prev[right] = slider.noUiSlider.get()[right];
          
          // if right is the same as center, make it not the same as center
           if (slider.noUiSlider.get()[right] == slider.noUiSlider.get()[center]) {
            prev[right] = parseFloat(prev[right]) + parseFloat(trial.step);
           }
          
          prev[center] = choice;
          prev[left] = parseFloat(prev[center]) + (parseFloat(prev[center]) - parseFloat(prev[right]));
          slider.noUiSlider.set(prev);
          prev = slider.noUiSlider.get();
        
        // if the value of the center changed during the slide,
        } else if (Math.round(slider.noUiSlider.get()[center]/trial.step) != Math.round(prev[center]/trial.step)) {
          prevUncertainty = Math.max(parseFloat(prev[center])-parseFloat(prev[left]), parseFloat(prev[right])-parseFloat(prev[center]));
          
          // if center is beyond the bounds, make it not beyond the bounds
          if (slider.noUiSlider.get()[center] < trial.min) {
            prev[center] = trial.min;
          } else if (slider.noUiSlider.get()[center] > trial.max) {
            prev[center] = trial.max;
          } else {
            prev[center] = slider.noUiSlider.get()[center];
          }
          prev[right] = parseFloat(prev[center]) + prevUncertainty;
          prev[left] = parseFloat(prev[center]) - prevUncertainty;
          slider.noUiSlider.set(prev);
          prev = slider.noUiSlider.get();
          choice = slider.noUiSlider.get()[center];
        }
      }
    }
    
    // reset button
    display_element.append('<br></br><p></p>');
    display_element.append($('<button>', {
      'id': 'reset',
      'class': 'sim',
      'html': 'Reset'
    }));
    
    $("#reset").click(function() {
      // re-declare global variables
      slider.noUiSlider.set(start);
      choice = 0;
      sliderActivated = false;
      uncertaintyDirected = false;
      directedLeft = false;
      left = 5;
      center = 5;
      right = 5;
      start = [trial.min-trial.step, trial.min-trial.step, trial.min-trial.step, trial.max+trial.step, trial.max+trial.step];
      prev =  [trial.min-trial.step, trial.min-trial.step, trial.min-trial.step, trial.max+trial.step, trial.max+trial.step];
      
      // toggle all but the middle handle off
      slidervals = slider.getElementsByClassName('noUi-origin');
      for (i=0; i<5; i++){
        if (i!=2) {
          slidervals[i].setAttribute('disabled', true);
        }
      }
      // hide all the sliders
      for (i=0; i<5; i++){
        slidervis[i].style.display = 'none';
      }
      for (i=0; i<3; i++){
        sliderconnect[i].style.background = '#FAFAFA';
      }
    });
    
    // submit button
    display_element.append($('<button>', {
      'id': 'next',
      'class': 'sim',
      'html': 'Submit Answer'
    }));
    
    $("#next").click(function() {
      display_element.html(''); // clear the display

      // data saving
      var trialdata = {
        choice: choice,
        uncertainty: Math.max(choice-slider.noUiSlider.get()[left], slider.noUiSlider.get()[right]-choice),
      };

      jsPsych.finishTrial(trialdata);

    });
  };

  return plugin;
})();