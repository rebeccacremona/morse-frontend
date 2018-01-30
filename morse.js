//
// Toggle Controls
//

const toggle_controls = document.getElementById('toggle_controls');
const controls = document.getElementById('controls');

toggle_controls.addEventListener('click', function(event){
  if(this.classList.contains('show')){
      this.innerHTML = '<<';
      this.classList.remove('show');
      this.classList.add('hide');
      controls.classList.remove('hidden');
  } else {
      this.innerHTML = '>>';
      this.classList.remove('hide');
      this.classList.add('show');
      controls.classList.add('hidden');
  }

});


//
// Timing Controls
//

const dash_input = document.getElementById('dash');
const pause_input = document.getElementById('pause');
const word_input = document.getElementById('word');

var duration_dash = dash_input.value;
var letter_pause = pause_input.value;
var word_pause = word_input.value;

dash_input.addEventListener('input', function(event){
  duration_dash = dash_input.value;
})
pause_input.addEventListener('input', function(event){
  letter_pause = pause_input.value;
})
word_input.addEventListener('input', function(event){
  word_pause = word_input.value;
})


//
// Sound Controls
//

const sound_input = document.getElementById('sound');
const volume_input = document.getElementById('volume');

var play_sounds = sound_input.checked;
var volume = volume_input.value / 10;

sound_input.addEventListener('input', function(event){
  play_sounds = sound_input.checked;
})
volume_input.addEventListener('input', function(event){
  volume = volume_input.value / 10;
})


//
// Play Sounds
// https://stackoverflow.com/a/41077092
//

const frequency = 600 // Hz
const type = 'triangle' // {sin, square, sawtooth, triangle}
const beep_duration = {
  "dot": 50, // ms
  "dash": 225 // ms
}
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var live_oscillator;

function create_oscillator(volume){
  let oscillator = audioCtx.createOscillator();
  let gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = volume;
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  return oscillator;
}

function beep(duration) {
  let oscillator = create_oscillator();
  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
    },
    duration
  );
}

function pause(duration) {
  let oscillator = create_oscillator(0);
  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
    },
    duration
  );
}



//
// Respond to the Spacebar
//

var spacebar_pressed = null;
var spacebar_released = null;

window.addEventListener('keydown', function(event){
  if (event.key == ' '){
    event.preventDefault();
    // key press event fires continuously while key is held down;
    // only act on initial key press event
    if (!spacebar_pressed){
      if (play_sounds){
        live_oscillator = create_oscillator(volume);
        live_oscillator.start();
      }
      spacebar_pressed = Date.now();
      if (spacebar_released){
        let waited = spacebar_pressed - spacebar_released;
        if (waited >= word_pause){
          add_to_outgoing(" / ");
        } else if (waited >= letter_pause){
          add_to_outgoing(" ");
        }
      }
      spacebar_released = null;
    }
  }
})

window.addEventListener('keyup', function(event){
  if (event.key == ' '){
    spacebar_released = Date.now()
    let signal;
    if (spacebar_released - spacebar_pressed >= duration_dash){
      signal = "-";
    } else {
      signal = "."
    }
    spacebar_pressed = null;
    add_to_outgoing(signal)
    if (live_oscillator){
      live_oscillator.stop();
    }
  }
})

//
// Display messages
//
const outgoing_element = document.getElementById('message_out');
const incoming_element = document.getElementById('message_in');

function add_to_outgoing(signal){
  add_signal_to_message(signal, outgoing_element);
}

function add_to_incoming(signal){
  add_signal_to_message(signal, incoming_element);
}

function add_signal_to_message(signal, element){
  let p = document.createElement('p');
  let t = document.createTextNode(signal);
  p.appendChild(t)
  element.appendChild(p);
}
