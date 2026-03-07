let _intervalId = null;

export function startTimer(seconds, onTick, onExpire) {
  stopTimer();
  let remaining = seconds;
  onTick(remaining, seconds);
  _intervalId = setInterval(() => {
    remaining -= 1;
    onTick(remaining, seconds);
    if (remaining <= 0) {
      stopTimer();
      onExpire();
    }
  }, 1000);
}

export function stopTimer() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
