let qk_results;

let tokens = [
  '[CLS]',
  'a',
  'wealthy',
  'white',
  '-',
  'collar',
  'worker',
  'from',
  'costa',
  'rica',
  'working',
  'in',
  'our',
  'marketing',
  'agency',
  'has',
  'set',
  'up',
  'a',
  'marine',
  'conservation',
  'centre',
  '.',
  '[SEP]',
];

const reshapeList4D = (array, d0, d1, d2, d3) => {
  const it = array[Symbol.iterator]();
  const res = [];
  for (let i = 0; i < d0; i++) {
    res.push([]);
    for (let j = 0; j < d1; j++) {
      res[i].push([]);
      for (let k = 0; k < d2; k++) {
        res[i][j].push([]);
        for (let l = 0; l < d3; l++) {
          res[i][j][k].push(it.next().value);
        }
      }
    }
  }
  return res;
};

const getDefaultQkResults = async () => {
  const request = await fetch('default_qk_results.dat');
  const buffer = await request.arrayBuffer();
  const array = [...new Float32Array(buffer)];
  const array4D = reshapeList4D(array, 12, 12, 24, 24);
  return array4D;
};
