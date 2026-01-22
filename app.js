const fileInput = document.getElementById("fileInput");
const textInput = document.getElementById("textInput");
const loadTextButton = document.getElementById("loadText");
const readerDisplay = document.getElementById("readerDisplay");
const wordLeft = document.getElementById("wordLeft");
const wordOrp = document.getElementById("wordOrp");
const wordRight = document.getElementById("wordRight");
const readerMeta = document.getElementById("readerMeta");
const playPauseButton = document.getElementById("playPause");
const rewindButton = document.getElementById("rewind");
const forwardButton = document.getElementById("forward");
const wpmSlider = document.getElementById("wpm");
const wpmValue = document.getElementById("wpmValue");
const fontSizeSlider = document.getElementById("fontSize");
const fontValue = document.getElementById("fontValue");
const progressSlider = document.getElementById("progress");
const themeToggle = document.getElementById("themeToggle");

window.pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js";

const state = {
  words: [],
  index: 0,
  isPlaying: false,
  timerId: null,
  maxLeft: 0,
};

const ORP_MAP = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];

const splitWords = (text) => text.match(/\S+/g) || [];

const getOrpIndex = (word) => {
  const length = word.length;
  if (length === 0) return 0;
  if (length < ORP_MAP.length) return ORP_MAP[length];
  return 4;
};

const computeMaxLeft = (words) =>
  words.reduce((max, word) => Math.max(max, getOrpIndex(word)), 0);

const updateProgress = () => {
  progressSlider.max = Math.max(state.words.length - 1, 0);
  progressSlider.value = state.index;
  readerMeta.textContent = `${state.words.length} palavras carregadas · ${
    state.index + 1
  } / ${state.words.length || 0}`;
};

const updateWordDisplay = () => {
  if (!state.words.length) {
    wordLeft.textContent = "";
    wordOrp.textContent = "";
    wordRight.textContent = "";
    readerMeta.textContent = "0 palavras carregadas";
    return;
  }

  const word = state.words[state.index] || "";
  const orpIndex = getOrpIndex(word);
  const left = word.slice(0, orpIndex);
  const orp = word.charAt(orpIndex) || "";
  const right = word.slice(orpIndex + 1);

  wordLeft.textContent = left;
  wordOrp.textContent = orp;
  wordRight.textContent = right;
  updateProgress();
};

const setWords = (words) => {
  state.words = words;
  state.index = 0;
  state.maxLeft = computeMaxLeft(words);
  readerDisplay.style.setProperty("--max-left", state.maxLeft);
  updateWordDisplay();
};

const stopPlayback = () => {
  state.isPlaying = false;
  playPauseButton.textContent = "Play";
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
};

const startPlayback = () => {
  if (!state.words.length) return;
  state.isPlaying = true;
  playPauseButton.textContent = "Pause";
  const interval = () => 60000 / Number(wpmSlider.value);
  state.timerId = setInterval(() => {
    state.index += 1;
    if (state.index >= state.words.length) {
      state.index = state.words.length - 1;
      stopPlayback();
      return;
    }
    updateWordDisplay();
  }, interval());
};

const togglePlayback = () => {
  if (state.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

const seekBy = (amount) => {
  if (!state.words.length) return;
  state.index = Math.min(Math.max(state.index + amount, 0), state.words.length - 1);
  updateWordDisplay();
};

const updateInterval = () => {
  wpmValue.textContent = wpmSlider.value;
  if (state.isPlaying) {
    stopPlayback();
    startPlayback();
  }
};

const updateFontSize = () => {
  fontValue.textContent = fontSizeSlider.value;
  readerDisplay.style.fontSize = `${fontSizeSlider.value}px`;
};

const setTheme = () => {
  document.body.classList.toggle("theme-dark");
};

const loadText = () => {
  const text = textInput.value.trim();
  setWords(splitWords(text));
};

const extractPdfText = async (arrayBuffer) => {
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str).join(" ");
    pageTexts.push(strings);
  }
  return pageTexts.join(" ");
};

const extractEpubText = async (arrayBuffer) => {
  const book = ePub(arrayBuffer);
  await book.ready;
  const texts = [];
  for (const item of book.spine.spineItems) {
    await item.load(book.load.bind(book));
    const text = item.document?.body?.textContent || "";
    if (text) {
      texts.push(text);
    }
    item.unload();
  }
  return texts.join(" ");
};

const extractMobiText = async (arrayBuffer) => {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(arrayBuffer);
};

const handleFile = async (file) => {
  if (!file) return;
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase();

  let text = "";
  try {
    if (extension === "pdf") {
      text = await extractPdfText(arrayBuffer);
    } else if (extension === "epub") {
      text = await extractEpubText(arrayBuffer);
    } else if (extension === "mobi") {
      text = await extractMobiText(arrayBuffer);
    } else {
      text = new TextDecoder().decode(arrayBuffer);
    }
  } catch (error) {
    text = "";
    readerMeta.textContent = `Erro ao processar o arquivo: ${error.message}`;
  }

  textInput.value = text;
  setWords(splitWords(text));
};

loadTextButton.addEventListener("click", loadText);
fileInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
playPauseButton.addEventListener("click", togglePlayback);
rewindButton.addEventListener("click", () => seekBy(-10));
forwardButton.addEventListener("click", () => seekBy(10));
progressSlider.addEventListener("input", (event) => {
  state.index = Number(event.target.value || 0);
  updateWordDisplay();
});

wpmSlider.addEventListener("input", updateInterval);
fontSizeSlider.addEventListener("input", updateFontSize);
themeToggle.addEventListener("click", setTheme);

updateFontSize();
updateInterval();
updateWordDisplay();
