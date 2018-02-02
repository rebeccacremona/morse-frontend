//
// Toggle Controls
//

const toggle_controls = document.getElementById('toggle_controls');
const controls = document.getElementById('controls');

toggle_controls.addEventListener('click', function(event){
  if(this.getAttribute('aria-expanded') == 'false' ){
      this.innerHTML = '<<';
      this.setAttribute('aria-expanded', 'true');
      controls.classList.remove('hidden');
  } else {
      this.innerHTML = '>>';
      this.setAttribute('aria-expanded', 'false');
      controls.classList.add('hidden');
  }
});


//
// Timing Controls
//

const dash_input = document.getElementById('dash');
const letter_input = document.getElementById('letter');
const word_input = document.getElementById('word');

var duration_dash = dash_input.value;
var letter_pause = letter_input.value;
var word_pause = word_input.value;

dash_input.addEventListener('input', function(event){
  duration_dash = dash_input.value;
})
letter_input.addEventListener('input', function(event){
  letter_pause = letter_input.value;
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

const frequency = 600; // Hz
const type = 'triangle'; // {sin, square, sawtooth, triangle}
const beep_duration = {
  "dot": 50, // ms
  "dash": 225 // ms
};
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
var pause_start = null;
var letter_pause_elapsed = false;
var word_pause_elapsed = false;


window.addEventListener('keydown', function(event){
  if (event.key == ' '){
    event.preventDefault();
    stop_pause_timer();
    // key press event fires continuously while key is held down;
    // only act on initial key press event
    if (!spacebar_pressed){
      if (play_sounds){
        live_oscillator = create_oscillator(volume);
        live_oscillator.start();
      }
      spacebar_pressed = Date.now();
      spacebar_released = null;
    }
  }
})

window.addEventListener('keyup', function(event){
  if (event.key == ' '){
    start_pause_timer();
    spacebar_released = Date.now();
    let signal;
    if (spacebar_released - spacebar_pressed >= duration_dash){
      signal = "-";
    } else {
      signal = ".";
    }
    spacebar_pressed = null;
    add_to_outgoing_message(signal);
    handle_outgoing_translation(signal);
    if (live_oscillator){
      live_oscillator.stop();
    }
  }
})

function start_pause_timer(){
  pause_start = Date.now();
}

function stop_pause_timer(){
  pause_start = null;
  if (word_pause_elapsed){
    add_to_outgoing_message(" / ");
    handle_outgoing_translation("/");
  }
  else if (letter_pause_elapsed){
    add_to_outgoing_message(" ");
    handle_outgoing_translation(" ");
  }
  letter_pause_elapsed = false;
  word_pause_elapsed = false;
}

function get_pause_duration(){
  if (pause_start){
    return Date.now() - pause_start;
  }
}

function respond_to_pauses(){
  let pause = get_pause_duration();
  if (pause){
    if (pause >= word_pause){
      word_pause_elapsed = true;
      stop_pause_timer();
    } else if (pause >= letter_pause){
      letter_pause_elapsed = true;
    }
  }
}
window.setInterval(respond_to_pauses, 200);


//
// Morse/Chars Translation
//

const chars_to_morse = {
  'A': '.-',     'B': '-...',   'C': '-.-.',
  'D': '-..',    'E': '.',      'F': '..-.',
  'G': '--.',    'H': '....',   'I': '..',
  'J': '.---',   'K': '-.-',    'L': '.-..',
  'M': '--',     'N': '-.',     'O': '---',
  'P': '.--.',   'Q': '--.-',   'R': '.-.',
  'S': '...',    'T': '-',      'U': '..-',
  'V': '...-',   'W': '.--',    'X': '-..-',
  'Y': '-.--',   'Z': '--..',

  '0': '-----',  '1': '.----',  '2': '..---',
  '3': '...--',  '4': '....-',  '5': '.....',
  '6': '-....',  '7': '--...',  '8': '---..',
  '9': '----.'
};

// Since javascript doesn't have dictionary comprehensions
// (or, indeed, dictionaries at all...)
const morse_to_chars =
  Object.keys(chars_to_morse).reduce(
    function(obj, key) {
      obj[chars_to_morse[key]] = key;
      return obj;
    }, {})
;

function to_morse(char){
  let morse = chars_to_morse[char];
  if (!morse){
    console.error("Can't translate char to morse code.");
  }
  return morse
}

function to_char(morse){
  let char = morse_to_chars[morse];
  if (!char){
    console.error("Invalid morse code.");
  }
  return char;
}

//
// Trigger Translation
//

var out_buffer = [];
var in_buffer = [];

function get_translation(signal, buffer){
  switch(signal){
    // the word is over:
    // return a translation of the buffer and a trailing space
    case '/':
      if (buffer.length > 0){
        return translate_buffer(buffer) || "" + " ";
      }
      return " ";
    // the letter is over: return a translation of the buffer
    case ' ':
      return translate_buffer(buffer) || "";
    // the letter isn't over: push signal onto the buffer
    default:
      buffer.push(signal);
      return null;
  }
}

function translate_buffer(buffer){
  // make a local copy of the buffer
  let tmp = buffer.slice();
  // reset thge global buffer; fancy due to js referencing behavior
  // https://stackoverflow.com/a/13104500
  buffer.length = 0
  return to_char(tmp.join(''));
}

function handle_incoming_signal(signal, output_element){
  let translation_or_null = get_translation(signal);
  if (translation) {
    output_element.push(translation);
  }
}

//
// Display messages and translations
//

const out_message_elem = document.getElementById('message_out');
const in_message_elem = document.getElementById('message_in');
const out_translation_elem = document.getElementById('translation_out');
const in_translation_elem = document.getElementById('translation_in');

// messages

function add_to_outgoing_message(signal){
  elem_to_dom(signal, out_message_elem);
}

function add_to_incoming_message(signal){
  elem_to_dom(signal, in_message_elem);
}

// translations

function handle_outgoing_translation(signal){
  add_to_incoming_message(signal);
  add_signal_to_translation(signal, out_buffer, in_translation_elem);
}

function handle_incoming_translation(signal){
  add_signal_to_translation(signal, in_buffer, in_translation_elem);
}

function add_signal_to_translation(signal, buffer, element){
  let translation = get_translation(signal, buffer);
  if (translation){
    console.log(translation);
    elem_to_dom(translation, element, 'span');
  }
}

// utils

function elem_to_dom(text, target, type='p'){
  let p = document.createElement(type);
  let t = document.createTextNode(text);
  p.appendChild(t);
  target.appendChild(p);
}
