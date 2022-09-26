let pyodide, fs, run;

const copyFile = async (filename) => {
  const request = await fetch(filename);
  const response = await request.arrayBuffer();
  fs.writeFile(filename, new Uint8Array(response));
};

const concatArrays = (arrs) => {
  const totalLen = arrs.reduce((partialLen, arr) => partialLen + arr.length, 0);
  const res = new Uint8Array(totalLen);
  arrs.reduce((partialLen, arr) => {
    res.set(arr, partialLen);
    return partialLen + arr.length;
  }, 0);
  return res;
};

const getParams = async () => {
  const baseUrl = 'https://ayaka-cdn.shn.hk/bert-base-uncased/params.npz.';
  const allParams = await Promise.all(
    [...Array(16).keys()].map(async (i) => {
      const url = baseUrl + String(i).padStart(2, '0');
      const request = await fetch(url, { cache: 'force-cache' });
      const response = await request.arrayBuffer();
      return new Uint8Array(response);
    })
  );
  return concatArrays(allParams);
};

(async () => {
  const paramsPromise = getParams();
  pyodide = await loadPyodide();
  fs = pyodide.FS;
  const codePromise = Promise.all([
    fetch('main.py').then((response) => response.text()),
    pyodide.loadPackage(['numpy', 'scipy']),
    pyodide
      .loadPackage('micropip')
      .then(() => pyodide.pyimport('micropip').install('word-piece-tokenizer')),
    copyFile('model.py'),
  ]);
  const params = await paramsPromise;
  fs.writeFile('params.npz', params);
  const [code] = await codePromise;

  run = pyodide.runPython(code);

  document.querySelector('#visualise-input').classList.remove('hidden');
  document
    .querySelectorAll('.loading-indicator')
    .forEach((elem) => elem.classList.add('hidden'));
})();

const handleVisualise = async (newInput = false) => {
  if (newInput) {
    const input = document.getElementById('userInput').value;
    [qk_results, tokens] = await run(input).toJs();
  }

  const layer_input = document.getElementById('layer-input').value | 0;
  const head_input = document.getElementById('head-input').value | 0;

  document.querySelector(
    "label[for='layer-input']"
  ).innerHTML = `Layer ${layer_input}`;
  document.querySelector(
    "label[for='head-input']"
  ).innerHTML = `Head ${head_input}`;
  visualiserRun(qk_results[layer_input][head_input], tokens);
};

(async () => {
  qk_results = await getDefaultQkResults();
  handleVisualise();
})();
