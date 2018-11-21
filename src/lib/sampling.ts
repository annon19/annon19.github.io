// the following is implemented

export function getInterval(resultSize: number, sampleSize: number, probability: number) {
  const base = 0.5 * 1 / sampleSize * Math.log(2 / (1 - probability));
  return resultSize * Math.pow(base, 0.5);
}