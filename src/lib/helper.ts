import { LatencyOption } from "../diel/workerSetup";

export const ScatterChartsBrushs = ["arrDelay", "depDelay"];
export const AllCharts = ["carrier", "day", "state", "delays"];


export enum EventType {
  Browser,
  ExpVersion,
  IsMobile, // true/false
  ScreenWidth,
  ScreenHeight,
  WindowWidth,
  WindowHeight,
  IsChronicles, // a label for whether it is chronicles
  HappyOrNot,
  Clip,
  Focus,
  Blur
}


// Note: haven't yet used/implemented
export enum ScaleOption {
  Fixed,
  Variable
}

export enum HistoryDisplayOption {
  SmallMultiples,
  Scrubber,
  FilmStrip
}

export function readFileSync(filename: string): string {
  let request = new XMLHttpRequest();
  request.open("GET", filename, false);  // `false` makes the request synchronous
  request.send(null);
  if (request.status === 200) {
    return request.responseText;
  } else {
    return "";
  }
}

export function readFileAsync(filename: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", filename, true);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

export function getLatency(latencyOption: LatencyOption) {
  if (latencyOption === LatencyOption.None) {
    return 0;
  } else if (latencyOption === LatencyOption.Low) {
    return 500 + Math.random() * 500;
  } else {
    return 3000 + Math.random() * 2000;
  }
}

export function isLoading(v: string) {
  if (!v) {
    return true;
  }
  for (let i = 0; i < AllCharts.length; i ++) {
    if (v.indexOf(AllCharts[i]) < 0) {
      return true;
    }
  }
  return false;
}