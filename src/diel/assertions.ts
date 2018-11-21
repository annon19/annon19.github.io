
function assertNoBigger(v1: number, v2: number, msg: string) {
  if (v1 > v2) {
    throw new Error(`${v1} is larger than ${v2}, ${msg}`);
  }
}

// db.create_function("assertNoBigger", assertNoBigger);