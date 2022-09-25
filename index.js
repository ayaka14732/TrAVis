let fs, run;

const copyFile = async (filename) => {
  const request = await fetch(filename);
  const response = await request.arrayBuffer();
  fs.writeFile(filename, new Uint8Array(response));
};

const getParams = async () => {
  return [...Array(8).keys()].map(async (i) => {
    const request = await fetch(
      `https://ayaka-cdn.shn.hk/travis-bert-base-uncased-params/params.npz.${i}`
    );
    const response = await request.arrayBuffer();
    return new Uint8Array(response);
  });
};

const mergeParams = (arrs) => {
  const totalLen = arrs.reduce((partialLen, arr) => partialLen + arr.length, 0);
  const res = new Uint8Array(totalLen);
  arrs.reduce((partialLen, arr) => res.set(arr, partialLen), 0);
  return res;
};

(async () => {
  const [params, pyodide] = await Promise.all([getParams(), loadPyodide()]);
  fs = pyodide.FS;
  const [codePromise] = Promise.all([
    fetch("main.py").then((response) => response.text()),
    pyodide.loadPackage(["numpy", "scipy"]),
    pyodide
      .loadPackage("micropip")
      .then(() => pyodide.pyimport("micropip").install("word-piece-tokenizer")),
    copyFile(["model.py"]),
  ]);
  fs.writeFile("params.npz", mergeParams(params));
  const code = await codePromise;

  run = pyodide.runPython(code);

  document.querySelector("#visualise-input").classList.remove("hidden");
  document
    .querySelectorAll(".loading-indicator")
    .forEach((elem) => elem.classList.add("hidden"));
})();

const handleVisualise = async (newInput = false) => {
  if (newInput) {
    const input = document.getElementById("userInput").value;
    [qk_results, tokens] = await run(input).toJs();
  }

  const layer_input = document.getElementById("layer-input").value | 0;
  const head_input = document.getElementById("head-input").value | 0;

  document.querySelector(
    "label[for='layer-input']"
  ).innerHTML = `Layer ${layer_input}`;
  document.querySelector(
    "label[for='head-input']"
  ).innerHTML = `Head ${head_input}`;
  visualiserRun(qk_results[layer_input][head_input], tokens);
};
