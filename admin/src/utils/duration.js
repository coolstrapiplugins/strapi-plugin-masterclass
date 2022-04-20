
const formatDuration = (duration) => {

  let hours = Math.floor(duration/3600)
  let remainingSeconds = duration % 3600

  let minutes = Math.floor(remainingSeconds/60)
  remainingSeconds %= 60

  let hoursStr = ""
  if (hours > 0) {
    hoursStr = `${hours}h`
  }

  let minutesStr = ""
  if (minutes > 0) {
    minutesStr = `${minutes}m`
  }

  let secondsStr = ""
  if (remainingSeconds > 0) {
    secondsStr = `${remainingSeconds}s`
  }

  return `${hoursStr} ${minutesStr} ${secondsStr}`
}

export default formatDuration