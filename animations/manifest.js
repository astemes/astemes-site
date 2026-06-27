/* List the hero-animation modules to load (filenames inside this animations/ folder).
   Drop a new animation .js file in here and add its filename to this array.
   Order does not matter — the loader sorts the default first.
   Each module must call window.AstemesAnim.register({ id, name, weight, isDefault, mount }). */
window.ASTEMES_ANIMATIONS = [
  'test-executive.js',
  'hil-tester.js',
  'battery-cycler.js',
  'batch-programmer.js',
  'vision-inspect.js',
  'ci-pipeline.js',
  'pid-control.js',
  'daq-logger.js',
  'ate-fleet.js',
  'board-cal.js',
  'fatigue-logger.js',
  'lv-cicd.js',
  'motor-testcell.js',
  'vibration-analyser.js'
];
