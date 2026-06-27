/* List the hero-animation modules to load (filenames inside this animations/ folder).
   Drop a new animation .js file in here and add its filename to this array.
   Order does not matter — the loader sorts the default first.
   Each module must call window.AstemesAnim.register({ id, name, weight, isDefault, mount }). */
window.ASTEMES_ANIMATIONS = [
  'test-executive.js',
  'ate-fleet.js',
  'battery-cycler.js',
  'board-cal.js',
  'ci-pipeline.js',
  'daq-logger.js',
  'fatigue-logger.js',
  'batch-programmer.js',
  'hil-tester.js',
  'lv-cicd.js',
  'motor-testcell.js',
  'pid-control.js',
  'sequence-executive.js',
  'vibration-analyser.js',
  'vision-inspect.js'
];
