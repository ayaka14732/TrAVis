let qk_results;

let tokens = [
  '[CLS]',
  'the',
  'rich',
  'white',
  '-',
  'collar',
  'worker',
  'from',
  'costa',
  'rica',
  'said',
  'his',
  'bamboo',
  'forest',
  'has',
  'been',
  'destroyed',
  'in',
  'a',
  'big',
  'fire',
  '.',
  '[SEP]',
];

const getDefaultQkResults = async () => {
  const request = await fetch('default_qk_results.dat');
  const buffer = await request.arrayBuffer();
  const array = [...new Float32Array(buffer)];
  const it = array[Symbol.iterator]();
  const res = [];
  for (let i = 0; i < 12; i++) {
    res.push([]);
    for (let j = 0; j < 12; j++) {
      res[i].push([]);
      for (let k = 0; k < 23; k++) {
        res[i][j].push([]);
        for (let l = 0; l < 23; l++) {
          res[i][j][k].push(it.next().value);
        }
      }
    }
  }
  return res;
};
