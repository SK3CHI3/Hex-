import chalk from 'chalk';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class ProgressIndicator {
  constructor(message = 'Processing') {
    this.message = message;
    this.frameIndex = 0;
    this.interval = null;
    this.startTime = null;
  }

  start() {
    this.startTime = Date.now();
    this.interval = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length];
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      process.stdout.write(`\r${chalk.cyan(frame)} ${this.message} ${chalk.dim(`(${elapsed}s)`)}`);
      this.frameIndex++;
    }, 80);
  }

  update(message) {
    this.message = message;
  }

  stop(finalMessage = null) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r\x1b[K'); // Clear line
    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  success(message = 'Done') {
    this.stop(chalk.green('✓ ') + message);
  }

  error(message = 'Failed') {
    this.stop(chalk.red('✗ ') + message);
  }
}

export class ProgressBar {
  constructor(total, label = 'Progress') {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.startTime = Date.now();
  }

  update(current, message = null) {
    this.current = current;
    const percentage = Math.round((current / this.total) * 100);
    const filled = Math.round((current / this.total) * 30);
    const empty = 30 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    let output = `\r${this.label}: ${chalk.cyan(bar)} ${percentage}% (${current}/${this.total})`;
    if (message) {
      output += ` ${chalk.dim(message)}`;
    }
    output += ` ${chalk.dim(`[${elapsed}s]`)}`;
    
    process.stdout.write(output);
    
    if (current >= this.total) {
      process.stdout.write('\n');
    }
  }

  increment(message = null) {
    this.update(this.current + 1, message);
  }
}

export class StepProgress {
  constructor(steps, label = 'Steps') {
    this.steps = steps;
    this.currentStep = 0;
    this.label = label;
  }

  start(stepMessage = null) {
    const msg = stepMessage || this.steps[this.currentStep];
    console.log(chalk.cyan(`\n[${this.currentStep + 1}/${this.steps.length}]`) + ` ${msg}`);
  }

  next(message = null) {
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      this.start(message);
    }
  }

  complete() {
    console.log(chalk.green(`\n✓ Completed ${this.steps.length} steps`));
  }
}

// Global progress state
let currentProgress = null;

export function startProgress(message) {
  if (currentProgress) {
    currentProgress.stop();
  }
  currentProgress = new ProgressIndicator(message);
  currentProgress.start();
  return currentProgress;
}

export function stopProgress(success = true, message = null) {
  if (currentProgress) {
    if (success) {
      currentProgress.success(message);
    } else {
      currentProgress.error(message);
    }
    currentProgress = null;
  }
}

export function updateProgress(message) {
  if (currentProgress) {
    currentProgress.update(message);
  }
}
